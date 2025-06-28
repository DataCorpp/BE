import { Request, Response } from 'express';
import Project, { IProject } from '../models/Project';
import User from '../models/User';
import FoodProduct from '../models/FoodProduct';
import mongoose from 'mongoose';
import { createTransporter } from '../utils/mailService';

// Extend Request interface to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ==================== PROJECT CRUD OPERATIONS ====================

/**
 * Create a new manufacturing project
 * POST /api/projects
 */
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      selectedProduct,
      selectedSupplierType,
      volume,
      units,
      packaging,
      packagingObjects,
      location,
      allergen,
      certification,
      additional,
      anonymous,
      hideFromCurrent,
      status // Get status from request
    } = req.body;

    // Validate required fields
    if (!name || !description || !volume || !units) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, volume, units'
      });
    }

    // Get user ID from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Validate status if provided
    const validStatuses = ['draft', 'active', 'in_review', 'paused', 'completed', 'cancelled'];
    // Default to draft if status is not provided or invalid
    const projectStatus = status && validStatuses.includes(status) ? status : 'draft';

    // Create new project
    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      selectedProduct,
      selectedSupplierType,
      volume,
      units,
      packaging: packaging || [],
      packagingObjects: packagingObjects || [],
      location: location || ['Global'],
      allergen: allergen || [],
      certification: certification || [],
      additional: additional?.trim(),
      anonymous: anonymous || false,
      hideFromCurrent: hideFromCurrent || false,
      createdBy: userId,
      status: projectStatus // Use validated status
    });

    await project.save();

    // Find potential matching manufacturers (simplified algorithm)
    const matchingManufacturers = await findMatchingManufacturers(project);
    
    // Update project with matching manufacturers
    if (matchingManufacturers.length > 0) {
      project.matchingManufacturers = matchingManufacturers.map(manufacturer => ({
        manufacturerId: manufacturer._id.toString(),
        matchScore: manufacturer.matchScore,
        status: 'pending' as const
      }));
      await project.save();
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
        matchingCount: matchingManufacturers.length
      }
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all projects for authenticated user
 * GET /api/projects
 */
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { status, page = 1, limit = 10, search } = req.query;

    // Build query
    const query: any = { createdBy: userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Project.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: projects.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get single project by ID
 * GET /api/projects/:id
 */
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findOne({
      _id: id,
      createdBy: userId
    }).populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { project }
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update project
 * PUT /api/projects/:id
 */
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData._id;

    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // ==================== RECALCULATE MATCHING MANUFACTURERS ====================
    // Clear cached match results so we use fresh project data
    try {
      const cacheKey = `${id}_manufacturers`;
      if (manufacturerMatchCache.has(cacheKey)) {
        console.log('Clearing cached manufacturer matches for updated project:', id);
        manufacturerMatchCache.delete(cacheKey);
      }
    } catch (cacheErr) {
      console.error('Error clearing manufacturerMatchCache:', cacheErr);
    }

    try {
      const matchingManufacturers = await findMatchingManufacturers(project as any);
      if (matchingManufacturers.length > 0) {
        project.matchingManufacturers = matchingManufacturers.map(manufacturer => ({
          manufacturerId: manufacturer._id.toString(),
          matchScore: manufacturer.matchScore,
          status: 'pending' as const
        }));
      } else {
        project.matchingManufacturers = [];
      }
      await project.save();
    } catch (matchErr) {
      console.error('Error recalculating manufacturer matches after project update:', matchErr);
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project,
        matchingCount: project.matchingManufacturers?.length || 0
      }
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete project
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findOneAndDelete({
      _id: id,
      createdBy: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== PROJECT STATUS MANAGEMENT ====================

/**
 * Update project status
 * PATCH /api/projects/:id/status
 */
export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.id;

    const validStatuses = ['draft', 'active', 'in_review', 'paused', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    const project = await Project.findOne({
      _id: id,
      createdBy: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update status and add timeline event
    project.status = status;
    
    if (reason) {
      project.timeline = project.timeline || [];
      project.timeline.push({
        event: `status_changed_to_${status}`,
        date: new Date(),
        description: reason
      });
    }

    await project.save();

    res.json({
      success: true,
      message: `Project status updated to ${status}`,
      data: { project }
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== MANUFACTURER MATCHING ====================

/**
 * Get matching manufacturers for a project
 * GET /api/projects/:id/manufacturers
 */
export const getProjectManufacturers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Find the project
    const project = await Project.findOne({
      _id: id,
      createdBy: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find matching manufacturers
    const matchingManufacturers = await findMatchingManufacturers(project);

    // Enhance manufacturer data with additional information
    const enhancedManufacturers = await Promise.all(matchingManufacturers.map(async (manufacturer: any) => {
      // Check if this manufacturer has been contacted already
      const matchingInfo = project.matchingManufacturers?.find(
        (m: any) => m.manufacturerId.toString() === manufacturer._id.toString()
      );

      // Get additional details from User model if needed
      let additionalDetails: { 
        address?: string;
        avatar?: string;
        website?: string;
        companyDescription?: string;
        establish?: number;
        phone?: string;
        email?: string;
      } = {};
      
      try {
        // Only fetch if we need more details
        if (!manufacturer.companyDescription || !manufacturer.address) {
          const userData = await User.findById(manufacturer._id)
            .select('companyDescription address avatar website establish phone email')
            .lean();
            
          if (userData) {
            additionalDetails = userData;
          }
        }
      } catch (err) {
        console.error(`Error fetching additional details for manufacturer ${manufacturer._id}:`, err);
      }

      // Return enhanced manufacturer data
      return {
        _id: manufacturer._id,
        id: manufacturer._id, // For frontend compatibility
        name: manufacturer.name || manufacturer.companyName || 'Unknown',
        companyName: manufacturer.companyName || manufacturer.name,
        email: manufacturer.email || additionalDetails?.email,
        address: manufacturer.address || additionalDetails?.address,
        industry: manufacturer.industry || 'Food Manufacturing',
        avatar: manufacturer.avatar || additionalDetails?.avatar,
        website: manufacturer.website || additionalDetails?.website,
        phone: manufacturer.phone || additionalDetails?.phone,
        companyDescription: manufacturer.companyDescription || additionalDetails?.companyDescription,
        establish: manufacturer.establish || additionalDetails?.establish,
        certificates: manufacturer.certificates || [],
        manufacturerSettings: manufacturer.manufacturerSettings || {},
        matchScore: manufacturer.matchScore || 0,
        matchScorePercent: manufacturer.matchScorePercent || 0,
        matchDetails: manufacturer.matchDetails || {},
        status: matchingInfo?.status || 'pending',
        contactedAt: matchingInfo?.contactedAt || null
      };
    }));

    res.json({
      success: true,
      data: {
        manufacturers: enhancedManufacturers,
        count: enhancedManufacturers.length,
        projectId: id
      }
    });

  } catch (error) {
    console.error('Error fetching project manufacturers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manufacturers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Contact a manufacturer for a project
 * POST /api/projects/:id/contact/:manufacturerId
 */
export const contactManufacturer = async (req: AuthRequest, res: Response) => {
  try {
    const { id, manufacturerId } = req.params;
    const { message, contactMethod, attachments } = req.body;
    const userId = req.user?.id;

    const project = await Project.findOne({
      _id: id,
      createdBy: userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update manufacturer contact status
    project.matchingManufacturers = project.matchingManufacturers || [];
    
    const manufacturerIndex = project.matchingManufacturers.findIndex(
      m => m.manufacturerId === manufacturerId
    );

    if (manufacturerIndex >= 0) {
      project.matchingManufacturers[manufacturerIndex].status = 'contacted';
      project.matchingManufacturers[manufacturerIndex].contactedAt = new Date();
    } else {
      project.matchingManufacturers.push({
        manufacturerId,
        matchScore: 0,
        status: 'contacted',
        contactedAt: new Date()
      });
    }

    // Add timeline event
    project.timeline = project.timeline || [];
    project.timeline.push({
      event: 'manufacturer_contacted',
      date: new Date(),
      description: `Contacted manufacturer via ${contactMethod || 'email'}`
    });

    await project.save();

    // ==================== COMMUNICATION LOGIC ====================
    try {
      // Fetch manufacturer details to get email
      const manufacturerUser = await User.findById(manufacturerId).select('email name companyName');

      if (!manufacturerUser || !manufacturerUser.email) {
        console.warn(`Manufacturer ${manufacturerId} not found or missing email.`);
      } else {
        const transporter = await createTransporter();

        const subject = req.body.subject || `Inquiry about project "${project.name}"`;
        const plainMessage = message || 'Hello, we are interested in discussing cooperation regarding our project.';

        // Build basic HTML email
        const htmlMessage = `
          <p>You have received a new message regarding project <strong>${project.name}</strong>.</p>
          <p><strong>From:</strong> ${req.user?.email}</p>
          <p><strong>Message:</strong></p>
          <p>${plainMessage.replace(/\n/g, '<br/>')}</p>
        `;

        const mailOptions: any = {
          from: process.env.EMAIL_FROM || 'no-reply@cpg-platform.com',
          to: manufacturerUser.email,
          subject,
          text: plainMessage,
          html: htmlMessage,
        };

        // Attachments (array of URLs or base64 strings)
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          mailOptions.attachments = attachments.map((att: string) => ({
            path: att
          }));
        }

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Contact email sent to manufacturer ${manufacturerUser.email}`);
        } catch (mailErr) {
          console.error('Failed to send contact email:', mailErr);
        }
      }
    } catch (commErr) {
      console.error('Communication logic error:', commErr);
    }

    res.json({
      success: true,
      message: 'Manufacturer contacted successfully',
      data: {
        projectId: id,
        manufacturerId,
        contactMethod: contactMethod || 'email',
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error contacting manufacturer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to contact manufacturer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== PROJECT ANALYTICS ====================

/**
 * Get project analytics for user
 * GET /api/projects/analytics
 */
export const getProjectAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const analytics = await Project.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inReviewProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] }
          },
          completedProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalManufacturerContacts: {
            $sum: { $size: { $ifNull: ['$matchingManufacturers', []] } }
          }
        }
      }
    ]);

    const statusBreakdown = await Project.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentActivity = await Project.find({
      createdBy: userId
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name status updatedAt timeline')
    .lean();

    res.json({
      success: true,
      data: {
        summary: analytics[0] || {
          totalProjects: 0,
          activeProjects: 0,
          inReviewProjects: 0,
          completedProjects: 0,
          totalManufacturerContacts: 0
        },
        statusBreakdown,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

// Cache for manufacturer matching results
const manufacturerMatchCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Find matching manufacturers for a project
 * Enhanced matching algorithm with more accurate scoring
 */
async function findMatchingManufacturers(project: IProject) {
  try {
    // Check cache first
    const cacheKey = `${project._id}_manufacturers`;
    const cached = manufacturerMatchCache.get(cacheKey);
    
    // Use cache if available and fresh
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached manufacturer matches for project:', project._id);
      return cached.data;
    }

    console.log('Finding matching manufacturers for project:', project.name, project._id);

    // Get all users with manufacturer role
    const manufacturers = await User.find({
      role: 'manufacturer',
      status: { $in: ['active', 'online'] } // Only active manufacturers
    }).select('name email companyName address industry certificates manufacturerSettings')
    .lean();

    if (!manufacturers.length) {
      console.log('No active manufacturers found');
      return [];
    }

    console.log(`Found ${manufacturers.length} potential manufacturers to match`);

    // Log project details for debugging
    console.log('Project details for matching:', {
      name: project.name,
      productType: project.selectedProduct?.type,
      productName: project.selectedProduct?.name,
      location: project.location,
      certification: project.certification,
      volume: project.volume,
      units: project.units
    });

    // Enhanced matching algorithm with adjustments:
    // 1. Location compatibility (20% weight)
    // 2. Certification match (25% weight) - increased importance
    // 3. Industry/Category expertise (35% weight)
    // 4. Production capacity (20% weight)
    
    const scoredManufacturers = manufacturers.map(manufacturer => {
      let totalScore = 0;
      let matchDetails: Record<string, any> = {};
      
      // ==================== 1. LOCATION MATCHING (20% weight) ====================
      let locationScore = 0;
      let locationDetails = [];
      
      if (project.location && project.location.length > 0) {
        if (project.location.includes('Global')) {
          locationScore = 20; // Global projects match all manufacturers
          locationDetails.push('Global location requested');
        } else if (manufacturer.address) {
          const manufacturerLocation = manufacturer.address.toLowerCase();
          
          // Exact country/region match
          const exactLocationMatches = project.location.filter(loc => 
            manufacturerLocation.includes(loc.toLowerCase())
          );
          
          // Regional mapping
          const regionMappings: Record<string, string[]> = {
            'asia': ['china', 'japan', 'korea', 'india', 'thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines'],
            'europe': ['germany', 'france', 'uk', 'italy', 'spain', 'netherlands', 'belgium', 'switzerland', 'sweden', 'denmark', 'norway'],
            'north america': ['united states', 'usa', 'canada', 'mexico'],
            'south america': ['brazil', 'argentina', 'chile', 'colombia', 'peru'],
            'africa': ['south africa', 'egypt', 'nigeria', 'kenya', 'morocco'],
            'oceania': ['australia', 'new zealand']
          };
          
          // Check for regional matches
          const regionalMatches = project.location.filter(loc => {
            const locLower = loc.toLowerCase();
            const countries = regionMappings[locLower];
            
            if (countries) {
              return countries.some(country => manufacturerLocation.includes(country));
            }
            return false;
          });
          
          if (exactLocationMatches.length > 0) {
            const matchPercentage = exactLocationMatches.length / project.location.length;
            locationScore = Math.round(matchPercentage * 20);
            locationDetails.push(`Exact location match: ${exactLocationMatches.join(', ')}`);
          } else if (regionalMatches.length > 0) {
            const matchPercentage = regionalMatches.length / project.location.length;
            locationScore = Math.round(matchPercentage * 15); // 75% of full score for regional match
            locationDetails.push(`Regional match: ${regionalMatches.join(', ')}`);
          }
        }
      } else {
        // No location specified, give partial credit
        locationScore = 10;
        locationDetails.push('No specific location required');
      }
      
      totalScore += locationScore;
      matchDetails['location'] = {
        score: locationScore,
        maxScore: 20,
        details: locationDetails.join('; ')
      };
      
      // ==================== 2. CERTIFICATION MATCHING (25% weight) ====================
      let certScore = 0;
      let certDetails = [];
      
      if (project.certification && project.certification.length > 0) {
        // Combine certificates from both locations they might be stored
        const manufacturerCerts = [
          ...(Array.isArray(manufacturer.certificates) ? manufacturer.certificates : 
             typeof manufacturer.certificates === 'string' ? [manufacturer.certificates] : []),
          ...(manufacturer.manufacturerSettings?.certifications || [])
        ].filter(Boolean); // Remove null/undefined entries
        
        if (manufacturerCerts.length > 0) {
          // Count matching certifications - more precise matching
          const matchedCerts = [];
          
          for (const projectCert of project.certification) {
            const projectCertLower = projectCert.toLowerCase().trim();
            
            // Check if any manufacturer cert matches this project cert
            const foundMatch = manufacturerCerts.some(mCert => {
              if (!mCert) return false;
              const mCertLower = typeof mCert === 'string' ? mCert.toLowerCase().trim() : '';
              
              // Check for exact or partial matches (both ways)
              const isMatch = 
                mCertLower === projectCertLower ||
                mCertLower.includes(projectCertLower) || 
                projectCertLower.includes(mCertLower);
                
              return isMatch;
            });
            
            if (foundMatch) {
              matchedCerts.push(projectCert);
            }
          }
          
          // Calculate percentage of matching certs
          const certMatchPercentage = project.certification.length > 0 ? 
            (matchedCerts.length / project.certification.length) : 0;
          
          // Score based on percentage matched - now out of 25 points
          if (certMatchPercentage >= 0.8) {
            certScore = 25; // 80%+ match gets full points
            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (excellent match)`);
          } else if (certMatchPercentage >= 0.5) {
            certScore = 18; // 50-80% match gets 18 points
            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (good match)`);
          } else if (certMatchPercentage > 0) {
            certScore = 12; // Some matches get partial credit
            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (partial match)`);
          } else {
            certScore = 0;
            certDetails.push('No certification matches');
          }
        } else {
          certScore = 0;
          certDetails.push('Manufacturer has no certifications');
        }
      } else {
        // No certifications required, give partial score
        certScore = 12; // Half points when no certs required
        certDetails.push('No certifications required for project');
      }
      
      totalScore += certScore;
      matchDetails['certifications'] = {
        score: certScore,
        maxScore: 25,
        details: certDetails.join('; ')
      };
      
      // ==================== 3. INDUSTRY/PRODUCT MATCHING (35% weight) ====================
      let industryScore = 0;
      let industryDetails = [];
      
      if (project.selectedProduct) {
        const productName = project.selectedProduct.name.toLowerCase().trim();
        const productType = project.selectedProduct.type;
        
        // Check manufacturer industry
        if (manufacturer.industry) {
          const manufacturerIndustry = manufacturer.industry.toLowerCase().trim();
          
          // Direct name matches (25 points)
          if (manufacturerIndustry === productName || 
              manufacturerIndustry.includes(productName) || 
              productName.includes(manufacturerIndustry)) {
            industryScore += 25;
            industryDetails.push('Direct industry match');
          } 
          // For related food categories - expanded categories
          else {
            // Food category mapping for better matching
            const foodCategoryMatches: Record<string, string[]> = {
              'sauce': ['condiment', 'sauce', 'dressing', 'marinade'],
              'seasoning': ['spice', 'seasoning', 'flavor', 'flavoring'],
              'fermented': ['miso', 'kimchi', 'sauerkraut', 'kombucha', 'yogurt'],
              'beverage': ['drink', 'juice', 'tea', 'coffee', 'water', 'soda'],
              'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
              'baked goods': ['bread', 'pastry', 'bakery', 'cake', 'cookie'],
              'snack': ['chip', 'crisp', 'cracker', 'nut', 'popcorn'],
              'grain': ['rice', 'pasta', 'noodle', 'cereal', 'flour'],
              'meat': ['beef', 'pork', 'chicken', 'poultry', 'sausage'],
              'seafood': ['fish', 'shrimp', 'seafood', 'shellfish'],
              'plant-based': ['vegan', 'vegetarian', 'plant', 'tofu', 'meat alternative']
            };
            
            // Check if product matches any food category
            let foundCategoryMatch = false;
            
            for (const [category, keywords] of Object.entries(foodCategoryMatches)) {
              // Check if product name contains any category keyword
              const productMatchesCategory = keywords.some(keyword => 
                productName.includes(keyword)
              );
              
              // Check if manufacturer industry matches this category
              const manufacturerMatchesCategory = 
                manufacturerIndustry.includes(category) ||
                keywords.some(keyword => manufacturerIndustry.includes(keyword));
              
              if (productMatchesCategory && manufacturerMatchesCategory) {
                industryScore += 20;
                industryDetails.push(`Related industry match: ${category}`);
                foundCategoryMatch = true;
                break;
              }
            }
            
            // General food manufacturing (fallback)
            if (!foundCategoryMatch && 
                (productType === 'FOODTYPE' || productType === 'CATEGORY') && 
                manufacturerIndustry.includes('food')) {
              industryScore += 15;
              industryDetails.push('General food manufacturing match');
            }
          }
        }
        
        // Check manufacturer preferred categories
        if (manufacturer.manufacturerSettings?.preferredCategories?.length) {
          const preferredCategories = manufacturer.manufacturerSettings.preferredCategories
            .filter(Boolean) // Remove null/undefined
            .map((cat: any) => typeof cat === 'string' ? cat.toLowerCase().trim() : '');
          
          // Improved category matching
          const preferredCategoryMatch = preferredCategories.some(category => {
            if (!category) return false;
            
            // Direct match with product name
            if (productName.includes(category) || category.includes(productName)) {
              return true;
            }
            
            // Enhanced food category mapping
            const categoryMatches: Record<string, string[]> = {
              'sauce': ['sauce', 'condiment', 'dressing', 'marinade'],
              'beverage': ['drink', 'juice', 'water', 'tea', 'coffee', 'soda'],
              'snack': ['chips', 'crackers', 'nuts', 'seeds', 'bars', 'popcorn'],
              'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
              'grain': ['rice', 'noodle', 'pasta', 'bread', 'cereal', 'flour'],
              'protein': ['meat', 'fish', 'tofu', 'seafood', 'beef', 'pork', 'poultry'],
              'bakery': ['bread', 'cake', 'pastry', 'cookie', 'baked'],
              'confectionery': ['candy', 'chocolate', 'sweet', 'dessert', 'confection'],
              'fruit': ['fruit', 'apple', 'berry', 'citrus', 'tropical'],
              'vegetable': ['vegetable', 'produce', 'fresh', 'greens']
            };
            
            // Check if category belongs to any of our predefined categories
            for (const [mainCategory, keywords] of Object.entries(categoryMatches)) {
              if (category.includes(mainCategory) && 
                  keywords.some(keyword => productName.includes(keyword))) {
                return true;
              }
              
              // Also check the reverse - if product is in a main category and manufacturer prefers keywords
              if (productName.includes(mainCategory) && 
                  keywords.some(keyword => category.includes(keyword))) {
                return true;
              }
            }
            
            return false;
          });
          
          if (preferredCategoryMatch) {
            // Additional 10 points if manufacturer explicitly prefers this category
            industryScore += Math.min(10, 35 - industryScore); // Cap at max 35 total
            industryDetails.push('Matches manufacturer preferred category');
          }
        }
      }
      
      // Cap industry score at 35 points maximum
      const finalIndustryScore = Math.min(industryScore, 35);
      totalScore += finalIndustryScore;
      
      matchDetails['industry'] = {
        score: finalIndustryScore,
        maxScore: 35,
        details: industryDetails.join('; ') || 'No industry match'
      };
      
      // ==================== 4. PRODUCTION CAPACITY MATCHING (20% weight) ====================
      let capacityScore = 0;
      let capacityDetails = [];
      
      if (project.volume) {
        // Extract numeric part from volume string
        let volumeValue = 0;
        const volumeStr = String(project.volume).toLowerCase().trim();
        
        // Improved volume parsing
        if (volumeStr.includes('k')) {
          // Handle K format (thousands)
          const matches = volumeStr.match(/(\d+)k\s*-\s*(\d+)k/i);
          if (matches && matches.length >= 3) {
            volumeValue = parseInt(matches[2]) * 1000; // Use upper range
            capacityDetails.push(`Project volume: ${volumeValue} units (from ${matches[1]}K-${matches[2]}K)`);
          } else {
            const singleMatch = volumeStr.match(/(\d+)k/i);
            if (singleMatch && singleMatch.length >= 2) {
              volumeValue = parseInt(singleMatch[1]) * 1000;
              capacityDetails.push(`Project volume: ${volumeValue} units (from ${singleMatch[1]}K)`);
            }
          }
        } else if (volumeStr.includes('+')) {
          // Handle "100+" format
          const matches = volumeStr.match(/(\d+)(\+)/i);
          if (matches && matches.length >= 2) {
            volumeValue = parseInt(matches[1]);
            if (volumeStr.includes('k+')) volumeValue *= 1000;
            capacityDetails.push(`Project volume: ${volumeValue}+ units (minimum)`);
          }
        } else {
          // Try to extract any number
          const matches = volumeStr.match(/(\d+)/);
          if (matches && matches.length >= 2) {
            volumeValue = parseInt(matches[1]);
            capacityDetails.push(`Project volume: ${volumeValue} units`);
          }
        }
        
        // Compare with manufacturer capacity
        if (manufacturer.manufacturerSettings?.productionCapacity) {
          const capacity = manufacturer.manufacturerSettings.productionCapacity;
          capacityDetails.push(`Manufacturer capacity: ${capacity} units`);
          
          if (capacity >= volumeValue) {
            capacityScore = 20; // Can fully handle the volume
            capacityDetails.push('Full capacity match (100%)');
          } else if (capacity >= volumeValue * 0.8) {
            capacityScore = 16; // Can handle 80% of the volume
            capacityDetails.push('Very good capacity match (80%+)');
          } else if (capacity >= volumeValue * 0.6) {
            capacityScore = 12; // Can handle 60% of the volume
            capacityDetails.push('Good capacity match (60%+)');
          } else if (capacity >= volumeValue * 0.4) {
            capacityScore = 8; // Can handle 40% of the volume
            capacityDetails.push('Partial capacity match (40%+)');
          } else if (capacity > 0) {
            capacityScore = 4; // Has some capacity but not enough
            capacityDetails.push('Limited capacity match');
          }
        } else {
          // Manufacturer hasn't specified capacity
          capacityScore = 8; // 40% of points when capacity not specified
          capacityDetails.push('Manufacturer capacity not specified');
        }
      } else {
        // Project hasn't specified volume
        capacityScore = 10; // Half points when volume not specified
        capacityDetails.push('Project volume not specified');
      }
      
      totalScore += capacityScore;
      matchDetails['capacity'] = {
        score: capacityScore,
        maxScore: 20,
        details: capacityDetails.join('; ')
      };
      
      // Calculate overall match percentage and normalize score for API
      const scorePercent = Math.round(totalScore);
      const normalizedScore = scorePercent / 100; // Convert to 0-1 range
      
      // Add match details to manufacturer object
      return {
        ...manufacturer,
        matchScore: normalizedScore, // Normalized score between 0-1
        matchScorePercent: scorePercent, // Original score as percentage
        matchDetails, // Structured match details for UI display
        totalScore: totalScore, // Raw score for debugging
        matchStrength: getMatchStrength(scorePercent) // Text description of match quality
      };
    });

    // Filter manufacturers with score >= 35%, sorted by score
    const qualifiedManufacturers = scoredManufacturers
      .filter(m => m.matchScorePercent >= 35) // Minimum threshold for match quality
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50); // Return top 50 matches max

    // Log match results for debugging
    console.log(`Found ${qualifiedManufacturers.length} qualified manufacturers for project ${project.name}`);
    qualifiedManufacturers.slice(0, 5).forEach(m => {
      console.log(`Top match: ${m.name || m.companyName}, Score: ${m.matchScorePercent}%, Strength: ${m.matchStrength}`);
    });

    // Cache the results
    manufacturerMatchCache.set(cacheKey, {
      data: qualifiedManufacturers,
      timestamp: Date.now()
    });

    return qualifiedManufacturers;

  } catch (error) {
    console.error('Error finding matching manufacturers:', error);
    // Return empty array instead of throwing to prevent cascade failures
    return [];
  }
}

/**
 * Get text description of match strength based on percentage score
 */
function getMatchStrength(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 70) return 'Very Good Match';
  if (score >= 60) return 'Good Match';
  if (score >= 50) return 'Moderate Match';
  if (score >= 40) return 'Fair Match';
  return 'Basic Match';
}