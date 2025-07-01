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
const packagingServiceSchema = new mongoose_1.Schema({
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
    // Packaging Service-specific fields
    serviceTypes: [{
            type: String,
            enum: [
                "design", "consultation", "testing", "automation", "logistics",
                "training", "compliance", "sustainability", "research"
            ]
        }],
    designServices: [{
            type: String,
            enum: [
                "structural_design", "graphic_design", "branding", "prototyping",
                "3d_modeling", "cad_design", "material_selection", "color_matching"
            ]
        }],
    consultingServices: [{
            type: String,
            enum: [
                "packaging_optimization", "sustainability", "cost_reduction", "compliance",
                "supply_chain", "risk_assessment", "market_analysis", "feasibility_study"
            ]
        }],
    testingServices: [{
            type: String,
            enum: [
                "durability", "shelf_life", "transport", "environmental", "barrier_properties",
                "compression", "vibration", "temperature", "humidity"
            ]
        }],
    automationServices: [{
            type: String,
            enum: [
                "line_integration", "equipment_supply", "maintenance", "training",
                "process_optimization", "quality_control", "robotics", "sensors"
            ]
        }],
    logisticsServices: [{
            type: String,
            enum: [
                "warehousing", "fulfillment", "distribution", "inventory_management",
                "order_processing", "returns_handling", "supply_chain_management"
            ]
        }],
    // Industry expertise
    industryExpertise: [{
            type: String,
            enum: [
                "food", "beverage", "cosmetics", "pharmaceutical", "electronics",
                "automotive", "consumer_goods", "medical_devices", "chemicals"
            ]
        }],
    certifications: [{
            type: String,
            enum: [
                "iso", "lean", "six_sigma", "pmp", "sustainable_packaging",
                "fda", "ce", "rohs", "reach", "fsc"
            ]
        }],
    // Service capabilities
    projectSizes: [{
            type: String,
            enum: ["startup", "small", "medium", "enterprise", "global"]
        }],
    serviceDuration: [{
            type: String,
            enum: ["short_term", "long_term", "ongoing", "project_based"]
        }],
    // Business details
    minimumProjectValue: {
        type: Number,
        required: true,
        min: 0,
    },
    hourlyRate: {
        type: Number,
        required: true,
        min: 0,
    },
    priceStructure: {
        type: String,
        required: true,
        enum: ["hourly", "project", "retainer", "performance", "hybrid"]
    },
    establish: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear(),
    },
    industry: {
        type: String,
        default: "Packaging Services",
    },
    status: {
        type: String,
        enum: ["active", "inactive", "pending"],
        default: "active",
    },
    // Location and reach
    servingRegions: [{
            type: String,
        }],
    teamSize: {
        type: String,
        enum: ["solo", "small", "medium", "large"],
        default: "small",
    },
}, {
    timestamps: true,
});
// Create indexes for better search performance
packagingServiceSchema.index({ companyName: 1 });
packagingServiceSchema.index({ serviceTypes: 1 });
packagingServiceSchema.index({ designServices: 1 });
packagingServiceSchema.index({ consultingServices: 1 });
packagingServiceSchema.index({ industryExpertise: 1 });
packagingServiceSchema.index({ certifications: 1 });
packagingServiceSchema.index({ servingRegions: 1 });
packagingServiceSchema.index({ status: 1 });
packagingServiceSchema.index({ address: 1 });
// Text search index
packagingServiceSchema.index({
    companyName: "text",
    description: "text",
    serviceTypes: "text",
    industryExpertise: "text"
});
const PackagingService = mongoose_1.default.model("PackagingService", packagingServiceSchema);
exports.default = PackagingService;
