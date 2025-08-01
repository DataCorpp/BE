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
// Schema cho Inventory
const InventoryItemSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    threshold: { type: Number, required: true },
    location: { type: String, required: true },
});
// Schema cơ bản cho Product - chỉ lưu thông tin chung
const productSchema = new mongoose_1.Schema({
    manufacturerName: {
        type: String,
        required: true,
        trim: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['food', 'beverage', 'health', 'other'],
    },
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        // Reference sẽ được set động dựa trên type
    },
}, {
    timestamps: true,
});
// Index cho tìm kiếm hiệu quả
productSchema.index({ type: 1 });
productSchema.index({ manufacturerName: 1 });
productSchema.index({ productName: 1 });
productSchema.index({ productId: 1 });
// Compound index cho tìm kiếm kết hợp
productSchema.index({ type: 1, manufacturerName: 1 });
productSchema.index({ type: 1, productName: 'text', manufacturerName: 'text' });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
