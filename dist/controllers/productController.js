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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductStats = exports.getManufacturers = exports.getProductTypes = exports.getProductDetails = exports.getProductById = exports.getProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
// @desc    Lấy tất cả sản phẩm cơ bản với discriminator routing
// @route   GET /api/products
// @access  Public
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, productType, includeDetails = false, // Flag để include detail models
        page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { manufacturerName: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter by productType (discriminator)
        if (productType && productType !== 'all') {
            query.productType = productType;
        }
        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        const totalCount = yield Product_1.default.countDocuments(query);
        // Chỉ select các field cơ bản từ Product
        const products = yield Product_1.default.find(query)
            .select('name manufacturerName productType createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        // Nếu yêu cầu include details, route đến đúng detail collection
        let detailedProducts = products.map(product => product.toObject());
        if (includeDetails === 'true') {
            detailedProducts = yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const details = yield product.getDetails();
                    return Object.assign(Object.assign({}, product.toObject()), { details: details });
                }
                catch (error) {
                    // Nếu không tìm thấy detail model, trả về product cơ bản
                    return product.toObject();
                }
            })));
        }
        res.json({
            products: detailedProducts,
            page: pageNum,
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount,
            discriminator: {
                enabled: true,
                supportedTypes: ['food', 'beverage', 'health', 'other']
            }
        });
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
// @desc    Lấy sản phẩm theo ID với discriminator routing
// @route   GET /api/products/:id
// @access  Public
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { includeDetails = false } = req.query;
        const product = yield Product_1.default.findById(req.params.id)
            .select('name manufacturerName productType createdAt updatedAt');
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        // Nếu yêu cầu include details, sử dụng discriminator routing
        if (includeDetails === 'true') {
            try {
                const details = yield product.getDetails();
                res.json({
                    product: product.toObject(),
                    details: details,
                    discriminator: product.productType
                });
            }
            catch (error) {
                // Nếu không tìm thấy detail model, trả về product cơ bản
                res.json({
                    product: product.toObject(),
                    details: null,
                    discriminator: product.productType,
                    warning: `No detail model found for productType: ${product.productType}`
                });
            }
        }
        else {
            res.json({
                product: product.toObject(),
                discriminator: product.productType
            });
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
// @desc    Route đến detail collection dựa trên discriminator
// @route   GET /api/products/:id/details
// @access  Public
const getProductDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.default.findById(req.params.id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        try {
            // Sử dụng discriminator routing để lấy detail
            const DetailModel = Product_1.default.getDetailModel(product.productType);
            const details = yield DetailModel.findOne({ productId: product._id })
                .populate('productId');
            if (!details) {
                res.status(404).json({
                    message: `No details found for ${product.productType} product`,
                    productType: product.productType
                });
                return;
            }
            res.json({
                product: product.toObject(),
                details: details,
                discriminator: product.productType
            });
        }
        catch (error) {
            res.status(400).json({
                message: `Unsupported product type: ${product.productType}`,
                supportedTypes: ['food', 'beverage', 'health']
            });
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
exports.getProductDetails = getProductDetails;
// @desc    Lấy unique product types (discriminators)
// @route   GET /api/products/types
// @access  Public
const getProductTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productTypes = yield Product_1.default.distinct('productType');
        // Thống kê theo từng type
        const stats = yield Product_1.default.aggregate([
            {
                $group: {
                    _id: '$productType',
                    count: { $sum: 1 },
                    manufacturers: { $addToSet: '$manufacturerName' }
                }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    manufacturerCount: { $size: '$manufacturers' },
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        res.json({
            success: true,
            data: {
                types: productTypes.filter(type => type),
                stats: stats,
                discriminator: {
                    enabled: true,
                    detailCollections: {
                        food: 'FoodProduct',
                        beverage: 'BeverageProduct',
                        health: 'HealthProduct'
                    }
                }
            }
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getProductTypes = getProductTypes;
// @desc    Lấy unique manufacturers với discriminator grouping
// @route   GET /api/products/manufacturers
// @access  Public
const getManufacturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productType } = req.query;
        const pipeline = [
            {
                $group: {
                    _id: '$manufacturerName',
                    productTypes: { $addToSet: '$productType' },
                    totalProducts: { $sum: 1 }
                }
            },
            {
                $project: {
                    manufacturer: '$_id',
                    productTypes: 1,
                    totalProducts: 1,
                    _id: 0
                }
            },
            {
                $sort: { totalProducts: -1 }
            }
        ];
        // Filter theo productType nếu có
        if (productType && productType !== 'all') {
            pipeline.unshift({
                $match: { productType: productType }
            });
        }
        const manufacturers = yield Product_1.default.aggregate(pipeline);
        res.json({
            success: true,
            data: manufacturers,
            discriminator: productType || 'all'
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getManufacturers = getManufacturers;
// @desc    Lấy product statistics với discriminator breakdown
// @route   GET /api/products/stats
// @access  Public
const getProductStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield Product_1.default.aggregate([
            {
                $group: {
                    _id: '$productType',
                    count: { $sum: 1 },
                    manufacturers: { $addToSet: '$manufacturerName' }
                }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    manufacturerCount: { $size: '$manufacturers' },
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        // Total statistics
        const totalStats = yield Product_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalManufacturers: { $addToSet: '$manufacturerName' },
                    productTypes: { $addToSet: '$productType' }
                }
            },
            {
                $project: {
                    totalProducts: 1,
                    totalManufacturers: { $size: '$totalManufacturers' },
                    totalTypes: { $size: '$productTypes' },
                    _id: 0
                }
            }
        ]);
        res.json({
            success: true,
            data: {
                byType: stats,
                total: totalStats[0] || { totalProducts: 0, totalManufacturers: 0, totalTypes: 0 },
                discriminator: {
                    enabled: true,
                    supportedTypes: ['food', 'beverage', 'health', 'other']
                }
            }
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getProductStats = getProductStats;
