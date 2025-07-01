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
  getManufacturers,
  getRolesByEmail
} from "../controllers/userController";
import { protect, requireAuth } from "../middleware/authMiddleware";
import User from "../models/User";

const router = express.Router();

// ========== AUTHENTICATION ROUTES ==========

// Session-based authentication
router.post("/login", loginUser);
router.post("/logout", logoutUser);

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
router.get("/roles/:email", getRolesByEmail);

// ========== PROTECTED ROUTES (SESSION-BASED) ==========

// Protected routes using session authentication
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// User info endpoint (session-based)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).lean();
  res.json(user);
});

// Add a test route to check session
router.get('/check-session', (req, res) => {
  console.log('=== SESSION CHECK ===');
  console.log('Session exists:', !!req.session);
  console.log('Session ID:', req.sessionID);
  console.log('Session userId:', req.session?.userId || 'NONE');
  console.log('Session userRole:', req.session?.userRole || 'NONE');
  
  res.json({
    sessionExists: !!req.session,
    sessionID: req.sessionID,
    userId: req.session?.userId || null,
    userRole: req.session?.userRole || null,
    isAuthenticated: !!req.session?.userId
  });
});

export default router;
