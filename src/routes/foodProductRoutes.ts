import express from "express";
import {
  getFoodProducts,
  getFoodProductById,
  createFoodProduct,
  updateFoodProduct,
  deleteFoodProduct,
} from "../controllers/foodProductController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// Route /api/foodproducts
router.route("/").get(getFoodProducts).post(protect, manufacturer, createFoodProduct);

// Route /api/foodproducts/:id
router
  .route("/:id")
  .get(getFoodProductById)
  .put(protect, manufacturer, updateFoodProduct)
  .delete(protect, manufacturer, deleteFoodProduct);

export default router; 