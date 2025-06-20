import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByType,
} from "../controllers/productController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// Route /api/products
router.route("/").get(getProducts).post(protect, manufacturer, createProduct);

// Route /api/products/type/:productType
router.route("/type/:productType").get(getProductsByType);

// Route /api/products/:id
router
  .route("/:id")
  .get(getProductById)
  .put(protect, manufacturer, updateProduct)
  .delete(protect, manufacturer, deleteProduct);

export default router;
