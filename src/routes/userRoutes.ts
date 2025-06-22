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
  getManufacturers
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

// ========== PROTECTED ROUTES (SESSION-BASED) ==========

// Protected routes using session authentication
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// User info endpoint (session-based)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).lean();
  res.json(user);
});

export default router;
