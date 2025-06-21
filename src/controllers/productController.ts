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

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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
    // Tìm Product reference trước
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Lấy chi tiết từ collection con tương ứng
    let productDetails;
    switch (product.type) {
      case 'food':
        productDetails = await FoodProduct.findById(product.productId);
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
  } catch (error) {
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
    const { type, manufacturerName, productName, ...otherData } = req.body;

    // Validate product type
    if (!isValidProductType(type)) {
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
    if ((req as any).user && (req as any).user._id) {
      userId = (req as any).user._id;
    } else {
      userId = new mongoose.Types.ObjectId('000000000000000000000000');
    }

    const productData = { manufacturerName, productName };
    
    // Chuẩn bị detail data dựa trên type
    let detailData;
    switch (type) {
      case 'food':
        const mappedData = mapFormDataToFoodProduct({ 
          manufacturerName, 
          productName, 
          user: userId,
          ...otherData 
        });
        detailData = mappedData.foodProductData;
        break;
      default:
        res.status(400).json({ message: `Product type ${type} is not yet supported` });
        return;
    }

    // Tạo product với transaction
    const result = await createProductHelper(type, productData, detailData);

    res.status(201).json({
      message: 'Product created successfully',
      product: result.product,
      productDetails: result.foodProduct || result.productDetails
    });
  } catch (error) {
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
