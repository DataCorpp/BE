import express from "express";
import {
  getFoodProducts,
  getFoodProductById,
  createFoodProduct,
  updateFoodProduct,
  deleteFoodProduct,
  getCategories,
  getProductTypes,
  getManufacturers,
  getFoodTypes,
  uploadProductImages,
  updateProductImage,
  updateProductImages
} from "../controllers/foodProductController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// @route   GET /api/foodproducts
// @desc    Get all food products with filtering options
// @access  Public
router.route("/")
  .get(getFoodProducts)
  .post(protect, manufacturer, createFoodProduct);

// @route   GET /api/foodproducts/metadata
// @desc    Get food product metadata for filters/dropdowns
// @access  Public
router.get("/categories", getCategories);
router.get("/types", getProductTypes);
router.get("/manufacturers", getManufacturers);
router.get("/foodtypes", getFoodTypes);

// @route   /api/foodproducts/images
// @desc    Upload and manage food product images
// @access  Protected
router.post("/images", protect, manufacturer, uploadProductImages);
router.put("/images", protect, manufacturer, updateProductImages);
router.put("/image", protect, manufacturer, updateProductImage);

// @route   /api/foodproducts/:id
// @desc    CRUD operations for individual food products
// @access  Mixed (GET: public, others: protected)
router.route("/:id")
  .get(getFoodProductById)
  .put(protect, manufacturer, updateFoodProduct)
  .delete(protect, manufacturer, deleteFoodProduct);

export default router; 