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
    // Tìm Product reference
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Delete với transaction
    await deleteProductWithReference(product.type, product.productId.toString());

    // Delete Product reference
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
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
