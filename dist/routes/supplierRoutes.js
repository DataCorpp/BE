"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supplierController_1 = require("../controllers/supplierController");
const router = express_1.default.Router();
// Routes for getting different supplier types
router.get("/packaging", supplierController_1.getPackagingSuppliers);
router.get("/ingredients", supplierController_1.getIngredientSuppliers);
router.get("/secondary-packagers", supplierController_1.getSecondaryPackagers);
router.get("/packaging-services", supplierController_1.getPackagingServices);
// Routes for getting specific supplier by ID
router.get("/:type/:id", supplierController_1.getSupplierById);
// Routes for getting filter options
router.get("/filters/:type", supplierController_1.getSupplierFilters);
exports.default = router;
