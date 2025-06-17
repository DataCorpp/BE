import express from "express";
import {
  getAllManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  getIndustries,
  getLocations
} from "../controllers/manufacturerController";
import { protect } from "../middleware/authMiddleware";
import { validateCreateManufacturer, validateUpdateManufacturer } from "../middleware/manufacturerValidation";

const router = express.Router();

// Route /api/manufacturers
router.route("/")
  .get(getAllManufacturers)
  .post(protect, validateCreateManufacturer, createManufacturer);

// Get metadata routes
router.get("/industries", getIndustries);
router.get("/locations", getLocations);

// Route /api/manufacturers/:id
router.route("/:id")
  .get(getManufacturerById)
  .put(protect, validateUpdateManufacturer, updateManufacturer)
  .delete(protect, deleteManufacturer);

export default router; 