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
} from "../controllers/foodProductController";
import { protect, manufacturer } from "../middleware/authMiddleware";

const router = express.Router();

// Route /api/foodproducts
router.route("/")
  .get(getFoodProducts)
  .post(protect, manufacturer, createFoodProduct);

// Public route for testing/development - không yêu cầu authentication
router.route("/public")
  .post(createFoodProduct);

// Public route for updating - không yêu cầu authentication
router.route("/public/:id")
  .put(updateFoodProduct);

// Test endpoint để debug data
router.route("/test")
  .post((req, res) => {
    console.log('=== TEST ENDPOINT DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Body keys:', Object.keys(req.body));
    console.log('Body type:', typeof req.body);
    res.json({
      message: 'Test endpoint - check server logs',
      receivedData: req.body,
      dataKeys: Object.keys(req.body)
    });
  });

// Get metadata routes
router.get("/categories", getCategories);
router.get("/types", getProductTypes);
router.get("/manufacturers", getManufacturers);
router.get("/foodtypes", getFoodTypes);

// Route /api/foodproducts/:id
router.route("/:id")
  .get(getFoodProductById)
  .put(protect, manufacturer, updateFoodProduct)
  .delete(protect, manufacturer, deleteFoodProduct);

export default router; 