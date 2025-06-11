import { Request, Response } from "express";
import FoodProduct from "../models/FoodProduct";

// @desc    Lấy tất cả sản phẩm thực phẩm
// @route   GET /api/foodproducts
// @access  Public
export const getFoodProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodProducts = await FoodProduct.find({});
    res.json(foodProducts);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Lấy sản phẩm thực phẩm theo ID
// @route   GET /api/foodproducts/:id
// @access  Public
export const getFoodProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodProduct = await FoodProduct.findById(req.params.id);

    if (foodProduct) {
      res.json(foodProduct);
    } else {
      res.status(404).json({ message: "Food product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Tạo sản phẩm thực phẩm mới
// @route   POST /api/foodproducts
// @access  Private/Manufacturer
export const createFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
      productName, 
      category, 
      flavorType, 
      ingredients, 
      usage, 
      packagingSize, 
      shelfLife, 
      manufacturerName, 
      manufacturerRegion 
    } = req.body;

    const foodProduct = new FoodProduct({
      productName,
      category,
      flavorType,
      ingredients,
      usage,
      packagingSize,
      shelfLife,
      manufacturerName,
      manufacturerRegion
    });

    const createdFoodProduct = await foodProduct.save();
    res.status(201).json(createdFoodProduct);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Cập nhật sản phẩm thực phẩm
// @route   PUT /api/foodproducts/:id
// @access  Private/Manufacturer
export const updateFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
      productName, 
      category, 
      flavorType, 
      ingredients, 
      usage, 
      packagingSize, 
      shelfLife, 
      manufacturerName, 
      manufacturerRegion 
    } = req.body;

    const foodProduct = await FoodProduct.findById(req.params.id);

    if (foodProduct) {
      foodProduct.productName = productName || foodProduct.productName;
      foodProduct.category = category || foodProduct.category;
      foodProduct.flavorType = flavorType || foodProduct.flavorType;
      foodProduct.ingredients = ingredients || foodProduct.ingredients;
      foodProduct.usage = usage || foodProduct.usage;
      foodProduct.packagingSize = packagingSize || foodProduct.packagingSize;
      foodProduct.shelfLife = shelfLife || foodProduct.shelfLife;
      foodProduct.manufacturerName = manufacturerName || foodProduct.manufacturerName;
      foodProduct.manufacturerRegion = manufacturerRegion || foodProduct.manufacturerRegion;

      const updatedFoodProduct = await foodProduct.save();
      res.json(updatedFoodProduct);
    } else {
      res.status(404).json({ message: "Food product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Xóa sản phẩm thực phẩm
// @route   DELETE /api/foodproducts/:id
// @access  Private/Manufacturer
export const deleteFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodProduct = await FoodProduct.findById(req.params.id);

    if (foodProduct) {
      await foodProduct.deleteOne();
      res.json({ message: "Food product removed" });
    } else {
      res.status(404).json({ message: "Food product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: "Unknown error occurred" });
    }
  }
}; 