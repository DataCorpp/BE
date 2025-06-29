import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { IUser } from "../models/User";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/mailService";
import { sendPasswordResetEmail } from "../utils/mailService";
import { generatePasswordResetToken, hashToken, buildResetUrl } from "../utils/passwordResetUtils";

// Define a custom Request type that includes the user property
interface RequestWithUser extends Request {
  user: {
    _id: mongoose.Types.ObjectId | string;
  };
}

// Helper function để tạo JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallbacksecret", {
    expiresIn: "30d",
  });
};

// Store email verification codes in memory (for development purposes)
// In production, you would use a database or cache like Redis
interface VerificationCode {
  code: string;
  expires: Date;
}

const verificationCodes: Record<string, VerificationCode> = {};

// Helper function to generate a random 6-digit code
const generateVerificationCode = (): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Don't log the generated code for security
  return code;
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
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const userId = user._id.toString();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(userId),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/users
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      phone,
      website,
      address,
      companyDescription,
    } = req.body;

    // Check for required fields
    if (!name || !email || !password) {
      res.status(400).json({ message: "Please provide name, email and password" });
      return;
    }

    // Check if valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    // Check if valid password (at least 6 characters)
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    // Kiểm tra xem người dùng đã tồn tại chưa
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Check if we're running in development mode without proper email setup
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

    // Tạo người dùng mới với trạng thái 'pending'
    const user = await User.create({
      name,
      email,
      password,
      role,
      status: isDevMode && !hasEmailConfig ? 'active' : 'pending', // Auto-activate in dev mode
      companyName,
      phone,
      website,
      address,
      companyDescription,
    });

    if (user) {
      const userId = user._id.toString();

      // Generate a verification code for the new user
      const verificationCode = generateVerificationCode();
      
      // Set expiration to 1 minute from now
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 1);
      
      // Store the code with its expiration
      verificationCodes[email] = {
        code: verificationCode,
        expires: expiration
      };

      // Send verification email
      let emailSent = false;
      try {
        await sendVerificationEmail(email, verificationCode);
        console.log(`Verification email processing completed for ${email}`);
        emailSent = true;
      } catch (emailError) {
        console.error('Error with email verification process');
        // In production, we might want to handle this differently
        if (process.env.NODE_ENV === 'production') {
          // In production, email is critical - return an error
          res.status(500).json({ message: "Failed to send verification email. Please try again later." });
          return;
        }
        // In development, we'll continue with registration anyway
      }

      // Create response object
      const responseObj: any = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(userId),
      };

      // In development, include verification code to help with testing
      if (process.env.NODE_ENV === 'development') {
        // Send verification code in response but not in logs
        responseObj.verificationCode = verificationCode;
        
        if (!emailSent) {
          console.log('\n🧪 DEVELOPMENT MODE: Email service not configured or failed');
          
          if (!hasEmailConfig) {
            console.log('ℹ️ User automatically activated in development mode without email verification');
          }
        }
      }

      res.status(201).json(responseObj);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Lấy thông tin người dùng
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        updatedAt: user.updatedAt,
      };

      res.json(userProfile);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      if (
        req.body.connectWith ||
        req.body.industryInterests ||
        req.body.interests ||
        req.body.lookingFor
      ) {
        // Initialize if not exists
        if (!user.connectionPreferences) {
          user.connectionPreferences = {
            connectWith: [],
            industryInterests: [],
            interests: [],
            lookingFor: [],
          };
        }

        if (req.body.connectWith)
          user.connectionPreferences.connectWith = req.body.connectWith;
        if (req.body.industryInterests)
          user.connectionPreferences.industryInterests =
            req.body.industryInterests;
        if (req.body.interests)
          user.connectionPreferences.interests = req.body.interests;
        if (req.body.lookingFor)
          user.connectionPreferences.lookingFor = req.body.lookingFor;
      }

      // Update role-specific settings based on the user's role
      if (user.role === "manufacturer" && req.body.manufacturerSettings) {
        const settings = req.body.manufacturerSettings;

        // Initialize if not exists
        if (!user.manufacturerSettings) {
          user.manufacturerSettings = {
            productionCapacity: 0,
            certifications: [],
            preferredCategories: [],
            minimumOrderValue: 0,
          };
        }

        if (settings.productionCapacity !== undefined)
          user.manufacturerSettings.productionCapacity =
            settings.productionCapacity;
        if (settings.certifications)
          user.manufacturerSettings.certifications = settings.certifications;
        if (settings.preferredCategories)
          user.manufacturerSettings.preferredCategories =
            settings.preferredCategories;
        if (settings.minimumOrderValue !== undefined)
          user.manufacturerSettings.minimumOrderValue =
            settings.minimumOrderValue;
      }

      if (user.role === "brand" && req.body.brandSettings) {
        const settings = req.body.brandSettings;

        // Initialize if not exists
        if (!user.brandSettings) {
          user.brandSettings = {
            marketSegments: [],
            brandValues: [],
            targetDemographics: [],
            productCategories: [],
          };
        }

        if (settings.marketSegments)
          user.brandSettings.marketSegments = settings.marketSegments;
        if (settings.brandValues)
          user.brandSettings.brandValues = settings.brandValues;
        if (settings.targetDemographics)
          user.brandSettings.targetDemographics = settings.targetDemographics;
        if (settings.productCategories)
          user.brandSettings.productCategories = settings.productCategories;
      }

      if (user.role === "retailer" && req.body.retailerSettings) {
        const settings = req.body.retailerSettings;

        // Initialize if not exists
        if (!user.retailerSettings) {
          user.retailerSettings = {
            storeLocations: 0,
            averageOrderValue: 0,
            customerBase: [],
            preferredCategories: [],
          };
        }

        if (settings.storeLocations !== undefined)
          user.retailerSettings.storeLocations = settings.storeLocations;
        if (settings.averageOrderValue !== undefined)
          user.retailerSettings.averageOrderValue = settings.averageOrderValue;
        if (settings.customerBase)
          user.retailerSettings.customerBase = settings.customerBase;
        if (settings.preferredCategories)
          user.retailerSettings.preferredCategories =
            settings.preferredCategories;
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
        token: generateToken(userId),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Verify user email with code
// @route   POST /api/users/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      res.status(400).json({ message: "Email and verification code are required" });
      return;
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // If user is already active
    if (user.status === 'active') {
      res.json({
        success: true,
        message: "Your email has already been verified",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
      return;
    }

    // Check if we have a verification code for this email
    const storedVerification = verificationCodes[email];
    const isDevMode = process.env.NODE_ENV === 'development';

    // In development mode, accept any verification code that matches when email config is missing
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    if (isDevMode && !hasEmailConfig && storedVerification && verificationCode === storedVerification.code) {
      // Update user status to active
      user.status = 'active';
      await user.save();

      // Remove verification code from memory
      delete verificationCodes[email];

      console.log(`✅ Email verified in development mode: ${email}`);
      
      res.json({
        success: true,
        message: "Email verified successfully (development mode)",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
      return;
    }

    if (!storedVerification) {
      // Handle the case where verification code is missing or expired
      if (isDevMode && !hasEmailConfig) {
        // In dev mode without email config, auto-verify with any code
        console.log('⚠️ DEV MODE: Auto-verifying user');
        user.status = 'active';
        await user.save();

        res.json({
          success: true,
          message: "Auto-verified in development mode",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
        return;
      } else {
        res.status(400).json({ message: "Verification code is invalid or has expired" });
        return;
      }
    }

    // Check if code has expired (1 minute validity)
    const now = new Date();
    if (now > storedVerification.expires) {
      // Remove expired code
      delete verificationCodes[email];
      res.status(400).json({ message: "Verification code has expired" });
      return;
    }

    // Verify the code
    if (verificationCode !== storedVerification.code) {
      res.status(400).json({ message: "Invalid verification code" });
      return;
    }

    // Update user status to active
    user.status = 'active';
    await user.save();

    // Remove used verification code
    delete verificationCodes[email];
    
    console.log(`✅ Email verified successfully: ${email}`);

    res.json({
      success: true,
      message: "Email verified successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Email verification error');
    
    if (error instanceof Error) {
      res.status(500).json({ message: "Verification failed" });
    } else {
      res.status(500).json({ message: "Unknown error occurred during verification" });
    }
  }
};

// @desc    Resend verification code
// @route   POST /api/users/resend-verification
// @access  Public
export const resendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if the user is already verified
    if (user.status === 'active') {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    // Generate a new verification code
    const verificationCode = generateVerificationCode();
    
    // Set expiration to 1 minute from now
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 1);
    
    // Store the code with its expiration
    verificationCodes[email] = {
      code: verificationCode,
      expires: expiration
    };

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log(`Verification email resent to ${email}`);
      
      // Create response object
      const responseObj: any = {
        success: true,
        message: "Verification email sent successfully",
      };
      
      // In development, include verification code but don't log it
      if (process.env.NODE_ENV === 'development') {
        responseObj.verificationCode = verificationCode;
      }
      
      res.json(responseObj);
    } catch (error) {
      console.error('Error with email verification process');
      
      // In development mode, still return success but include the verification code
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Development mode: Continuing despite email error');
        
        res.json({
          success: true,
          message: "Verification email simulation successful (development mode)",
          verificationCode: verificationCode
        });
        return;
      }
      
      // In production, return error
      res.status(500).json({ message: "Failed to send verification email" });
    }
  } catch (error) {
    console.error('Resend verification error');
    
    if (error instanceof Error) {
      res.status(500).json({ message: "Failed to resend verification email" });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Request password reset email
// @route   POST /api/users/forgot-password
// @access  Public
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, still return success but don't send email
    // This prevents user enumeration attacks
    if (!user) {
      res.status(200).json({ 
        message: "If an account with that email exists, we have sent password reset instructions." 
      });
      return;
    }

    // Generate a password reset token
    const resetTokenData = generatePasswordResetToken();

    // Save the hashed token to the database with expiry
    user.resetPasswordToken = resetTokenData.token;
    user.resetPasswordExpires = resetTokenData.expires;
    await user.save();

    // Build the reset URL
    const resetUrl = buildResetUrl(resetTokenData.plainToken);

    // Send the reset email
    try {
      await sendPasswordResetEmail(email, resetTokenData.plainToken, resetUrl);
      
      res.status(200).json({ 
        message: "If an account with that email exists, we have sent password reset instructions." 
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Clear the reset token data since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      res.status(500).json({ message: "Failed to send password reset email. Please try again later." });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Reset password with token
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: "Token and password are required" });
      return;
    }

    // Hash the provided token for comparison
    const hashedToken = hashToken(token);

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired password reset token" });
      return;
    }

    // Set the new password
    user.password = password;
    
    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};
