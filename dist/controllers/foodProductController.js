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
// @desc    Lấy tất cả sản phẩm thực phẩm
// @route   GET /api/foodproducts
// @access  Public
const getFoodProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, productType, sustainable, sortBy, minPrice, maxPrice, minRating, leadTime, inStockOnly, manufacturer, page = 1, limit = 10 } = req.query;
        // Build query for FoodProduct
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
        // Filter by lead time
        if (leadTime) {
            if (Array.isArray(leadTime) && leadTime.length > 0) {
                const leadTimeValues = leadTime.map((time) => time.split(' ')[0]);
                query.leadTime = { $in: leadTimeValues };
            }
            else if (typeof leadTime === 'string') {
                query.leadTime = leadTime.split(' ')[0];
            }
        }
        // Filter by stock status
        if (inStockOnly === 'true') {
            query.currentAvailable = { $gt: 0 };
        }
        // Filter by manufacturer
        if (manufacturer) {
            if (Array.isArray(manufacturer) && manufacturer.length > 0) {
                query.manufacturer = { $in: manufacturer };
            }
            else if (typeof manufacturer === 'string') {
                query.manufacturer = manufacturer;
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
            products: foodProducts,
            page: pageNum,
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount
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
exports.getFoodProducts = getFoodProducts;
// @desc    Lấy sản phẩm thực phẩm theo ID
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
            res.json(foodProduct);
        }
        else {
            res.status(404).json({ message: "Food product not found" });
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
exports.getFoodProductById = getFoodProductById;
// @desc    Tạo sản phẩm thực phẩm mới (Discriminator-based)
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
// @desc    Tạo sản phẩm thực phẩm mới (Discriminator-based) - Simplified version
// @route   POST /api/foodproducts/simple
// @access  Public
const createFoodProductSimple = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== CREATE FOOD PRODUCT SIMPLE ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        // Lấy user ID từ request hoặc tạo default user ID
        let userId;
        if (req.user && req.user._id) {
            userId = req.user._id;
            console.log('Using authenticated user ID:', userId);
        }
        else {
            // Tạo một ObjectId default cho trường hợp không có user authentication
            const mongoose = require('mongoose');
            userId = new mongoose.Types.ObjectId('000000000000000000000000');
            console.log('Using default user ID:', userId);
        }
        // Lấy tất cả data từ request
        const requestData = req.body;
        // Chuẩn bị data cho Product (base model với discriminator)
        const productData = {
            user: userId,
            name: requestData.name || 'Unnamed Product',
            manufacturerName: requestData.manufacturerName || requestData.manufacturer || 'Unknown Manufacturer',
        };
        // Chuẩn bị data cho FoodProduct (detail model)
        const foodProductData = {
            // Basic fields với default values
            category: requestData.category || 'Other',
            description: requestData.description || 'No description provided',
            image: requestData.image || 'https://via.placeholder.com/300x300?text=No+Image',
            price: Number(requestData.pricePerUnit) || 0,
            countInStock: Number(requestData.currentAvailable) || 0,
            rating: 0,
            numReviews: 0,
            // Food-specific fields với default values
            manufacturer: requestData.manufacturerName || requestData.manufacturer || 'Unknown Manufacturer',
            originCountry: requestData.originCountry || 'Unknown',
            manufacturerRegion: requestData.manufacturerRegion || 'Unknown',
            minOrderQuantity: Number(requestData.minOrderQuantity) || 1,
            dailyCapacity: Number(requestData.dailyCapacity) || 100,
            currentAvailable: Number(requestData.currentAvailable) || 0,
            unitType: requestData.unitType || 'piece',
            pricePerUnit: Number(requestData.pricePerUnit) || 0,
            priceCurrency: requestData.priceCurrency || 'USD',
            leadTime: requestData.leadTime || '1-2',
            leadTimeUnit: requestData.leadTimeUnit || 'weeks',
            sustainable: Boolean(requestData.sustainable),
            foodType: requestData.foodType || 'Other',
            flavorType: Array.isArray(requestData.flavorType) ? requestData.flavorType : (requestData.flavorType ? [requestData.flavorType] : ['Unknown']),
            ingredients: Array.isArray(requestData.ingredients) ? requestData.ingredients : (requestData.ingredients ? [requestData.ingredients] : ['Unknown']),
            allergens: Array.isArray(requestData.allergens) ? requestData.allergens : (requestData.allergens ? [requestData.allergens] : ['None']),
            usage: Array.isArray(requestData.usage) ? requestData.usage : (requestData.usage ? [requestData.usage] : ['General use']),
            packagingType: requestData.packagingType || 'Standard',
            packagingSize: requestData.packagingSize || 'Medium',
            shelfLife: requestData.shelfLife || '12 months',
            shelfLifeStartDate: requestData.shelfLifeStartDate ? new Date(requestData.shelfLifeStartDate) : new Date(),
            shelfLifeEndDate: requestData.shelfLifeEndDate ? new Date(requestData.shelfLifeEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            storageInstruction: requestData.storageInstruction || 'Store in cool, dry place',
        };
        console.log('Product data (simple):', JSON.stringify(productData, null, 2));
        console.log('FoodProduct data (simple):', JSON.stringify(foodProductData, null, 2));
        // Chỉ validate name (minimum requirement)
        if (!productData.name || productData.name.trim() === '' || productData.name === 'Unnamed Product') {
            res.status(400).json({
                message: 'Product name is required',
                field: 'name'
            });
            return;
        }
        // Sử dụng static method createWithProduct (discriminator-based transaction)
        const result = yield FoodProduct_1.default.createWithProduct(productData, foodProductData);
        console.log('Food product created successfully (simple version)');
        console.log('Product ID:', result.product._id);
        console.log('FoodProduct ID:', result.foodProduct._id);
        // Populate để trả về đầy đủ thông tin
        const populatedFoodProduct = yield FoodProduct_1.default.findById(result.foodProduct._id)
            .populate('productId', 'name manufacturerName productType');
        res.status(201).json({
            success: true,
            data: {
                product: result.product,
                foodProduct: populatedFoodProduct,
                productId: result.product._id,
                discriminator: 'food'
            },
            message: 'Food product created successfully with simplified validation'
        });
    }
    catch (error) {
        console.error('=== CREATE FOOD PRODUCT SIMPLE ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error object:', error);
        res.status(400).json({
            message: error.message || "Error creating food product",
            details: error.name === 'ValidationError' ? error.message : undefined,
            version: 'simple'
        });
    }
});
exports.createFoodProductSimple = createFoodProductSimple;
// @desc    Cập nhật sản phẩm thực phẩm
// @route   PUT /api/foodproducts/:id
// @access  Private/Manufacturer
const updateFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foodProduct = yield FoodProduct_1.default.findById(req.params.id);
        if (foodProduct) {
            // Update all fields from request body
            Object.assign(foodProduct, req.body);
            const updatedFoodProduct = yield foodProduct.save();
            res.json(updatedFoodProduct);
        }
        else {
            res.status(404).json({ message: "Food product not found" });
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
exports.updateFoodProduct = updateFoodProduct;
// @desc    Xóa sản phẩm thực phẩm
// @route   DELETE /api/foodproducts/:id
// @access  Private/Manufacturer
const deleteFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foodProduct = yield FoodProduct_1.default.findById(req.params.id);
        if (foodProduct) {
            yield foodProduct.deleteOne();
            res.json({ message: "Food product removed" });
        }
        else {
            res.status(404).json({ message: "Food product not found" });
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
exports.deleteFoodProduct = deleteFoodProduct;
// @desc    Get unique categories
// @route   GET /api/foodproducts/categories
// @access  Public
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield FoodProduct_1.default.distinct('category');
        res.json(['All Categories', ...categories]);
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
exports.getCategories = getCategories;
// @desc    Get unique product types
// @route   GET /api/foodproducts/types
// @access  Public
const getProductTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productTypes = yield FoodProduct_1.default.distinct('productType');
        res.json(productTypes);
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
exports.getProductTypes = getProductTypes;
// @desc    Get unique manufacturers
// @route   GET /api/foodproducts/manufacturers
// @access  Public
const getManufacturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const manufacturers = yield FoodProduct_1.default.distinct('manufacturer');
        res.json(manufacturers);
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
exports.getManufacturers = getManufacturers;
