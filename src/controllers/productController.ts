import { Request, Response } from "express";
import { Product, getProductModel, createProduct as createProductHelper, mapFormDataToFoodProduct } from "../models";

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productType } = req.query;
    
    // Nếu có productType, filter theo loại, nếu không thì lấy tất cả
    const filter = productType ? { productType } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Manufacturer
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productType = 'other', ...requestData } = req.body;

    // Chuẩn bị data với user info
    let productData = {
      user: (req as any).user._id,
      rating: 0,
      numReviews: 0,
      ...requestData,
    };

    // Xử lý mapping đặc biệt cho food products
    if (productType === 'food') {
      productData = mapFormDataToFoodProduct(productData);
    }

    // Sử dụng helper function để tạo sản phẩm với loại phù hợp
    const product = createProductHelper(productType, productData);

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        message: error.message,
        details: error.name === 'ValidationError' ? error.message : undefined
      });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Manufacturer
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const { productType, ...updateData } = req.body;
      
      // Xử lý mapping đặc biệt cho food products
      let finalUpdateData = updateData;
      if (product.productType === 'food' || productType === 'food') {
        finalUpdateData = mapFormDataToFoodProduct(updateData);
      }

      // Cập nhật các field được gửi trong request
      Object.keys(finalUpdateData).forEach(key => {
        if (finalUpdateData[key] !== undefined && key !== '_id' && key !== '__v') {
          (product as any)[key] = finalUpdateData[key];
        }
      });

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        message: error.message,
        details: error.name === 'ValidationError' ? error.message : undefined
      });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Manufacturer
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Lấy sản phẩm theo loại
// @route   GET /api/products/type/:productType
// @access  Public
export const getProductsByType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productType } = req.params;
    const Model = getProductModel(productType as any);
    
    const products = await Model.find({ productType });
    res.json(products);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};
