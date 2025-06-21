import express from "express";
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
  googleLogin,
  logoutUser,
  refreshAccessToken,
  logoutUserWithTokens,
  getManufacturers
} from "../controllers/userController";
import { protect, protectWithAccessToken } from "../middleware/authMiddleware";

const router = express.Router();

// ========== AUTHENTICATION ROUTES ==========

// Legacy authentication (session-based)
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// JWT authentication routes
router.post("/auth/login", loginUser); // Same function but different endpoint
router.post("/auth/refresh-token", refreshAccessToken);
router.post("/auth/logout", logoutUserWithTokens);

// ========== REGISTRATION & VERIFICATION ==========
router.post("/", registerUser);
router.post("/register", registerUser); // Alternative endpoint
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);

// ========== PASSWORD RESET ==========
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// ========== OAUTH ==========
router.post("/google-login", googleLogin);

// ========== PUBLIC ROUTES ==========
router.get("/manufacturers", getManufacturers);

// ========== PROTECTED ROUTES ==========

// Legacy protected routes (support both JWT and session)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// JWT-only protected routes
router.get("/auth/me", protectWithAccessToken, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        companyName: user.companyName,
        profileComplete: user.profileComplete,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user info"
    });
  }
});

// Alternative endpoint for getUserProfile (legacy compatibility)
router.get("/me", protect, getUserProfile);

export default router;
