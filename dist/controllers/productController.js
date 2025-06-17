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
exports.getProductsByManufacturer = exports.getProductTypes = exports.getCategories = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Manufacturer_1 = __importDefault(require("../models/Manufacturer"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, productType, sustainable, sortBy, minPrice, maxPrice, minRating, leadTimeUnit, maxLeadTime, status, manufacturer, page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }
        // Filter by category
        if (category && category !== 'All Categories') {
            query.category = category;
        }
        // Filter by productType (can be an array)
        if (productType && Array.isArray(productType) && productType.length > 0) {
            query.productType = { $in: productType };
        }
        else if (productType && !Array.isArray(productType)) {
            query.productType = productType;
        }
        // Filter by sustainable
        if (sustainable === 'true') {
            query.sustainable = true;
        }
        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice);
            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }
        // Filter by rating
        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }
        // Filter by lead time
        if (leadTimeUnit || maxLeadTime) {
            if (leadTimeUnit) {
                query['leadTimeDetailed.unit'] = leadTimeUnit;
            }
            if (maxLeadTime) {
                query['leadTimeDetailed.max'] = { $lte: Number(maxLeadTime) };
            }
        }
        // Filter by status
        if (status) {
            if (Array.isArray(status) && status.length > 0) {
                query.status = { $in: status };
            }
            else if (typeof status === 'string') {
                query.status = status;
            }
        }
        // Filter by manufacturer
        if (manufacturer) {
            if (Array.isArray(manufacturer) && manufacturer.length > 0) {
                query.manufacturer = { $in: manufacturer.map(id => new mongoose_1.default.Types.ObjectId(id)) };
            }
            else if (typeof manufacturer === 'string') {
                query.manufacturer = new mongoose_1.default.Types.ObjectId(manufacturer);
            }
        }
        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        // Create sort object
        let sortOptions = {};
        if (sortBy) {
            switch (sortBy) {
                case 'price-asc':
                    sortOptions = { price: 1 };
                    break;
                case 'price-desc':
                    sortOptions = { price: -1 };
                    break;
                case 'rating':
                    sortOptions = { rating: -1 };
                    break;
                case 'name':
                    sortOptions = { name: 1 };
                    break;
                default:
                    // Default sort by relevance if searching, otherwise by newest first
                    sortOptions = search ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
            }
        }
        else {
            // Default sort
            sortOptions = search ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
        }
        const totalCount = yield Product_1.default.countDocuments(query);
        const products = yield Product_1.default.find(query)
            .populate('manufacturer', 'name location industry website')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        res.json({
            success: true,
            products,
            page: pageNum,
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount
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
exports.getProducts = getProducts;
// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid product ID" });
            return;
        }
        const product = yield Product_1.default.findById(id)
            .populate('manufacturer', 'name location industry certification contact website image description');
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        res.json({ success: true, data: product });
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
exports.getProductById = getProductById;
// @desc    Create new product
// @route   POST /api/products
// @access  Private/Manufacturer
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate manufacturer exists
        if (req.body.manufacturer && !mongoose_1.default.Types.ObjectId.isValid(req.body.manufacturer)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        if (req.body.manufacturer) {
            const manufacturerExists = yield Manufacturer_1.default.findById(req.body.manufacturer);
            if (!manufacturerExists) {
                res.status(400).json({ success: false, message: "Manufacturer not found" });
                return;
            }
        }
        const product = new Product_1.default(req.body);
        const createdProduct = yield product.save();
        // Populate manufacturer data for response
        yield createdProduct.populate('manufacturer', 'name location industry website');
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: createdProduct
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.createProduct = createProduct;
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Manufacturer
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid product ID" });
            return;
        }
        // Validate manufacturer if provided
        if (req.body.manufacturer && !mongoose_1.default.Types.ObjectId.isValid(req.body.manufacturer)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        if (req.body.manufacturer) {
            const manufacturerExists = yield Manufacturer_1.default.findById(req.body.manufacturer);
            if (!manufacturerExists) {
                res.status(400).json({ success: false, message: "Manufacturer not found" });
                return;
            }
        }
        const product = yield Product_1.default.findById(id);
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Update all fields from request body
        Object.assign(product, req.body);
        const updatedProduct = yield product.save();
        yield updatedProduct.populate('manufacturer', 'name location industry website');
        res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.updateProduct = updateProduct;
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Manufacturer
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid product ID" });
            return;
        }
        const product = yield Product_1.default.findById(id);
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        yield Product_1.default.deleteOne({ _id: id });
        res.json({
            success: true,
            message: "Product deleted successfully"
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
exports.deleteProduct = deleteProduct;
// @desc    Get unique categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Product_1.default.distinct('category');
        res.json({
            success: true,
            data: ['All Categories', ...categories.filter(category => category)]
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
exports.getCategories = getCategories;
// @desc    Get unique product types
// @route   GET /api/products/types
// @access  Public
const getProductTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productTypes = yield Product_1.default.distinct('productType');
        res.json({
            success: true,
            data: productTypes.filter(type => type)
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
// @desc    Get products by manufacturer
// @route   GET /api/products/manufacturer/:manufacturerId
// @access  Public
const getProductsByManufacturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { manufacturerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(manufacturerId)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = { manufacturer: new mongoose_1.default.Types.ObjectId(manufacturerId) };
        const totalCount = yield Product_1.default.countDocuments(query);
        const products = yield Product_1.default.find(query)
            .populate('manufacturer', 'name location industry website')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        res.json({
            success: true,
            products,
            page: pageNum,
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount
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
exports.getProductsByManufacturer = getProductsByManufacturer;
