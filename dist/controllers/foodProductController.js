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
exports.getManufacturersFromProducts = exports.getProductTypes = exports.getCategories = exports.deleteFoodProduct = exports.updateFoodProduct = exports.createFoodProduct = exports.getFoodProductById = exports.getFoodProducts = void 0;
const FoodProduct_1 = __importDefault(require("../models/FoodProduct"));
const Manufacturer_1 = __importDefault(require("../models/Manufacturer"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Lấy tất cả sản phẩm thực phẩm với manufacturer details
// @route   GET /api/foodproducts
// @access  Public
const getFoodProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, productType, sustainable, sortBy, minPrice, maxPrice, minRating, leadTime, inStockOnly, manufacturer, page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
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
            query.pricePerUnit = {};
            if (minPrice)
                query.pricePerUnit.$gte = Number(minPrice);
            if (maxPrice)
                query.pricePerUnit.$lte = Number(maxPrice);
        }
        // Filter by rating
        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }
        // Filter by lead time - cập nhật để hỗ trợ leadTimeDetailed
        if (leadTime) {
            if (Array.isArray(leadTime) && leadTime.length > 0) {
                const leadTimeValues = leadTime.map((time) => {
                    if (typeof time === 'string') {
                        return time.split(' ')[0];
                    }
                    return time;
                });
                // Tìm kiếm theo cả leadTime cũ và leadTimeDetailed.average mới
                query.$or = [
                    { leadTime: { $in: leadTimeValues } },
                    { 'leadTimeDetailed.average': { $in: leadTimeValues.map(v => Number(v)) } }
                ];
            }
            else if (typeof leadTime === 'string') {
                const leadTimeValue = leadTime.split(' ')[0];
                query.$or = [
                    { leadTime: leadTimeValue },
                    { 'leadTimeDetailed.average': Number(leadTimeValue) }
                ];
            }
        }
        // Filter by stock status
        if (inStockOnly === 'true') {
            query.$or = [
                { currentAvailable: { $gt: 0 } },
                { status: 'available' }
            ];
        }
        // Filter by manufacturer - cập nhật để hỗ trợ ObjectId
        if (manufacturer) {
            if (Array.isArray(manufacturer) && manufacturer.length > 0) {
                // Kiểm tra xem manufacturer là ObjectId hay string
                const manufacturerIds = yield Promise.all(manufacturer.map((mfr) => __awaiter(void 0, void 0, void 0, function* () {
                    if (mongoose_1.default.Types.ObjectId.isValid(mfr)) {
                        return new mongoose_1.default.Types.ObjectId(mfr);
                    }
                    else {
                        // Tìm manufacturer theo name
                        const foundMfr = yield Manufacturer_1.default.findOne({ name: { $regex: mfr, $options: 'i' } });
                        return foundMfr ? foundMfr._id : null;
                    }
                })));
                query.manufacturer = { $in: manufacturerIds.filter(id => id !== null) };
            }
            else if (typeof manufacturer === 'string') {
                if (mongoose_1.default.Types.ObjectId.isValid(manufacturer)) {
                    query.manufacturer = new mongoose_1.default.Types.ObjectId(manufacturer);
                }
                else {
                    // Tìm manufacturer theo name
                    const foundMfr = yield Manufacturer_1.default.findOne({ name: { $regex: manufacturer, $options: 'i' } });
                    if (foundMfr) {
                        query.manufacturer = foundMfr._id;
                    }
                }
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
                    sortOptions = { pricePerUnit: 1 };
                    break;
                case 'price-desc':
                    sortOptions = { pricePerUnit: -1 };
                    break;
                case 'rating':
                    sortOptions = { rating: -1 };
                    break;
                case 'name':
                    sortOptions = { name: 1 };
                    break;
                default:
                    // Default sort by relevance (newest first)
                    sortOptions = { createdAt: -1 };
            }
        }
        else {
            // Default sort
            sortOptions = { createdAt: -1 };
        }
        const totalCount = yield FoodProduct_1.default.countDocuments(query);
        const foodProducts = yield FoodProduct_1.default.find(query)
            .populate('manufacturer', 'name location industry website')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        res.json({
            success: true,
            products: foodProducts,
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
exports.getFoodProducts = getFoodProducts;
// @desc    Lấy sản phẩm thực phẩm theo ID với manufacturer details
// @route   GET /api/foodproducts/:id
// @access  Public
const getFoodProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid product ID" });
            return;
        }
        const foodProduct = yield FoodProduct_1.default.findById(id)
            .populate('manufacturer', 'name location industry certification contact website image description');
        if (foodProduct) {
            res.json({ success: true, data: foodProduct });
        }
        else {
            res.status(404).json({ success: false, message: "Food product not found" });
        }
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
exports.getFoodProductById = getFoodProductById;
// @desc    Tạo sản phẩm thực phẩm mới
// @route   POST /api/foodproducts
// @access  Private/Manufacturer
const createFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate manufacturer exists
        if (req.body.manufacturer && !mongoose_1.default.Types.ObjectId.isValid(req.body.manufacturer)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        if (req.body.manufacturer) {
            const manufacturer = yield Manufacturer_1.default.findById(req.body.manufacturer);
            if (!manufacturer) {
                res.status(400).json({ success: false, message: "Manufacturer not found" });
                return;
            }
        }
        const foodProduct = new FoodProduct_1.default(req.body);
        const createdFoodProduct = yield foodProduct.save();
        // Populate manufacturer before returning
        yield createdFoodProduct.populate('manufacturer', 'name location industry website');
        res.status(201).json({
            success: true,
            message: "Food product created successfully",
            data: createdFoodProduct
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
exports.createFoodProduct = createFoodProduct;
// @desc    Cập nhật sản phẩm thực phẩm
// @route   PUT /api/foodproducts/:id
// @access  Private/Manufacturer
const updateFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const manufacturer = yield Manufacturer_1.default.findById(req.body.manufacturer);
            if (!manufacturer) {
                res.status(400).json({ success: false, message: "Manufacturer not found" });
                return;
            }
        }
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (foodProduct) {
            // Update all fields from request body
            Object.assign(foodProduct, req.body);
            const updatedFoodProduct = yield foodProduct.save();
            yield updatedFoodProduct.populate('manufacturer', 'name location industry website');
            res.json({
                success: true,
                message: "Food product updated successfully",
                data: updatedFoodProduct
            });
        }
        else {
            res.status(404).json({ success: false, message: "Food product not found" });
        }
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
exports.updateFoodProduct = updateFoodProduct;
// @desc    Xóa sản phẩm thực phẩm
// @route   DELETE /api/foodproducts/:id
// @access  Private/Manufacturer
const deleteFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid product ID" });
            return;
        }
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (foodProduct) {
            yield FoodProduct_1.default.deleteOne({ _id: id });
            res.json({
                success: true,
                message: "Food product removed successfully"
            });
        }
        else {
            res.status(404).json({ success: false, message: "Food product not found" });
        }
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
exports.deleteFoodProduct = deleteFoodProduct;
// @desc    Get unique categories
// @route   GET /api/foodproducts/categories
// @access  Public
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield FoodProduct_1.default.distinct('category');
        res.json({
            success: true,
            data: ['All Categories', ...categories.filter(cat => cat)]
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
// @route   GET /api/foodproducts/types
// @access  Public
const getProductTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productTypes = yield FoodProduct_1.default.distinct('productType');
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
// @desc    Get manufacturers from food products
// @route   GET /api/foodproducts/manufacturers
// @access  Public
const getManufacturersFromProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get unique manufacturer IDs from products
        const manufacturerIds = yield FoodProduct_1.default.distinct('manufacturer');
        // Get manufacturer details
        const manufacturers = yield Manufacturer_1.default.find({
            _id: { $in: manufacturerIds }
        }).select('name location industry');
        res.json({
            success: true,
            data: manufacturers
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
exports.getManufacturersFromProducts = getManufacturersFromProducts;
