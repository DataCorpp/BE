"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema cho FoodProduct theo format mới
const foodProductSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    originCountry: {
        type: String,
        trim: true,
    },
    manufacturer: {
        type: mongoose_1.Types.ObjectId,
        ref: 'Manufacturer',
        required: [true, "Manufacturer is required"],
    },
    image: {
        type: String,
        default: "/placeholder.svg",
    },
    price: {
        type: String,
        trim: true,
    },
    currency: {
        type: String,
        trim: true,
        default: "USD",
    },
    pricePerUnit: {
        type: Number,
        min: [0, "Price per unit cannot be negative"],
    },
    unitType: {
        type: String,
        trim: true,
        default: "units",
    },
    packagingSize: {
        type: String,
        trim: true,
    },
    rating: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
        default: 4.0,
    },
    reviewsCount: {
        type: Number,
        min: [0, "Reviews count cannot be negative"],
        default: 0,
    },
    productType: {
        type: String,
        trim: true,
        default: "seasoning",
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    minOrderQuantity: {
        type: Number,
        min: [1, "Minimum order quantity must be at least 1"],
        default: 1,
    },
    leadTimeDetailed: {
        average: {
            type: Number,
            min: [0, "Lead time average cannot be negative"],
        },
        max: {
            type: Number,
            min: [0, "Lead time max cannot be negative"],
        },
        unit: {
            type: String,
            enum: ["days", "weeks", "months"],
            default: "weeks",
        },
    },
    sustainable: {
        type: Boolean,
        default: false,
    },
    ingredients: [{
            type: String,
            trim: true,
        }],
    allergens: [{
            type: String,
            trim: true,
        }],
    flavorType: [{
            type: String,
            enum: ["salty", "sweet", "spicy", "umami", "sour", "aromatic", "creamy", "nutty", "savory", "citrus", "tangy", "rich", "mild", "complex"],
            trim: true,
        }],
    usage: [{
            type: String,
            trim: true,
        }],
    shelfLife: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['available', 'discontinued', 'preorder'],
        default: 'available',
    },
    // Backwards compatibility fields
    leadTime: {
        type: String,
        trim: true,
    },
    leadTimeUnit: {
        type: String,
        default: "weeks",
    },
    sku: {
        type: String,
        trim: true,
    },
    currentAvailable: {
        type: Number,
        min: [0, "Current available cannot be negative"],
    },
    manufacturerRegion: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Add index for better performance
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ category: 1 });
foodProductSchema.index({ status: 1 });
foodProductSchema.index({ name: 'text', description: 'text' });
const FoodProduct = mongoose_1.default.model("FoodProduct", foodProductSchema);
exports.default = FoodProduct;
