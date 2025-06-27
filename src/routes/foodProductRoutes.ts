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
} from "../controllers/foodProductController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// Route /api/foodproducts
router.route("/")
  .get(getFoodProducts)
  .post(protect, manufacturer, createFoodProduct);

// Get metadata routes
router.get("/categories", getCategories);
router.get("/types", getProductTypes);
router.get("/manufacturers", getManufacturers);

// Route /api/foodproducts/:id
router.route("/:id")
  .get(getFoodProductById)
  .put(updateFoodProduct)
  .delete(protect, manufacturer, deleteFoodProduct);

export default router; 