"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post("/login", userController_1.loginUser);
router.post("/", userController_1.registerUser);
router.post("/verify-email", userController_1.verifyEmail);
router.post("/resend-verification", userController_1.resendVerificationCode);
router.post("/forgot-password", userController_1.requestPasswordReset);
router.post("/reset-password", userController_1.resetPassword);
// Protected routes
router.get("/profile", authMiddleware_1.protect, userController_1.getUserProfile);
router.put("/profile", authMiddleware_1.protect, userController_1.updateUserProfile);
exports.default = router;
