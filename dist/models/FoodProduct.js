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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema cho FoodProduct - collection riêng biệt với discriminator support
const foodProductSchema = new mongoose_1.Schema({
    // Reference đến Product (discriminator-based routing)
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "Product",
        validate: {
            validator: function (productId) {
                return __awaiter(this, void 0, void 0, function* () {
                    const Product = mongoose_1.default.model('Product');
                    const product = yield Product.findById(productId);
                    return product && product.productType === 'food';
                });
            },
            message: 'Referenced product must have productType "food"'
        }
    },
    // Fields bổ sung không có trong Product base
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
    countInStock: {
        type: Number,
        required: true,
        default: 0,
    },
    rating: {
        type: Number,
        required: true,
        default: 0,
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0,
    },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual field để combine product info
foodProductSchema.virtual('fullProductName').get(function () {
    var _a;
    const populatedProduct = this.populated('productId') || this.productId;
    if (populatedProduct && typeof populatedProduct === 'object' && 'manufacturerName' in populatedProduct) {
        return `${populatedProduct.manufacturerName} - ${populatedProduct.name}`;
    }
    return ((_a = this.productId) === null || _a === void 0 ? void 0 : _a.toString()) || 'Unknown Product';
});
// Index cho tìm kiếm hiệu quả với discriminator support
foodProductSchema.index({ productId: 1 });
foodProductSchema.index({ foodType: 1 });
foodProductSchema.index({ flavorType: 1 });
foodProductSchema.index({ allergens: 1 });
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ originCountry: 1 });
foodProductSchema.index({ sku: 1 });
foodProductSchema.index({ category: 1, foodType: 1 }); // Compound index
// Static method để tạo cả Product và FoodProduct (discriminator-based creation)
foodProductSchema.statics.createWithProduct = function (productData, foodData) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const Product = mongoose_1.default.model('Product');
            // Tạo Product với productType = 'food'
            const productDoc = new Product(Object.assign(Object.assign({}, productData), { productType: 'food' }));
            const savedProduct = yield productDoc.save({ session });
            // Tạo FoodProduct với reference
            const foodProductDoc = new this(Object.assign(Object.assign({}, foodData), { productId: savedProduct._id }));
            const savedFoodProduct = yield foodProductDoc.save({ session });
            yield session.commitTransaction();
            return {
                product: savedProduct,
                foodProduct: savedFoodProduct
            };
        }
        catch (error) {
            yield session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    });
};
// Instance method để lấy full product info
foodProductSchema.methods.getFullProduct = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.populate('productId');
        return {
            product: this.productId,
            foodProduct: this.toObject(),
            combined: Object.assign(Object.assign({}, this.toObject()), { productInfo: this.productId })
        };
    });
};
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
// Tạo model riêng biệt với discriminator support
const FoodProduct = mongoose_1.default.model("FoodProduct", foodProductSchema);
exports.default = FoodProduct;
