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
exports.updateProductImages = exports.updateProductImage = exports.uploadProductImages = exports.getFoodTypes = exports.getManufacturers = exports.getProductTypes = exports.getCategories = exports.deleteFoodProduct = exports.updateFoodProduct = exports.createFoodProduct = exports.getFoodProductById = exports.getFoodProducts = void 0;
const FoodProduct_1 = __importDefault(require("../models/FoodProduct"));
const Product_1 = __importDefault(require("../models/Product"));
const mongoose_1 = __importDefault(require("mongoose"));
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
    var _a, _b;
    try {
        console.log('=== CREATE FOOD PRODUCT ===');
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
        const _c = req.body, { 
        // Product reference data
        manufacturerName, productName, 
        // FoodProduct data
        name, brand, category, description, image, price, countInStock, manufacturer, originCountry, manufacturerRegion, minOrderQuantity, dailyCapacity, currentAvailable, unitType, pricePerUnit, priceCurrency, leadTime, leadTimeUnit, sustainable, foodType, flavorType, ingredients, allergens, usage, packagingType, packagingSize, shelfLife, shelfLifeStartDate, shelfLifeEndDate, storageInstruction, images, // Add the images array field
        // Remove user from the destructured fields since we handle it separately
        user: _user } = _c, // Rename to avoid conflict
        restFields = __rest(_c, ["manufacturerName", "productName", "name", "brand", "category", "description", "image", "price", "countInStock", "manufacturer", "originCountry", "manufacturerRegion", "minOrderQuantity", "dailyCapacity", "currentAvailable", "unitType", "pricePerUnit", "priceCurrency", "leadTime", "leadTimeUnit", "sustainable", "foodType", "flavorType", "ingredients", "allergens", "usage", "packagingType", "packagingSize", "shelfLife", "shelfLifeStartDate", "shelfLifeEndDate", "storageInstruction", "images", "user"]);
        // Log the images array to verify its format
        console.log('Images field in request:', {
            images: images ? (Array.isArray(images) ? `Array with ${images.length} items` : 'Not an array') : 'undefined',
            image: image || 'undefined'
        });
        if (images) {
            console.log('First few images:', Array.isArray(images) ? images.slice(0, 3) : images);
        }
        // Process images - ensure it's always an array
        let processedImages = [];
        if (images) {
            if (Array.isArray(images)) {
                // Make a deep copy of the array
                processedImages = [...images];
                console.log(`Found ${processedImages.length} images in array`);
            }
            else if (typeof images === 'string') {
                // If it's a string, put it in an array
                processedImages = [images];
                console.log('Converted single image string to array');
            }
        }
        // Make sure main image is included in the processedImages array
        if (image && processedImages.indexOf(image) === -1) {
            processedImages.unshift(image);
            console.log('Added main image to images array:', image);
        }
        else if (image && processedImages.indexOf(image) !== 0) {
            // Reorder to put main image first
            processedImages = [
                image,
                ...processedImages.filter(img => img !== image)
            ];
            console.log('Moved main image to front of array:', image);
        }
        else if (!image && processedImages.length > 0) {
            // Use first image as main if not specified
            console.log('Using first image as main:', processedImages[0]);
        }
        // Chuẩn bị data cho Product reference
        const productData = {
            manufacturerName: manufacturer || manufacturerName,
            productName: productName || name,
        };
        // Prepare data for FoodProduct with proper field validation
        const foodProductData = Object.assign({ user: userId, name: name !== null && name !== void 0 ? name : productName, brand: (_a = brand !== null && brand !== void 0 ? brand : manufacturer) !== null && _a !== void 0 ? _a : manufacturerName, category: category !== null && category !== void 0 ? category : 'Other', description: description !== null && description !== void 0 ? description : 'No description provided', image: image !== null && image !== void 0 ? image : (processedImages.length > 0 ? processedImages[0] : 'https://via.placeholder.com/300x300?text=No+Image'), images: processedImages, price: Number(price !== null && price !== void 0 ? price : pricePerUnit) || 0, countInStock: Number(countInStock !== null && countInStock !== void 0 ? countInStock : currentAvailable) || 0, rating: 0, numReviews: 0, 
            // Food-specific fields - DO NOT set default values for these fields
            manufacturer: manufacturer !== null && manufacturer !== void 0 ? manufacturer : manufacturerName, originCountry: originCountry !== null && originCountry !== void 0 ? originCountry : 'Unknown', manufacturerRegion: manufacturerRegion, minOrderQuantity: Number(minOrderQuantity) || 1, dailyCapacity: Number(dailyCapacity) || 100, currentAvailable: Number(currentAvailable) || 0, unitType: unitType !== null && unitType !== void 0 ? unitType : 'units', pricePerUnit: Number(pricePerUnit) || 0, priceCurrency: priceCurrency !== null && priceCurrency !== void 0 ? priceCurrency : 'USD', leadTime: leadTime !== null && leadTime !== void 0 ? leadTime : '1-2', leadTimeUnit: leadTimeUnit !== null && leadTimeUnit !== void 0 ? leadTimeUnit : 'weeks', sustainable: Boolean(sustainable), 
            // CRITICAL: Pass these fields exactly as received without any transformation or defaults
            foodType,
            packagingType,
            packagingSize,
            shelfLife,
            storageInstruction, 
            // Array fields - preserve exactly as received
            flavorType: Array.isArray(flavorType) ? flavorType : (flavorType ? [flavorType] : []), ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? [ingredients] : []), allergens: Array.isArray(allergens) ? allergens : (allergens ? [allergens] : []), usage: Array.isArray(usage) ? usage : (usage ? [usage] : []), 
            // Dates
            shelfLifeStartDate: shelfLifeStartDate ? new Date(shelfLifeStartDate) : undefined, shelfLifeEndDate: shelfLifeEndDate ? new Date(shelfLifeEndDate) : undefined }, restFields);
        // Log the request body and processed data for debugging
        console.log('Request body:', req.body);
        console.log('Processed food product data:', {
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
        // Create food product using static method
        const result = yield FoodProduct_1.default.createWithProduct(productData, foodProductData);
        console.log('Food product created successfully:', {
            foodProduct: {
                _id: result.foodProduct._id,
                name: result.foodProduct.name,
                manufacturer: result.foodProduct.manufacturer
            },
            product: {
                _id: result.product._id,
                manufacturerName: result.product.manufacturerName,
                productName: result.product.productName
            }
        });
        // IMPORTANT: Verify the data was saved correctly by fetching it directly from MongoDB
        const savedFoodProduct = yield FoodProduct_1.default.findById(result.foodProduct._id);
        console.log('=== VERIFICATION: DATA SAVED TO MONGODB ===');
        console.log('Actual data in MongoDB after save:', {
            foodType: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.foodType,
            packagingType: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.packagingType,
            packagingSize: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.packagingSize,
            shelfLife: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.shelfLife,
            storageInstruction: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.storageInstruction,
            flavorType: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.flavorType,
            ingredients: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.ingredients,
            allergens: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.allergens,
            usage: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.usage,
            image: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.image,
            images: savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.images,
            imagesCount: ((_b = savedFoodProduct === null || savedFoodProduct === void 0 ? void 0 : savedFoodProduct.images) === null || _b === void 0 ? void 0 : _b.length) || 0
        });
        res.status(201).json(result.foodProduct);
    }
    catch (error) {
        console.error('Error creating food product:', error);
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
        const { id } = req.params;
        // Validate the ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "Invalid product ID format",
                error: "INVALID_ID_FORMAT"
            });
            return;
        }
        // Extract manufacturer field from request body
        const _c = req.body, { manufacturer, manufacturerName, // Accept both for backward compatibility
        user: _user, // Rename to avoid conflict with userId
        images, // Explicitly extract images array
        image } = _c, // Explicitly extract main image
        updateData = __rest(_c, ["manufacturer", "manufacturerName", "user", "images", "image"]);
        // Log the array fields to check their format
        console.log('🔍 Array fields in request body:');
        console.log('- Images:', images ? `[${images.length} items]` : 'undefined');
        if (images)
            console.log('- First few images:', images.slice(0, 3));
        // Validate the images array if provided
        if (images !== undefined) {
            if (!Array.isArray(images)) {
                console.warn(`⚠️ Images field is not an array, converting to array: ${images}`);
                updateData.images = [images].filter(Boolean);
            }
            else {
                // Make a deep copy of the images array to avoid reference issues
                updateData.images = [...images];
                console.log(`✓ Images array validated [${updateData.images.length} items]`);
            }
            // If main image is provided, ensure it's in the images array
            if (image && !updateData.images.includes(image)) {
                console.log('🔄 Adding main image to images array:', image);
                updateData.images.unshift(image);
            }
            else if (image && updateData.images[0] !== image) {
                console.log('🔄 Moving main image to front of images array:', image);
                updateData.images = [
                    image,
                    ...updateData.images.filter(img => img !== image)
                ];
            }
            else if (!image && updateData.images.length > 0) {
                console.log('🔄 Setting main image from images array:', updateData.images[0]);
                updateData.image = updateData.images[0];
            }
        }
        else if (image) {
            // If only main image is provided, set images array to contain just that image
            updateData.images = [image];
            console.log('🔄 Created images array from main image:', updateData.images);
        }
        // Process manufacturer field - Both might be present in API calls
        let manufacturerValue = manufacturer || manufacturerName;
        if (manufacturerValue) {
            updateData.manufacturer = manufacturerValue;
            updateData.brand = manufacturerValue; // Ensure brand is updated to match manufacturer
        }
        // Find the product
        const foodProduct = yield FoodProduct_1.default.findById(id);
        if (!foodProduct) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        // Handle array fields
        ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
            if (req.body[field] !== undefined) {
                // Convert value to array if it isn't already
                if (!Array.isArray(req.body[field])) {
                    console.log(`Converting ${field} to array:`, req.body[field]);
                    if (typeof req.body[field] === 'string' && req.body[field].trim()) {
                        updateData[field] = [req.body[field]];
                    }
                    else if (req.body[field] === null || req.body[field] === '') {
                        updateData[field] = [];
                    }
                }
                else {
                    // Make a copy to avoid reference issues
                    updateData[field] = [...req.body[field]];
                }
            }
        });
        // Debug log the final update data
        console.log('Final update data:', {
            images: updateData.images ? updateData.images.length : 'unchanged',
            image: updateData.image || 'unchanged',
            flavorType: updateData.flavorType || 'unchanged',
            ingredients: updateData.ingredients || 'unchanged',
            allergens: updateData.allergens || 'unchanged',
            usage: updateData.usage || 'unchanged'
        });
        // Update the product with { new: true } to return updated document
        // Using findByIdAndUpdate with runValidators to ensure schema validation
        const updatedProduct = yield FoodProduct_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        // Verify that the update was successful by checking the field values
        console.log('Verification after update:', {
            images: ((_a = updatedProduct === null || updatedProduct === void 0 ? void 0 : updatedProduct.images) === null || _a === void 0 ? void 0 : _a.length) || 0,
            imagesSample: ((_b = updatedProduct === null || updatedProduct === void 0 ? void 0 : updatedProduct.images) === null || _b === void 0 ? void 0 : _b.slice(0, 3)) || []
        });
        res.json(updatedProduct);
    }
    catch (error) {
        console.error('Error updating food product:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.updateFoodProduct = updateFoodProduct;
// @desc    Xóa sản phẩm thực phẩm
// @route   DELETE /api/foodproducts/:id
// @access  Private/Manufacturer
const deleteFoodProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Sử dụng static method deleteWithProduct
        const deletedFoodProduct = yield FoodProduct_1.default.deleteWithProduct(req.params.id);
        if (deletedFoodProduct) {
            res.json({ message: "Food product deleted successfully" });
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
            res.status(500).json({ message: "Unknown error occurred" });
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
            'image',
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
