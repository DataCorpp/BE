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
// Public route for testing/development - không yêu cầu authentication
router.route("/public")
    .post(foodProductController_1.createFoodProduct);
// Simple route với validation ít nghiêm ngặt hơn
router.route("/simple")
    .post(foodProductController_1.createFoodProductSimple);
// Public route for updating - không yêu cầu authentication
router.route("/public/:id")
    .put(foodProductController_1.updateFoodProduct);
// Test endpoint để debug data
router.route("/debug")
    .post((req, res) => {
    console.log('=== DEBUG ENDPOINT ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Body keys:', Object.keys(req.body));
    console.log('Body type:', typeof req.body);
    // Kiểm tra các field bắt buộc
    const requiredFields = ['name', 'manufacturerName', 'manufacturer', 'originCountry', 'foodType', 'packagingType', 'packagingSize', 'shelfLife', 'storageInstruction'];
    const missingFields = [];
    const presentFields = [];
    for (const field of requiredFields) {
        if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
            missingFields.push(field);
        }
        else {
            presentFields.push(field);
        }
    }
    // Kiểm tra array fields
    const arrayFields = ['flavorType', 'ingredients', 'allergens'];
    const missingArrays = [];
    const presentArrays = [];
    for (const field of arrayFields) {
        if (!req.body[field] || !Array.isArray(req.body[field]) || req.body[field].length === 0) {
            missingArrays.push(field);
        }
        else {
            presentArrays.push(field);
        }
    }
    res.json({
        message: 'Debug endpoint - check server logs',
        receivedData: req.body,
        dataKeys: Object.keys(req.body),
        validation: {
            requiredFields: {
                present: presentFields,
                missing: missingFields
            },
            arrayFields: {
                present: presentArrays,
                missing: missingArrays
            }
        }
    });
});
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
router.get("/categories", foodProductController_1.getCategories);
router.get("/types", foodProductController_1.getProductTypes);
router.get("/manufacturers", foodProductController_1.getManufacturers);
// Route /api/foodproducts/:id
router.route("/:id")
    .get(foodProductController_1.getFoodProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.updateFoodProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.manufacturer, foodProductController_1.deleteFoodProduct);
exports.default = router;
