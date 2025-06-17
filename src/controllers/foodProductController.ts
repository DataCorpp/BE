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
    const { 
      search, 
      category, 
      productType, 
      sustainable, 
      sortBy,
      minPrice,
      maxPrice,
      minRating,
      leadTime,
      inStockOnly,
      manufacturer,
      page = 1,
      limit = 10 
    } = req.query;
    
    // Build query
    const query: any = {};
    
    // Search functionality
    if (search) {
      query.$or = [
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
    
    // Filter by productType (can be an array)
    if (productType && Array.isArray(productType) && productType.length > 0) {
      query.productType = { $in: productType };
    } else if (productType && !Array.isArray(productType)) {
      query.productType = productType;
    }
    
    // Filter by sustainable
    if (sustainable === 'true') {
      query.sustainable = true;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }
    
    // Filter by rating
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    
    // Filter by lead time
    if (leadTime) {
      if (Array.isArray(leadTime) && leadTime.length > 0) {
        const leadTimeValues = leadTime.map((time: string) => time.split(' ')[0]);
        query.leadTime = { $in: leadTimeValues };
      } else if (typeof leadTime === 'string') {
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
      } else if (typeof manufacturer === 'string') {
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
      switch(sortBy) {
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
    } else {
      // Default sort
      sortOptions = { createdAt: -1 };
    }
    
    const totalCount = await FoodProduct.countDocuments(query);
    const foodProducts = await FoodProduct.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      products: foodProducts,
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
    const foodProduct = new FoodProduct(req.body);
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
    const foodProduct = await FoodProduct.findById(req.params.id);

    if (foodProduct) {
      // Update all fields from request body
      Object.assign(foodProduct, req.body);
      
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

// @desc    Get unique categories
// @route   GET /api/foodproducts/categories
// @access  Public
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await FoodProduct.distinct('category');
    res.json(['All Categories', ...categories]);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Get unique product types
// @route   GET /api/foodproducts/types
// @access  Public
export const getProductTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productTypes = await FoodProduct.distinct('productType');
    res.json(productTypes);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Get unique manufacturers
// @route   GET /api/foodproducts/manufacturers
// @access  Public
export const getManufacturers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const manufacturers = await FoodProduct.distinct('manufacturer');
    res.json(manufacturers);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
}; 