import { Request, Response } from "express";
import FoodProduct from "../models/FoodProduct";
import Product from "../models/Product";

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
    
    // Build query cho FoodProduct
    const query: any = {};
    
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
      const matchingProducts = await Product.find(productQuery);
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
    } else if (productType && !Array.isArray(productType)) {
      query.foodType = productType;
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
    
    // Lấy thông tin Product reference cho mỗi FoodProduct
    const foodProductIds = foodProducts.map(fp => fp._id);
    const productReferences = await Product.find({ 
      type: 'food', 
      productId: { $in: foodProductIds } 
    });
    
    // Kết hợp thông tin
    const enrichedProducts = foodProducts.map(fp => {
      const productRef = productReferences.find(pr => 
        pr.productId.toString() === fp._id.toString()
      );
      return {
        ...fp.toObject(),
        productReference: productRef
      };
    });
    
    console.log(`[SERVER] Fetched ${enrichedProducts.length} products`);
    
    res.json({
      products: enrichedProducts,
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
      // Lấy thông tin Product reference
      const productReference = await Product.findOne({
        type: 'food',
        productId: foodProduct._id
      });

      res.json({
        ...foodProduct.toObject(),
        productReference: productReference
      });
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
    console.log('=== CREATE FOOD PRODUCT DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Lấy user ID từ request hoặc tạo default user ID
    let userId;
    if ((req as any).user && (req as any).user._id) {
      userId = (req as any).user._id;
      console.log('Using authenticated user ID:', userId);
    } else {
      // Tạo một ObjectId default cho trường hợp không có user authentication
      const mongoose = require('mongoose');
      userId = new mongoose.Types.ObjectId('000000000000000000000000');
      console.log('Using default user ID:', userId);
    }

    const {
      // Product reference data
      manufacturerName,
      productName,
      
      // FoodProduct data
      name,
      brand,
      category,
      description,
      image,
      price,
      countInStock,
      manufacturer,
      originCountry,
      manufacturerRegion,
      minOrderQuantity,
      dailyCapacity,
      currentAvailable,
      unitType,
      pricePerUnit,
      priceCurrency,
      leadTime,
      leadTimeUnit,
      sustainable,
      foodType,
      flavorType,
      ingredients,
      allergens,
      usage,
      packagingType,
      packagingSize,
      shelfLife,
      shelfLifeStartDate,
      shelfLifeEndDate,
      storageInstruction,
    } = req.body;

    // Chuẩn bị data cho Product reference
    const productData = {
      manufacturerName: manufacturerName || manufacturer,
      productName: productName || name,
    };

    // Chuẩn bị data cho FoodProduct
    const foodProductData = {
      user: userId,
      name: name || productName,
      brand: brand || manufacturerName,
      category: category || 'Other',
      description: description || 'No description provided',
      image: image || 'https://via.placeholder.com/300x300?text=No+Image',
      price: Number(price || pricePerUnit) || 0,
      countInStock: Number(countInStock || currentAvailable) || 0,
      rating: 0,
      numReviews: 0,
      
      // Food-specific fields
      manufacturer: manufacturer || manufacturerName,
      originCountry: originCountry || 'Unknown',
      manufacturerRegion: manufacturerRegion || '',
      minOrderQuantity: Number(minOrderQuantity) || 1,
      dailyCapacity: Number(dailyCapacity) || 100,
      currentAvailable: Number(currentAvailable) || 0,
      unitType: unitType || 'units',
      pricePerUnit: Number(pricePerUnit) || 0,
      priceCurrency: priceCurrency || 'USD',
      leadTime: leadTime || '1-2',
      leadTimeUnit: leadTimeUnit || 'weeks',
      sustainable: Boolean(sustainable),
      foodType: foodType || 'Other',
      flavorType: Array.isArray(flavorType) ? flavorType : (flavorType ? [flavorType] : []),
      ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? [ingredients] : []),
      allergens: Array.isArray(allergens) ? allergens : (allergens ? [allergens] : []),
      usage: Array.isArray(usage) ? usage : (usage ? [usage] : []),
      packagingType: packagingType || 'Bottle',
      packagingSize: packagingSize || 'Standard',
      shelfLife: shelfLife || '12 months',
      shelfLifeStartDate: shelfLifeStartDate ? new Date(shelfLifeStartDate) : undefined,
      shelfLifeEndDate: shelfLifeEndDate ? new Date(shelfLifeEndDate) : undefined,
      storageInstruction: storageInstruction || 'Store in cool, dry place',
    };

    console.log('Product data:', JSON.stringify(productData, null, 2));
    console.log('FoodProduct data:', JSON.stringify(foodProductData, null, 2));

    // Validate required fields
    if (!productData.manufacturerName || !productData.productName) {
      res.status(400).json({
        message: 'Manufacturer name and product name are required',
        missingFields: [
          ...(productData.manufacturerName ? [] : ['manufacturerName']),
          ...(productData.productName ? [] : ['productName'])
        ]
      });
      return;
    }

    // Sử dụng static method createWithProduct để tạo với transaction
    const result = await (FoodProduct as any).createWithProduct(productData, foodProductData);

    console.log('Food product created successfully');
    console.log('Product ID:', result.product._id);
    console.log('FoodProduct ID:', result.foodProduct._id);

    res.status(201).json({
      message: 'Food product created successfully',
      product: result.product,
      foodProduct: result.foodProduct
    });
  } catch (error) {
    console.error('Error creating food product:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
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
    const { manufacturerName, productName, ...foodProductData } = req.body;

    const productData = {
      ...(manufacturerName && { manufacturerName }),
      ...(productName && { productName }),
    };

    // Sử dụng static method updateWithProduct
    const updatedFoodProduct = await (FoodProduct as any).updateWithProduct(
      req.params.id,
      productData,
      foodProductData
    );

    if (updatedFoodProduct) {
      // Lấy thông tin Product reference
      const productReference = await Product.findOne({
        type: 'food',
        productId: updatedFoodProduct._id
      });

      res.json({
        ...updatedFoodProduct.toObject(),
        productReference: productReference
      });
    } else {
      res.status(404).json({ message: "Food product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
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
    // Sử dụng static method deleteWithProduct
    const deletedFoodProduct = await (FoodProduct as any).deleteWithProduct(req.params.id);

    if (deletedFoodProduct) {
      res.json({ message: "Food product deleted successfully" });
    } else {
      res.status(404).json({ message: "Food product not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
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
    res.json(categories);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Get unique food types (thay vì product types)
// @route   GET /api/foodproducts/types
// @access  Public
export const getProductTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodTypes = await FoodProduct.distinct('foodType');
    res.json(foodTypes);
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