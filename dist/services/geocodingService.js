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
exports.GeocodingService = void 0;
const node_geocoder_1 = __importDefault(require("node-geocoder"));
const options = {
    provider: 'openstreetmap',
    formatter: null
};
const geocoder = (0, node_geocoder_1.default)(options);
class GeocodingService {
    /**
     * Convert address to coordinates
     */
    static geocodeAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!address || address.trim() === '') {
                    return null;
                }
                const results = yield geocoder.geocode(address);
                if (results && results.length > 0) {
                    const result = results[0];
                    return {
                        latitude: result.latitude || 0,
                        longitude: result.longitude || 0
                    };
                }
                return null;
            }
            catch (error) {
                console.error('Geocoding error for address:', address, error);
                return null;
            }
        });
    }
    /**
     * Convert multiple addresses to coordinates in batch
     */
    static geocodeAddresses(addresses) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = new Map();
            // Process addresses in batches to avoid rate limiting
            const batchSize = 5;
            for (let i = 0; i < addresses.length; i += batchSize) {
                const batch = addresses.slice(i, i + batchSize);
                yield Promise.all(batch.map((address) => __awaiter(this, void 0, void 0, function* () {
                    const coordinates = yield this.geocodeAddress(address);
                    if (coordinates) {
                        results.set(address, coordinates);
                    }
                    // Add delay to respect rate limits
                    yield new Promise(resolve => setTimeout(resolve, 200));
                })));
            }
            return results;
        });
    }
    /**
     * Get location data for users with valid addresses
     */
    static getUsersLocationData(users) {
        return __awaiter(this, void 0, void 0, function* () {
            const locationData = [];
            for (const user of users) {
                if (user.address && user.address.trim() !== '') {
                    const coordinates = yield this.geocodeAddress(user.address);
                    if (coordinates) {
                        locationData.push({
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
                        });
                    }
                }
            }
            return locationData;
        });
    }
    /**
     * Get users within a certain radius of a point
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }
    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    /**
     * Filter users by radius from a center point
     */
    static filterUsersByRadius(locationData, centerLat, centerLon, radiusKm) {
        return locationData.filter(user => {
            const distance = this.calculateDistance(centerLat, centerLon, user.coordinates.latitude, user.coordinates.longitude);
            return distance <= radiusKm;
        });
    }
    /**
     * Group users by proximity
     */
    static groupUsersByProximity(locationData, radiusKm = 50) {
        const groups = [];
        const processed = new Set();
        for (const user of locationData) {
            if (processed.has(user.userId))
                continue;
            const group = [user];
            processed.add(user.userId);
            // Find nearby users
            for (const otherUser of locationData) {
                if (processed.has(otherUser.userId))
                    continue;
                const distance = this.calculateDistance(user.coordinates.latitude, user.coordinates.longitude, otherUser.coordinates.latitude, otherUser.coordinates.longitude);
                if (distance <= radiusKm) {
                    group.push(otherUser);
                    processed.add(otherUser.userId);
                }
            }
            groups.push(group);
        }
        return groups;
    }
}
exports.GeocodingService = GeocodingService;
