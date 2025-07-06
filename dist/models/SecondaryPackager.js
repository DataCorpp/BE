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
const secondaryPackagerSchema = new mongoose_1.Schema({
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
    // Secondary Packaging-specific fields
    packagingServices: [{
            type: String,
            enum: [
                "retail_packaging", "case_packing", "palletizing", "shrink_wrap",
                "bundling", "gift_wrapping", "promotional_packaging", "kitting"
            ]
        }],
    equipmentTypes: [{
            type: String,
            enum: ["automated", "semi_automated", "manual", "robotics", "hybrid"]
        }],
    packagingFormats: [{
            type: String,
            enum: [
                "boxes", "cases", "bundles", "trays", "displays", "multipacks",
                "blisters", "clamshells", "tubes", "pouches"
            ]
        }],
    labelingServices: [{
            type: String,
            enum: [
                "product_labeling", "case_labeling", "barcode", "qr_code",
                "rfid", "expiry_date", "batch_numbering", "custom_labels"
            ]
        }],
    qualityControls: [{
            type: String,
            enum: [
                "inspection", "weight_check", "seal_integrity", "visual_check",
                "leak_testing", "drop_testing", "compression_testing"
            ]
        }],
    certifications: [{
            type: String,
            enum: [
                "iso", "brc", "sqf", "haccp", "organic", "fda", "gmp",
                "kosher", "halal", "lean_manufacturing"
            ]
        }],
    // Capacity and capabilities
    dailyCapacity: {
        type: Number,
        required: true,
        min: 1,
    },
    batchSizes: [{
            type: String,
            enum: ["small", "medium", "large", "custom", "unlimited"]
        }],
    storageCapability: {
        type: Boolean,
        default: false,
    },
    temperatureControlled: {
        type: Boolean,
        default: false,
    },
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
        default: "Secondary Packaging",
    },
    status: {
        type: String,
        enum: ["active", "inactive", "pending"],
        default: "active",
    },
    // Location and services
    servingRegions: [{
            type: String,
        }],
    facilitySizes: [{
            type: String,
            enum: ["small", "medium", "large", "enterprise"]
        }],
}, {
    timestamps: true,
});
// Create indexes for better search performance
secondaryPackagerSchema.index({ companyName: 1 });
secondaryPackagerSchema.index({ packagingServices: 1 });
secondaryPackagerSchema.index({ equipmentTypes: 1 });
secondaryPackagerSchema.index({ packagingFormats: 1 });
secondaryPackagerSchema.index({ certifications: 1 });
secondaryPackagerSchema.index({ servingRegions: 1 });
secondaryPackagerSchema.index({ status: 1 });
secondaryPackagerSchema.index({ address: 1 });
// Text search index
secondaryPackagerSchema.index({
    companyName: "text",
    description: "text",
    packagingServices: "text",
    packagingFormats: "text"
});
const SecondaryPackager = mongoose_1.default.model("SecondaryPackager", secondaryPackagerSchema);
exports.default = SecondaryPackager;
