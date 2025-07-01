"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Debug middleware to log admin route access attempts
router.use((req, res, next) => {
    console.log(`Admin route access: ${req.method} ${req.originalUrl}`);
    console.log("Authorization headers:", {
        adminAuth: req.headers["adminauthorization"] || "not provided",
        adminRole: req.headers["x-admin-role"] || "not provided",
        adminEmail: req.headers["x-admin-email"] || "not provided",
    });
    next();
});
// ===== Admin Authentication Routes (do NOT require protectAdmin) =====
router.post('/login', adminController_1.adminLogin);
// Route to get current admin info (requires headers)
router.get('/me', authMiddleware_1.protectAdmin, adminController_1.adminMe);
// Apply admin middlewares to all subsequent routes
router.use(authMiddleware_1.protectAdmin);
router.use(authMiddleware_1.admin);
// User management routes
router.get("/users", adminController_1.getAllUsers);
router.get("/users/:id", adminController_1.getUserById);
router.put("/users/:id", adminController_1.updateUser);
router.delete("/users/:id", adminController_1.deleteUser);
router.patch("/users/:id/role", adminController_1.updateUserRole);
router.patch("/users/:id/status", adminController_1.updateUserStatus);
router.patch("/users/:id/profile", adminController_1.updateUserProfile);
exports.default = router;
