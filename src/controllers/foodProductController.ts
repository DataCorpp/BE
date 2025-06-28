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
    console.log('=== GET FOOD PRODUCT BY ID ===');
    console.log('Requested product ID:', req.params.id);
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
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
    foodProduct = await FoodProduct.findById(req.params.id);
    
    // Nếu tìm thấy FoodProduct, tìm thêm Product reference
    if (foodProduct) {
      console.log('✅ Tìm thấy FoodProduct trực tiếp:', {
        _id: foodProduct._id,
        name: foodProduct.name
      });
      
      // Tìm Product reference
      productReference = await Product.findOne({
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
      productReference = await Product.findById(req.params.id);
      
      if (productReference && productReference.type === 'food') {
        console.log('✅ Tìm thấy Product reference:', {
          _id: productReference._id,
          productId: productReference.productId,
          name: productReference.productName
        });
        
        // Tìm FoodProduct thông qua productId
        foodProduct = await FoodProduct.findById(productReference.productId);
        
        if (foodProduct) {
          console.log('✅ Tìm thấy FoodProduct qua Product reference:', {
            _id: foodProduct._id,
            name: foodProduct.name
          });
        } else {
          console.error('❌ Không tìm thấy FoodProduct từ Product reference! ID không khớp hoặc đã bị xóa.');
        }
      } else {
        console.log('❌ Không tìm thấy Product với ID đã cung cấp hoặc không phải loại food');
      }
    }

    if (foodProduct) {
      // Return combined data
      res.json({
        ...foodProduct.toObject(),
        productReference: productReference,
        // Add information about which ID was used
        lookupInfo: {
          requestedId: req.params.id,
          foundDirectly: req.params.id === foodProduct._id.toString(),
          viaProductReference: req.params.id !== foodProduct._id.toString()
        }
      });
    } else {
      // Product not found - try to diagnose why
      console.error('❌ Food product not found with ID:', req.params.id);
      
      // Check if ANY food products exist in the database
      const count = await FoodProduct.countDocuments();
      console.log(`📊 Total food products in database: ${count}`);
      
      // If there are products, show some samples for comparison
      if (count > 0) {
        const samples = await FoodProduct.find().limit(3);
        console.log('📋 Sample FoodProduct IDs for comparison:');
        samples.forEach((sample, i) => {
          console.log(`  FoodProduct ${i+1}: ${sample._id} (${sample.name})`);
        });
        
        // Also show some Product references
        const productSamples = await Product.find({type: 'food'}).limit(3);
        console.log('📋 Sample Product IDs for comparison:');
        productSamples.forEach((sample, i) => {
          console.log(`  Product ${i+1}: ${sample._id} → references → ${sample.productId} (${sample.productName})`);
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
  } catch (error) {
    console.error('❌ Error in getFoodProductById:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        message: error.message,
        error: "SERVER_ERROR" 
      });
    } else {
      res.status(500).json({ 
        message: "Unknown error occurred", 
        error: "SERVER_ERROR"
      });
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
    console.log('Requested product ID:', req.params.id);
    console.log('Request body fields:', Object.keys(req.body));
    console.log('Request body complete:', JSON.stringify(req.body, null, 2));
    
    // Make sure we have a valid ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('⛔ Invalid product ID format:', req.params.id);
      res.status(400).json({ 
        message: "Invalid product ID format",
        error: "INVALID_ID"
      });
      return;
    }
    
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
        console.error('⛔ Invalid user ID format in request body:', req.body.user);
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
    
    // Log the array fields to check their format
    console.log('🔍 Array fields in request body:');
    ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
      console.log(`  ${field}:`, 
        Array.isArray(req.body[field]) 
          ? `Array with ${req.body[field].length} items: ${JSON.stringify(req.body[field])}` 
          : `Not an array: ${typeof req.body[field]} - Value: ${JSON.stringify(req.body[field])}`
      );
    });
    
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

    console.log('🔧 Prepared update data:', JSON.stringify(foodProductData, null, 2));

    // Validate required fields for update
    const validationResult = validateFoodProductFields(foodProductData, true);
    
    // Return detailed error if validation fails
    if (!validationResult.valid) {
      console.error('⛔ Validation failed:', {
        missingFields: validationResult.missingFields,
        validationErrors: validationResult.validationErrors
      });
      res.status(400).json({
        message: 'Invalid update data',
        missingFields: validationResult.missingFields,
        validationErrors: validationResult.validationErrors
      });
      return;
    }

    // Tìm ID của FoodProduct - có thể nhận vào ID của Product hoặc FoodProduct
    let foodProductId = req.params.id;
    let productReference = null;
    
    // PHƯƠNG PHÁP 1: Kiểm tra xem có phải là ID của FoodProduct không
    console.log('🔍 Phương pháp 1: Kiểm tra nếu ID là của FoodProduct:', foodProductId);
    let foodProduct = await FoodProduct.findById(foodProductId);
    
    // PHƯƠNG PHÁP 2: Nếu không phải ID của FoodProduct, thì có thể là ID của Product
    if (!foodProduct) {
      console.log('⚠️ Không tìm thấy FoodProduct trực tiếp, thử tìm qua Product...');
      
      // Tìm Product với ID được cung cấp
      productReference = await Product.findById(foodProductId);
      
      if (productReference && productReference.type === 'food') {
        console.log('✅ Tìm thấy Product reference:', {
          _id: productReference._id,
          productId: productReference.productId,
          name: productReference.productName
        });
        
        // Cập nhật foodProductId để sử dụng ID của FoodProduct thay vì Product
        foodProductId = productReference.productId.toString();
        console.log('🔄 Chuyển đổi ID thành FoodProduct ID:', foodProductId);
        
        // Tìm FoodProduct thông qua productId
        foodProduct = await FoodProduct.findById(foodProductId);
        
        if (foodProduct) {
          console.log('✅ Tìm thấy FoodProduct qua Product reference:', {
            _id: foodProduct._id,
            name: foodProduct.name
          });
        } else {
          console.error('❌ Không tìm thấy FoodProduct từ Product reference! ID không khớp hoặc đã bị xóa.');
        }
      } else {
        console.log('❌ Không tìm thấy Product với ID đã cung cấp hoặc không phải loại food');
      }
    } else {
      console.log('✅ Tìm thấy FoodProduct trực tiếp:', {
        _id: foodProduct._id,
        name: foodProduct.name
      });
    }

    // Kiểm tra xem có tìm thấy FoodProduct không
    if (!foodProduct) {
      console.error('❌ Food product not found with ID:', req.params.id);
      
      // Check if ANY food products exist in the database
      const count = await FoodProduct.countDocuments();
      console.log(`📊 Total food products in database: ${count}`);
      
      // If there are products, show some samples for comparison
      if (count > 0) {
        const samples = await FoodProduct.find().limit(3);
        console.log('📋 Sample FoodProduct IDs for comparison:');
        samples.forEach((sample, i) => {
          console.log(`  FoodProduct ${i+1}: ${sample._id} (${sample.name})`);
        });
        
        // Also show some Product references
        const productSamples = await Product.find({type: 'food'}).limit(3);
        console.log('📋 Sample Product IDs for comparison:');
        productSamples.forEach((sample, i) => {
          console.log(`  Product ${i+1}: ${sample._id} → references → ${sample.productId} (${sample.productName})`);
        });
      }
      
      res.status(404).json({ 
        message: "Food product not found", 
        error: "PRODUCT_NOT_FOUND",
        requestedId: req.params.id,
        totalProductsInDb: count,
        tip: "ID có thể là của FoodProduct hoặc của Product. Hãy đảm bảo sử dụng đúng ID."
      });
      return;
    }

    // Check ownership if user ID is available
    if (userId && foodProduct.user && foodProduct.user.toString() !== userId) {
      console.error('⛔ Unauthorized update attempt:', {
        productUserId: foodProduct.user.toString(),
        requestUserId: userId
      });
      res.status(403).json({ 
        message: "Not authorized to update this food product",
        error: "UNAUTHORIZED"
      });
      return;
    }

    // Try to update food product
    try {
      // Update food product using the correct ID
      const updatedFoodProduct = await (FoodProduct as any).updateWithProduct(
        foodProductId,
        // Product reference data
        {
          manufacturerName: foodProductData.manufacturer || foodProduct.manufacturer,
          productName: foodProductData.name || foodProduct.name
        },
        // Food product data
        foodProductData
      );
      
      // IMPORTANT: Verify the data was updated correctly by fetching it directly from MongoDB
      const savedFoodProduct = await FoodProduct.findById(foodProductId);
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

      // Add source ID information to response
      res.json({
        ...updatedFoodProduct.toObject(),
        lookupInfo: {
          requestedId: req.params.id,
          usedFoodProductId: foodProductId,
          usedProductReference: req.params.id !== foodProductId
        }
      });
    } catch (updateError) {
      console.error('Error during product update:', updateError);
      let errorMessage = 'Failed to update food product';
      
      if (updateError instanceof Error) {
        errorMessage = updateError.message;
      }
      
      res.status(400).json({ 
        message: errorMessage,
        error: "UPDATE_FAILED"
      });
    }
  } catch (error) {
    console.error('Error updating food product:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        message: error.message,
        error: "SERVER_ERROR"
      });
    } else {
      res.status(500).json({ 
        message: "Unknown error occurred", 
        error: "SERVER_ERROR"
      });
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
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
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
    res.json({
      success: true,
      data: foodTypes,
      total: foodTypes.length
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
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
    res.json({
      success: true,
      data: manufacturers,
      total: manufacturers.length
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Get unique food types (like Soy Sauce, Miso, etc.)
// @route   GET /api/foodproducts/foodtypes
// @access  Public
export const getFoodTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodTypes = await FoodProduct.distinct('foodType');
    // Filter out any null/undefined values and sort alphabetically
    const cleanFoodTypes = foodTypes.filter(type => type && type.trim()).sort();
    res.json({
      success: true,
      data: cleanFoodTypes,
      total: cleanFoodTypes.length
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// Utility function for validating food product fields
const validateFoodProductFields = (data: Record<string, any>, isUpdate = false): { 
  valid: boolean; 
  missingFields: string[];
  validationErrors: string[];
} => {
  console.log('🔍 Validating food product fields. Is update?', isUpdate);
  
  // Initialize result object
  const result = { 
    valid: true,
    missingFields: [] as string[],
    validationErrors: [] as string[]
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
    return (
      data[field] === undefined || 
      data[field] === null || 
      (typeof data[field] === 'string' && data[field].trim() === '')
    );
  });

  // Check for invalid numeric fields
  const numericFields = ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'];
  
  numericFields.forEach(field => {
    // Only validate if the field is present
    if (field in data) {
      const value = Number(data[field]);
      if (isNaN(value)) {
        result.validationErrors.push(`${field} must be a valid number`);
      } else if (value < 0) {
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