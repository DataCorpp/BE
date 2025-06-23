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
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// ========== AUTHENTICATION ROUTES ==========
// Session-based authentication
router.post("/login", userController_1.loginUser);
router.post("/logout", userController_1.logoutUser);
// ========== REGISTRATION & VERIFICATION ==========
router.post("/", userController_1.registerUser);
router.post("/register", userController_1.registerUser); // Alternative endpoint
router.post("/verify-email", userController_1.verifyEmail);
router.post("/resend-verification", userController_1.resendVerificationCode);
// ========== PASSWORD RESET ==========
router.post("/forgot-password", userController_1.requestPasswordReset);
router.post("/reset-password", userController_1.resetPassword);
// ========== OAUTH ==========
router.post("/google-login", userController_1.googleLogin);
// ========== PUBLIC ROUTES ==========
router.get("/manufacturers", userController_1.getManufacturers);
// ========== PROTECTED ROUTES (SESSION-BASED) ==========
// Protected routes using session authentication
router.get("/profile", authMiddleware_1.protect, userController_1.getUserProfile);
router.put("/profile", authMiddleware_1.protect, userController_1.updateUserProfile);
// User info endpoint (session-based)
router.get('/me', authMiddleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(req.session.userId).lean();
    res.json(user);
}));
// Add a test route to check session
router.get('/check-session', (req, res) => {
    var _a, _b, _c, _d, _e;
    console.log('=== SESSION CHECK ===');
    console.log('Session exists:', !!req.session);
    console.log('Session ID:', req.sessionID);
    console.log('Session userId:', ((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId) || 'NONE');
    console.log('Session userRole:', ((_b = req.session) === null || _b === void 0 ? void 0 : _b.userRole) || 'NONE');
    res.json({
        sessionExists: !!req.session,
        sessionID: req.sessionID,
        userId: ((_c = req.session) === null || _c === void 0 ? void 0 : _c.userId) || null,
        userRole: ((_d = req.session) === null || _d === void 0 ? void 0 : _d.userRole) || null,
        isAuthenticated: !!((_e = req.session) === null || _e === void 0 ? void 0 : _e.userId)
    });
});
exports.default = router;
