"use strict";
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
exports.mapFormDataToFoodProduct = exports.isValidProductType = exports.createProduct = exports.getProductModel = exports.FoodProduct = exports.Product = void 0;
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
            return Product_1.default;
    }
};
exports.getProductModel = getProductModel;
// Helper function để tạo sản phẩm với loại phù hợp
const createProduct = (productType, data) => {
    const Model = (0, exports.getProductModel)(productType);
    return new Model(Object.assign(Object.assign({}, data), { productType }));
};
exports.createProduct = createProduct;
// Helper function để validate productType
const isValidProductType = (type) => {
    return ['food', 'beverage', 'health', 'other'].includes(type);
};
exports.isValidProductType = isValidProductType;
// Helper function để map form data to database structure
const mapFormDataToFoodProduct = (formData) => {
    const { manufacturerName, currentAvailable, pricePerUnit, foodProductData } = formData, baseProductData = __rest(formData, ["manufacturerName", "currentAvailable", "pricePerUnit", "foodProductData"]);
    // Map form fields to database fields
    const mappedData = Object.assign(Object.assign(Object.assign({}, baseProductData), { 
        // Map manufacturerName to both brand (base schema) and manufacturer (food schema)
        brand: manufacturerName, manufacturer: manufacturerName, 
        // Map currentAvailable to countInStock (base schema) and keep currentAvailable (food schema)
        countInStock: currentAvailable || 0, currentAvailable: currentAvailable || 0, 
        // Map pricePerUnit to price (base schema) and keep pricePerUnit (food schema)
        price: pricePerUnit || 0, pricePerUnit: pricePerUnit || 0 }), foodProductData);
    return mappedData;
};
exports.mapFormDataToFoodProduct = mapFormDataToFoodProduct;
exports.default = {
    Product: Product_1.default,
    FoodProduct: FoodProduct_1.default,
    getProductModel: exports.getProductModel,
    createProduct: exports.createProduct,
    isValidProductType: exports.isValidProductType,
    mapFormDataToFoodProduct: exports.mapFormDataToFoodProduct,
};
