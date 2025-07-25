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
exports.deleteProductImage = exports.updateProductImages = exports.updateProductImage = exports.uploadProductImages = exports.getFoodTypes = exports.getManufacturers = exports.getProductTypes = exports.getCategories = exports.deleteFoodProduct = exports.updateFoodProduct = exports.createFoodProduct = exports.getFoodProductById = exports.getFoodProducts = void 0;
const FoodProduct_1 = __importDefault(require("../models/FoodProduct"));
const Product_1 = __importDefault(require("../models/Product"));
const mongoose_1 = __importDefault(require("mongoose"));
const s3Client_1 = require("../utils/s3Client");
// @desc    Lấy tất cả sản phẩm thực phẩm
// @route   GET /api/foodproducts
// @access  Public
const getFoodProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, productType, sustainable, sortBy, minPrice, maxPrice, minRating, leadTime, inStockOnly, manufacturer, page = 1, limit = 10 } = req.query;
        // Build query cho FoodProduct
        const query = {};
        // Search functionality - tìm kiếm trong cả Product và FoodProduct
        if (search) {
            // Tìm trong Product collection trước
            const productQuery = {
                type: 'food',
                $or: [
                    { productName: { $regex: search, $options: 'i' } },
                    { manufacturerName: { $regex: search, $options: 'i' } }
                ]
            };
            const matchingProducts = yield Product_1.default.find(productQuery);
            const matchingProductIds = matchingProducts.map(p => p.productId);
            // Kết hợp với tìm kiếm trong FoodProduct
            query.$or = [
                { _id: { $in: matchingProductIds } },
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter by category
        if (category && category !== 'All Categories') {
            query.category = category;
        }
        // Filter by foodType (thay vì productType)
        if (productType && Array.isArray(productType) && productType.length > 0) {
            query.foodType = { $in: productType };
        }
        else if (productType && !Array.isArray(productType)) {
            query.foodType = productType;
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
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        // Lấy thông tin Product reference cho mỗi FoodProduct
        const foodProductIds = foodProducts.map(fp => fp._id);
        const productReferences = yield Product_1.default.find({
            type: 'food',
            productId: { $in: foodProductIds }
        });
        // Kết hợp thông tin
        const enrichedProducts = foodProducts.map(fp => {
            const productRef = productReferences.find(pr => pr.productId.toString() === fp._id.toString());
            return Object.assign(Object.assign({}, fp.toObject()), { productReference: productRef });
        });
        console.log(`[SERVER] Fetched ${enrichedProducts.length} products`);
        res.json({
            products: enrichedProducts,
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
        console.log('=== GET FOOD PRODUCT BY ID ===');
        console.log('Requested product ID:', req.params.id);
        // Validate the ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            console.error('❌ Invalid MongoDB ObjectId format:', req.params.id);
            res.status(400).json({
                message: "Invalid product ID format",
                error: "INVALID_ID_FORMAT"
            });
            return;
        }
        let foodProduct = null;
        let productReference = null;
        // PHƯƠNG PHÁP 1: Tìm kiếm trực tiếp FoodProduct bằng ID
        console.log('🔍 Phương pháp 1: Tìm kiếm FoodProduct trực tiếp với ID:', req.params.id);
        foodProduct = yield FoodProduct_1.default.findById(req.params.id);
        // Nếu tìm thấy FoodProduct, tìm thêm Product reference
        if (foodProduct) {
            console.log('✅ Tìm thấy FoodProduct trực tiếp:', {
                _id: foodProduct._id,
                name: foodProduct.name
            });
            // Tìm Product reference
            productReference = yield Product_1.default.findOne({
                type: 'food',
                productId: foodProduct._id
            });
            if (productReference) {
                console.log('✅ Tìm thấy Product reference:', {
                    _id: productReference._id,
                    name: productReference.productName
                });
            }
        }
        // PHƯƠNG PHÁP 2: Nếu không tìm thấy FoodProduct trực tiếp, thử tìm qua Product
        else {
            console.log('⚠️ Không tìm thấy FoodProduct trực tiếp, thử tìm qua Product...');
            // Tìm Product với ID được cung cấp
            productReference = yield Product_1.default.findById(req.params.id);
            if (productReference && productReference.type === 'food') {
                console.log('✅ Tìm thấy Product reference:', {
                    _id: productReference._id,
                    productId: productReference.productId,
                    name: productReference.productName
                });
                // Tìm FoodProduct thông qua productId
                foodProduct = yield FoodProduct_1.default.findById(productReference.productId);
                if (foodProduct) {
                    console.log('✅ Tìm thấy FoodProduct qua Product reference:', {
                        _id: foodProduct._id,
                        name: foodProduct.name
                    });
                }
                else {
                    console.error('❌ Không tìm thấy FoodProduct từ Product reference! ID không khớp hoặc đã bị xóa.');
                }
            }
            else {
                console.log('❌ Không tìm thấy Product với ID đã cung cấp hoặc không phải loại food');
            }
        }
        if (foodProduct) {
            // Return combined data
            res.json(Object.assign(Object.assign({}, foodProduct.toObject()), { productReference: productReference, 
                // Add information about which ID was used
                lookupInfo: {
                    requestedId: req.params.id,
                    foundDirectly: req.params.id === foodProduct._id.toString(),
                    viaProductReference: req.params.id !== foodProduct._id.toString()
                } }));
        }
        else {
            // Product not found - try to diagnose why
            console.error('❌ Food product not found with ID:', req.params.id);
            // Check if ANY food products exist in the database
            const count = yield FoodProduct_1.default.countDocuments();
            console.log(`📊 Total food products in database: ${count}`);
            // If there are products, show some samples for comparison
            if (count > 0) {
                const samples = yield FoodProduct_1.default.find().limit(3);
                console.log('📋 Sample FoodProduct IDs for comparison:');
                samples.forEach((sample, i) => {
                    console.log(`  FoodProduct ${i + 1}: ${sample._id} (${sample.name})`);
                });
                // Also show some Product references
                const productSamples = yield Product_1.default.find({ type: 'food' }).limit(3);
                console.log('📋 Sample Product IDs for comparison:');
                productSamples.forEach((sample, i) => {
                    console.log(`  Product ${i + 1}: ${sample._id} → references → ${sample.productId} (${sample.productName})`);
                });
            }
            // Return 404 with detailed message
            res.status(404).json({
                message: "Food product not found",
                error: "PRODUCT_NOT_FOUND",
                requestedId: req.params.id,
                totalProductsInDb: count,
                tip: "ID có thể là của FoodProduct hoặc của Product. Hãy đảm bảo sử dụng đúng ID."
            });
        }
    }
    catch (error) {
        console.error('❌ Error in getFoodProductById:', error);
        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
                error: "SERVER_ERROR"
            });
        }
        else {
            res.status(500).json({
                message: "Unknown error occurred",
                error: "SERVER_ERROR"
            });
        }
    }
});
exports.getFoodProductById = getFoodProductById;
// @desc    Create a new food product
// @route   POST /api/foodproducts
// @access  Private
const createFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('=== CREATE FOOD PRODUCT - DIRECT METHOD ===');
        // Get user ID from authenticated user or request body
        let userId;
        // If request comes from authenticated route
        if (req.user && req.user._id) {
            userId = req.user._id.toString();
            console.log('Using authenticated user ID:', userId);
        }
        // If request includes user ID in body
        else if (req.body.user) {
            // Validate the user ID format
            if (!mongoose_1.default.Types.ObjectId.isValid(req.body.user)) {
                console.error('Invalid user ID format in request body:', req.body.user);
                res.status(400).json({
                    message: "Invalid user ID format in request body",
                    error: "INVALID_USER_ID"
                });
                return;
            }
            userId = req.body.user;
            console.log('Using user ID from request body:', userId);
        }
        // No user ID available
        else {
            console.error('No user ID available');
            res.status(400).json({
                message: "User ID is required",
                error: "MISSING_USER_ID"
            });
            return;
        }
        // Extract the data from req.body directly
        const _b = req.body, { 
        // Required fields for Product reference
        manufacturerName, productName } = _b, 
        // Allow rest fields to pass through directly
        restFields = __rest(_b, ["manufacturerName", "productName"]);
        // Log the received data for debugging
        console.log('Direct create method - received data:', Object.assign(Object.assign({}, restFields), { user: userId, manufacturerName,
            productName }));
        // Process images - ensure it's always a non-empty array if there are uploads
        let processedImages = [];
        let mainImage = restFields.image;
        // Handle images array
        if (restFields.images) {
            if (Array.isArray(restFields.images)) {
                // Make a deep copy of the array and filter out empty strings
                processedImages = [...restFields.images].filter(img => img && img.trim() !== '');
                console.log(`Found ${processedImages.length} valid images in array`);
            }
            else if (typeof restFields.images === 'string' && restFields.images.trim() !== '') {
                // If it's a string, put it in an array
                processedImages = [restFields.images];
                console.log('Converted single image string to array');
            }
        }
        // Make sure main image is included in the processedImages array
        if (mainImage && mainImage.trim() !== '') {
            if (processedImages.indexOf(mainImage) === -1) {
                // If main image is not in the array, add it at the beginning
                processedImages.unshift(mainImage);
                console.log('Added main image to images array:', mainImage);
            }
            else if (processedImages.indexOf(mainImage) !== 0) {
                // If main image is in the array but not first, reorder to put it first
                processedImages = [
                    mainImage,
                    ...processedImages.filter(img => img !== mainImage)
                ];
                console.log('Moved main image to front of array:', mainImage);
            }
        }
        else if (processedImages.length > 0) {
            // If no main image specified but images array has items, use first one as main
            mainImage = processedImages[0];
            console.log('Using first image as main:', mainImage);
        }
        // Ensure images array is not empty if there's a main image
        if (mainImage && processedImages.length === 0) {
            processedImages = [mainImage];
            console.log('Created images array with main image:', mainImage);
        }
        // Chuẩn bị data cho Product reference
        const productData = {
            manufacturerName: restFields.manufacturer || manufacturerName,
            productName: productName || restFields.name,
        };
        // Prepare data for FoodProduct with proper field handling
        const foodProductData = Object.assign(Object.assign({}, restFields), { user: userId, image: mainImage, images: processedImages, 
            // Ensure type consistency for numeric fields
            minOrderQuantity: restFields.minOrderQuantity ? Number(restFields.minOrderQuantity) : undefined, dailyCapacity: restFields.dailyCapacity ? Number(restFields.dailyCapacity) : undefined, currentAvailable: restFields.currentAvailable ? Number(restFields.currentAvailable) : undefined, pricePerUnit: restFields.pricePerUnit ? Number(restFields.pricePerUnit) : undefined, price: restFields.price ? Number(restFields.price) : undefined, countInStock: restFields.countInStock ? Number(restFields.countInStock) : undefined, rating: restFields.rating ? Number(restFields.rating) : 0, numReviews: restFields.numReviews ? Number(restFields.numReviews) : 0 });
        // Log the data that will be saved
        console.log('Data to be saved directly to FoodProduct schema:', {
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
            imagesCount: ((_a = foodProductData.images) === null || _a === void 0 ? void 0 : _a.length) || 0
        });
        // Validate required fields
        const validation = validateFoodProductFields(foodProductData);
        if (!validation.valid) {
            console.error('Validation failed:', validation);
            res.status(400).json({
                message: "Invalid food product data",
                missingFields: validation.missingFields,
                validationErrors: validation.validationErrors
            });
            return;
        }
        // Create food product using static method - direct save without mapping
        const result = yield FoodProduct_1.default.createWithProduct(productData, foodProductData);
        console.log('✅ Food product created successfully with direct method:', {
            foodProduct: {
                _id: result.foodProduct._id,
                name: result.foodProduct.name
            }
        });
        res.status(201).json(result.foodProduct);
    }
    catch (error) {
        console.error('❌ Error in direct createFoodProduct:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.createFoodProduct = createFoodProduct;
// @desc    Update food product
// @route   PUT /api/foodproducts/:id
// @access  Private/Manufacturer
const updateFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('=== UPDATE FOOD PRODUCT - DIRECT METHOD ===');
        const { id } = req.params;
        // Validate the ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "Invalid product ID format",
                error: "INVALID_ID_FORMAT"
            });
            return;
        }
        // Extract fields from request body
        const _c = req.body, { manufacturer, manufacturerName, productName, user: _user, // Rename to avoid conflict with userId
        images, // Explicitly extract images array
        image } = _c, // Explicitly extract main image
        updateData = __rest(_c, ["manufacturer", "manufacturerName", "productName", "user", "images", "image"]);
        // Find the food product first to check if it exists
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (!foodProduct) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        // Log the array fields to check their format
        console.log('🔍 Image fields in request body:');
        console.log('- Main image:', image || 'undefined');
        console.log('- Images array:', images ?
            (Array.isArray(images) ? `Array with ${images.length} items` : `Not an array: ${typeof images}`)
            : 'undefined');
        // Process images - ensure proper synchronization
        let updatedImages = [];
        let updatedMainImage = image || foodProduct.image; // Default to existing if not provided
        // CASE 1: New images array provided
        if (images !== undefined) {
            if (Array.isArray(images)) {
                // Use the provided images array
                updatedImages = [...images].filter(img => img && img.trim() !== '');
            }
            else if (typeof images === 'string' && images.trim() !== '') {
                // Convert string to array
                updatedImages = [images];
            }
            else {
                // Empty or invalid input, use existing images
                updatedImages = foodProduct.images || [];
            }
        }
        // CASE 2: No new images array, but existing images
        else if (foodProduct.images && foodProduct.images.length > 0) {
            // Keep existing images
            updatedImages = [...foodProduct.images];
        }
        // Ensure main image is synchronized with images array
        if (updatedMainImage && updatedMainImage.trim() !== '') {
            if (updatedImages.length === 0) {
                // If images array is empty but we have a main image, create the array
                updatedImages = [updatedMainImage];
                console.log('🔄 Created images array from main image');
            }
            else if (!updatedImages.includes(updatedMainImage)) {
                // Add main image to beginning if not in array
                updatedImages.unshift(updatedMainImage);
                console.log('🔄 Added main image to front of images array');
            }
            else if (updatedImages[0] !== updatedMainImage) {
                // Move main image to front if not already there
                updatedImages = [
                    updatedMainImage,
                    ...updatedImages.filter(img => img !== updatedMainImage)
                ];
                console.log('🔄 Reordered images array to put main image first');
            }
        }
        else if (updatedImages.length > 0) {
            // No main image specified but images exist, use first as main
            updatedMainImage = updatedImages[0];
            console.log('🔄 Set main image from first item in images array');
        }
        // Update the data object with processed image fields
        updateData.image = updatedMainImage;
        updateData.images = updatedImages;
        // Process manufacturer field
        if (manufacturer || manufacturerName) {
            updateData.manufacturer = manufacturer || manufacturerName;
            updateData.brand = manufacturer || manufacturerName; // Ensure brand matches manufacturer
            // Also update the Product reference if manufacturer/product name changes
            const productReference = yield Product_1.default.findOne({
                type: 'food',
                productId: id
            });
            if (productReference) {
                const productUpdate = {};
                if (manufacturer || manufacturerName) {
                    productUpdate.manufacturerName = manufacturer || manufacturerName;
                }
                if (productName || updateData.name) {
                    productUpdate.productName = productName || updateData.name;
                }
                if (Object.keys(productUpdate).length > 0) {
                    yield Product_1.default.findByIdAndUpdate(productReference._id, productUpdate);
                    console.log('✅ Updated Product reference:', productUpdate);
                }
            }
        }
        // Process array fields to ensure they're arrays
        ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
            if (req.body[field] !== undefined) {
                // Convert to array if it's not already
                if (!Array.isArray(req.body[field])) {
                    if (typeof req.body[field] === 'string' && req.body[field].trim() !== '') {
                        updateData[field] = [req.body[field]];
                    }
                    else if (req.body[field] === null || req.body[field] === '') {
                        updateData[field] = [];
                    }
                }
                else {
                    // Make a copy of the array
                    updateData[field] = [...req.body[field]];
                }
            }
        });
        // Convert numeric fields
        ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit', 'price', 'countInStock'].forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = Number(updateData[field]);
            }
        });
        // Log the final update data
        console.log('Final update data:', {
            image: updateData.image,
            imageCount: ((_a = updateData.images) === null || _a === void 0 ? void 0 : _a.length) || 0,
            imageSample: ((_b = updateData.images) === null || _b === void 0 ? void 0 : _b.slice(0, 2)) || [],
            // Include other fields that were processed
            flavorType: updateData.flavorType || 'unchanged',
            ingredients: updateData.ingredients || 'unchanged',
            allergens: updateData.allergens || 'unchanged',
            usage: updateData.usage || 'unchanged'
        });
        // Update the product directly - no need for additional mapping
        const updatedProduct = yield FoodProduct_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        console.log('✅ Food product updated successfully with direct method');
        res.json(updatedProduct);
    }
    catch (error) {
        console.error('❌ Error in direct updateFoodProduct:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.updateFoodProduct = updateFoodProduct;
// @desc    Delete a food product
// @route   DELETE /api/food-products/:id
const deleteFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (!foodProduct) {
            return res.status(404).json({ message: 'Food product not found' });
        }
        // Delete associated images from S3 before deleting the product
        const imagesToDelete = [...(foodProduct.images || [])];
        if (foodProduct.image && !imagesToDelete.includes(foodProduct.image)) {
            imagesToDelete.push(foodProduct.image);
        }
        // Track deletion results
        const deletionResults = {};
        // Process each image for deletion
        for (const imageUrl of imagesToDelete) {
            try {
                // Extract key from URL
                const key = (0, s3Client_1.extractKeyFromUrl)(imageUrl);
                if (key) {
                    // Delete the object from S3
                    const isDeleted = yield (0, s3Client_1.deleteObjectFromS3)(key);
                    deletionResults[key] = isDeleted;
                }
                else {
                    console.warn(`Could not extract key from URL: ${imageUrl}`);
                }
            }
            catch (imgError) {
                console.error(`Error deleting image ${imageUrl}:`, imgError);
            }
        }
        // Delete the product from the database
        const deletedProduct = yield FoodProduct_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            message: 'Food product deleted successfully',
            deletedProduct,
            imagesDeleted: deletionResults
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
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
            data: categories,
            total: categories.length
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
// @desc    Get unique food types (thay vì product types)
// @route   GET /api/foodproducts/types
// @access  Public
const getProductTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foodTypes = yield FoodProduct_1.default.distinct('foodType');
        res.json({
            success: true,
            data: foodTypes,
            total: foodTypes.length
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
// @desc    Get unique manufacturers
// @route   GET /api/foodproducts/manufacturers
// @access  Public
const getManufacturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const manufacturers = yield FoodProduct_1.default.distinct('manufacturer');
        res.json({
            success: true,
            data: manufacturers,
            total: manufacturers.length
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
// @desc    Get unique food types (like Soy Sauce, Miso, etc.)
// @route   GET /api/foodproducts/foodtypes
// @access  Public
const getFoodTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foodTypes = yield FoodProduct_1.default.distinct('foodType');
        // Filter out any null/undefined values and sort alphabetically
        const cleanFoodTypes = foodTypes.filter(type => type && type.trim()).sort();
        res.json({
            success: true,
            data: cleanFoodTypes,
            total: cleanFoodTypes.length
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
exports.getFoodTypes = getFoodTypes;
// Utility function for validating food product fields
const validateFoodProductFields = (data, isUpdate = false) => {
    console.log('🔍 Validating food product fields. Is update?', isUpdate);
    // Initialize result object
    const result = {
        valid: true,
        missingFields: [],
        validationErrors: []
    };
    // Base required fields - these are always required
    const baseRequiredFields = ['name', 'category', 'manufacturer'];
    // For creation, require more fields
    // For updates, we only require the base fields to be present if they're included in the payload
    const requiredFields = isUpdate
        ? baseRequiredFields // Only basic fields required for updates
        : [
            ...baseRequiredFields,
            'originCountry',
            'packagingType',
            'packagingSize',
            'shelfLife',
            'storageInstruction',
            'minOrderQuantity',
            'dailyCapacity',
            'unitType',
            'pricePerUnit',
            'description',
            'foodType'
        ];
    // For updates, only validate fields that are present in the payload
    const fieldsToValidate = isUpdate
        ? requiredFields.filter(field => field in data)
        : requiredFields;
    console.log('🔍 Fields to validate:', fieldsToValidate);
    // Check for missing fields
    result.missingFields = fieldsToValidate.filter(field => {
        // Skip field if it's an update and the field isn't in the payload
        if (isUpdate && !(field in data)) {
            return false;
        }
        // Otherwise check if the field is missing
        return (data[field] === undefined ||
            data[field] === null ||
            (typeof data[field] === 'string' && data[field].trim() === ''));
    });
    // Check for invalid numeric fields
    const numericFields = ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'];
    numericFields.forEach(field => {
        // Only validate if the field is present
        if (field in data) {
            const value = Number(data[field]);
            if (isNaN(value)) {
                result.validationErrors.push(`${field} must be a valid number`);
            }
            else if (value < 0) {
                result.validationErrors.push(`${field} cannot be negative`);
            }
        }
    });
    // For update operations, if flavorType, ingredients, allergens, usage are provided
    // Ensure they are arrays or can be converted to arrays
    const arrayFields = ['flavorType', 'ingredients', 'allergens', 'usage'];
    arrayFields.forEach(field => {
        if (field in data) {
            // If not an array and not convertible to array, add validation error
            if (!Array.isArray(data[field]) &&
                !(typeof data[field] === 'string' && data[field].trim() !== '')) {
                result.validationErrors.push(`${field} must be a valid array or string`);
            }
        }
    });
    // Set validity based on missing fields and validation errors
    result.valid = result.missingFields.length === 0 && result.validationErrors.length === 0;
    console.log('🔍 Validation result:', {
        valid: result.valid,
        missingFields: result.missingFields,
        validationErrors: result.validationErrors
    });
    return result;
};
// @desc    Upload product images
// @route   POST /api/foodproducts/upload or /api/foodproducts/upload/multiple
// @access  Private
const uploadProductImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files || (req.file ? [req.file] : []);
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }
        // For EC2 deployment, construct URLs based on server URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileDetails = Array.isArray(files)
            ? files.map(file => ({
                filename: file.filename,
                path: file.path,
                url: `${baseUrl}/Storage/${file.filename}`
            }))
            : [{
                    filename: files.filename,
                    path: files.path,
                    url: `${baseUrl}/Storage/${files.filename}`
                }];
        console.log('Files uploaded successfully:', fileDetails);
        res.status(200).json({
            message: 'Files uploaded successfully',
            files: fileDetails
        });
    }
    catch (error) {
        console.error('Error uploading files:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Unknown error occurred' });
        }
    }
});
exports.uploadProductImages = uploadProductImages;
// @desc    Update product image
// @route   PUT /api/foodproducts/:id/image
// @access  Private
const updateProductImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        // Validate the ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "Invalid product ID format",
                error: "INVALID_ID_FORMAT"
            });
            return;
        }
        // Find the product
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (!foodProduct) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        // Construct the URL for the uploaded file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/Storage/${file.filename}`;
        // IMPORTANT: Preserve existing images
        let updatedImages = foodProduct.images || [];
        // Update the product with the new image URL as the main image
        foodProduct.image = imageUrl;
        // Add the new image to the front of the images array if it doesn't exist already
        if (!updatedImages.includes(imageUrl)) {
            // Put the new image at the beginning of the array as the main image
            updatedImages.unshift(imageUrl);
        }
        else {
            // If the image already exists in the array but isn't the first one,
            // move it to the front of the array
            if (updatedImages[0] !== imageUrl) {
                updatedImages = [
                    imageUrl,
                    ...updatedImages.filter(img => img !== imageUrl)
                ];
            }
        }
        // Update the images array
        foodProduct.images = updatedImages;
        // Save the updated product
        yield foodProduct.save();
        console.log('Product image updated successfully:', {
            productId: id,
            newImage: imageUrl,
            totalImages: foodProduct.images.length
        });
        res.status(200).json({
            message: 'Product image updated successfully',
            image: imageUrl,
            images: foodProduct.images
        });
    }
    catch (error) {
        console.error('Error updating product image:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Unknown error occurred' });
        }
    }
});
exports.updateProductImage = updateProductImage;
// @desc    Update product images
// @route   PUT /api/foodproducts/:id/images
// @access  Private
const updateProductImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { images, mainImage } = req.body;
        // Validate the ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "Invalid product ID format",
                error: "INVALID_ID_FORMAT"
            });
            return;
        }
        // Find the product
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (!foodProduct) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        // Validate images array
        if (!Array.isArray(images) || images.length === 0) {
            res.status(400).json({ message: 'Images must be a non-empty array' });
            return;
        }
        console.log('Updating product images:', {
            productId: id,
            providedImages: images,
            providedMainImage: mainImage,
            currentImages: foodProduct.images,
            currentMainImage: foodProduct.image
        });
        // Set main image - either from explicit mainImage parameter or use first image
        const newMainImage = mainImage || images[0];
        // Make sure the main image is included in the images array
        let updatedImages = [...images]; // Create a copy to avoid reference issues
        if (!updatedImages.includes(newMainImage)) {
            updatedImages.unshift(newMainImage);
            console.log('Main image not in array, adding it');
        }
        else if (updatedImages[0] !== newMainImage) {
            // Rearrange to ensure main image is first
            updatedImages = [
                newMainImage,
                ...updatedImages.filter(img => img !== newMainImage)
            ];
            console.log('Reordering images to ensure main image is first');
        }
        // Update the product with the new images array and main image
        foodProduct.images = updatedImages;
        foodProduct.image = newMainImage;
        yield foodProduct.save();
        console.log('Product images updated successfully:', {
            productId: id,
            totalImages: foodProduct.images.length,
            mainImage: foodProduct.image,
            imagesList: foodProduct.images
        });
        res.status(200).json({
            message: 'Product images updated successfully',
            image: foodProduct.image,
            images: foodProduct.images
        });
    }
    catch (error) {
        console.error('Error updating product images:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Unknown error occurred' });
        }
    }
});
exports.updateProductImages = updateProductImages;
// @desc    Delete product image from S3
// @route   DELETE /api/foodproducts/image
// @access  Protected
const deleteProductImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url, productId } = req.query;
        if (!url) {
            res.status(400).json({
                success: false,
                message: "Image URL is required"
            });
            return;
        }
        // Extract the key from the URL
        const imageKey = (0, s3Client_1.extractKeyFromUrl)(url);
        if (!imageKey) {
            res.status(400).json({
                success: false,
                message: "Could not extract image key from URL"
            });
            return;
        }
        // If productId is provided, verify user owns this product
        if (productId) {
            // Validate the ID format
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid product ID format"
                });
                return;
            }
            // Find the product to verify ownership
            const product = yield FoodProduct_1.default.findById(productId);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
                return;
            }
            // Check if user is the owner (only if user ID is attached to the product)
            if (product.user && req.user && product.user.toString() !== req.user._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this image"
                });
                return;
            }
            // Update product to remove this image from the array
            if (product.image === url) {
                // If it's the main image, clear it
                product.image = '';
            }
            // If the product has an images array, remove the URL from it
            if (product.images && Array.isArray(product.images)) {
                product.images = product.images.filter(img => img !== url);
            }
            // Save the product
            yield product.save();
        }
        // Delete the image from S3
        const deleted = yield (0, s3Client_1.deleteObjectFromS3)(imageKey);
        if (deleted) {
            res.status(200).json({
                success: true,
                message: "Image deleted successfully"
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Failed to delete image from storage"
            });
        }
    }
    catch (error) {
        console.error("Error deleting product image:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "An unknown error occurred"
        });
    }
});
exports.deleteProductImage = deleteProductImage;
