"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const productValidation_1 = require("../middleware/productValidation");
const router = express_1.default.Router();
// Route /api/products
router.route("/")
    .get(productController_1.getProducts)
    .post(authMiddleware_1.protect, authMiddleware_1.manufacturer, productValidation_1.validateCreateProduct, productController_1.createProduct);
// Get metadata routes
router.get("/categories", productController_1.getCategories);
router.get("/types", productController_1.getProductTypes);
// Get products by manufacturer
router.get("/manufacturer/:manufacturerId", productController_1.getProductsByManufacturer);
// Route /api/products/:id
router.route("/:id")
    .get(productController_1.getProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.manufacturer, productValidation_1.validateUpdateProduct, productController_1.updateProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.manufacturer, productController_1.deleteProduct);
exports.default = router;
