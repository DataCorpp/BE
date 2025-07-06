import express from "express";
import {
  getProducts,
  getProductDetails,
  createProductGeneric,
  updateProduct,
  deleteProduct,
  getProductStats,
} from "../controllers/productController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// Route /api/products
router.route("/").get(getProducts).post(protect, manufacturer, createProductGeneric);

// Route /api/products/stats - Thống kê sản phẩm theo type  
router.route("/stats").get(getProductStats);

// Route /api/products/:id/details - Chi tiết sản phẩm
router.route("/:id/details").get(getProductDetails);

// Route /api/products/:id - CRUD operations
router
  .route("/:id")
  .put(protect, manufacturer, updateProduct)
  .delete(protect, manufacturer, deleteProduct);

export default router;
