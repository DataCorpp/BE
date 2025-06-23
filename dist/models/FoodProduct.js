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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Product_1 = __importDefault(require("./Product"));
// Schema cho FoodProduct - collection độc lập
const foodProductSchema = new mongoose_1.Schema({
    // Basic Product Info
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
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
    image: {
        type: String,
        required: true,
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
});
// Index cho tìm kiếm hiệu quả
foodProductSchema.index({ foodType: 1 });
foodProductSchema.index({ flavorType: 1 });
foodProductSchema.index({ allergens: 1 });
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ originCountry: 1 });
foodProductSchema.index({ sku: 1 });
foodProductSchema.index({ name: 'text', description: 'text', manufacturer: 'text' });
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
// Static method để tạo product với error handling (không dùng transaction)
foodProductSchema.statics.createWithProduct = function (productData, foodProductData) {
    return __awaiter(this, void 0, void 0, function* () {
        let foodProduct = null;
        let product = null;
        try {
            // Tạo FoodProduct trước
            foodProduct = new this(foodProductData);
            yield foodProduct.save();
            // Tạo Product reference
            product = new Product_1.default({
                manufacturerName: productData.manufacturerName,
                productName: productData.productName,
                type: 'food',
                productId: foodProduct._id,
            });
            yield product.save();
            return { product, foodProduct };
        }
        catch (error) {
            // Cleanup nếu có lỗi
            if (foodProduct && foodProduct._id) {
                try {
                    yield this.findByIdAndDelete(foodProduct._id);
                }
                catch (cleanupError) {
                    console.error('Error during cleanup:', cleanupError);
                }
            }
            throw error;
        }
    });
};
// Static method để lấy product với reference
foodProductSchema.statics.findWithProduct = function (query) {
    return __awaiter(this, void 0, void 0, function* () {
        const products = yield Product_1.default.find(Object.assign({ type: 'food' }, query));
        const productIds = products.map(p => p.productId);
        const foodProducts = yield this.find({ _id: { $in: productIds } });
        return foodProducts.map(fp => {
            const product = products.find(p => p.productId.toString() === fp._id.toString());
            return Object.assign(Object.assign({}, fp.toObject()), { productInfo: product });
        });
    });
};
// Static method để update product với error handling
foodProductSchema.statics.updateWithProduct = function (foodProductId, productData, foodProductData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Update FoodProduct
            const foodProduct = yield this.findByIdAndUpdate(foodProductId, foodProductData, { new: true });
            if (!foodProduct) {
                throw new Error('Food product not found');
            }
            // Update Product reference nếu có thay đổi
            if (productData.manufacturerName || productData.productName) {
                const productUpdate = Object.assign(Object.assign({}, (productData.manufacturerName && { manufacturerName: productData.manufacturerName })), (productData.productName && { productName: productData.productName }));
                const updatedProduct = yield Product_1.default.findOneAndUpdate({ productId: foodProductId, type: 'food' }, productUpdate, { new: true });
                if (!updatedProduct) {
                    console.warn(`Product reference not found for FoodProduct ${foodProductId}`);
                }
            }
            return foodProduct;
        }
        catch (error) {
            throw error;
        }
    });
};
// Static method để delete product với error handling
foodProductSchema.statics.deleteWithProduct = function (foodProductId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== DELETE FOOD PRODUCT WITH REFERENCE ===');
            console.log('Food Product ID:', foodProductId);
            // Validate ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(foodProductId)) {
                throw new Error('Invalid food product ID format');
            }
            // Check if FoodProduct exists
            const foodProduct = yield this.findById(foodProductId);
            if (!foodProduct) {
                console.log('Food product not found for deletion');
                throw new Error('Food product not found');
            }
            console.log('Food product found:', {
                name: foodProduct.name,
                manufacturer: foodProduct.manufacturer,
                user: foodProduct.user
            });
            // Delete FoodProduct first
            console.log('Deleting FoodProduct document...');
            const deletedFoodProduct = yield this.findByIdAndDelete(foodProductId);
            if (!deletedFoodProduct) {
                throw new Error('Failed to delete food product from database');
            }
            console.log('FoodProduct deleted successfully');
            // Find and delete Product reference
            console.log('Looking for Product reference...');
            const productReference = yield Product_1.default.findOne({
                productId: foodProductId,
                type: 'food'
            });
            if (productReference) {
                console.log('Product reference found:', productReference._id);
                const deletedReference = yield Product_1.default.findByIdAndDelete(productReference._id);
                if (deletedReference) {
                    console.log('Product reference deleted successfully');
                }
                else {
                    console.warn('Failed to delete Product reference');
                }
            }
            else {
                console.warn(`Product reference not found for FoodProduct ${foodProductId}`);
            }
            console.log('Delete operation completed');
            return deletedFoodProduct;
        }
        catch (error) {
            console.error('Error in deleteWithProduct:', error);
            throw error;
        }
    });
};
const FoodProduct = mongoose_1.default.model("FoodProduct", foodProductSchema);
exports.default = FoodProduct;
