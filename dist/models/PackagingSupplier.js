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
const packagingSupplierSchema = new mongoose_1.Schema({
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
    // Packaging-specific fields
    packagingTypes: [{
            type: String,
            enum: ["plastic", "paper", "glass", "metal", "biodegradable", "composite", "foam", "textile"]
        }],
    materialTypes: [{
            type: String,
            enum: ["flexible", "rigid", "eco-friendly", "barrier", "transparent", "opaque"]
        }],
    capabilities: [{
            type: String,
            enum: ["printing", "labeling", "custom_shapes", "multi_layer", "embossing", "hot_stamping", "die_cutting"]
        }],
    certifications: [{
            type: String,
            enum: ["FDA", "ISO", "FSC", "recyclable", "compostable", "BRC", "SQF", "organic"]
        }],
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
    // Business details
    establish: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear(),
    },
    industry: {
        type: String,
        default: "Packaging",
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
packagingSupplierSchema.index({ companyName: 1 });
packagingSupplierSchema.index({ packagingTypes: 1 });
packagingSupplierSchema.index({ materialTypes: 1 });
packagingSupplierSchema.index({ certifications: 1 });
packagingSupplierSchema.index({ servingRegions: 1 });
packagingSupplierSchema.index({ status: 1 });
packagingSupplierSchema.index({ address: 1 });
// Text search index
packagingSupplierSchema.index({
    companyName: "text",
    description: "text",
    capabilities: "text"
});
const PackagingSupplier = mongoose_1.default.model("PackagingSupplier", packagingSupplierSchema);
exports.default = PackagingSupplier;
