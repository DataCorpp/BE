"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const foodProductController_1 = require("../controllers/foodProductController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Route /api/foodproducts
router.route("/")
    .get(foodProductController_1.getFoodProducts)
    .post(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.createFoodProduct);
// Get metadata routes
router.get("/categories", foodProductController_1.getCategories);
router.get("/types", foodProductController_1.getProductTypes);
router.get("/manufacturers", foodProductController_1.getManufacturers);
// Route /api/foodproducts/:id
router.route("/:id")
    .get(foodProductController_1.getFoodProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.updateFoodProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.deleteFoodProduct);
exports.default = router;
