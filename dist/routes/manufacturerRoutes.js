"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const manufacturerController_1 = require("../controllers/manufacturerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const manufacturerValidation_1 = require("../middleware/manufacturerValidation");
const router = express_1.default.Router();
// Route /api/manufacturers
router.route("/")
    .get(manufacturerController_1.getAllManufacturers)
    .post(authMiddleware_1.protect, manufacturerValidation_1.validateCreateManufacturer, manufacturerController_1.createManufacturer);
// Get metadata routes
router.get("/industries", manufacturerController_1.getIndustries);
router.get("/locations", manufacturerController_1.getLocations);
// Route /api/manufacturers/:id
router.route("/:id")
    .get(manufacturerController_1.getManufacturerById)
    .put(authMiddleware_1.protect, manufacturerValidation_1.validateUpdateManufacturer, manufacturerController_1.updateManufacturer)
    .delete(authMiddleware_1.protect, manufacturerController_1.deleteManufacturer);
exports.default = router;
