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
// Cấu hình toàn cục cho mongoose để tránh áp dụng giá trị mặc định khi update
mongoose_1.default.set('setDefaultsOnInsert', false);
// Schema cho FoodProduct - collection độc lập
const foodProductSchema = new mongoose_1.Schema({
    // Basic Information
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    brand: {
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
    // Packaging & Storage
    packagingType: {
        type: String,
        required: true
    },
    packagingSize: {
        type: String,
        required: true
    },
    shelfLife: {
        type: String,
        required: true
    },
    storageInstruction: {
        type: String,
        required: true
    },
    // Production Details
    minOrderQuantity: {
        type: Number,
        required: true,
        min: 0, // Changed from 1 to 0 to allow zero values
    },
    dailyCapacity: {
        type: Number,
        required: true,
        min: 0, // Changed from 1 to 0 to allow zero values
    },
    currentAvailable: {
        type: Number,
        default: 0,
        min: 0,
    },
    unitType: {
        type: String,
        required: true,
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0,
    },
    priceCurrency: {
        type: String,
        required: true,
        default: "USD",
    },
    // Description & Media
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
    },
    // For compatibility with existing code
    countInStock: {
        type: Number,
        required: true,
        default: 0,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
    // Food Details
    foodType: {
        type: String,
        required: true
    },
    flavorType: {
        type: [String]
    },
    ingredients: {
        type: [String]
    },
    allergens: {
        type: [String]
    },
    usage: {
        type: [String]
    },
    // System Fields
    sku: {
        type: String,
        unique: true,
        sparse: true, // cho phép null/undefined và vẫn unique
    },
}, {
    timestamps: true,
    // IMPORTANT: Disable applying defaults on create
    // This ensures that MongoDB won't apply any default values when creating a new document
    skipDefaults: true
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
    console.log('=== PRE SAVE MIDDLEWARE - BEFORE PROCESSING ===');
    console.log('Data being saved to MongoDB:', {
        foodType: this.foodType,
        packagingType: this.packagingType,
        packagingSize: this.packagingSize,
        shelfLife: this.shelfLife,
        storageInstruction: this.storageInstruction,
        flavorType: this.flavorType,
        ingredients: this.ingredients,
        allergens: this.allergens,
        usage: this.usage,
        image: this.image,
        images: this.images,
        imagesCount: this.images ? this.images.length : 0
    });
    // Auto-generate SKU if not provided
    if (!this.sku && this.isNew) {
        const prefix = this.foodType.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `${prefix}${timestamp}`;
    }
    // Make sure arrays exist and are actually arrays
    ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
        if (!this[field]) {
            this[field] = [];
            console.log(`Created empty array for ${field}`);
        }
        else if (!Array.isArray(this[field])) {
            this[field] = [this[field]].filter(Boolean);
            console.log(`Converted ${field} to array:`, this[field]);
        }
    });
    // CRITICAL: Special handling for images array
    if (!this.images) {
        this.images = [];
        console.log('Created empty images array');
    }
    else if (!Array.isArray(this.images)) {
        // If it's not an array, convert to array
        this.images = [this.images].filter(Boolean);
        console.log('Converted non-array images to array:', this.images);
    }
    // Handle main image relationship with images array
    if (this.image) {
        // If main image exists but not in images array, add it
        if (!this.images.includes(this.image)) {
            this.images.unshift(this.image);
            console.log('Added main image to images array:', this.image);
        }
        else if (this.images[0] !== this.image) {
            // If main image is in array but not first, move to front
            const newImagesArray = [
                this.image,
                ...this.images.filter(img => img !== this.image)
            ];
            this.images = newImagesArray;
            console.log('Moved main image to front of images array:', this.image);
        }
    }
    else if (this.images.length > 0) {
        // If no main image but images exist, use first as main
        this.image = this.images[0];
        console.log('Set main image from images array:', this.image);
    }
    // Auto-assign first image as main image if main image not set
    if (!this.image && this.images && this.images.length > 0) {
        this.image = this.images[0];
    }
    // Log changes after processing
    console.log('=== PRE SAVE MIDDLEWARE - AFTER PROCESSING ===');
    console.log('Data after pre-save processing:', {
        image: this.image,
        images: this.images,
        imagesCount: this.images ? this.images.length : 0,
        imagesSample: this.images ? this.images.slice(0, 3) : []
    });
    next();
});
// Ghi đè phương thức save để đảm bảo không có giá trị mặc định nào được áp dụng
foodProductSchema.methods.saveWithoutDefaults = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== CUSTOM SAVE METHOD CALLED ===');
        console.log('Data before save:', {
            foodType: this.foodType,
            packagingType: this.packagingType,
            packagingSize: this.packagingSize,
            shelfLife: this.shelfLife,
            storageInstruction: this.storageInstruction,
            flavorType: this.flavorType,
            ingredients: this.ingredients,
            allergens: this.allergens,
            usage: this.usage,
            image: this.image,
            images: this.images
        });
        // Simplified image handling - only supporting single image
        // Images array is kept for backwards compatibility but no longer actively used
        this.images = this.image ? [this.image] : [];
        // Sử dụng insertOne trực tiếp để bypass schema defaults
        if (this.isNew) {
            // Lấy collection trực tiếp từ constructor
            const collection = this.constructor.collection;
            // Create a clean document object with all fields explicitly defined
            const doc = this.toObject({ depopulate: true });
            // Xóa _id nếu nó là null hoặc undefined
            if (doc._id === null || doc._id === undefined) {
                delete doc._id;
            }
            // Simplified image handling - only supporting single image
            doc.images = doc.image ? [doc.image] : [];
            // Log the final document that will be inserted
            console.log('Final document to be inserted:', {
                image: doc.image,
                images: doc.images,
                imagesCount: doc.images ? doc.images.length : 0,
                imagesSample: doc.images ? doc.images.slice(0, 2) : []
            });
            // Create the document in MongoDB
            const result = yield collection.insertOne(doc);
            this._id = result.insertedId;
            console.log('Document inserted directly, bypassing schema defaults');
            // Verify that images were saved correctly
            const savedDoc = yield collection.findOne({ _id: this._id });
            console.log('Saved document verification:', {
                image: savedDoc.image,
                images: savedDoc.images,
                imagesCount: savedDoc.images ? savedDoc.images.length : 0,
                imagesSample: savedDoc.images ? savedDoc.images.slice(0, 2) : []
            });
            return this;
        }
        else {
            // Nếu không phải document mới, sử dụng save thông thường
            return yield this.save();
        }
    });
};
// Static method để tạo product với error handling (không dùng transaction)
foodProductSchema.statics.createWithProduct = function (productData, foodProductData) {
    return __awaiter(this, void 0, void 0, function* () {
        let foodProduct = null;
        let product = null;
        try {
            console.log('=== CREATE WITH PRODUCT - INPUT DATA ===');
            console.log('Food-specific fields received:', {
                foodType: foodProductData.foodType,
                packagingType: foodProductData.packagingType,
                packagingSize: foodProductData.packagingSize,
                shelfLife: foodProductData.shelfLife,
                storageInstruction: foodProductData.storageInstruction,
                flavorType: foodProductData.flavorType,
                ingredients: foodProductData.ingredients,
                allergens: foodProductData.allergens,
                usage: foodProductData.usage,
                image: foodProductData.image,
                images: foodProductData.images,
                imagesCount: foodProductData.images ? foodProductData.images.length : 0
            });
            // Set brand to manufacturer if not provided
            if (!foodProductData.brand) {
                foodProductData.brand = foodProductData.manufacturer;
            }
            // Validate required fields are present
            const requiredFields = ['name', 'category', 'manufacturer', 'originCountry',
                'packagingType', 'packagingSize', 'shelfLife', 'storageInstruction',
                'minOrderQuantity', 'dailyCapacity', 'unitType', 'pricePerUnit',
                'description', 'image', 'foodType'];
            const missingFields = requiredFields.filter(field => foodProductData[field] === undefined ||
                foodProductData[field] === null ||
                (typeof foodProductData[field] === 'string' && foodProductData[field].trim() === ''));
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }
            // Handle numeric fields - ensure they are numbers
            ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'].forEach(field => {
                if (foodProductData[field] !== undefined) {
                    foodProductData[field] = Number(foodProductData[field]);
                    if (isNaN(foodProductData[field])) {
                        throw new Error(`Field ${field} must be a valid number`);
                    }
                }
            });
            // IMPROVED: Better handling of array fields
            ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
                if (foodProductData[field] !== undefined && !Array.isArray(foodProductData[field])) {
                    // If it's a string, try to convert it to an array
                    if (typeof foodProductData[field] === 'string' && foodProductData[field].trim() !== '') {
                        foodProductData[field] = [foodProductData[field]];
                    }
                    else {
                        // Otherwise, make it an empty array
                        foodProductData[field] = [];
                    }
                }
                else if (Array.isArray(foodProductData[field])) {
                    // Create a copy to avoid reference issues
                    foodProductData[field] = [...foodProductData[field]];
                }
            });
            // Simplified image handling - only supporting single image
            foodProductData.images = foodProductData.image ? [foodProductData.image] : [];
            // Set countInStock from currentAvailable if not provided
            if (foodProductData.currentAvailable !== undefined && foodProductData.countInStock === undefined) {
                foodProductData.countInStock = foodProductData.currentAvailable;
            }
            // Set price from pricePerUnit if not provided
            if (foodProductData.pricePerUnit !== undefined && foodProductData.price === undefined) {
                foodProductData.price = foodProductData.pricePerUnit;
            }
            console.log('=== CREATE WITH PRODUCT - PROCESSED DATA ===');
            console.log('Food-specific fields after processing:', {
                foodType: foodProductData.foodType,
                packagingType: foodProductData.packagingType,
                packagingSize: foodProductData.packagingSize,
                shelfLife: foodProductData.shelfLife,
                storageInstruction: foodProductData.storageInstruction,
                flavorType: foodProductData.flavorType,
                ingredients: foodProductData.ingredients,
                allergens: foodProductData.allergens,
                usage: foodProductData.usage,
                image: foodProductData.image,
                images: foodProductData.images,
                imagesCount: foodProductData.images.length
            });
            // IMPORTANT: Create a direct instance without any schema defaults
            foodProduct = new this(foodProductData);
            console.log('=== CREATE WITH PRODUCT - BEFORE SAVE ===');
            console.log('Food product instance before save:', {
                foodType: foodProduct.foodType,
                packagingType: foodProduct.packagingType,
                packagingSize: foodProduct.packagingSize,
                shelfLife: foodProduct.shelfLife,
                storageInstruction: foodProduct.storageInstruction,
                flavorType: foodProduct.flavorType,
                ingredients: foodProduct.ingredients,
                allergens: foodProduct.allergens,
                usage: foodProduct.usage,
                image: foodProduct.image,
                images: foodProduct.images,
                imagesCount: foodProduct.images ? foodProduct.images.length : 0
            });
            // Sử dụng phương thức saveWithoutDefaults thay vì save thông thường
            yield foodProduct.saveWithoutDefaults();
            // Double check the saved data
            const freshFoodProduct = yield this.findById(foodProduct._id);
            console.log('=== CREATE WITH PRODUCT - AFTER SAVE ===');
            console.log('Food product after save (from instance):', {
                foodType: foodProduct.foodType,
                packagingType: foodProduct.packagingType,
                packagingSize: foodProduct.packagingSize,
                shelfLife: foodProduct.shelfLife,
                storageInstruction: foodProduct.storageInstruction,
                flavorType: foodProduct.flavorType,
                ingredients: foodProduct.ingredients,
                allergens: foodProduct.allergens,
                usage: foodProduct.usage,
                image: foodProduct.image,
                images: foodProduct.images,
                imagesCount: foodProduct.images ? foodProduct.images.length : 0
            });
            console.log('Food product after save (from database):', {
                _id: freshFoodProduct === null || freshFoodProduct === void 0 ? void 0 : freshFoodProduct._id,
                image: freshFoodProduct === null || freshFoodProduct === void 0 ? void 0 : freshFoodProduct.image,
                images: freshFoodProduct === null || freshFoodProduct === void 0 ? void 0 : freshFoodProduct.images,
                imagesCount: (freshFoodProduct === null || freshFoodProduct === void 0 ? void 0 : freshFoodProduct.images) ? freshFoodProduct.images.length : 0
            });
            // Tạo Product reference
            product = new Product_1.default({
                manufacturerName: productData.manufacturerName || foodProductData.manufacturer,
                productName: productData.productName || foodProductData.name,
                type: 'food',
                productId: foodProduct._id,
            });
            yield product.save();
            return { product, foodProduct: freshFoodProduct || foodProduct };
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
            console.error('Error in createWithProduct:', error);
            // Add more context to the error for better debugging
            if (error instanceof Error) {
                throw new Error(`Failed to create food product: ${error.message}`);
            }
            else {
                throw new Error('Failed to create food product due to unknown error');
            }
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
            console.log('=== UPDATE WITH PRODUCT - INPUT DATA ===');
            console.log('Food-specific fields received for update:', {
                foodType: foodProductData.foodType,
                packagingType: foodProductData.packagingType,
                packagingSize: foodProductData.packagingSize,
                shelfLife: foodProductData.shelfLife,
                storageInstruction: foodProductData.storageInstruction,
                flavorType: foodProductData.flavorType,
                ingredients: foodProductData.ingredients,
                allergens: foodProductData.allergens,
                usage: foodProductData.usage,
                image: foodProductData.image,
                images: foodProductData.images
            });
            // Tìm sản phẩm hiện có để lấy giá trị hiện tại cho các trường không được cung cấp
            const existingFoodProduct = yield this.findById(foodProductId);
            if (!existingFoodProduct) {
                throw new Error('Food product not found');
            }
            console.log('✅ Found existing food product:', {
                _id: existingFoodProduct._id,
                name: existingFoodProduct.name,
                foodType: existingFoodProduct.foodType
            });
            // CRITICAL FIX: Ensure array fields are actually arrays WITHOUT modifying their content
            // This is essential for proper update operation
            ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
                if (foodProductData[field] !== undefined) {
                    // If it's already an array, leave it as is
                    if (Array.isArray(foodProductData[field])) {
                        console.log(`Field ${field} is already an array with ${foodProductData[field].length} items`);
                    }
                    // If it's a string, try to parse it as JSON array
                    else if (typeof foodProductData[field] === 'string') {
                        try {
                            // Check if it's a JSON string array
                            if (foodProductData[field].startsWith('[') && foodProductData[field].endsWith(']')) {
                                const parsed = JSON.parse(foodProductData[field]);
                                if (Array.isArray(parsed)) {
                                    foodProductData[field] = parsed;
                                    console.log(`Parsed ${field} from JSON string to array with ${parsed.length} items`);
                                }
                                else {
                                    foodProductData[field] = [foodProductData[field]];
                                    console.log(`Converted ${field} from string to single-item array`);
                                }
                            }
                            else {
                                // If it's just a regular string, make it a single-item array
                                foodProductData[field] = [foodProductData[field]];
                                console.log(`Converted ${field} from string to single-item array`);
                            }
                        }
                        catch (e) {
                            // If parsing failed, treat as a single string item
                            foodProductData[field] = [foodProductData[field]];
                            console.log(`Converted ${field} from string to single-item array (parse failed)`);
                        }
                    }
                    // If it's another type (object, number, etc.), convert to string and wrap in array
                    else {
                        foodProductData[field] = [String(foodProductData[field])];
                        console.log(`Converted ${field} from ${typeof foodProductData[field]} to single-item array`);
                    }
                }
            });
            // Enhanced handling for images array
            if (foodProductData.images !== undefined) {
                // Ensure images is an array
                if (!Array.isArray(foodProductData.images)) {
                    if (typeof foodProductData.images === 'string') {
                        // Try to parse as JSON if it's a string
                        try {
                            if (foodProductData.images.startsWith('[') && foodProductData.images.endsWith(']')) {
                                const parsed = JSON.parse(foodProductData.images);
                                if (Array.isArray(parsed)) {
                                    foodProductData.images = parsed;
                                    console.log(`Parsed images from JSON string to array with ${parsed.length} items`);
                                }
                                else {
                                    foodProductData.images = [foodProductData.images];
                                    console.log(`Converted images string to single-item array`);
                                }
                            }
                            else {
                                // Regular string, wrap in array
                                foodProductData.images = [foodProductData.images];
                                console.log(`Converted images string to single-item array`);
                            }
                        }
                        catch (e) {
                            // Parse failed, use as single string
                            foodProductData.images = [foodProductData.images];
                            console.log(`Converted images from string to single-item array (parse failed)`);
                        }
                    }
                    else if (foodProductData.images) {
                        // Non-string value, convert to array
                        foodProductData.images = [String(foodProductData.images)];
                        console.log(`Converted images to single-item array`);
                    }
                    else {
                        // Null/undefined, initialize as empty array
                        foodProductData.images = [];
                        console.log('Initialized empty images array');
                    }
                }
                // Handle main image synchronization with images array
                if (foodProductData.image) {
                    // Ensure main image is in the images array and is the first element
                    if (!foodProductData.images.includes(foodProductData.image)) {
                        foodProductData.images.unshift(foodProductData.image);
                        console.log(`Added main image to images array: ${foodProductData.image}`);
                    }
                    else if (foodProductData.images[0] !== foodProductData.image) {
                        // Rearrange to put main image first
                        foodProductData.images = [
                            foodProductData.image,
                            ...foodProductData.images.filter(img => img !== foodProductData.image)
                        ];
                        console.log(`Moved main image to front of images array: ${foodProductData.image}`);
                    }
                }
                else if (foodProductData.images.length > 0) {
                    // If no main image provided but images array exists, use first image as main
                    foodProductData.image = foodProductData.images[0];
                    console.log(`Set main image from images array: ${foodProductData.image}`);
                }
                console.log(`Final images array for update: ${foodProductData.images.length} items`);
                console.log(`Main image for update: ${foodProductData.image}`);
            }
            else if (foodProductData.image) {
                // If only main image provided (not images array), update images array from existing
                if (existingFoodProduct.images && existingFoodProduct.images.length > 0) {
                    // If existing product has images, update array to include new main image
                    if (!existingFoodProduct.images.includes(foodProductData.image)) {
                        foodProductData.images = [
                            foodProductData.image,
                            ...existingFoodProduct.images
                        ];
                    }
                    else if (existingFoodProduct.images[0] !== foodProductData.image) {
                        // Rearrange to put new main image first
                        foodProductData.images = [
                            foodProductData.image,
                            ...existingFoodProduct.images.filter(img => img !== foodProductData.image)
                        ];
                    }
                    else {
                        // Keep existing array
                        foodProductData.images = [...existingFoodProduct.images];
                    }
                }
                else {
                    // No existing images, create new array with main image
                    foodProductData.images = [foodProductData.image];
                }
                console.log(`Created/updated images array from main image: ${foodProductData.images.length} items`);
            }
            // Handle numeric fields - ensure they are numbers
            ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'].forEach(field => {
                if (foodProductData[field] !== undefined) {
                    foodProductData[field] = Number(foodProductData[field]);
                    if (isNaN(foodProductData[field])) {
                        throw new Error(`Field ${field} must be a valid number`);
                    }
                }
            });
            // Set countInStock from currentAvailable
            if (foodProductData.currentAvailable !== undefined) {
                foodProductData.countInStock = foodProductData.currentAvailable;
            }
            // Set price from pricePerUnit
            if (foodProductData.pricePerUnit !== undefined) {
                foodProductData.price = foodProductData.pricePerUnit;
            }
            console.log('=== UPDATE WITH PRODUCT - PROCESSED DATA ===');
            console.log('Food-specific fields after processing:', {
                foodType: foodProductData.foodType,
                packagingType: foodProductData.packagingType,
                packagingSize: foodProductData.packagingSize,
                shelfLife: foodProductData.shelfLife,
                storageInstruction: foodProductData.storageInstruction,
                flavorType: foodProductData.flavorType,
                ingredients: foodProductData.ingredients,
                allergens: foodProductData.allergens,
                usage: foodProductData.usage,
                image: foodProductData.image,
                images: foodProductData.images
            });
            // Update FoodProduct - IMPORTANT: Use { new: true, runValidators: true, setDefaultsOnInsert: false }
            // setDefaultsOnInsert: false prevents MongoDB from applying schema defaults
            const foodProduct = yield this.findByIdAndUpdate(foodProductId, foodProductData, {
                new: true,
                runValidators: false, // Disable validators for update to be more lenient
                setDefaultsOnInsert: false // IMPORTANT: Don't apply schema defaults
            });
            if (!foodProduct) {
                throw new Error('Food product not found');
            }
            console.log('=== UPDATE WITH PRODUCT - AFTER UPDATE ===');
            console.log('Food product after update:', {
                foodType: foodProduct.foodType,
                packagingType: foodProduct.packagingType,
                packagingSize: foodProduct.packagingSize,
                shelfLife: foodProduct.shelfLife,
                storageInstruction: foodProduct.storageInstruction,
                flavorType: foodProduct.flavorType,
                ingredients: foodProduct.ingredients,
                allergens: foodProduct.allergens,
                usage: foodProduct.usage,
                image: foodProduct.image,
                images: foodProduct.images
            });
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
            console.error('Error in updateWithProduct:', error);
            // Add more context to the error for better debugging
            if (error instanceof Error) {
                throw new Error(`Failed to update food product: ${error.message}`);
            }
            else {
                throw new Error('Failed to update food product due to unknown error');
            }
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
            // Add more context to the error for better debugging
            if (error instanceof Error) {
                throw new Error(`Failed to delete food product: ${error.message}`);
            }
            else {
                throw new Error('Failed to delete food product due to unknown error');
            }
        }
    });
};
const FoodProduct = mongoose_1.default.model("FoodProduct", foodProductSchema);
exports.default = FoodProduct;
