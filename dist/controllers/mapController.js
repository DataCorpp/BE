"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapController = void 0;
const User_1 = __importDefault(require("../models/User"));
const geocodingService_1 = require("../services/geocodingService");
class MapController {
    /**
     * Get all users with their location data
     */
    static getAllUsersLocations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { role, industry, radius, centerLat, centerLon, status = 'active' } = req.query;
                // Build query filters
                let query = {};
                // Filter by status (exclude inactive users by default)
                if (status) {
                    if (status === 'all') {
                        // Don't filter by status
                    }
                    else {
                        query.status = status;
                    }
                }
                else {
                    query.status = { $ne: 'inactive' };
                }
                // Filter by role
                if (role && role !== 'all') {
                    query.role = role;
                }
                // Filter by industry
                if (industry && industry !== 'all') {
                    query.industry = new RegExp(industry, 'i');
                }
                // Only get users with addresses
                query.address = { $exists: true, $ne: '', $nin: [null] };
                const users = yield User_1.default.find(query).select('name email companyName role address industry establish description companyDescription avatar status');
                if (!users || users.length === 0) {
                    return res.json({
                        success: true,
                        message: 'No users found with addresses',
                        locations: [],
                        total: 0
                    });
                }
                // Get location data for users
                let locationData = yield geocodingService_1.GeocodingService.getUsersLocationData(users);
                // Filter by radius if specified
                if (radius && centerLat && centerLon) {
                    const radiusKm = parseFloat(radius);
                    const lat = parseFloat(centerLat);
                    const lon = parseFloat(centerLon);
                    if (!isNaN(radiusKm) && !isNaN(lat) && !isNaN(lon)) {
                        locationData = geocodingService_1.GeocodingService.filterUsersByRadius(locationData, lat, lon, radiusKm);
                    }
                }
                res.json({
                    success: true,
                    locations: locationData,
                    total: locationData.length,
                    filters: {
                        role: role || 'all',
                        industry: industry || 'all',
                        status: status || 'active',
                        radius: radius ? parseFloat(radius) : null,
                        center: (centerLat && centerLon) ? {
                            latitude: parseFloat(centerLat),
                            longitude: parseFloat(centerLon)
                        } : null
                    }
                });
            }
            catch (error) {
                console.error('Error getting users locations:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving user locations',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
    /**
     * Get location data for a specific user
     */
    static getUserLocation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const user = yield User_1.default.findById(userId).select('name email companyName role address industry establish description companyDescription avatar status');
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                if (!user.address || user.address.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: 'User does not have an address'
                    });
                }
                const coordinates = yield geocodingService_1.GeocodingService.geocodeAddress(user.address);
                if (!coordinates) {
                    return res.status(400).json({
                        success: false,
                        message: 'Unable to geocode user address'
                    });
                }
                const locationData = {
                    userId: user._id.toString(),
                    name: user.name,
                    companyName: user.companyName || '',
                    address: user.address,
                    coordinates,
                    role: user.role,
                    industry: user.industry,
                    establishedYear: user.establish,
                    description: user.description || user.companyDescription,
                    avatar: user.avatar,
                    status: user.status
                };
                res.json({
                    success: true,
                    location: locationData
                });
            }
            catch (error) {
                console.error('Error getting user location:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving user location',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
    /**
     * Get users near a specific location
     */
    static getUsersNearLocation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { latitude, longitude, radius = 50, // Default 50km radius
                role, industry, limit = 50 } = req.query;
                if (!latitude || !longitude) {
                    return res.status(400).json({
                        success: false,
                        message: 'Latitude and longitude are required'
                    });
                }
                const lat = parseFloat(latitude);
                const lon = parseFloat(longitude);
                const radiusKm = parseFloat(radius);
                const limitNum = parseInt(limit);
                if (isNaN(lat) || isNaN(lon) || isNaN(radiusKm)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid coordinates or radius'
                    });
                }
                // Build query filters
                let query = {
                    address: { $exists: true, $ne: '', $nin: [null] },
                    status: { $ne: 'inactive' }
                };
                if (role && role !== 'all') {
                    query.role = role;
                }
                if (industry && industry !== 'all') {
                    query.industry = new RegExp(industry, 'i');
                }
                const users = yield User_1.default.find(query)
                    .limit(limitNum * 2) // Get more users to account for geocoding failures
                    .select('name email companyName role address industry establish description companyDescription avatar status');
                if (!users || users.length === 0) {
                    return res.json({
                        success: true,
                        message: 'No users found',
                        locations: [],
                        total: 0
                    });
                }
                // Get location data for all users
                const allLocationData = yield geocodingService_1.GeocodingService.getUsersLocationData(users);
                // Filter by radius
                const nearbyUsers = geocodingService_1.GeocodingService.filterUsersByRadius(allLocationData, lat, lon, radiusKm);
                // Sort by distance and limit results
                const usersWithDistance = nearbyUsers.map(user => (Object.assign(Object.assign({}, user), { distance: geocodingService_1.GeocodingService.calculateDistance(lat, lon, user.coordinates.latitude, user.coordinates.longitude) }))).sort((a, b) => a.distance - b.distance).slice(0, limitNum);
                res.json({
                    success: true,
                    locations: usersWithDistance,
                    total: usersWithDistance.length,
                    searchCenter: { latitude: lat, longitude: lon },
                    searchRadius: radiusKm
                });
            }
            catch (error) {
                console.error('Error getting nearby users:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving nearby users',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
    /**
     * Geocode an address to coordinates
     */
    static geocodeAddress(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { address } = req.body;
                if (!address || address.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: 'Address is required'
                    });
                }
                const coordinates = yield geocodingService_1.GeocodingService.geocodeAddress(address);
                if (!coordinates) {
                    return res.status(400).json({
                        success: false,
                        message: 'Unable to geocode the provided address'
                    });
                }
                res.json({
                    success: true,
                    address,
                    coordinates
                });
            }
            catch (error) {
                console.error('Error geocoding address:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error geocoding address',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
    /**
     * Get statistics about user locations
     */
    static getLocationStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalUsers = yield User_1.default.countDocuments();
                const usersWithAddress = yield User_1.default.countDocuments({
                    address: { $exists: true, $ne: '', $nin: [null] }
                });
                const roleStats = yield User_1.default.aggregate([
                    {
                        $match: {
                            address: { $exists: true, $ne: '', $nin: [null] }
                        }
                    },
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 }
                        }
                    }
                ]);
                const industryStats = yield User_1.default.aggregate([
                    {
                        $match: {
                            address: { $exists: true, $ne: '', $nin: [null] },
                            industry: { $exists: true, $ne: '', $nin: [null] }
                        }
                    },
                    {
                        $group: {
                            _id: '$industry',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]);
                const statusStats = yield User_1.default.aggregate([
                    {
                        $match: {
                            address: { $exists: true, $ne: '', $nin: [null] }
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]);
                res.json({
                    success: true,
                    stats: {
                        totalUsers,
                        usersWithAddress,
                        usersWithoutAddress: totalUsers - usersWithAddress,
                        coveragePercentage: Math.round((usersWithAddress / totalUsers) * 100),
                        byRole: roleStats.reduce((acc, item) => {
                            acc[item._id] = item.count;
                            return acc;
                        }, {}),
                        byIndustry: industryStats.reduce((acc, item) => {
                            acc[item._id] = item.count;
                            return acc;
                        }, {}),
                        byStatus: statusStats.reduce((acc, item) => {
                            acc[item._id] = item.count;
                            return acc;
                        }, {})
                    }
                });
            }
            catch (error) {
                console.error('Error getting location stats:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving location statistics',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
    /**
     * Group users by proximity
     */
    static getUserProximityGroups(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { radius = 50, role, industry } = req.query;
                const radiusKm = parseFloat(radius);
                if (isNaN(radiusKm)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid radius value'
                    });
                }
                // Build query filters
                let query = {
                    address: { $exists: true, $ne: '', $nin: [null] },
                    status: { $ne: 'inactive' }
                };
                if (role && role !== 'all') {
                    query.role = role;
                }
                if (industry && industry !== 'all') {
                    query.industry = new RegExp(industry, 'i');
                }
                const users = yield User_1.default.find(query).select('name email companyName role address industry establish description companyDescription avatar status');
                if (!users || users.length === 0) {
                    return res.json({
                        success: true,
                        message: 'No users found',
                        groups: [],
                        totalGroups: 0
                    });
                }
                // Get location data for users
                const locationData = yield geocodingService_1.GeocodingService.getUsersLocationData(users);
                // Group users by proximity
                const groups = geocodingService_1.GeocodingService.groupUsersByProximity(locationData, radiusKm);
                // Sort groups by size (largest first)
                groups.sort((a, b) => b.length - a.length);
                res.json({
                    success: true,
                    groups,
                    totalGroups: groups.length,
                    totalUsers: locationData.length,
                    radius: radiusKm
                });
            }
            catch (error) {
                console.error('Error getting proximity groups:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving proximity groups',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
        });
    }
}
exports.MapController = MapController;
