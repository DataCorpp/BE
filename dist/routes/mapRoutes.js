"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mapController_1 = require("../controllers/mapController");
const router = express_1.default.Router();
// GET /api/map/locations - Get all users with location data
router.get('/locations', mapController_1.MapController.getAllUsersLocations);
// GET /api/map/locations/:userId - Get specific user location
router.get('/locations/:userId', mapController_1.MapController.getUserLocation);
// GET /api/map/nearby - Get users near a specific location
router.get('/nearby', mapController_1.MapController.getUsersNearLocation);
// POST /api/map/geocode - Geocode an address to coordinates
router.post('/geocode', mapController_1.MapController.geocodeAddress);
// GET /api/map/stats - Get location statistics
router.get('/stats', mapController_1.MapController.getLocationStats);
// GET /api/map/groups - Get user proximity groups
router.get('/groups', mapController_1.MapController.getUserProximityGroups);
exports.default = router;
