import express from "express";
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword
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

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
