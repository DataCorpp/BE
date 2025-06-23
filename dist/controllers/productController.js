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
exports.getProductStats = exports.deleteProduct = exports.updateProduct = exports.createProductGeneric = exports.getProductDetails = exports.getProducts = void 0;
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Lấy tất cả sản phẩm từ Product collection (chỉ thông tin chung)
// @route   GET /api/products
// @access  Public
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, type, manufacturer, page = 1, limit = 10 } = req.query;
        // Build query cho Product collection
        const query = {};
        // Search functionality
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { manufacturerName: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter by type
        if (type && (0, models_1.isValidProductType)(type)) {
            query.type = type;
        }
        // Filter by manufacturer
        if (manufacturer) {
            query.manufacturerName = { $regex: manufacturer, $options: 'i' };
        }
        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        const totalCount = yield models_1.Product.countDocuments(query);
        const products = yield models_1.Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        console.log(`[SERVER] Fetched ${products.length} products`);
        res.json({
            products,
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
exports.getProducts = getProducts;
// @desc    Lấy chi tiết sản phẩm (bao gồm thông tin từ collection con)
// @route   GET /api/products/:id/details
// @access  Public
const getProductDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tìm Product reference trước
        const product = yield models_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        // Lấy chi tiết từ collection con tương ứng
        let productDetails;
        switch (product.type) {
            case 'food':
                productDetails = yield models_1.FoodProduct.findById(product.productId);
                break;
            default:
                res.status(400).json({ message: `Product type ${product.type} is not yet supported` });
                return;
        }
        if (!productDetails) {
            res.status(404).json({ message: "Product details not found" });
            return;
        }
        res.json({
            productReference: product,
            productDetails: productDetails
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
exports.getProductDetails = getProductDetails;
// @desc    Tạo sản phẩm mới (tự động phân loại theo type)
// @route   POST /api/products
// @access  Private
const createProductGeneric = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { type, manufacturerName, productName } = _a, otherData = __rest(_a, ["type", "manufacturerName", "productName"]);
        // Validate product type
        if (!(0, models_1.isValidProductType)(type)) {
            res.status(400).json({
                message: "Invalid product type",
                validTypes: ['food', 'beverage', 'health', 'other']
            });
            return;
        }
        // Validate required fields
        if (!manufacturerName || !productName) {
            res.status(400).json({
                message: 'Manufacturer name and product name are required',
                missingFields: [
                    ...(manufacturerName ? [] : ['manufacturerName']),
                    ...(productName ? [] : ['productName'])
                ]
            });
            return;
        }
        // Lấy user ID
        let userId;
        if (req.user && req.user._id) {
            userId = req.user._id;
            console.log("Using authenticated user ID:", userId);
        }
        else {
            userId = new mongoose_1.default.Types.ObjectId('000000000000000000000000');
            console.log("Using default user ID:", userId);
        }
        const productData = { manufacturerName, productName };
        // Chuẩn bị detail data dựa trên type
        let detailData;
        switch (type) {
            case 'food':
                const mappedData = (0, models_1.mapFormDataToFoodProduct)(Object.assign({ manufacturerName,
                    productName, user: userId }, otherData));
                // Đảm bảo trường user được đặt đúng
                detailData = Object.assign(Object.assign({}, mappedData.foodProductData), { user: userId // Đảm bảo trường user luôn được đặt
                 });
                console.log("Food product data with user:", {
                    userId: userId,
                    name: detailData.name,
                    manufacturer: detailData.manufacturer
                });
                break;
            default:
                res.status(400).json({ message: `Product type ${type} is not yet supported` });
                return;
        }
        // Tạo product với transaction
        const result = yield (0, models_1.createProduct)(type, productData, detailData);
        res.status(201).json({
            message: 'Product created successfully',
            product: result.product,
            productDetails: result.foodProduct || result.productDetails
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "Unknown error occurred" });
        }
    }
});
exports.createProductGeneric = createProductGeneric;
// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tìm Product reference
        const product = yield models_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        const _a = req.body, { manufacturerName, productName } = _a, detailData = __rest(_a, ["manufacturerName", "productName"]);
        const productData = Object.assign(Object.assign({}, (manufacturerName && { manufacturerName })), (productName && { productName }));
        // Update với transaction
        const updatedProduct = yield (0, models_1.updateProductWithReference)(product.type, product.productId.toString(), productData, detailData);
        // Lấy thông tin Product reference mới
        const updatedProductRef = yield models_1.Product.findById(req.params.id);
        res.json({
            productReference: updatedProductRef,
            productDetails: updatedProduct
        });
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
exports.updateProduct = updateProduct;
// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        console.log('=== DELETE PRODUCT DEBUG ===');
        console.log('Request ID:', req.params.id);
        console.log('User:', ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || 'Unknown');
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            console.log('Invalid ObjectId format');
            res.status(400).json({ message: "Invalid product ID format" });
            return;
        }
        // Tìm Product reference
        const product = yield models_1.Product.findById(req.params.id);
        console.log('Product found:', product ? 'YES' : 'NO');
        if (!product) {
            console.log('Product not found in database');
            res.status(404).json({ message: "Product not found" });
            return;
        }
        console.log('Product details:', {
            type: product.type,
            productId: product.productId,
            manufacturerName: product.manufacturerName,
            productName: product.productName
        });
        console.log('Request user details:', {
            userId: (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString(),
            email: (_d = req.user) === null || _d === void 0 ? void 0 : _d.email,
            role: (_e = req.user) === null || _e === void 0 ? void 0 : _e.role,
            companyName: (_f = req.user) === null || _f === void 0 ? void 0 : _f.companyName
        });
        // Check ownership if user is available
        if (req.user && req.user._id) {
            const currentUserId = req.user._id.toString();
            console.log('Current user ID:', currentUserId);
            // Get the detailed product to check ownership based on product type
            let detailProduct;
            let hasOwnership = false;
            try {
                if (product.type === 'food') {
                    detailProduct = yield models_1.FoodProduct.findById(product.productId);
                    console.log('Food product found:', detailProduct ? 'YES' : 'NO');
                    if (detailProduct) {
                        const productUserId = (_g = detailProduct.user) === null || _g === void 0 ? void 0 : _g.toString();
                        console.log('Product user ID:', productUserId);
                        hasOwnership = productUserId === currentUserId;
                        console.log('Food product ownership check:', hasOwnership);
                    }
                }
                // TODO: Add ownership checks for other product types (beverage, health, etc.)
                // For now, allow deletion of non-food products for backwards compatibility
                else {
                    console.log('Non-food product type, allowing deletion for backwards compatibility');
                    hasOwnership = true;
                }
                // Additional fallback: If no detailed product found or ownership check failed
                if (!hasOwnership) {
                    const userRole = (_h = req.user) === null || _h === void 0 ? void 0 : _h.role;
                    const userEmail = (_j = req.user) === null || _j === void 0 ? void 0 : _j.email;
                    console.log('Attempting role-based access check:');
                    console.log('- User role:', userRole);
                    console.log('- User email:', userEmail);
                    // Allow deletion for admin users
                    if (userRole === 'admin') {
                        console.log('✅ Admin user, allowing deletion');
                        hasOwnership = true;
                    }
                    // Allow deletion for manufacturer users (they can delete their own products)
                    else if (userRole === 'manufacturer') {
                        console.log('✅ Manufacturer user, allowing deletion');
                        hasOwnership = true;
                    }
                    // Allow deletion for specific email domains (temporary workaround)
                    else if (userEmail && (userEmail.includes('admin') || userEmail.includes('test'))) {
                        console.log('✅ Test/admin email, allowing deletion');
                        hasOwnership = true;
                    }
                }
                if (!hasOwnership) {
                    console.log('User does not own this product and has no admin privileges');
                    res.status(403).json({ message: "You don't have permission to delete this product" });
                    return;
                }
                console.log('✅ Ownership check passed');
            }
            catch (ownershipError) {
                console.error('Error checking product ownership:', ownershipError);
                // For backwards compatibility, allow deletion if ownership check fails
                // but log the error for debugging
                console.log('⚠️ Ownership check failed, allowing deletion for backwards compatibility');
            }
        }
        else {
            console.log('⚠️ No user in request, skipping ownership check');
        }
        // Delete với transaction để đảm bảo consistency
        let session;
        try {
            session = yield mongoose_1.default.startSession();
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                console.log('Starting delete transaction...');
                // Delete detail product first
                yield (0, models_1.deleteProductWithReference)(product.type, product.productId.toString());
                console.log('Detail product deleted');
                // Delete Product reference
                yield models_1.Product.findByIdAndDelete(req.params.id);
                console.log('Product reference deleted');
            }));
            console.log('Delete transaction completed successfully');
            res.json({
                message: "Product deleted successfully",
                deletedId: req.params.id
            });
        }
        catch (transactionError) {
            console.error('Transaction error:', transactionError);
            throw transactionError;
        }
        finally {
            if (session) {
                yield session.endSession();
            }
        }
    }
    catch (error) {
        console.error('=== DELETE ERROR ===');
        console.error('Error details:', error);
        if (error instanceof Error) {
            // Handle specific MongoDB errors
            if (error.message.includes('not found')) {
                res.status(404).json({ message: "Product not found" });
            }
            else if (error.message.includes('permission')) {
                res.status(403).json({ message: error.message });
            }
            else if (error.message.includes('validation')) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({
                    message: "Failed to delete product",
                    error: error.message
                });
            }
        }
        else {
            res.status(500).json({ message: "Unknown error occurred during deletion" });
        }
    }
});
exports.deleteProduct = deleteProduct;
// @desc    Lấy thống kê sản phẩm theo type
// @route   GET /api/products/stats
// @access  Public
const getProductStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield models_1.Product.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        const totalProducts = yield models_1.Product.countDocuments();
        res.json({
            totalProducts,
            byType: stats
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
exports.getProductStats = getProductStats;
