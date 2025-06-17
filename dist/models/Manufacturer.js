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
// Schema for Manufacturer
const manufacturerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Manufacturer name is required"],
        trim: true,
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
    },
    establish: {
        type: Number,
        required: [true, "Establishment year is required"],
        validate: {
            validator: function (v) {
                return v > 0 && v <= new Date().getFullYear();
            },
            message: props => `${props.value} is not a valid establishment year!`
        }
    },
    industry: {
        type: String,
        required: [true, "Industry is required"],
        trim: true,
    },
    certification: [{
            type: String,
            trim: true,
        }],
    contact: {
        email: {
            type: String,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    website: {
        type: String,
        required: [true, "Website is required"],
        trim: true,
    },
    image: {
        type: String,
        default: "/manufacturer-placeholder.svg",
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
}, {
    timestamps: true,
});
const Manufacturer = mongoose_1.default.model("Manufacturer", manufacturerSchema);
exports.default = Manufacturer;
