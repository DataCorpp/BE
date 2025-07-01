"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectAnalytics = exports.contactManufacturer = exports.getProjectManufacturers = exports.updateProjectStatus = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const User_1 = __importDefault(require("../models/User"));
const FoodProduct_1 = __importDefault(require("../models/FoodProduct"));
const mongoose_1 = __importDefault(require("mongoose"));
const mailService_1 = require("../utils/mailService");
// ==================== PROJECT CRUD OPERATIONS ====================
/**
 * Create a new manufacturing project
 * POST /api/projects
 */
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, selectedProduct, selectedSupplierType, volume, units, packaging, packagingObjects, location, allergen, certification, additional, anonymous, hideFromCurrent, status // Get status from request
         } = req.body;
        // Validate required fields
        if (!name || !description || !volume || !units) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, description, volume, units'
            });
        }
        // Get user ID from auth middleware
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        // Ensure arrays are properly handled
        const processedPackaging = Array.isArray(packaging) ? packaging :
            typeof packaging === 'string' ? [packaging] : [];
        const processedLocation = Array.isArray(location) ? location :
            typeof location === 'string' ? [location] : ['Global'];
        const processedAllergen = Array.isArray(allergen) ? allergen :
            typeof allergen === 'string' ? [allergen] : [];
        const processedCertification = Array.isArray(certification) ? certification :
            typeof certification === 'string' ? [certification] : [];
        // Log the processed data for debugging
        console.log('Creating project with processed data:', {
            packaging: processedPackaging,
            location: processedLocation,
            allergen: processedAllergen,
            certification: processedCertification
        });
        // Create new project
        const project = new Project_1.default({
            name: name.trim(),
            description: description.trim(),
            selectedProduct,
            selectedSupplierType,
            volume,
            units,
            packaging: processedPackaging,
            packagingObjects: packagingObjects || [],
            location: processedLocation,
            allergen: processedAllergen,
            certification: processedCertification,
            additional: additional === null || additional === void 0 ? void 0 : additional.trim(),
            anonymous: anonymous || false,
            hideFromCurrent: hideFromCurrent || false,
            createdBy: userId,
            status: projectStatus // Use validated status
        });
        yield project.save();
        // Find potential matching manufacturers (simplified algorithm)
        const matchingManufacturers = yield findMatchingManufacturers(project);
        // Update project with matching manufacturers
        if (matchingManufacturers.length > 0) {
            project.matchingManufacturers = matchingManufacturers.map(manufacturer => ({
                manufacturerId: manufacturer._id.toString(),
                matchScore: manufacturer.matchScore,
                status: 'pending'
            }));
            yield project.save();
        }
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                project,
                matchingCount: matchingManufacturers.length
            }
        });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.createProject = createProject;
/**
 * Get all projects for authenticated user
 * GET /api/projects
 */
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        const { status, page = 1, limit = 10, search } = req.query;
        // Build query
        const query = { createdBy: userId };
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
        const [projects, total] = yield Promise.all([
            Project_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('createdBy', 'name email')
                .lean(),
            Project_1.default.countDocuments(query)
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
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getProjects = getProjects;
/**
 * Get single project by ID
 * GET /api/projects/:id
 */
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }
        const project = yield Project_1.default.findOne({
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
    }
    catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getProjectById = getProjectById;
/**
 * Update project
 * PUT /api/projects/:id
 */
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const updateData = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }
        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData._id;
        const project = yield Project_1.default.findOneAndUpdate({ _id: id, createdBy: userId }, { $set: updateData }, { new: true, runValidators: true });
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
        }
        catch (cacheErr) {
            console.error('Error clearing manufacturerMatchCache:', cacheErr);
        }
        try {
            const matchingManufacturers = yield findMatchingManufacturers(project);
            if (matchingManufacturers.length > 0) {
                project.matchingManufacturers = matchingManufacturers.map(manufacturer => ({
                    manufacturerId: manufacturer._id.toString(),
                    matchScore: manufacturer.matchScore,
                    status: 'pending'
                }));
            }
            else {
                project.matchingManufacturers = [];
            }
            yield project.save();
        }
        catch (matchErr) {
            console.error('Error recalculating manufacturer matches after project update:', matchErr);
        }
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: {
                project,
                matchingCount: ((_b = project.matchingManufacturers) === null || _b === void 0 ? void 0 : _b.length) || 0
            }
        });
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.updateProject = updateProject;
/**
 * Delete project
 * DELETE /api/projects/:id
 */
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }
        const project = yield Project_1.default.findOneAndDelete({
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
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.deleteProject = deleteProject;
// ==================== PROJECT STATUS MANAGEMENT ====================
/**
 * Update project status
 * PATCH /api/projects/:id/status
 */
const updateProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const validStatuses = ['draft', 'active', 'in_review', 'paused', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
            });
        }
        const project = yield Project_1.default.findOne({
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
        yield project.save();
        res.json({
            success: true,
            message: `Project status updated to ${status}`,
            data: { project }
        });
    }
    catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update project status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.updateProjectStatus = updateProjectStatus;
// ==================== MANUFACTURER MATCHING ====================
/**
 * Get matching manufacturers for a project
 * GET /api/projects/:id/manufacturers
 */
const getProjectManufacturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        // Find the project
        const project = yield Project_1.default.findOne({
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
        const matchingManufacturers = yield findMatchingManufacturers(project);
        // Enhance manufacturer data with additional information
        const enhancedManufacturers = yield Promise.all(matchingManufacturers.map((manufacturer) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Check if this manufacturer has been contacted already
            const matchingInfo = (_a = project.matchingManufacturers) === null || _a === void 0 ? void 0 : _a.find((m) => m.manufacturerId.toString() === manufacturer._id.toString());
            // Get additional details from User model if needed
            let additionalDetails = {};
            try {
                // Only fetch if we need more details
                if (!manufacturer.companyDescription || !manufacturer.address) {
                    const userData = yield User_1.default.findById(manufacturer._id)
                        .select('companyDescription address avatar website establish phone email')
                        .lean();
                    if (userData) {
                        additionalDetails = userData;
                    }
                }
            }
            catch (err) {
                console.error(`Error fetching additional details for manufacturer ${manufacturer._id}:`, err);
            }
            // Return enhanced manufacturer data
            return {
                _id: manufacturer._id,
                id: manufacturer._id, // For frontend compatibility
                name: manufacturer.name || manufacturer.companyName || 'Unknown',
                companyName: manufacturer.companyName || manufacturer.name,
                email: manufacturer.email || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.email),
                address: manufacturer.address || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.address),
                industry: manufacturer.industry || 'Food Manufacturing',
                avatar: manufacturer.avatar || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.avatar),
                website: manufacturer.website || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.website),
                phone: manufacturer.phone || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.phone),
                companyDescription: manufacturer.companyDescription || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.companyDescription),
                establish: manufacturer.establish || (additionalDetails === null || additionalDetails === void 0 ? void 0 : additionalDetails.establish),
                certificates: manufacturer.certificates || [],
                manufacturerSettings: manufacturer.manufacturerSettings || {},
                matchScore: manufacturer.matchScore || 0,
                matchScorePercent: manufacturer.matchScorePercent || 0,
                matchDetails: manufacturer.matchDetails || {},
                status: (matchingInfo === null || matchingInfo === void 0 ? void 0 : matchingInfo.status) || 'pending',
                contactedAt: (matchingInfo === null || matchingInfo === void 0 ? void 0 : matchingInfo.contactedAt) || null
            };
        })));
        res.json({
            success: true,
            data: {
                manufacturers: enhancedManufacturers,
                count: enhancedManufacturers.length,
                projectId: id
            }
        });
    }
    catch (error) {
        console.error('Error fetching project manufacturers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch manufacturers',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getProjectManufacturers = getProjectManufacturers;
/**
 * Contact a manufacturer for a project
 * POST /api/projects/:id/contact/:manufacturerId
 */
const contactManufacturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id, manufacturerId } = req.params;
        const { message, contactMethod, attachments } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const project = yield Project_1.default.findOne({
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
        const manufacturerIndex = project.matchingManufacturers.findIndex(m => m.manufacturerId === manufacturerId);
        if (manufacturerIndex >= 0) {
            project.matchingManufacturers[manufacturerIndex].status = 'contacted';
            project.matchingManufacturers[manufacturerIndex].contactedAt = new Date();
        }
        else {
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
        yield project.save();
        // ==================== COMMUNICATION LOGIC ====================
        try {
            // Fetch manufacturer details to get email
            const manufacturerUser = yield User_1.default.findById(manufacturerId).select('email name companyName');
            if (!manufacturerUser || !manufacturerUser.email) {
                console.warn(`Manufacturer ${manufacturerId} not found or missing email.`);
            }
            else {
                const transporter = yield (0, mailService_1.createTransporter)();
                const subject = req.body.subject || `Inquiry about project "${project.name}"`;
                const plainMessage = message || 'Hello, we are interested in discussing cooperation regarding our project.';
                // Build basic HTML email
                const htmlMessage = `
          <p>You have received a new message regarding project <strong>${project.name}</strong>.</p>
          <p><strong>From:</strong> ${(_b = req.user) === null || _b === void 0 ? void 0 : _b.email}</p>
          <p><strong>Message:</strong></p>
          <p>${plainMessage.replace(/\n/g, '<br/>')}</p>
        `;
                const mailOptions = {
                    from: process.env.EMAIL_FROM || 'no-reply@cpg-platform.com',
                    to: manufacturerUser.email,
                    subject,
                    text: plainMessage,
                    html: htmlMessage,
                };
                // Attachments (array of URLs or base64 strings)
                if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                    mailOptions.attachments = attachments.map((att) => ({
                        path: att
                    }));
                }
                try {
                    yield transporter.sendMail(mailOptions);
                    console.log(`Contact email sent to manufacturer ${manufacturerUser.email}`);
                }
                catch (mailErr) {
                    console.error('Failed to send contact email:', mailErr);
                }
            }
        }
        catch (commErr) {
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
    }
    catch (error) {
        console.error('Error contacting manufacturer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to contact manufacturer',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.contactManufacturer = contactManufacturer;
// ==================== PROJECT ANALYTICS ====================
/**
 * Get project analytics for user
 * GET /api/projects/analytics
 */
const getProjectAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        const analytics = yield Project_1.default.aggregate([
            { $match: { createdBy: new mongoose_1.default.Types.ObjectId(userId) } },
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
        const statusBreakdown = yield Project_1.default.aggregate([
            { $match: { createdBy: new mongoose_1.default.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        const recentActivity = yield Project_1.default.find({
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
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getProjectAnalytics = getProjectAnalytics;
// ==================== HELPER FUNCTIONS ====================
// Cache for manufacturer matching results
const manufacturerMatchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
/**
 * Find matching manufacturers for a project
 * Enhanced matching algorithm with more accurate scoring
 */
function findMatchingManufacturers(project) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
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
            const manufacturers = yield User_1.default.find({
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
                productType: (_a = project.selectedProduct) === null || _a === void 0 ? void 0 : _a.type,
                productName: (_b = project.selectedProduct) === null || _b === void 0 ? void 0 : _b.name,
                location: project.location,
                certification: project.certification,
                packaging: project.packaging,
                allergen: project.allergen,
                additional: project.additional,
                volume: project.volume,
                units: project.units
            });
            // Enhanced matching algorithm with adjustments:
            // 1. Location compatibility (15% weight)
            // 2. Certification match (20% weight)
            // 3. Industry/Category expertise (25% weight)
            // 4. Production capacity (15% weight)
            // 5. Packaging compatibility (10% weight)
            // 6. Allergen requirements (10% weight)
            // 7. Additional requirements (5% weight)
            const scoredManufacturers = manufacturers.map((manufacturer) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                let totalScore = 0;
                let matchDetails = {};
                // ==================== 1. LOCATION MATCHING (15% weight) ====================
                let locationScore = 0;
                let locationDetails = [];
                if (project.location && project.location.length > 0) {
                    // Check if project has explicit 'Global' location or empty location array
                    const isGlobalProject = project.location.some(loc => loc.toLowerCase().trim() === 'global');
                    if (isGlobalProject) {
                        locationScore = 15; // Global projects match all manufacturers
                        locationDetails.push('Global location requested');
                    }
                    else if (manufacturer.address) {
                        const manufacturerLocation = manufacturer.address.toLowerCase();
                        // Exact country/region match
                        const exactLocationMatches = project.location.filter(loc => manufacturerLocation.includes(loc.toLowerCase()));
                        // Regional mapping
                        const regionMappings = {
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
                            locationScore = Math.round(matchPercentage * 15);
                            locationDetails.push(`Exact location match: ${exactLocationMatches.join(', ')}`);
                        }
                        else if (regionalMatches.length > 0) {
                            const matchPercentage = regionalMatches.length / project.location.length;
                            locationScore = Math.round(matchPercentage * 11); // 75% of full score for regional match
                            locationDetails.push(`Regional match: ${regionalMatches.join(', ')}`);
                        }
                    }
                }
                else {
                    // No location specified, give partial credit
                    locationScore = 7; // Half points
                    locationDetails.push('No specific location required');
                }
                totalScore += locationScore;
                matchDetails['location'] = {
                    score: locationScore,
                    maxScore: 15,
                    details: locationDetails.join('; ')
                };
                // ==================== 2. CERTIFICATION MATCHING (20% weight) ====================
                let certScore = 0;
                let certDetails = [];
                if (project.certification && Array.isArray(project.certification) && project.certification.length > 0) {
                    // Log certifications for debugging
                    console.log(`Project ${project._id} certifications:`, project.certification);
                    // Combine certificates from both locations they might be stored
                    const manufacturerCerts = [
                        ...(Array.isArray(manufacturer.certificates) ? manufacturer.certificates :
                            typeof manufacturer.certificates === 'string' ? [manufacturer.certificates] : []),
                        ...(((_a = manufacturer.manufacturerSettings) === null || _a === void 0 ? void 0 : _a.certifications) || [])
                    ].filter(Boolean); // Remove null/undefined entries
                    if (manufacturerCerts.length > 0) {
                        // Count matching certifications - more precise matching
                        const matchedCerts = [];
                        for (const projectCert of project.certification) {
                            const projectCertLower = projectCert.toLowerCase().trim();
                            // Check if any manufacturer cert matches this project cert
                            const foundMatch = manufacturerCerts.some(mCert => {
                                if (!mCert)
                                    return false;
                                const mCertLower = typeof mCert === 'string' ? mCert.toLowerCase().trim() : '';
                                // Check for exact or partial matches (both ways)
                                const isMatch = mCertLower === projectCertLower ||
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
                        // Score based on percentage matched - now out of 20 points
                        if (certMatchPercentage >= 0.8) {
                            certScore = 20; // 80%+ match gets full points
                            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (excellent match)`);
                        }
                        else if (certMatchPercentage >= 0.5) {
                            certScore = 15; // 50-80% match gets 15 points
                            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (good match)`);
                        }
                        else if (certMatchPercentage > 0) {
                            certScore = 10; // Some matches get partial credit
                            certDetails.push(`Matched ${matchedCerts.length}/${project.certification.length} certifications (partial match)`);
                        }
                        else {
                            certScore = 0;
                            certDetails.push('No certification matches');
                        }
                    }
                    else {
                        certScore = 0;
                        certDetails.push('Manufacturer has no certifications');
                    }
                }
                else {
                    // No certifications required, give partial score
                    certScore = 10; // Half points when no certs required
                    certDetails.push('No certifications required for project');
                    console.log(`Project ${project._id} has no certifications specified`);
                }
                totalScore += certScore;
                matchDetails['certifications'] = {
                    score: certScore,
                    maxScore: 20,
                    details: certDetails.join('; ')
                };
                // ==================== 3. INDUSTRY/PRODUCT MATCHING (25% weight) ====================
                let industryScore = 0;
                let industryDetails = [];
                if (project.selectedProduct) {
                    const productName = project.selectedProduct.name.toLowerCase().trim();
                    const productType = project.selectedProduct.type;
                    // Check manufacturer industry
                    if (manufacturer.industry) {
                        const manufacturerIndustry = manufacturer.industry.toLowerCase().trim();
                        // Direct name matches (20 points)
                        if (manufacturerIndustry === productName ||
                            manufacturerIndustry.includes(productName) ||
                            productName.includes(manufacturerIndustry)) {
                            industryScore += 20;
                            industryDetails.push('Direct industry match');
                        }
                        // For related food categories - expanded categories
                        else {
                            // Food category mapping for better matching
                            const foodCategoryMatches = {
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
                                const productMatchesCategory = keywords.some(keyword => productName.includes(keyword));
                                // Check if manufacturer industry matches this category
                                const manufacturerMatchesCategory = manufacturerIndustry.includes(category) ||
                                    keywords.some(keyword => manufacturerIndustry.includes(keyword));
                                if (productMatchesCategory && manufacturerMatchesCategory) {
                                    industryScore += 15;
                                    industryDetails.push(`Related industry match: ${category}`);
                                    foundCategoryMatch = true;
                                    break;
                                }
                            }
                            // General food manufacturing (fallback)
                            if (!foundCategoryMatch &&
                                (productType === 'FOODTYPE' || productType === 'CATEGORY') &&
                                manufacturerIndustry.includes('food')) {
                                industryScore += 10;
                                industryDetails.push('General food manufacturing match');
                            }
                        }
                    }
                    // Check manufacturer preferred categories
                    if ((_c = (_b = manufacturer.manufacturerSettings) === null || _b === void 0 ? void 0 : _b.preferredCategories) === null || _c === void 0 ? void 0 : _c.length) {
                        const preferredCategories = manufacturer.manufacturerSettings.preferredCategories
                            .filter(Boolean) // Remove null/undefined
                            .map((cat) => typeof cat === 'string' ? cat.toLowerCase().trim() : '');
                        // Improved category matching
                        const preferredCategoryMatch = preferredCategories.some(category => {
                            if (!category)
                                return false;
                            // Direct match with product name
                            if (productName.includes(category) || category.includes(productName)) {
                                return true;
                            }
                            // Enhanced food category mapping
                            const categoryMatches = {
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
                            // Additional 5 points if manufacturer explicitly prefers this category
                            industryScore += Math.min(5, 25 - industryScore); // Cap at max 25 total
                            industryDetails.push('Matches manufacturer preferred category');
                        }
                    }
                }
                // Cap industry score at 25 points maximum
                const finalIndustryScore = Math.min(industryScore, 25);
                totalScore += finalIndustryScore;
                matchDetails['industry'] = {
                    score: finalIndustryScore,
                    maxScore: 25,
                    details: industryDetails.join('; ') || 'No industry match'
                };
                // ==================== 4. PRODUCTION CAPACITY MATCHING (15% weight) ====================
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
                        }
                        else {
                            const singleMatch = volumeStr.match(/(\d+)k/i);
                            if (singleMatch && singleMatch.length >= 2) {
                                volumeValue = parseInt(singleMatch[1]) * 1000;
                                capacityDetails.push(`Project volume: ${volumeValue} units (from ${singleMatch[1]}K)`);
                            }
                        }
                    }
                    else if (volumeStr.includes('+')) {
                        // Handle "100+" format
                        const matches = volumeStr.match(/(\d+)(\+)/i);
                        if (matches && matches.length >= 2) {
                            volumeValue = parseInt(matches[1]);
                            if (volumeStr.includes('k+'))
                                volumeValue *= 1000;
                            capacityDetails.push(`Project volume: ${volumeValue}+ units (minimum)`);
                        }
                    }
                    else {
                        // Try to extract any number
                        const matches = volumeStr.match(/(\d+)/);
                        if (matches && matches.length >= 2) {
                            volumeValue = parseInt(matches[1]);
                            capacityDetails.push(`Project volume: ${volumeValue} units`);
                        }
                    }
                    // Compare with manufacturer capacity
                    if ((_d = manufacturer.manufacturerSettings) === null || _d === void 0 ? void 0 : _d.productionCapacity) {
                        const capacity = manufacturer.manufacturerSettings.productionCapacity;
                        capacityDetails.push(`Manufacturer capacity: ${capacity} units`);
                        if (capacity >= volumeValue) {
                            capacityScore = 15; // Can fully handle the volume
                            capacityDetails.push('Full capacity match (100%)');
                        }
                        else if (capacity >= volumeValue * 0.8) {
                            capacityScore = 12; // Can handle 80% of the volume
                            capacityDetails.push('Very good capacity match (80%+)');
                        }
                        else if (capacity >= volumeValue * 0.6) {
                            capacityScore = 9; // Can handle 60% of the volume
                            capacityDetails.push('Good capacity match (60%+)');
                        }
                        else if (capacity >= volumeValue * 0.4) {
                            capacityScore = 6; // Can handle 40% of the volume
                            capacityDetails.push('Partial capacity match (40%+)');
                        }
                        else if (capacity > 0) {
                            capacityScore = 3; // Has some capacity but not enough
                            capacityDetails.push('Limited capacity match');
                        }
                    }
                    else {
                        // Manufacturer hasn't specified capacity
                        capacityScore = 6; // 40% of points when capacity not specified
                        capacityDetails.push('Manufacturer capacity not specified');
                    }
                }
                else {
                    // Project hasn't specified volume
                    capacityScore = 7; // Half points when volume not specified
                    capacityDetails.push('Project volume not specified');
                }
                totalScore += capacityScore;
                matchDetails['capacity'] = {
                    score: capacityScore,
                    maxScore: 15,
                    details: capacityDetails.join('; ')
                };
                // ==================== 5. PACKAGING COMPATIBILITY (10% weight) ====================
                let packagingScore = 0;
                let packagingDetails = [];
                if (project.packaging && Array.isArray(project.packaging) && project.packaging.length > 0) {
                    console.log(`Project ${project._id} packaging requirements:`, project.packaging);
                    // Get manufacturer's products to check packaging types
                    try {
                        // Find products from this manufacturer
                        const manufacturerProducts = yield FoodProduct_1.default.find({
                            user: manufacturer._id
                        }).select('packagingType packagingSize').lean();
                        if (manufacturerProducts && manufacturerProducts.length > 0) {
                            // Extract all packaging types from manufacturer's products
                            const manufacturerPackagingTypes = manufacturerProducts
                                .map(p => { var _a; return (_a = p.packagingType) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim(); })
                                .filter(Boolean);
                            console.log(`Manufacturer ${manufacturer._id} packaging types:`, manufacturerPackagingTypes);
                            // Count matching packaging types
                            let matchCount = 0;
                            const matchedPackagingTypes = [];
                            for (const projectPackaging of project.packaging) {
                                const projectPackagingLower = projectPackaging.toLowerCase().trim();
                                // Check for exact or partial matches
                                const hasMatch = manufacturerPackagingTypes.some(mPackaging => {
                                    if (!mPackaging)
                                        return false;
                                    // Check for exact or partial matches (both ways)
                                    return mPackaging === projectPackagingLower ||
                                        mPackaging.includes(projectPackagingLower) ||
                                        projectPackagingLower.includes(mPackaging);
                                });
                                if (hasMatch) {
                                    matchCount++;
                                    matchedPackagingTypes.push(projectPackaging);
                                }
                            }
                            // Calculate score based on percentage of matched packaging types
                            if (matchCount > 0) {
                                const matchPercentage = matchCount / project.packaging.length;
                                packagingScore = Math.round(matchPercentage * 10);
                                packagingDetails.push(`Matched ${matchCount}/${project.packaging.length} packaging types: ${matchedPackagingTypes.join(', ')}`);
                            }
                            else {
                                packagingScore = 0;
                                packagingDetails.push('No matching packaging types found');
                            }
                        }
                        else {
                            packagingScore = 5; // Half points if manufacturer has no products yet
                            packagingDetails.push('Manufacturer has no products to check packaging compatibility');
                        }
                    }
                    catch (error) {
                        console.error('Error checking packaging compatibility:', error);
                        packagingScore = 5; // Half points on error
                        packagingDetails.push('Could not check packaging compatibility');
                    }
                }
                else {
                    packagingScore = 5; // Half points when no packaging specified
                    packagingDetails.push('No packaging requirements specified');
                }
                totalScore += packagingScore;
                matchDetails['packaging'] = {
                    score: packagingScore,
                    maxScore: 10,
                    details: packagingDetails.join('; ')
                };
                // ==================== 6. ALLERGEN REQUIREMENTS (10% weight) ====================
                let allergenScore = 0;
                let allergenDetails = [];
                if (project.allergen && Array.isArray(project.allergen) && project.allergen.length > 0) {
                    console.log(`Project ${project._id} allergen requirements:`, project.allergen);
                    try {
                        // Find products from this manufacturer
                        const manufacturerProducts = yield FoodProduct_1.default.find({
                            user: manufacturer._id
                        }).select('allergens').lean();
                        if (manufacturerProducts && manufacturerProducts.length > 0) {
                            // Count products that match allergen requirements
                            let matchingProductsCount = 0;
                            // For each product, check if it meets allergen requirements
                            for (const product of manufacturerProducts) {
                                if (product.allergens && Array.isArray(product.allergens)) {
                                    // Check if product allergens match project requirements
                                    const productAllergens = product.allergens.map(a => a.toLowerCase().trim());
                                    console.log(`Product ${product._id} allergens:`, productAllergens);
                                    // For allergen requirements, we need to check if the product is free from allergens
                                    // or has the required allergen-free properties
                                    const allergenRequirementsMet = project.allergen.every(allergenReq => {
                                        const reqLower = allergenReq.toLowerCase().trim();
                                        // If requirement is "Gluten Free", check if product has "Gluten Free" in allergens
                                        // or doesn't have "Gluten" in allergens
                                        if (reqLower.includes('free')) {
                                            // Check if product explicitly states it's free from this allergen
                                            return productAllergens.some(pa => pa.includes(reqLower));
                                        }
                                        // If requirement is a specific diet type (vegan, vegetarian, etc.)
                                        if (['vegan', 'vegetarian', 'kosher', 'halal'].includes(reqLower)) {
                                            return productAllergens.some(pa => pa.includes(reqLower));
                                        }
                                        // Default case: assume it's an allergen that should NOT be present
                                        return true; // Skip this check for now as we don't have enough context
                                    });
                                    if (allergenRequirementsMet) {
                                        matchingProductsCount++;
                                    }
                                }
                            }
                            // Calculate score based on percentage of products meeting allergen requirements
                            if (matchingProductsCount > 0) {
                                const matchPercentage = matchingProductsCount / manufacturerProducts.length;
                                allergenScore = Math.round(matchPercentage * 10);
                                allergenDetails.push(`${matchingProductsCount}/${manufacturerProducts.length} products meet allergen requirements`);
                            }
                            else {
                                allergenScore = 0;
                                allergenDetails.push('No products meet allergen requirements');
                            }
                        }
                        else {
                            allergenScore = 5; // Half points if manufacturer has no products
                            allergenDetails.push('Manufacturer has no products to check allergen compatibility');
                        }
                    }
                    catch (error) {
                        console.error('Error checking allergen compatibility:', error);
                        allergenScore = 5; // Half points on error
                        allergenDetails.push('Could not check allergen compatibility');
                    }
                }
                else {
                    allergenScore = 5; // Half points when no allergen requirements
                    allergenDetails.push('No allergen requirements specified');
                }
                totalScore += allergenScore;
                matchDetails['allergen'] = {
                    score: allergenScore,
                    maxScore: 10,
                    details: allergenDetails.join('; ')
                };
                // ==================== 7. ADDITIONAL REQUIREMENTS (5% weight) ====================
                let additionalScore = 0;
                let additionalDetails = [];
                if (project.additional && project.additional.trim()) {
                    console.log(`Project ${project._id} additional requirements:`, project.additional);
                    try {
                        // Extract key phrases from additional requirements
                        const additionalText = project.additional.toLowerCase();
                        // Define important keywords to look for
                        const keyPhrases = {
                            sustainability: ['sustainable', 'eco-friendly', 'recyclable', 'biodegradable', 'green', 'environmental'],
                            quality: ['high quality', 'premium', 'certified', 'quality control', 'inspection'],
                            customization: ['custom', 'customized', 'personalized', 'bespoke', 'tailored'],
                            technology: ['innovative', 'technology', 'automated', 'digital', 'smart'],
                            delivery: ['fast delivery', 'shipping', 'logistics', 'quick turnaround'],
                            materials: ['bpa free', 'fda approved', 'food grade', 'organic', 'natural']
                        };
                        // Check manufacturer description and industry for matching keywords
                        const manufacturerText = [
                            manufacturer.description || '',
                            manufacturer.companyDescription || '',
                            manufacturer.industry || ''
                        ].join(' ').toLowerCase();
                        let matchedCategories = 0;
                        const matchedKeywords = [];
                        // Check each category of keywords
                        for (const [category, keywords] of Object.entries(keyPhrases)) {
                            // Check if any keyword from this category is in both texts
                            const categoryMatched = keywords.some(keyword => additionalText.includes(keyword) && manufacturerText.includes(keyword));
                            if (categoryMatched) {
                                matchedCategories++;
                                matchedKeywords.push(category);
                            }
                        }
                        // Calculate score based on matched categories
                        if (matchedCategories > 0) {
                            additionalScore = Math.min(matchedCategories, 5); // Max 5 points
                            additionalDetails.push(`Matched requirements in: ${matchedKeywords.join(', ')}`);
                        }
                        else {
                            // Check if manufacturer has any products
                            const hasProducts = yield FoodProduct_1.default.exists({ user: manufacturer._id });
                            if (hasProducts) {
                                additionalScore = 2; // Some points if manufacturer has products
                                additionalDetails.push('Manufacturer has products but no specific keyword matches');
                            }
                            else {
                                additionalScore = 1; // Minimal points
                                additionalDetails.push('No specific keyword matches found');
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error analyzing additional requirements:', error);
                        additionalScore = 2; // Some points on error
                        additionalDetails.push('Could not fully analyze additional requirements');
                    }
                }
                else {
                    additionalScore = 3; // More than half points when no additional requirements
                    additionalDetails.push('No additional requirements specified');
                }
                totalScore += additionalScore;
                matchDetails['additional'] = {
                    score: additionalScore,
                    maxScore: 5,
                    details: additionalDetails.join('; ')
                };
                // Remove duplicate score calculation - use only the final one
                const finalScorePercent = Math.round(totalScore);
                const finalNormalizedScore = finalScorePercent / 100; // Convert to 0-1 range
                // Add match details to manufacturer object
                return Object.assign(Object.assign({}, manufacturer), { matchScore: finalNormalizedScore, matchScorePercent: finalScorePercent, // Original score as percentage
                    matchDetails, totalScore: totalScore, matchStrength: getMatchStrength(finalScorePercent) // Text description of match quality
                 });
            }));
            // Filter manufacturers with score >= 30%, sorted by score (lowered threshold due to more criteria)
            // First, await all the promises to get the actual manufacturer data
            const resolvedManufacturers = yield Promise.all(scoredManufacturers);
            // Filter manufacturers with score >= 30%, sorted by score (lowered threshold due to more criteria)
            const qualifiedManufacturers = resolvedManufacturers
                .filter(m => m.matchScorePercent >= 30) // Minimum threshold for match quality
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
        }
        catch (error) {
            console.error('Error finding matching manufacturers:', error);
            // Return empty array instead of throwing to prevent cascade failures
            return [];
        }
    });
}
/**
 * Get text description of match strength based on percentage score
 * Updated thresholds to account for new matching criteria
 */
function getMatchStrength(score) {
    if (score >= 75)
        return 'Excellent Match';
    if (score >= 65)
        return 'Very Good Match';
    if (score >= 55)
        return 'Good Match';
    if (score >= 45)
        return 'Moderate Match';
    if (score >= 35)
        return 'Fair Match';
    return 'Basic Match';
}
