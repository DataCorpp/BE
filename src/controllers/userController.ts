import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

// Define a custom Request type that includes the user property
interface RequestWithUser extends Request {
  user: {
    _id: mongoose.Types.ObjectId | string;
  };
}

// Helper function để tạo JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallbacksecret', {
    expiresIn: '30d'
  });
};

// @desc    Đăng nhập người dùng & lấy token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Kiểm tra xem có email hay không
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const userId = user._id.toString();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(userId)
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, companyName, phone, website, address, companyDescription } = req.body;

    // Kiểm tra xem người dùng đã tồn tại chưa
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Tạo người dùng mới
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (user) {
      const userId = user._id.toString();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(userId)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Unknown error occurred' });
    }
  }
};

// @desc    Lấy thông tin người dùng
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as RequestWithUser).user._id);

    if (user) {
      // Return complete user profile without password
      const userProfile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        status: user.status,
        profileComplete: user.profileComplete,
        lastLogin: user.lastLogin,
        phone: user.phone,
        website: user.website,
        websiteUrl: user.websiteUrl,
        address: user.address,
        description: user.description,
        companyDescription: user.companyDescription,
        industry: user.industry,
        certificates: user.certificates,
        avatar: user.avatar,
        connectionPreferences: user.connectionPreferences,
        manufacturerSettings: user.manufacturerSettings,
        brandSettings: user.brandSettings,
        retailerSettings: user.retailerSettings,
        notifications: user.notifications,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json(userProfile);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as RequestWithUser).user._id);

    if (user) {
      // Update basic profile fields
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Update role if provided in the request
      if (req.body.role) {
        user.role = req.body.role;
      }

      // Update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      // Update status if provided
      if (req.body.status) {
        user.status = req.body.status;
      }

      // Profile fields from ProfileSetup.tsx and ProfileForm.tsx
      if (req.body.companyName) user.companyName = req.body.companyName;
      
      // Make sure to handle phone field from both phone and phoneNumber properties
      if (req.body.phone) user.phone = req.body.phone;
      else if (req.body.phoneNumber) user.phone = req.body.phoneNumber; // Also check for phoneNumber field
      
      if (req.body.address) user.address = req.body.address;
      if (req.body.website) user.website = req.body.website; 
      if (req.body.websiteUrl) user.websiteUrl = req.body.websiteUrl;
      
      // Synchronize companyDescription and description fields
      // Always prefer companyDescription when both are provided
      if (req.body.companyDescription) {
        user.companyDescription = req.body.companyDescription;
        user.description = req.body.companyDescription; // Sync description to match companyDescription
      } else if (req.body.description) {
        user.companyDescription = req.body.description; // Use description value for companyDescription
        user.description = req.body.description;
      }
      
      if (req.body.industry) user.industry = req.body.industry;
      if (req.body.certificates) user.certificates = req.body.certificates;
      if (req.body.avatar) user.avatar = req.body.avatar;
      
      // Update profileComplete flag if provided
      if (req.body.profileComplete !== undefined) {
        user.profileComplete = req.body.profileComplete;
      }
      
      // Update lastLogin if needed
      if (req.body.lastLogin) {
        user.lastLogin = new Date(req.body.lastLogin);
      }
      
      // Update connection preferences
      if (req.body.connectWith || req.body.industryInterests || req.body.interests || req.body.lookingFor) {
        // Initialize if not exists
        if (!user.connectionPreferences) {
          user.connectionPreferences = {
            connectWith: [],
            industryInterests: [],
            interests: [],
            lookingFor: []
          };
        }
        
        if (req.body.connectWith) user.connectionPreferences.connectWith = req.body.connectWith;
        if (req.body.industryInterests) user.connectionPreferences.industryInterests = req.body.industryInterests;
        if (req.body.interests) user.connectionPreferences.interests = req.body.interests;
        if (req.body.lookingFor) user.connectionPreferences.lookingFor = req.body.lookingFor;
      }
      
      // Update role-specific settings based on the user's role
      if (user.role === 'manufacturer' && req.body.manufacturerSettings) {
        const settings = req.body.manufacturerSettings;
        
        // Initialize if not exists
        if (!user.manufacturerSettings) {
          user.manufacturerSettings = {
            productionCapacity: 0,
            certifications: [],
            preferredCategories: [],
            minimumOrderValue: 0
          };
        }
        
        if (settings.productionCapacity !== undefined) user.manufacturerSettings.productionCapacity = settings.productionCapacity;
        if (settings.certifications) user.manufacturerSettings.certifications = settings.certifications;
        if (settings.preferredCategories) user.manufacturerSettings.preferredCategories = settings.preferredCategories;
        if (settings.minimumOrderValue !== undefined) user.manufacturerSettings.minimumOrderValue = settings.minimumOrderValue;
      }
      
      if (user.role === 'brand' && req.body.brandSettings) {
        const settings = req.body.brandSettings;
        
        // Initialize if not exists
        if (!user.brandSettings) {
          user.brandSettings = {
            marketSegments: [],
            brandValues: [],
            targetDemographics: [],
            productCategories: []
          };
        }
        
        if (settings.marketSegments) user.brandSettings.marketSegments = settings.marketSegments;
        if (settings.brandValues) user.brandSettings.brandValues = settings.brandValues;
        if (settings.targetDemographics) user.brandSettings.targetDemographics = settings.targetDemographics;
        if (settings.productCategories) user.brandSettings.productCategories = settings.productCategories;
      }
      
      if (user.role === 'retailer' && req.body.retailerSettings) {
        const settings = req.body.retailerSettings;
        
        // Initialize if not exists
        if (!user.retailerSettings) {
          user.retailerSettings = {
            storeLocations: 0,
            averageOrderValue: 0,
            customerBase: [],
            preferredCategories: []
          };
        }
        
        if (settings.storeLocations !== undefined) user.retailerSettings.storeLocations = settings.storeLocations;
        if (settings.averageOrderValue !== undefined) user.retailerSettings.averageOrderValue = settings.averageOrderValue;
        if (settings.customerBase) user.retailerSettings.customerBase = settings.customerBase;
        if (settings.preferredCategories) user.retailerSettings.preferredCategories = settings.preferredCategories;
      }

      const updatedUser = await user.save();
      const userId = updatedUser._id.toString();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        companyName: updatedUser.companyName,
        role: updatedUser.role,
        status: updatedUser.status,
        profileComplete: updatedUser.profileComplete,
        phone: updatedUser.phone,
        website: updatedUser.website,
        websiteUrl: updatedUser.websiteUrl,
        address: updatedUser.address,
        description: updatedUser.description,
        companyDescription: updatedUser.companyDescription,
        industry: updatedUser.industry,
        certificates: updatedUser.certificates,
        avatar: updatedUser.avatar,
        connectionPreferences: updatedUser.connectionPreferences,
        manufacturerSettings: updatedUser.manufacturerSettings,
        brandSettings: updatedUser.brandSettings,
        retailerSettings: updatedUser.retailerSettings,
        token: generateToken(userId)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Unknown error occurred' });
    }
  }
}; 