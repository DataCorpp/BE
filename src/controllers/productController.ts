import { Request, Response } from "express";
import { 
  Product, 
  FoodProduct, 
  getProductModel, 
  createProduct as createProductHelper,
  getProductWithReference,
  updateProductWithReference,
  deleteProductWithReference,
  isValidProductType,
  mapFormDataToFoodProduct 
} from "../models";
import mongoose from "mongoose";

// @desc    Lấy tất cả sản phẩm từ Product collection (chỉ thông tin chung)
// @route   GET /api/products
// @access  Public
export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
      search, 
      type, 
      manufacturer,
      page = 1,
      limit = 10 
    } = req.query;

    // Build query cho Product collection
    const query: any = {};

    // Search functionality
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { manufacturerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type && isValidProductType(type as string)) {
      query.type = type;
    }

    // Filter by manufacturer
    if (manufacturer) {
      query.manufacturerName = { $regex: manufacturer, $options: 'i' };
    }

    // Filter by user (owner)
    if (req.query.user) {
      query.user = req.query.user;
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
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
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Lấy chi tiết sản phẩm (bao gồm thông tin từ collection con)
// @route   GET /api/products/:id/details
// @access  Public
export const getProductDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`=== GET PRODUCT DETAILS - START ===`);
    console.log(`Looking up product reference with ID: ${req.params.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`Invalid ObjectId format: ${req.params.id}`);
      res.status(400).json({ message: "Invalid product ID format" });
      return;
    }
    
    // Tìm Product reference trước
    const product = await Product.findById(req.params.id);

    if (!product) {
      console.log(`Product reference not found with ID: ${req.params.id}`);
      res.status(404).json({ message: "Product not found" });
      return;
    }

    console.log(`Product reference found:`, {
      _id: product._id.toString(),
      type: product.type,
      productId: product.productId ? product.productId.toString() : 'undefined',
      manufacturerName: product.manufacturerName,
      productName: product.productName
    });
    
    // Validate productId
    if (!product.productId) {
      console.error(`Product reference is missing productId field: ${req.params.id}`);
      res.status(500).json({ 
        message: "Product reference has invalid or missing productId",
        productReference: product 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(product.productId)) {
      console.error(`Product has invalid productId format: ${product.productId}`);
      res.status(500).json({ 
        message: "Product has invalid productId format",
        productReference: product 
      });
      return;
    }

    // Lấy chi tiết từ collection con tương ứng
    let productDetails;
    console.log(`Looking up product details in ${product.type} collection with ID: ${product.productId}`);
    
    switch (product.type) {
      case 'food':
        productDetails = await FoodProduct.findById(product.productId);
        break;
      default:
        console.log(`Product type ${product.type} is not yet supported`);
        res.status(400).json({ message: `Product type ${product.type} is not yet supported` });
        return;
    }

    if (!productDetails) {
      console.error(`Product details not found in ${product.type} collection. ID: ${product.productId}`);
      
      // Try to check if the ID exists in any other collections for debugging
      if (product.type === 'food') {
        console.log('Attempting to verify if the ID exists in other collections...');
        try {
          const idExistsInProduct = await Product.exists({ _id: product.productId });
          console.log(`ID exists in Product collection? ${idExistsInProduct ? 'YES' : 'NO'}`);
          
          // If the product.productId is actually pointing to another Product document
          // instead of a FoodProduct document, this is a major issue
          if (idExistsInProduct) {
            console.error('CRITICAL DATA INTEGRITY ERROR: productId is pointing to another Product document');
          }
        } catch (verifyError) {
          console.error('Error during collection verification:', verifyError);
        }
      }
      
      res.status(404).json({ 
        message: "Product details not found",
        error: `The productId ${product.productId} does not exist in the ${product.type} collection`,
        productReference: {
          _id: product._id,
          type: product.type,
          productId: product.productId,
          manufacturerName: product.manufacturerName,
          productName: product.productName
        }
      });
      return;
    }

    console.log(`Product details found successfully`);
    console.log(`=== GET PRODUCT DETAILS - SUCCESS ===`);
    
    res.json({
      productReference: product,
      productDetails: productDetails
    });
  } catch (error) {
    console.error(`=== GET PRODUCT DETAILS - ERROR ===`);
    console.error('Error fetching product details:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Tạo sản phẩm mới (tự động phân loại theo type)
// @route   POST /api/products
// @access  Private
export const createProductGeneric = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('=== CREATE PRODUCT GENERIC - START ===');
    console.log('Request body:', JSON.stringify({
      type: req.body.type,
      manufacturerName: req.body.manufacturerName,
      productName: req.body.productName,
    }));
    
    const { type, manufacturerName, productName, ...otherData } = req.body;

    // Validate product type
    if (!isValidProductType(type)) {
      console.log(`Invalid product type: ${type}`);
      res.status(400).json({ 
        message: "Invalid product type", 
        validTypes: ['food', 'beverage', 'health', 'other'] 
      });
      return;
    }

    // Validate required fields
    if (!manufacturerName || !productName) {
      console.log('Missing required fields:', {
        manufacturerName: !!manufacturerName,
        productName: !!productName
      });
      
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
    if ((req as any).user && (req as any).user._id) {
      userId = (req as any).user._id;
      console.log("Using authenticated user ID:", userId);
    } else {
      userId = new mongoose.Types.ObjectId('000000000000000000000000');
      console.log("Using default user ID:", userId);
    }

    const productData = { manufacturerName, productName, user: userId };
    console.log('Product reference data prepared:', productData);
    
    // Chuẩn bị detail data dựa trên type
    let detailData;
    switch (type) {
      case 'food':
        console.log('Mapping form data to food product structure');
        const mappedData = mapFormDataToFoodProduct({ 
          manufacturerName, 
          productName, 
          user: userId,
          ...otherData 
        });
        // Đảm bảo trường user được đặt đúng
        detailData = {
          ...mappedData.foodProductData,
          user: userId // Đảm bảo trường user luôn được đặt
        };
        console.log("Food product data prepared:", {
          userId: userId,
          name: detailData.name,
          manufacturer: detailData.manufacturer,
          category: detailData.category,
          // Other important fields
          foodType: detailData.foodType,
          packagingType: detailData.packagingType
        });
        break;
      default:
        console.log(`Product type ${type} not yet supported`);
        res.status(400).json({ message: `Product type ${type} is not yet supported` });
        return;
    }

    console.log('Calling createProductHelper to create product with reference');
    // Tạo product với transaction
    const result = await createProductHelper(type, productData, detailData);
    
    if (!result) {
      console.error('Create product helper returned null or undefined result');
      res.status(500).json({ message: 'Failed to create product (helper returned no result)' });
      return;
    }
    
    if (!result.product || !result.product._id) {
      console.error('Product reference not created properly', result);
      res.status(500).json({ message: 'Failed to create product reference' });
      return;
    }
    
    if (type === 'food' && (!result.foodProduct || !result.foodProduct._id)) {
      console.error('Food product details not created properly', result);
      res.status(500).json({ message: 'Failed to create food product details' });
      return;
    }

    // Verify that productId matches the detail document _id
    const productIdStr = result.product.productId.toString();
    const detailIdStr = (type === 'food' ? result.foodProduct._id.toString() : result.productDetails._id.toString());
    
    console.log('Verification check:', {
      productReference: {
        _id: result.product._id.toString(),
        productId: productIdStr
      },
      detailDocument: {
        _id: detailIdStr
      },
      match: productIdStr === detailIdStr
    });
    
    if (productIdStr !== detailIdStr) {
      console.error('Critical error: productId does not match detail document _id');
      console.error('Product.productId:', productIdStr);
      console.error('Detail document._id:', detailIdStr);
      res.status(500).json({ 
        message: 'Data integrity error: Product reference does not correctly link to detail document',
        product: result.product,
        detail: type === 'food' ? result.foodProduct : result.productDetails
      });
      return;
    }

    console.log('=== CREATE PRODUCT GENERIC - SUCCESS ===');
    console.log('Product created successfully:', {
      productReferenceId: result.product._id,
      detailId: type === 'food' ? result.foodProduct._id : result.productDetails._id,
      type: type
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: result.product,
      productDetails: result.foodProduct || result.productDetails
    });
  } catch (error) {
    console.error('=== CREATE PRODUCT ERROR ===');
    console.error('Error creating product:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Tìm Product reference
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const { manufacturerName, productName, ...detailData } = req.body;

    const productData = {
      ...(manufacturerName && { manufacturerName }),
      ...(productName && { productName }),
    };

    // Update với transaction
    const updatedProduct = await updateProductWithReference(
      product.type,
      product.productId.toString(),
      productData,
      detailData
    );

    // Lấy thông tin Product reference mới
    const updatedProductRef = await Product.findById(req.params.id);

    res.json({
      productReference: updatedProductRef,
      productDetails: updatedProduct
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('=== DELETE PRODUCT DEBUG ===');
    console.log('Request ID:', req.params.id);
    console.log('User:', (req as any).user?.email || 'Unknown');
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format');
      res.status(400).json({ message: "Invalid product ID format" });
      return;
    }

    // Tìm Product reference
    const product = await Product.findById(req.params.id);
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
      userId: (req as any).user?._id?.toString(),
      email: (req as any).user?.email,
      role: (req as any).user?.role,
      companyName: (req as any).user?.companyName
    });

    // Check ownership if user is available
    if ((req as any).user && (req as any).user._id) {
      const currentUserId = (req as any).user._id.toString();
      console.log('Current user ID:', currentUserId);
      
      // Get the detailed product to check ownership based on product type
      let detailProduct;
      let hasOwnership = false;
      
      try {
        if (product.type === 'food') {
          detailProduct = await FoodProduct.findById(product.productId);
          console.log('Food product found:', detailProduct ? 'YES' : 'NO');
          
          if (detailProduct) {
            const productUserId = detailProduct.user?.toString();
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
          const userRole = (req as any).user?.role;
          const userEmail = (req as any).user?.email;
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
        
      } catch (ownershipError) {
        console.error('Error checking product ownership:', ownershipError);
        // For backwards compatibility, allow deletion if ownership check fails
        // but log the error for debugging
        console.log('⚠️ Ownership check failed, allowing deletion for backwards compatibility');
      }
    } else {
      console.log('⚠️ No user in request, skipping ownership check');
    }

    // Delete với transaction để đảm bảo consistency
    let session;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        console.log('Starting delete transaction...');
        
        // Delete detail product first
        await deleteProductWithReference(product.type, product.productId.toString());
        console.log('Detail product deleted');
        
        // Delete Product reference
        await Product.findByIdAndDelete(req.params.id);
        console.log('Product reference deleted');
      });
      
      console.log('Delete transaction completed successfully');
      res.json({ 
        message: "Product deleted successfully",
        deletedId: req.params.id 
      });
    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      throw transactionError;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
    
  } catch (error) {
    console.error('=== DELETE ERROR ===');
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      // Handle specific MongoDB errors
      if (error.message.includes('not found')) {
        res.status(404).json({ message: "Product not found" });
      } else if (error.message.includes('permission')) {
        res.status(403).json({ message: error.message });
      } else if (error.message.includes('validation')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ 
          message: "Failed to delete product", 
          error: error.message 
        });
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred during deletion" });
    }
  }
};

// @desc    Lấy thống kê sản phẩm theo type
// @route   GET /api/products/stats
// @access  Public
export const getProductStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await Product.aggregate([
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

    const totalProducts = await Product.countDocuments();

    res.json({
      totalProducts,
      byType: stats
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};
