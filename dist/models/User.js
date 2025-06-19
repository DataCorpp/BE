"use strict";
//Quang Anh đang làm đừng động vào file này nhé---------------------------
//TO DO: Quang Anh đang làm đừng động vào file này nhé---------------------------
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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Manufacturer-specific settings
const manufacturerSettingsSchema = new mongoose_1.Schema({
    productionCapacity: { type: Number, default: 0 },
    certifications: [{ type: String }],
    preferredCategories: [{ type: String }],
    minimumOrderValue: { type: Number, default: 0 },
});
// Brand-specific settings
const brandSettingsSchema = new mongoose_1.Schema({
    marketSegments: [{ type: String }],
    brandValues: [{ type: String }],
    targetDemographics: [{ type: String }],
    productCategories: [{ type: String }],
});
// Retailer-specific settings
const retailerSettingsSchema = new mongoose_1.Schema({
    storeLocations: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    customerBase: [{ type: String }],
    preferredCategories: [{ type: String }],
});
// Connection preferences schema
const connectionPreferencesSchema = new mongoose_1.Schema({
    connectWith: [{ type: String }],
    industryInterests: [{ type: String }],
    interests: [{ type: String }],
    lookingFor: [{ type: String }],
});
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        required: true,
        enum: ["manufacturer", "brand", "retailer"],
        default: "manufacturer",
    },
    status: {
        type: String,
        enum: [
            "online",
            "away",
            "busy",
            "active",
            "inactive",
            "pending",
            "suspended",
        ],
        default: "pending",
    },
    profileComplete: {
        type: Boolean,
        default: false,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    // Profile information
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    description: { type: String }, // Synchronized with companyDescription
    avatar: { type: String },
    // Fields from ProfileSetup
    industry: { type: String },
    certificates: { type: String },
    websiteUrl: { type: String },
    companyDescription: { type: String }, // Primary field, synchronized with description
    // Connection preferences
    connectionPreferences: connectionPreferencesSchema,
    // Role-specific settings
    manufacturerSettings: manufacturerSettingsSchema,
    brandSettings: brandSettingsSchema,
    retailerSettings: retailerSettingsSchema,
    // Notifications counter
    notifications: {
        type: Number,
        default: 0,
    },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});
// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password")) {
            next();
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
    });
});
// So sánh mật khẩu người dùng nhập với mật khẩu đã hash
userSchema.methods.matchPassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
