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
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin);
router.post("/logout", logoutUser);
router.get("/manufacturers", getManufacturers);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
