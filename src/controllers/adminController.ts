import { Request, Response } from "express";
import User from "../models/User";

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    console.log("Database query: Fetching all users");
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get filter parameters
    const search = req.query.search as string;
    const role = req.query.role as string;
    
    // Build filter query
    const filter: any = {};
    if (role) {
      filter.role = { $regex: role, $options: 'i' }; // Case-insensitive match
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const users = await User.find(filter, "-password")
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);
    
    console.log(`Successfully fetched ${users.length} users from database (page ${page}, limit ${limit})`);

    // Return data in a consistent format
    res.json({
      success: true,
      data: {
        users,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Database error when fetching users:", error);

    // Send more detailed error for debugging
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: "Error fetching users from database",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: "Unknown error fetching users" 
      });
    }
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user" 
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    // Handle "new" userId case - creating a new user
    if (req.params.id === 'new') {
      if (!req.body.email) {
        return res.status(400).json({ 
          success: false,
          message: "Email is required" 
        });
      }

      // Create user with random password (that they'd need to reset)
      const randomPassword = Math.random().toString(36).slice(-8);
      const newUser = new User({
        ...req.body,
        password: randomPassword,
        isPasswordTemporary: true
      });

      await newUser.save();
      
      // Return user without password
      const userObject = newUser.toObject();
      delete userObject.password;
      
      return res.status(201).json({
        success: true,
        data: userObject,
        message: "User created successfully"
      });
    }

    // Regular update case
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update fields
    Object.assign(user, req.body);
    await user.save();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      success: true,
      data: userObject
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating user",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    res.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting user" 
    });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Sử dụng User.findByIdAndUpdate thay vì assign trực tiếp
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating user role" 
    });
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Sử dụng User.findByIdAndUpdate thay vì assign trực tiếp
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating user status" 
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Validate the user ID
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }

    // Validate the profile data
    if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No profile data provided" 
      });
    }

    console.log(`Updating profile for user ${userId}:`, profileData);

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: profileData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log("User profile updated successfully");
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: "Error updating user profile",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: "Unknown error updating user profile" 
      });
    }
  }
};

// ================= ADMIN AUTHENTICATION =================

// @desc    Admin login to obtain auth token
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user with matching email & admin role
    const user = await User.findOne({ email, role: "admin" });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or not an admin user",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // For now we create a simple token (could be JWT in future). ProtectAdmin only checks presence.
    const token = `adm-${user._id}-${Date.now()}`;

    // Return minimal user information & token
    res.json({
      success: true,
      message: "Admin login successful",
      role: user.role,
      email: user.email,
      name: user.name,
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Return current admin info (requires protectAdmin headers)
// @route   GET /api/admin/me
// @access  Private (admin)
export const adminMe = async (req: Request, res: Response) => {
  try {
    // protectAdmin has already attached req.user
    const adminUser = (req as any).user;

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(401).json({ success: false, message: "Not authenticated as admin" });
    }

    res.json({
      success: true,
      role: adminUser.role,
      email: adminUser.email,
    });
  } catch (error) {
    console.error("Admin me error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
