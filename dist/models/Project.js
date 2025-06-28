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
const ProjectSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'in_review', 'paused', 'completed', 'cancelled'],
        default: 'draft'
    },
    // Product Information
    selectedProduct: {
        id: String,
        name: String,
        type: {
            type: String,
            enum: ['PRODUCT', 'CATEGORY', 'FOODTYPE']
        },
        image: String,
        category: String
    },
    // Supplier Information  
    selectedSupplierType: {
        id: Number,
        name: String
    },
    // Project Requirements
    volume: {
        type: String,
        required: true
    },
    units: {
        type: String,
        required: true
    },
    packaging: [{
            type: String
        }],
    packagingObjects: [{
            id: Number,
            name: String,
            material: String
        }],
    // Location & Requirements
    location: [{
            type: String
        }],
    allergen: [{
            type: String
        }],
    certification: [{
            type: String
        }],
    additional: {
        type: String,
        maxlength: 1000
    },
    // Project Settings
    anonymous: {
        type: Boolean,
        default: false
    },
    hideFromCurrent: {
        type: Boolean,
        default: false
    },
    // Metadata
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Matching & Communication
    matchingManufacturers: [{
            manufacturerId: String,
            matchScore: Number,
            contactedAt: Date,
            status: {
                type: String,
                enum: ['pending', 'contacted', 'responded', 'rejected'],
                default: 'pending'
            }
        }],
    // Project Lifecycle
    timeline: [{
            event: String,
            date: {
                type: Date,
                default: Date.now
            },
            description: String
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for better performance
ProjectSchema.index({ createdBy: 1, status: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'selectedProduct.name': 'text', description: 'text' });
// Virtual for project age
ProjectSchema.virtual('projectAge').get(function () {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});
// Pre-save middleware to add timeline events
ProjectSchema.pre('save', function (next) {
    if (this.isNew) {
        this.timeline = [{
                event: 'project_created',
                date: new Date(),
                description: 'Project created and submitted for review'
            }];
    }
    if (this.isModified('status') && !this.isNew) {
        this.timeline = this.timeline || [];
        this.timeline.push({
            event: `status_changed_to_${this.status}`,
            date: new Date(),
            description: `Project status changed to ${this.status}`
        });
    }
    next();
});
exports.default = mongoose_1.default.model('Project', ProjectSchema);
