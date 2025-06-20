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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByType = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const models_1 = require("../models");
// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productType } = req.query;
        // Nếu có productType, filter theo loại, nếu không thì lấy tất cả
        const filter = productType ? { productType } : {};
        const products = yield models_1.Product.find(filter);
        res.json(products);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.getProducts = getProducts;
// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield models_1.Product.findById(req.params.id);
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.getProductById = getProductById;
// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Manufacturer
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { productType = 'other' } = _a, requestData = __rest(_a, ["productType"]);
        // Chuẩn bị data với user info
        let productData = Object.assign({ user: req.user._id, rating: 0, numReviews: 0 }, requestData);
        // Xử lý mapping đặc biệt cho food products
        if (productType === 'food') {
            productData = (0, models_1.mapFormDataToFoodProduct)(productData);
        }
        // Sử dụng helper function để tạo sản phẩm với loại phù hợp
        const product = (0, models_1.createProduct)(productType, productData);
        const createdProduct = yield product.save();
        res.status(201).json(createdProduct);
    }
    catch (error) {
        console.error('Error creating product:', error);
        if (error instanceof Error) {
            res.status(400).json({
                message: error.message,
                details: error.name === 'ValidationError' ? error.message : undefined
            });
        }
        else {
            res.status(400).json({ message: "Unknown error occurred" });
        }
    }
});
exports.createProduct = createProduct;
// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Manufacturer
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield models_1.Product.findById(req.params.id);
        if (product) {
            const _a = req.body, { productType } = _a, updateData = __rest(_a, ["productType"]);
            // Xử lý mapping đặc biệt cho food products
            let finalUpdateData = updateData;
            if (product.productType === 'food' || productType === 'food') {
                finalUpdateData = (0, models_1.mapFormDataToFoodProduct)(updateData);
            }
            // Cập nhật các field được gửi trong request
            Object.keys(finalUpdateData).forEach(key => {
                if (finalUpdateData[key] !== undefined && key !== '_id' && key !== '__v') {
                    product[key] = finalUpdateData[key];
                }
            });
            const updatedProduct = yield product.save();
            res.json(updatedProduct);
        }
        else {
            res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error('Error updating product:', error);
        if (error instanceof Error) {
            res.status(400).json({
                message: error.message,
                details: error.name === 'ValidationError' ? error.message : undefined
            });
        }
        else {
            res.status(400).json({ message: "Unknown error occurred" });
        }
    }
});
exports.updateProduct = updateProduct;
// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Manufacturer
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield models_1.Product.findById(req.params.id);
        if (product) {
            yield product.deleteOne();
            res.json({ message: "Product removed" });
        }
        else {
            res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: "Unknown error occurred" });
        }
    }
});
exports.deleteProduct = deleteProduct;
// @desc    Lấy sản phẩm theo loại
// @route   GET /api/products/type/:productType
// @access  Public
const getProductsByType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productType } = req.params;
        const Model = (0, models_1.getProductModel)(productType);
        const products = yield Model.find({ productType });
        res.json(products);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.getProductsByType = getProductsByType;
