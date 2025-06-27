import { Request, Response } from "express";
import FoodProduct from "../models/FoodProduct";
import Product from "../models/Product";
import mongoose from "mongoose";

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

// @desc    Create food product
// @route   POST /api/foodproducts
// @access  Private/Manufacturer
export const createFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('=== CREATE FOOD PRODUCT ===');
    
    // Get user ID from authenticated user or request body
    let userId: string;
    
    // If request comes from authenticated route
    if (req.user && req.user._id) {
      userId = req.user._id.toString();
      console.log('Using authenticated user ID:', userId);
    } 
    // If request includes user ID in body
    else if (req.body.user) {
      // Validate the user ID format
      if (!mongoose.Types.ObjectId.isValid(req.body.user)) {
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
      // Remove user from the destructured fields since we handle it separately
      user: _user, // Rename to avoid conflict
      ...restFields
    } = req.body;

    // Chuẩn bị data cho Product reference
    const productData = {
      manufacturerName: manufacturer || manufacturerName,
      productName: productName || name,
    };

    // Prepare data for FoodProduct with proper field validation
    const foodProductData = {
      user: userId, // Use the validated userId
      name: name ?? productName,
      brand: brand ?? manufacturer ?? manufacturerName,
      category: category ?? 'Other',
      description: description ?? 'No description provided',
      image: image ?? 'https://via.placeholder.com/300x300?text=No+Image',
      price: Number(price ?? pricePerUnit) || 0,
      countInStock: Number(countInStock ?? currentAvailable) || 0,
      rating: 0,
      numReviews: 0,
      
      // Food-specific fields - DO NOT set default values for these fields
      manufacturer: manufacturer ?? manufacturerName, // Prioritize manufacturer field
      originCountry: originCountry ?? 'Unknown',
      manufacturerRegion: manufacturerRegion,
      minOrderQuantity: Number(minOrderQuantity) || 1,
      dailyCapacity: Number(dailyCapacity) || 100,
      currentAvailable: Number(currentAvailable) || 0,
      unitType: unitType ?? 'units',
      pricePerUnit: Number(pricePerUnit) || 0,
      priceCurrency: priceCurrency ?? 'USD',
      leadTime: leadTime ?? '1-2',
      leadTimeUnit: leadTimeUnit ?? 'weeks',
      sustainable: Boolean(sustainable),
      
      // CRITICAL: Pass these fields exactly as received without any transformation or defaults
      foodType,
      packagingType,
      packagingSize,
      shelfLife,
      storageInstruction,
      
      // Array fields - preserve exactly as received
      flavorType: Array.isArray(flavorType) ? flavorType : (flavorType ? [flavorType] : []),
      ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? [ingredients] : []),
      allergens: Array.isArray(allergens) ? allergens : (allergens ? [allergens] : []),
      usage: Array.isArray(usage) ? usage : (usage ? [usage] : []),
      
      // Dates
      shelfLifeStartDate: shelfLifeStartDate ? new Date(shelfLifeStartDate) : undefined,
      shelfLifeEndDate: shelfLifeEndDate ? new Date(shelfLifeEndDate) : undefined,
      
      // Include any other fields not explicitly destructured
      ...restFields
    };
    
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
      usage: foodProductData.usage
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
    const result = await (FoodProduct as any).createWithProduct(productData, foodProductData);

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
    const savedFoodProduct = await FoodProduct.findById(result.foodProduct._id);
    console.log('=== VERIFICATION: DATA SAVED TO MONGODB ===');
    console.log('Actual data in MongoDB after save:', {
      foodType: savedFoodProduct?.foodType,
      packagingType: savedFoodProduct?.packagingType,
      packagingSize: savedFoodProduct?.packagingSize,
      shelfLife: savedFoodProduct?.shelfLife,
      storageInstruction: savedFoodProduct?.storageInstruction,
      flavorType: savedFoodProduct?.flavorType,
      ingredients: savedFoodProduct?.ingredients,
      allergens: savedFoodProduct?.allergens,
      usage: savedFoodProduct?.usage
    });
    
    // Check if data was saved correctly
    const fieldsToCheck = [
      'foodType', 'packagingType', 'packagingSize', 'shelfLife', 'storageInstruction'
    ];
    
    const arrayFieldsToCheck = [
      'flavorType', 'ingredients', 'allergens', 'usage'
    ];
    
    let hasDataMismatch = false;
    
    // Check string fields
    fieldsToCheck.forEach(field => {
      if (savedFoodProduct?.[field] !== foodProductData[field]) {
        console.warn(`WARNING: Field ${field} was not saved correctly!`);
        console.warn(`  Expected: "${foodProductData[field]}"`);
        console.warn(`  Actual: "${savedFoodProduct?.[field]}"`);
        hasDataMismatch = true;
      }
    });
    
    // Check array fields (need to compare differently)
    arrayFieldsToCheck.forEach(field => {
      const expected = foodProductData[field] || [];
      const actual = savedFoodProduct?.[field] || [];
      
      if (expected.length !== actual.length) {
        console.warn(`WARNING: Field ${field} length mismatch!`);
        console.warn(`  Expected length: ${expected.length}, values: ${JSON.stringify(expected)}`);
        console.warn(`  Actual length: ${actual.length}, values: ${JSON.stringify(actual)}`);
        hasDataMismatch = true;
      } else {
        // Check each element
        for (let i = 0; i < expected.length; i++) {
          if (expected[i] !== actual[i]) {
            console.warn(`WARNING: Field ${field}[${i}] mismatch!`);
            console.warn(`  Expected: "${expected[i]}"`);
            console.warn(`  Actual: "${actual[i]}"`);
            hasDataMismatch = true;
          }
        }
      }
    });
    
    if (hasDataMismatch) {
      console.warn('WARNING: Some data was not saved correctly to MongoDB!');
      console.warn('This might be due to schema defaults or middleware modifying the data.');
    } else {
      console.log('SUCCESS: All data was saved correctly to MongoDB!');
    }

    res.status(201).json(result.foodProduct);
  } catch (error) {
    console.error('Error creating food product:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

// @desc    Update food product
// @route   PUT /api/foodproducts/:id
// @access  Private/Manufacturer
export const updateFoodProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('=== UPDATE FOOD PRODUCT ===');
    
    // Get user ID from authenticated user or request body
    let userId: string | undefined;
    
    // If request comes from authenticated route
    if (req.user && req.user._id) {
      userId = req.user._id.toString();
      console.log('Using authenticated user ID:', userId);
    } 
    // If request includes user ID in body
    else if (req.body.user) {
      // Validate the user ID format
      if (!mongoose.Types.ObjectId.isValid(req.body.user)) {
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

    // Extract manufacturer field from request body
    const { 
      manufacturer, 
      manufacturerName, // Accept both for backward compatibility
      user: _user, // Rename to avoid conflict with userId
      ...updateData 
    } = req.body;
    
    // Prepare update data
    const foodProductData = {
      ...updateData,
      // Prioritize manufacturer field, fall back to manufacturerName
      ...(manufacturer || manufacturerName ? { 
        manufacturer: manufacturer || manufacturerName 
      } : {}),
      // Only include user field if it's provided
      ...(userId ? { user: userId } : {})
    };

    // Validate required fields for update
    const validationResult = validateFoodProductFields(foodProductData, true);
    
    // Return detailed error if validation fails
    if (!validationResult.valid) {
      res.status(400).json({
        message: 'Invalid update data',
        missingFields: validationResult.missingFields,
        validationErrors: validationResult.validationErrors
      });
      return;
    }

    // Find food product by ID
    const foodProduct = await FoodProduct.findById(req.params.id);

    if (!foodProduct) {
      res.status(404).json({ message: "Food product not found" });
      return;
    }

    // Check ownership if user ID is available
    if (userId && foodProduct.user && foodProduct.user.toString() !== userId) {
      res.status(403).json({ 
        message: "Not authorized to update this food product",
        error: "UNAUTHORIZED"
      });
      return;
    }

    // Update food product
    const updatedFoodProduct = await (FoodProduct as any).updateWithProduct(
      req.params.id,
      // Product reference data
      {
        manufacturerName: foodProductData.manufacturer || foodProduct.manufacturer,
        productName: foodProductData.name || foodProduct.name
      },
      // Food product data
      foodProductData
    );
    
    // IMPORTANT: Verify the data was updated correctly by fetching it directly from MongoDB
    const savedFoodProduct = await FoodProduct.findById(req.params.id);
    console.log('=== VERIFICATION: DATA UPDATED IN MONGODB ===');
    console.log('Actual data in MongoDB after update:', {
      foodType: savedFoodProduct?.foodType,
      packagingType: savedFoodProduct?.packagingType,
      packagingSize: savedFoodProduct?.packagingSize,
      shelfLife: savedFoodProduct?.shelfLife,
      storageInstruction: savedFoodProduct?.storageInstruction,
      flavorType: savedFoodProduct?.flavorType,
      ingredients: savedFoodProduct?.ingredients,
      allergens: savedFoodProduct?.allergens,
      usage: savedFoodProduct?.usage
    });
    
    // Check if data was updated correctly
    const fieldsToCheck = [
      'foodType', 'packagingType', 'packagingSize', 'shelfLife', 'storageInstruction'
    ];
    
    const arrayFieldsToCheck = [
      'flavorType', 'ingredients', 'allergens', 'usage'
    ];
    
    let hasDataMismatch = false;
    
    // Check string fields - only check fields that were provided in the update
    fieldsToCheck.forEach(field => {
      if (foodProductData[field] !== undefined && savedFoodProduct?.[field] !== foodProductData[field]) {
        console.warn(`WARNING: Field ${field} was not updated correctly!`);
        console.warn(`  Expected: "${foodProductData[field]}"`);
        console.warn(`  Actual: "${savedFoodProduct?.[field]}"`);
        hasDataMismatch = true;
      }
    });
    
    // Check array fields (need to compare differently)
    arrayFieldsToCheck.forEach(field => {
      if (foodProductData[field] !== undefined) {
        const expected = foodProductData[field] || [];
        const actual = savedFoodProduct?.[field] || [];
        
        if (expected.length !== actual.length) {
          console.warn(`WARNING: Field ${field} length mismatch!`);
          console.warn(`  Expected length: ${expected.length}, values: ${JSON.stringify(expected)}`);
          console.warn(`  Actual length: ${actual.length}, values: ${JSON.stringify(actual)}`);
          hasDataMismatch = true;
        } else {
          // Check each element
          for (let i = 0; i < expected.length; i++) {
            if (expected[i] !== actual[i]) {
              console.warn(`WARNING: Field ${field}[${i}] mismatch!`);
              console.warn(`  Expected: "${expected[i]}"`);
              console.warn(`  Actual: "${actual[i]}"`);
              hasDataMismatch = true;
            }
          }
        }
      }
    });
    
    if (hasDataMismatch) {
      console.warn('WARNING: Some data was not updated correctly in MongoDB!');
      console.warn('This might be due to schema defaults or middleware modifying the data.');
    } else {
      console.log('SUCCESS: All data was updated correctly in MongoDB!');
    }

    res.json(updatedFoodProduct);
  } catch (error) {
    console.error('Error updating food product:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
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

// Utility function for validating food product fields
const validateFoodProductFields = (data: Record<string, any>, isUpdate = false): { 
  valid: boolean; 
  missingFields: string[];
  validationErrors: string[];
} => {
  const missingFields: string[] = [];
  const validationErrors: string[] = [];
  
  // For updates, we only validate fields that are present
  // For creates, we validate all required fields
  
  // Validate user ID is present and in correct format
  if (!isUpdate || data.user !== undefined) {
    if (!data.user) {
      missingFields.push('user');
    } else if (!mongoose.Types.ObjectId.isValid(data.user)) {
      validationErrors.push('user must be a valid MongoDB ObjectId');
    }
  }
  
  // Required string fields
  const requiredStringFields = [
    'name', 'brand', 'category', 'description', 'image', 
    'manufacturer', 'originCountry', 'unitType', 'priceCurrency',
    'leadTime', 'leadTimeUnit', 'foodType', 'packagingType',
    'packagingSize', 'shelfLife', 'storageInstruction'
  ];
  
  // Check required string fields
  requiredStringFields.forEach(field => {
    if (!isUpdate || data[field] !== undefined) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }
  });
  
  // Required numeric fields with minimums
  const requiredNumericFields = [
    { field: 'minOrderQuantity', min: 1 },
    { field: 'dailyCapacity', min: 1 },
    { field: 'pricePerUnit', min: 0 },
    { field: 'price', min: 0 }
  ];
  
  // Check required numeric fields
  requiredNumericFields.forEach(({ field, min }) => {
    if (!isUpdate || data[field] !== undefined) {
      if (typeof data[field] !== 'number' || data[field] < min) {
        missingFields.push(field);
      }
    }
  });
  
  // Required array fields
  const requiredArrayFields = ['flavorType', 'ingredients'];
  
  // Check required array fields
  requiredArrayFields.forEach(field => {
    if (!isUpdate || data[field] !== undefined) {
      if (!Array.isArray(data[field]) || data[field].length === 0) {
        missingFields.push(field);
      }
    }
  });
  
  // Validate enum values
  // UnitType
  if (!isUpdate || data.unitType !== undefined) {
    // Bỏ kiểm tra giá trị cố định cho unitType
    if (!data.unitType) {
      missingFields.push('unitType');
    }
  }
  
  // Currency
  if (!isUpdate || data.priceCurrency !== undefined) {
    // Giữ lại kiểm tra cho priceCurrency vì đây là tiêu chuẩn quốc tế
    const validCurrencies = ["USD", "JPY", "EUR", "CNY"];
    if (data.priceCurrency && !validCurrencies.includes(data.priceCurrency)) {
      validationErrors.push(`priceCurrency must be one of: ${validCurrencies.join(', ')}`);
    }
  }
  
  // Lead time unit
  if (!isUpdate || data.leadTimeUnit !== undefined) {
    // Bỏ kiểm tra giá trị cố định cho leadTimeUnit
    if (!data.leadTimeUnit) {
      missingFields.push('leadTimeUnit');
    }
  }
  
  // Food type
  if (!isUpdate || data.foodType !== undefined) {
    // Bỏ kiểm tra giá trị cố định cho foodType
    // Cho phép người dùng nhập bất kỳ giá trị nào
    if (!data.foodType) {
      missingFields.push('foodType');
    }
  }
  
  // Packaging type
  if (!isUpdate || data.packagingType !== undefined) {
    // Bỏ kiểm tra giá trị cố định cho packagingType
    // Cho phép người dùng nhập bất kỳ giá trị nào
    if (!data.packagingType) {
      missingFields.push('packagingType');
    }
  }
  
  // Validate dates if both are provided
  if (data.shelfLifeStartDate && data.shelfLifeEndDate) {
    if (new Date(data.shelfLifeStartDate) >= new Date(data.shelfLifeEndDate)) {
      validationErrors.push('shelfLifeStartDate must be before shelfLifeEndDate');
    }
  }
  
  return {
    valid: missingFields.length === 0 && validationErrors.length === 0,
    missingFields,
    validationErrors
  };
}; 