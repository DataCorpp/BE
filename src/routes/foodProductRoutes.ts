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
router.route("/").get(getFoodProducts).post(createFoodProduct);

// Route /api/foodproducts/:id
router
  .route("/:id")
  .get(getFoodProductById)
  .put(updateFoodProduct)
  .delete(deleteFoodProduct);

export default router; 