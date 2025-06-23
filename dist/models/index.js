"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodProduct = exports.Product = exports.mapFormDataToFoodProduct = exports.isValidProductType = exports.deleteProductWithReference = exports.updateProductWithReference = exports.getProductWithReference = exports.createProduct = exports.getProductModel = void 0;
const Product_1 = __importDefault(require("./Product"));
exports.Product = Product_1.default;
const FoodProduct_1 = __importDefault(require("./FoodProduct"));
exports.FoodProduct = FoodProduct_1.default;
// Helper function để lấy model phù hợp dựa trên productType
const getProductModel = (productType) => {
    switch (productType) {
        case 'food':
            return FoodProduct_1.default;
        case 'beverage':
        case 'health':
        case 'other':
        default:
            // Trong tương lai có thể tạo BeverageProduct, HealthProduct, etc.
            return FoodProduct_1.default; // Tạm thời default về FoodProduct
    }
};
exports.getProductModel = getProductModel;
// Helper function để tạo product với cấu trúc mới
const createProduct = (productType, productData, detailData) => __awaiter(void 0, void 0, void 0, function* () {
    const ProductModel = (0, exports.getProductModel)(productType);
    if (productType === 'food' && ProductModel === FoodProduct_1.default) {
        return yield FoodProduct_1.default.createWithProduct(productData, detailData);
    }
    // Cho các loại sản phẩm khác trong tương lai
    throw new Error(`Product type ${productType} is not yet supported`);
});
exports.createProduct = createProduct;
// Helper function để lấy product với reference
const getProductWithReference = (productType_1, ...args_1) => __awaiter(void 0, [productType_1, ...args_1], void 0, function* (productType, query = {}) {
    switch (productType) {
        case 'food':
            return yield FoodProduct_1.default.findWithProduct(query);
        default:
            throw new Error(`Product type ${productType} is not yet supported`);
    }
});
exports.getProductWithReference = getProductWithReference;
// Helper function để update product với reference
const updateProductWithReference = (productType, productId, productData, detailData) => __awaiter(void 0, void 0, void 0, function* () {
    switch (productType) {
        case 'food':
            return yield FoodProduct_1.default.updateWithProduct(productId, productData, detailData);
        default:
            throw new Error(`Product type ${productType} is not yet supported`);
    }
});
exports.updateProductWithReference = updateProductWithReference;
// Helper function để delete product với reference
const deleteProductWithReference = (productType, productId) => __awaiter(void 0, void 0, void 0, function* () {
    switch (productType) {
        case 'food':
            return yield FoodProduct_1.default.deleteWithProduct(productId);
        default:
            throw new Error(`Product type ${productType} is not yet supported`);
    }
});
exports.deleteProductWithReference = deleteProductWithReference;
// Helper function để validate product type
const isValidProductType = (productType) => {
    return ['food', 'beverage', 'health', 'other'].includes(productType);
};
exports.isValidProductType = isValidProductType;
// Helper function để map form data to database structure cho FoodProduct
const mapFormDataToFoodProduct = (formData) => {
    const { manufacturerName, productName, name } = formData, 
    // Tách product reference data và detail data
    detailData = __rest(formData, ["manufacturerName", "productName", "name"]);
    const productData = {
        manufacturerName: manufacturerName || detailData.manufacturer,
        productName: productName || name || detailData.name,
    };
    const foodProductData = {
        name: name || productName,
        brand: detailData.brand || manufacturerName,
        category: detailData.category || 'Other',
        description: detailData.description || 'No description provided',
        image: detailData.image || 'https://via.placeholder.com/300x300?text=No+Image',
        price: Number(detailData.price || detailData.pricePerUnit) || 0,
        countInStock: Number(detailData.countInStock || detailData.currentAvailable) || 0,
        rating: detailData.rating || 0,
        numReviews: detailData.numReviews || 0,
        // Food-specific fields với default values
        manufacturer: detailData.manufacturer || manufacturerName,
        originCountry: detailData.originCountry || 'Unknown',
        manufacturerRegion: detailData.manufacturerRegion || '',
        minOrderQuantity: Number(detailData.minOrderQuantity) || 1,
        dailyCapacity: Number(detailData.dailyCapacity) || 100,
        currentAvailable: Number(detailData.currentAvailable) || 0,
        unitType: detailData.unitType || 'units',
        pricePerUnit: Number(detailData.pricePerUnit) || 0,
        priceCurrency: detailData.priceCurrency || 'USD',
        leadTime: detailData.leadTime || '1-2',
        leadTimeUnit: detailData.leadTimeUnit || 'weeks',
        sustainable: Boolean(detailData.sustainable),
        foodType: detailData.foodType || 'Other',
        flavorType: Array.isArray(detailData.flavorType) ? detailData.flavorType : (detailData.flavorType ? [detailData.flavorType] : []),
        ingredients: Array.isArray(detailData.ingredients) ? detailData.ingredients : (detailData.ingredients ? [detailData.ingredients] : []),
        allergens: Array.isArray(detailData.allergens) ? detailData.allergens : (detailData.allergens ? [detailData.allergens] : []),
        usage: Array.isArray(detailData.usage) ? detailData.usage : (detailData.usage ? [detailData.usage] : []),
        packagingType: detailData.packagingType || 'Bottle',
        packagingSize: detailData.packagingSize || 'Standard',
        shelfLife: detailData.shelfLife || '12 months',
        shelfLifeStartDate: detailData.shelfLifeStartDate ? new Date(detailData.shelfLifeStartDate) : undefined,
        shelfLifeEndDate: detailData.shelfLifeEndDate ? new Date(detailData.shelfLifeEndDate) : undefined,
        storageInstruction: detailData.storageInstruction || 'Store in cool, dry place',
    };
    return { productData, foodProductData };
};
exports.mapFormDataToFoodProduct = mapFormDataToFoodProduct;
exports.default = {
    Product: Product_1.default,
    FoodProduct: FoodProduct_1.default,
    getProductModel: exports.getProductModel,
    createProduct: exports.createProduct,
    getProductWithReference: exports.getProductWithReference,
    updateProductWithReference: exports.updateProductWithReference,
    deleteProductWithReference: exports.deleteProductWithReference,
    isValidProductType: exports.isValidProductType,
    mapFormDataToFoodProduct: exports.mapFormDataToFoodProduct,
};
