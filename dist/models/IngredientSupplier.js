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
const ingredientSupplierSchema = new mongoose_1.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    contactName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    // Ingredient-specific fields
    ingredientCategories: [{
            type: String,
            enum: [
                "spices", "sweeteners", "preservatives", "proteins", "oils_fats",
                "vitamins", "minerals", "flavors", "colors", "emulsifiers",
                "thickeners", "acids", "bases", "enzymes", "probiotics"
            ]
        }],
    ingredientTypes: [{
            type: String,
            enum: ["organic", "natural", "artificial", "gmo_free", "synthetic", "extracted", "fermented"]
        }],
    specialties: [{
            type: String,
            enum: [
                "allergen_free", "gluten_free", "dairy_free", "vegan", "vegetarian",
                "kosher", "halal", "paleo", "keto", "sugar_free", "sodium_free"
            ]
        }],
    certifications: [{
            type: String,
            enum: [
                "organic", "fair_trade", "non_gmo", "kosher", "halal", "iso",
                "haccp", "brc", "sqf", "rainforest_alliance", "utz"
            ]
        }],
    originCountries: [{
            type: String,
        }],
    shelfLife: {
        type: String,
        required: true,
        enum: ["3 months", "6 months", "1 year", "2 years", "3+ years"]
    },
    storageRequirements: [{
            type: String,
            enum: ["room_temperature", "refrigerated", "frozen", "dry", "humidity_controlled"]
        }],
    // Business details
    minimumOrderQuantity: {
        type: Number,
        required: true,
        min: 1,
    },
    leadTime: {
        type: String,
        required: true,
        enum: ["1-2 weeks", "3-4 weeks", "1-2 months", "2-3 months", "3+ months"]
    },
    priceRange: {
        type: String,
        required: true,
        enum: ["low", "medium", "high", "premium"]
    },
    establish: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear(),
    },
    industry: {
        type: String,
        default: "Food Ingredients",
    },
    status: {
        type: String,
        enum: ["active", "inactive", "pending"],
        default: "active",
    },
    // Location and capacity
    servingRegions: [{
            type: String,
        }],
    productionCapacity: {
        type: String,
        enum: ["small", "medium", "large", "enterprise"],
        default: "medium",
    },
}, {
    timestamps: true,
});
// Create indexes for better search performance
ingredientSupplierSchema.index({ companyName: 1 });
ingredientSupplierSchema.index({ ingredientCategories: 1 });
ingredientSupplierSchema.index({ ingredientTypes: 1 });
ingredientSupplierSchema.index({ specialties: 1 });
ingredientSupplierSchema.index({ certifications: 1 });
ingredientSupplierSchema.index({ originCountries: 1 });
ingredientSupplierSchema.index({ servingRegions: 1 });
ingredientSupplierSchema.index({ status: 1 });
ingredientSupplierSchema.index({ address: 1 });
// Text search index
ingredientSupplierSchema.index({
    companyName: "text",
    description: "text",
    ingredientCategories: "text",
    specialties: "text"
});
const IngredientSupplier = mongoose_1.default.model("IngredientSupplier", ingredientSupplierSchema);
exports.default = IngredientSupplier;
