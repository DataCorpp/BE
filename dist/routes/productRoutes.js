"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const router = express_1.default.Router();
// Route /api/products - lấy thông tin cơ bản với discriminator support
router.route("/").get(productController_1.getProducts);
// Route /api/products/types - lấy danh sách product types (discriminators)
router.route("/types").get(productController_1.getProductTypes);
// Route /api/products/manufacturers - lấy danh sách manufacturers với discriminator grouping
router.route("/manufacturers").get(productController_1.getManufacturers);
// Route /api/products/stats - lấy thống kê products với discriminator breakdown
router.route("/stats").get(productController_1.getProductStats);
// Route /api/products/:id - lấy thông tin cơ bản
router.route("/:id").get(productController_1.getProductById);
// Route /api/products/:id/details - discriminator-based routing đến detail collection
router.route("/:id/details").get(productController_1.getProductDetails);
exports.default = router;
