"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Route /api/products
router.route("/").get(productController_1.getProducts).post(authMiddleware_1.protect, authMiddleware_1.manufacturer, productController_1.createProduct);
// Route /api/products/type/:productType
router.route("/type/:productType").get(productController_1.getProductsByType);
// Route /api/products/:id
router
    .route("/:id")
    .get(productController_1.getProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.manufacturer, productController_1.updateProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.manufacturer, productController_1.deleteProduct);
exports.default = router;
