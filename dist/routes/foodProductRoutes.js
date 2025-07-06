"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const foodProductController_1 = require("../controllers/foodProductController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// @route   GET /api/foodproducts
// @desc    Get all food products with filtering options
// @access  Public
router.route("/")
    .get(foodProductController_1.getFoodProducts)
    .post(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.createFoodProduct);
// @route   GET /api/foodproducts/metadata
// @desc    Get food product metadata for filters/dropdowns
// @access  Public
router.get("/categories", foodProductController_1.getCategories);
router.get("/types", foodProductController_1.getProductTypes);
router.get("/manufacturers", foodProductController_1.getManufacturers);
router.get("/foodtypes", foodProductController_1.getFoodTypes);
// @route   /api/foodproducts/images
// @desc    Upload and manage food product images
// @access  Protected
router.post("/images", authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.uploadProductImages);
router.put("/images", authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.updateProductImages);
router.put("/image", authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.updateProductImage);
router.delete("/image", authMiddleware_1.protect, foodProductController_1.deleteProductImage);
// @route   /api/foodproducts/:id
// @desc    CRUD operations for individual food products
// @access  Mixed (GET: public, others: protected)
router.route("/:id")
    .get(foodProductController_1.getFoodProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.updateFoodProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.deleteFoodProduct);
exports.default = router;
