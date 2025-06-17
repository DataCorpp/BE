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
// Schema for Product
const productSchema = new mongoose_1.Schema({
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
        default: "/product-placeholder.svg",
    },
    price: {
        type: Number,
        min: [0, "Price cannot be negative"],
    },
    currency: {
        type: String,
        trim: true,
    },
    pricePerUnit: {
        type: Number,
        min: [0, "Price per unit cannot be negative"],
    },
    unitType: {
        type: String,
        trim: true,
    },
    packagingSize: {
        type: String,
        trim: true,
    },
    rating: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
        default: 0,
    },
    reviewsCount: {
        type: Number,
        min: [0, "Reviews count cannot be negative"],
        default: 0,
    },
    productType: {
        type: String,
        required: [true, "Product type is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
    },
    minOrderQuantity: {
        type: Number,
        required: [true, "Minimum order quantity is required"],
        min: [1, "Minimum order quantity must be at least 1"],
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
            enum: ['days', 'weeks', 'months'],
            default: 'weeks',
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
            enum: ["salty", "sweet", "spicy", "umami", "sour", "bitter", "aromatic", "mild", "rich", "complex", "nutty", "savory", "creamy", "tangy", "citrus"],
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
}, {
    timestamps: true,
});
// Add indexes for better query performance
productSchema.index({ manufacturer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ name: 'text', description: 'text' });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
