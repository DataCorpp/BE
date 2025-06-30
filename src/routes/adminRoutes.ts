import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  updateUserProfile,
  adminLogin,
  adminMe,
} from "../controllers/adminController";
import { admin, protectAdmin } from "../middleware/authMiddleware";

const router = express.Router();

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
router.post('/login', adminLogin);

// Route to get current admin info (requires headers)
router.get('/me', protectAdmin, adminMe);

// Apply admin middlewares to all subsequent routes
router.use(protectAdmin);
router.use(admin);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/profile", updateUserProfile);

export default router;
