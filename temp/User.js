"use strict";
//Quang Anh đang làm đừng động vào file này nhé---------------------------
//TO DO: Quang Anh đang làm đừng động vào file này nhé---------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var bcryptjs_1 = require("bcryptjs");
// Manufacturer-specific settings
var manufacturerSettingsSchema = new mongoose_1.Schema({
    productionCapacity: { type: Number, default: 0 },
    certifications: [{ type: String }],
    preferredCategories: [{ type: String }],
    minimumOrderValue: { type: Number, default: 0 },
});
// Brand-specific settings
var brandSettingsSchema = new mongoose_1.Schema({
    marketSegments: [{ type: String }],
    brandValues: [{ type: String }],
    targetDemographics: [{ type: String }],
    productCategories: [{ type: String }],
});
// Retailer-specific settings
var retailerSettingsSchema = new mongoose_1.Schema({
    storeLocations: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    customerBase: [{ type: String }],
    preferredCategories: [{ type: String }],
});
// Connection preferences schema
var connectionPreferencesSchema = new mongoose_1.Schema({
    connectWith: [{ type: String }],
    industryInterests: [{ type: String }],
    interests: [{ type: String }],
    lookingFor: [{ type: String }],
});
var userSchema = new mongoose_1.Schema({
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
    // Add establish field
    establish: { type: Number },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});
// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!this.isModified("password")) {
                        next();
                    }
                    return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 1:
                    salt = _b.sent();
                    _a = this;
                    return [4 /*yield*/, bcryptjs_1.default.hash(this.password, salt)];
                case 2:
                    _a.password = _b.sent();
                    return [2 /*return*/];
            }
        });
    });
});
// So sánh mật khẩu người dùng nhập với mật khẩu đã hash
userSchema.methods.matchPassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcryptjs_1.default.compare(enteredPassword, this.password)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
var User = mongoose_1.default.model("User", userSchema);
exports.default = User;
