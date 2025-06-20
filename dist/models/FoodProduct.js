"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Product_1 = __importDefault(require("./Product"));
// Schema cho FoodProduct - extend từ Product base schema
const foodProductSchema = new mongoose_1.Schema({
    // Manufacturer & Origin Details
    manufacturer: {
        type: String,
        required: true,
    },
    originCountry: {
        type: String,
        required: true,
    },
    manufacturerRegion: {
        type: String,
    },
    // Production Details
    minOrderQuantity: {
        type: Number,
        required: true,
        min: 1,
    },
    dailyCapacity: {
        type: Number,
        required: true,
        min: 1,
    },
    currentAvailable: {
        type: Number,
        default: 0,
        min: 0,
    },
    unitType: {
        type: String,
        required: true,
        enum: ["units", "kg", "g", "liters", "ml", "packs", "bottles", "boxes", "bags", "cans"],
    },
    // Pricing
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0,
    },
    priceCurrency: {
        type: String,
        required: true,
        enum: ["USD", "JPY", "EUR", "CNY"],
        default: "USD",
    },
    // Lead Time
    leadTime: {
        type: String,
        required: true,
    },
    leadTimeUnit: {
        type: String,
        required: true,
        enum: ["days", "weeks", "months"],
        default: "weeks",
    },
    // Sustainability
    sustainable: {
        type: Boolean,
        default: false,
    },
    // Product Code
    sku: {
        type: String,
        unique: true,
        sparse: true, // cho phép null/undefined và vẫn unique
    },
    // Food-specific Details
    foodType: {
        type: String,
        required: true,
        enum: [
            "Miso", "Soy Sauce", "Dressing", "Vinegar", "Cooking Oil",
            "Paste", "Marinade", "Soup Base", "Seasoning Mix", "Sauce",
            "Pickle", "Fermented", "Instant Food", "Snack", "Dessert",
            "Beverage Mix", "Health Food", "Other"
        ],
    },
    flavorType: [{
            type: String,
            enum: [
                "Sweet", "Salty", "Sour", "Bitter", "Umami", "Spicy",
                "Mild", "Rich", "Fresh", "Smoky", "Nutty", "Fruity",
                "Herbal", "Earthy", "Floral", "Creamy", "Tangy", "Aromatic"
            ],
        }],
    ingredients: [{
            type: String,
            required: true,
        }],
    allergens: [{
            type: String,
            enum: [
                "Gluten", "Peanuts", "Tree Nuts", "Soy", "Dairy", "Eggs",
                "Fish", "Shellfish", "Sesame", "Mustard", "Celery", "Sulphites",
                "Lupin", "Molluscs"
            ],
        }],
    usage: [{
            type: String,
        }],
    // Packaging Details
    packagingType: {
        type: String,
        required: true,
        enum: [
            "Bottle", "Can", "Jar", "Pouch", "Box", "Bag",
            "Vacuum Pack", "Tube", "Tray", "Sachet"
        ],
    },
    packagingSize: {
        type: String,
        required: true,
    },
    // Storage & Shelf Life
    shelfLife: {
        type: String,
        required: true,
    },
    shelfLifeStartDate: {
        type: Date,
    },
    shelfLifeEndDate: {
        type: Date,
    },
    storageInstruction: {
        type: String,
        required: true,
    },
});
// Index cho tìm kiếm hiệu quả
foodProductSchema.index({ foodType: 1 });
foodProductSchema.index({ flavorType: 1 });
foodProductSchema.index({ allergens: 1 });
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ originCountry: 1 });
foodProductSchema.index({ sku: 1 });
// Validation middleware
foodProductSchema.pre('save', function (next) {
    // Validate shelf life dates if provided
    if (this.shelfLifeStartDate && this.shelfLifeEndDate) {
        if (this.shelfLifeStartDate >= this.shelfLifeEndDate) {
            next(new Error('Shelf life start date must be before end date'));
            return;
        }
    }
    // Auto-generate SKU if not provided
    if (!this.sku && this.isNew) {
        const prefix = this.foodType.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `${prefix}${timestamp}`;
    }
    next();
});
// Tạo discriminator từ Product base model
const FoodProduct = Product_1.default.discriminator("food", foodProductSchema);
exports.default = FoodProduct;
