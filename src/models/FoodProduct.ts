import mongoose, { Document, Schema } from "mongoose";
import Product from "./Product";

// Định nghĩa interface cho FoodProduct - collection độc lập
export interface IFoodProduct extends Document {
  // Basic Information
  user: mongoose.Types.ObjectId;
  name: string; // productName in JSON
  category: string;
  brand: string; // Used for display purposes
  rating: number;
  numReviews: number;

  // Manufacturer & Origin Details
  manufacturer: string; // manufacturerName in JSON
  originCountry: string;
  
  // Packaging & Storage
  packagingType: string;
  packagingSize: string;
  shelfLife: string;
  storageInstruction: string; // storageInstructions in JSON

  // Production Details
  minOrderQuantity: number; // minimumOrderQuantity in JSON
  dailyCapacity: number;
  currentAvailable: number; // currentAvailableStock in JSON
  unitType: string;
  pricePerUnit: number;
  priceCurrency: string; // USD, JPY, EUR, CNY
  
  // Description & Media
  description: string; // productDescription in JSON
  image: string; // productImage in JSON = images[0]
  images: string[]; // Added to support multiple images 
  
  // Food Details
  foodType: string;
  flavorType: string[]; // primaryFlavorProfile in JSON
  ingredients: string[]; // mainIngredients in JSON
  allergens: string[]; // allergens in JSON
  usage: string[]; // usageExamples in JSON
  
  // System Fields
  sku?: string;
  countInStock: number; // For compatibility with existing code
  price: number; // For compatibility with existing code
}

// Cấu hình toàn cục cho mongoose để tránh áp dụng giá trị mặc định khi update
mongoose.set('setDefaultsOnInsert', false);

// Schema cho FoodProduct - collection độc lập
const foodProductSchema = new Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },

  // Manufacturer & Origin Details
  manufacturer: {
    type: String,
    required: true,
  },
  originCountry: {
    type: String,
    required: true,
  },

  // Packaging & Storage
  packagingType: {
    type: String,
    required: true
  },
  packagingSize: {
    type: String,
    required: true
  },
  shelfLife: {
    type: String,
    required: true
  },
  storageInstruction: {
    type: String,
    required: true
  },

  // Production Details
  minOrderQuantity: {
    type: Number,
    required: true,
    min: 0, // Changed from 1 to 0 to allow zero values
  },
  dailyCapacity: {
    type: Number,
    required: true,
    min: 0, // Changed from 1 to 0 to allow zero values
  },
  currentAvailable: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitType: {
    type: String,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  priceCurrency: {
    type: String,
    required: true,
    default: "USD",
  },

  // Description & Media
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  images: {
    type: [String],
  },

  // For compatibility with existing code
  countInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  
  // Food Details
  foodType: {
    type: String,
    required: true
  },
  flavorType: {
    type: [String]
  },
  ingredients: {
    type: [String]
  },
  allergens: {
    type: [String]
  },
  usage: {
    type: [String]
  },

  // System Fields
  sku: {
    type: String,
    unique: true,
    sparse: true, // cho phép null/undefined và vẫn unique
  },
}, {
  timestamps: true,
  // IMPORTANT: Disable applying defaults on create
  // This ensures that MongoDB won't apply any default values when creating a new document
  skipDefaults: true
});

// Index cho tìm kiếm hiệu quả
foodProductSchema.index({ foodType: 1 });
foodProductSchema.index({ flavorType: 1 });
foodProductSchema.index({ allergens: 1 });
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ originCountry: 1 });
foodProductSchema.index({ sku: 1 });
foodProductSchema.index({ name: 'text', description: 'text', manufacturer: 'text' });

// Validation middleware
foodProductSchema.pre('save', function(next) {
  console.log('=== PRE SAVE MIDDLEWARE - BEFORE PROCESSING ===');
  console.log('Data being saved to MongoDB:', {
    foodType: this.foodType,
    packagingType: this.packagingType,
    packagingSize: this.packagingSize,
    shelfLife: this.shelfLife,
    storageInstruction: this.storageInstruction,
    flavorType: this.flavorType,
    ingredients: this.ingredients,
    allergens: this.allergens,
    usage: this.usage,
    image: this.image,
    images: this.images,
    imagesCount: this.images ? this.images.length : 0
  });

  // Auto-generate SKU if not provided
  if (!this.sku && this.isNew) {
    const prefix = this.foodType.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${prefix}${timestamp}`;
  }
  
  // Make sure arrays exist and are actually arrays
  ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
    if (!this[field]) {
      this[field] = [];
      console.log(`Created empty array for ${field}`);
    } else if (!Array.isArray(this[field])) {
      this[field] = [this[field]].filter(Boolean);
      console.log(`Converted ${field} to array:`, this[field]);
    }
  });
  
  // CRITICAL: Special handling for images array
  if (!this.images) {
    this.images = [];
    console.log('Created empty images array');
  } else if (!Array.isArray(this.images)) {
    // If it's not an array, convert to array
    this.images = [this.images].filter(Boolean);
    console.log('Converted non-array images to array:', this.images);
  } 
  
  // Handle main image relationship with images array
  if (this.image) {
    // If main image exists but not in images array, add it
    if (!this.images.includes(this.image)) {
      this.images.unshift(this.image);
      console.log('Added main image to images array:', this.image);
    } else if (this.images[0] !== this.image) {
      // If main image is in array but not first, move to front
      const newImagesArray = [
        this.image,
        ...this.images.filter(img => img !== this.image)
      ];
      this.images = newImagesArray;
      console.log('Moved main image to front of images array:', this.image);
    }
  } else if (this.images.length > 0) {
    // If no main image but images exist, use first as main
    this.image = this.images[0];
    console.log('Set main image from images array:', this.image);
  }

  // Auto-assign first image as main image if main image not set
  if (!this.image && this.images && this.images.length > 0) {
    this.image = this.images[0];
  }

  // Log changes after processing
  console.log('=== PRE SAVE MIDDLEWARE - AFTER PROCESSING ===');
  console.log('Data after pre-save processing:', {
    image: this.image,
    images: this.images,
    imagesCount: this.images ? this.images.length : 0,
    imagesSample: this.images ? this.images.slice(0, 3) : []
  });
  
  next();
});

// Ghi đè phương thức save để đảm bảo không có giá trị mặc định nào được áp dụng
foodProductSchema.methods.saveWithoutDefaults = async function() {
  console.log('=== CUSTOM SAVE METHOD CALLED ===');
  console.log('Data before save:', {
    foodType: this.foodType,
    packagingType: this.packagingType,
    packagingSize: this.packagingSize,
    shelfLife: this.shelfLife,
    storageInstruction: this.storageInstruction,
    flavorType: this.flavorType,
    ingredients: this.ingredients,
    allergens: this.allergens,
    usage: this.usage,
    image: this.image,
    images: this.images
  });
  
  // Sử dụng insertOne trực tiếp để bypass schema defaults
  if (this.isNew) {
    // Lấy collection trực tiếp từ constructor
    const collection = (this.constructor as any).collection;
    
    // Create a clean document object with all fields explicitly defined
    const doc = this.toObject({ depopulate: true });
    
    // Xóa _id nếu nó là null hoặc undefined
    if (doc._id === null || doc._id === undefined) {
      delete doc._id;
    }
    
    // Ensure images array is properly initialized
    if (!doc.images) {
      doc.images = doc.image ? [doc.image] : [];
    } else if (!Array.isArray(doc.images)) {
      doc.images = typeof doc.images === 'string' && doc.images.trim() !== '' 
        ? [doc.images] 
        : (doc.image ? [doc.image] : []);
    } else if (doc.image && !doc.images.includes(doc.image)) {
      // Ensure main image is in the images array
      doc.images.unshift(doc.image);
    }
    
    // Log the final document that will be inserted
    console.log('Final document to be inserted:', {
      image: doc.image,
      images: doc.images,
      imagesCount: doc.images ? doc.images.length : 0,
      imagesSample: doc.images ? doc.images.slice(0, 2) : []
    });

    // Create the document in MongoDB
    const result = await collection.insertOne(doc);
    this._id = result.insertedId;
    
    console.log('Document inserted directly, bypassing schema defaults');
    
    // Verify that images were saved correctly
    const savedDoc = await collection.findOne({ _id: this._id });
    console.log('Saved document verification:', {
      image: savedDoc.image,
      images: savedDoc.images,
      imagesCount: savedDoc.images ? savedDoc.images.length : 0,
      imagesSample: savedDoc.images ? savedDoc.images.slice(0, 2) : []
    });
    
    return this;
  } else {
    // Nếu không phải document mới, sử dụng save thông thường
    return await this.save();
  }
};

// Static method để tạo product với error handling (không dùng transaction)
foodProductSchema.statics.createWithProduct = async function(
  productData: { manufacturerName: string; productName: string; [key: string]: any },
  foodProductData: any
) {
  let foodProduct = null;
  let product = null;

  try {
    console.log('=== CREATE WITH PRODUCT - INPUT DATA ===');
    console.log('Food-specific fields received:', {
      foodType: foodProductData.foodType,
      packagingType: foodProductData.packagingType,
      packagingSize: foodProductData.packagingSize,
      shelfLife: foodProductData.shelfLife,
      storageInstruction: foodProductData.storageInstruction,
      flavorType: foodProductData.flavorType,
      ingredients: foodProductData.ingredients,
      allergens: foodProductData.allergens,
      usage: foodProductData.usage,
      image: foodProductData.image,
      images: foodProductData.images,
      imagesCount: foodProductData.images ? foodProductData.images.length : 0
    });
    
    // Set brand to manufacturer if not provided
    if (!foodProductData.brand) {
      foodProductData.brand = foodProductData.manufacturer;
    }

    // Validate required fields are present
    const requiredFields = ['name', 'category', 'manufacturer', 'originCountry', 
                           'packagingType', 'packagingSize', 'shelfLife', 'storageInstruction',
                           'minOrderQuantity', 'dailyCapacity', 'unitType', 'pricePerUnit',
                           'description', 'foodType'];
    
    const missingFields = requiredFields.filter(field => 
      foodProductData[field] === undefined || 
      foodProductData[field] === null || 
      (typeof foodProductData[field] === 'string' && foodProductData[field].trim() === '')
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle numeric fields - ensure they are numbers
    ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'].forEach(field => {
      if (foodProductData[field] !== undefined) {
        foodProductData[field] = Number(foodProductData[field]);
        if (isNaN(foodProductData[field])) {
          throw new Error(`Field ${field} must be a valid number`);
        }
      }
    });

    // IMPROVED: Better handling of array fields
    ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
      if (foodProductData[field] !== undefined && !Array.isArray(foodProductData[field])) {
        // If it's a string, try to convert it to an array
        if (typeof foodProductData[field] === 'string' && foodProductData[field].trim() !== '') {
          foodProductData[field] = [foodProductData[field]];
        } else {
          // Otherwise, make it an empty array
          foodProductData[field] = [];
        }
      } else if (Array.isArray(foodProductData[field])) {
        // Create a copy to avoid reference issues
        foodProductData[field] = [...foodProductData[field]];
      }
    });
    
    // Ensure images is initialized as an array
    if (!foodProductData.images) {
      foodProductData.images = [];
    } else if (!Array.isArray(foodProductData.images)) {
      foodProductData.images = typeof foodProductData.images === 'string' && foodProductData.images.trim() !== '' 
        ? [foodProductData.images] 
        : [];
    }
    
    // Set countInStock from currentAvailable if not provided
    if (foodProductData.currentAvailable !== undefined && foodProductData.countInStock === undefined) {
      foodProductData.countInStock = foodProductData.currentAvailable;
    }

    // Set price from pricePerUnit if not provided
    if (foodProductData.pricePerUnit !== undefined && foodProductData.price === undefined) {
      foodProductData.price = foodProductData.pricePerUnit;
    }
    
    console.log('=== CREATE WITH PRODUCT - PROCESSED DATA ===');
    console.log('Food-specific fields after processing:', {
      foodType: foodProductData.foodType,
      packagingType: foodProductData.packagingType,
      packagingSize: foodProductData.packagingSize,
      shelfLife: foodProductData.shelfLife,
      storageInstruction: foodProductData.storageInstruction,
      flavorType: foodProductData.flavorType,
      ingredients: foodProductData.ingredients,
      allergens: foodProductData.allergens,
      usage: foodProductData.usage,
      image: foodProductData.image,
      images: foodProductData.images,
      imagesCount: foodProductData.images ? foodProductData.images.length : 0
    });

    // IMPORTANT: Create a direct instance without any schema defaults
    foodProduct = new this(foodProductData);
    
    console.log('=== CREATE WITH PRODUCT - BEFORE SAVE ===');
    console.log('Food product instance before save:', {
      foodType: foodProduct.foodType,
      packagingType: foodProduct.packagingType,
      packagingSize: foodProduct.packagingSize,
      shelfLife: foodProduct.shelfLife,
      storageInstruction: foodProduct.storageInstruction,
      flavorType: foodProduct.flavorType,
      ingredients: foodProduct.ingredients,
      allergens: foodProduct.allergens,
      usage: foodProduct.usage,
      image: foodProduct.image,
      images: foodProduct.images,
      imagesCount: foodProduct.images ? foodProduct.images.length : 0
    });
    
    // STEP 1: Tạo và lưu food product trước
    await foodProduct.saveWithoutDefaults();
    console.log('STEP 1 ✅ Food product saved successfully with ID:', foodProduct._id);
    
    if (!foodProduct._id) {
      throw new Error('Failed to generate _id for food product');
    }
    
    // Double check the saved data
    const freshFoodProduct = await this.findById(foodProduct._id);
    if (!freshFoodProduct) {
      throw new Error('Failed to retrieve saved food product');
    }
    
    console.log('Food product verification from database:', {
      _id: freshFoodProduct._id,
      name: freshFoodProduct.name,
      foodType: freshFoodProduct.foodType,
      image: freshFoodProduct.image,
      images: freshFoodProduct.images,
      imagesCount: freshFoodProduct.images ? freshFoodProduct.images.length : 0
    });

    // STEP 2: Tạo Product reference với productId chính là _id của food product
    console.log('STEP 2: Creating Product reference with foodProduct._id:', foodProduct._id);
    product = new Product({
      manufacturerName: productData.manufacturerName || foodProductData.manufacturer,
      productName: productData.productName || foodProductData.name,
      type: 'food',
      productId: foodProduct._id, // Assign the ID of the food product as productId
      user: productData.user || foodProductData.user,
    });
    
    console.log('Product reference before save:', {
      manufacturerName: product.manufacturerName,
      productName: product.productName, 
      type: product.type,
      productId: product.productId
    });
    
    // STEP 3: Lưu Product reference
    await product.save();
    console.log('STEP 3 ✅ Product reference saved successfully with ID:', product._id);
    
    // STEP 4: Kiểm tra lại sau khi lưu
    const freshProduct = await Product.findById(product._id);
    if (!freshProduct) {
      throw new Error('Failed to retrieve saved product reference');
    }
    
    console.log('Final verification - Product reference after save:', {
      _id: freshProduct._id,
      manufacturerName: freshProduct.manufacturerName,
      productName: freshProduct.productName,
      type: freshProduct.type,
      productId: freshProduct.productId
    });
    
    // Verify that productId matches the food product _id
    const productIdStr = freshProduct.productId.toString();
    const foodProductIdStr = foodProduct._id.toString();
    
    if (productIdStr !== foodProductIdStr) {
      console.error('ERROR: productId does not match foodProduct._id');
      console.error(`Product.productId: ${productIdStr}`);
      console.error(`FoodProduct._id: ${foodProductIdStr}`);
      throw new Error('Product reference points to incorrect food product ID');
    }
    
    console.log('✅ VERIFICATION PASSED: productId correctly points to foodProduct._id');
    
    return { product: freshProduct || product, foodProduct: freshFoodProduct || foodProduct };
  } catch (error) {
    // Cleanup nếu có lỗi
    if (foodProduct && foodProduct._id) {
      try {
        await this.findByIdAndDelete(foodProduct._id);
        console.log('Cleaned up food product after error:', foodProduct._id);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    
    if (product && product._id) {
      try {
        await Product.findByIdAndDelete(product._id);
        console.log('Cleaned up product reference after error:', product._id);
      } catch (cleanupError) {
        console.error('Error during product reference cleanup:', cleanupError);
      }
    }
    
    console.error('Error in createWithProduct:', error);
    // Add more context to the error for better debugging
    if (error instanceof Error) {
      throw new Error(`Failed to create food product: ${error.message}`);
    } else {
      throw new Error('Failed to create food product due to unknown error');
    }
  }
};

// Static method để lấy product với reference
foodProductSchema.statics.findWithProduct = async function(query: any) {
  const products = await Product.find({ type: 'food', ...query });
  const productIds = products.map(p => p.productId);
  const foodProducts = await this.find({ _id: { $in: productIds } });
  
  return foodProducts.map(fp => {
    const product = products.find(p => p.productId.toString() === fp._id.toString());
    return {
      ...fp.toObject(),
      productInfo: product
    };
  });
};

// Static method để update product với error handling
foodProductSchema.statics.updateWithProduct = async function(
  foodProductId: string,
  productData: { manufacturerName?: string; productName?: string },
  foodProductData: any
) {
  try {
    console.log('=== UPDATE WITH PRODUCT - INPUT DATA ===');
    console.log('Food-specific fields received for update:', {
      foodType: foodProductData.foodType,
      packagingType: foodProductData.packagingType,
      packagingSize: foodProductData.packagingSize,
      shelfLife: foodProductData.shelfLife,
      storageInstruction: foodProductData.storageInstruction,
      flavorType: foodProductData.flavorType,
      ingredients: foodProductData.ingredients,
      allergens: foodProductData.allergens,
      usage: foodProductData.usage,
      image: foodProductData.image,
      images: foodProductData.images
    });
    
    // Tìm sản phẩm hiện có để lấy giá trị hiện tại cho các trường không được cung cấp
    const existingFoodProduct = await this.findById(foodProductId);
    if (!existingFoodProduct) {
      throw new Error('Food product not found');
    }
    
    console.log('✅ Found existing food product:', {
      _id: existingFoodProduct._id,
      name: existingFoodProduct.name,
      foodType: existingFoodProduct.foodType
    });
    
    // CRITICAL FIX: Ensure array fields are actually arrays WITHOUT modifying their content
    // This is essential for proper update operation
    ['flavorType', 'ingredients', 'allergens', 'usage'].forEach(field => {
      if (foodProductData[field] !== undefined) {
        // If it's already an array, leave it as is
        if (Array.isArray(foodProductData[field])) {
          console.log(`Field ${field} is already an array with ${foodProductData[field].length} items`);
        } 
        // If it's a string, try to parse it as JSON array
        else if (typeof foodProductData[field] === 'string') {
          try {
            // Check if it's a JSON string array
            if (foodProductData[field].startsWith('[') && foodProductData[field].endsWith(']')) {
              const parsed = JSON.parse(foodProductData[field]);
              if (Array.isArray(parsed)) {
                foodProductData[field] = parsed;
                console.log(`Parsed ${field} from JSON string to array with ${parsed.length} items`);
              } else {
                foodProductData[field] = [foodProductData[field]];
                console.log(`Converted ${field} from string to single-item array`);
              }
            } else {
              // If it's just a regular string, make it a single-item array
              foodProductData[field] = [foodProductData[field]];
              console.log(`Converted ${field} from string to single-item array`);
            }
          } catch (e) {
            // If parsing failed, treat as a single string item
            foodProductData[field] = [foodProductData[field]];
            console.log(`Converted ${field} from string to single-item array (parse failed)`);
          }
        } 
        // If it's another type (object, number, etc.), convert to string and wrap in array
        else {
          foodProductData[field] = [String(foodProductData[field])];
          console.log(`Converted ${field} from ${typeof foodProductData[field]} to single-item array`);
        }
      }
    });

    // Enhanced handling for images array
    if (foodProductData.images !== undefined) {
      // Ensure images is an array
      if (!Array.isArray(foodProductData.images)) {
        if (typeof foodProductData.images === 'string') {
          // Try to parse as JSON if it's a string
          try {
            if (foodProductData.images.startsWith('[') && foodProductData.images.endsWith(']')) {
              const parsed = JSON.parse(foodProductData.images);
              if (Array.isArray(parsed)) {
                foodProductData.images = parsed;
                console.log(`Parsed images from JSON string to array with ${parsed.length} items`);
              } else {
                foodProductData.images = [foodProductData.images];
                console.log(`Converted images string to single-item array`);
              }
            } else {
              // Regular string, wrap in array
              foodProductData.images = [foodProductData.images];
              console.log(`Converted images string to single-item array`);
            }
          } catch (e) {
            // Parse failed, use as single string
            foodProductData.images = [foodProductData.images];
            console.log(`Converted images from string to single-item array (parse failed)`);
          }
        } else if (foodProductData.images) {
          // Non-string value, convert to array
          foodProductData.images = [String(foodProductData.images)];
          console.log(`Converted images to single-item array`);
        } else {
          // Null/undefined, initialize as empty array
          foodProductData.images = [];
          console.log('Initialized empty images array');
        }
      }
      
      // Handle main image synchronization with images array
      if (foodProductData.image) {
        // Ensure main image is in the images array and is the first element
        if (!foodProductData.images.includes(foodProductData.image)) {
          foodProductData.images.unshift(foodProductData.image);
          console.log(`Added main image to images array: ${foodProductData.image}`);
        } else if (foodProductData.images[0] !== foodProductData.image) {
          // Rearrange to put main image first
          foodProductData.images = [
            foodProductData.image,
            ...foodProductData.images.filter(img => img !== foodProductData.image)
          ];
          console.log(`Moved main image to front of images array: ${foodProductData.image}`);
        }
          } else if (foodProductData.images && foodProductData.images.length > 0) {
      // If no main image provided but images array exists, use first image as main
      foodProductData.image = foodProductData.images[0];
      console.log(`Set main image from images array: ${foodProductData.image}`);
    }
    
    console.log(`Final images array for update: ${foodProductData.images ? foodProductData.images.length : 0} items`);
      console.log(`Main image for update: ${foodProductData.image}`);
    } else if (foodProductData.image) {
      // If only main image provided (not images array), update images array from existing
      if (existingFoodProduct.images && existingFoodProduct.images.length > 0) {
        // If existing product has images, update array to include new main image
        if (!existingFoodProduct.images.includes(foodProductData.image)) {
          foodProductData.images = [
            foodProductData.image,
            ...existingFoodProduct.images
          ];
        } else if (existingFoodProduct.images[0] !== foodProductData.image) {
          // Rearrange to put new main image first
          foodProductData.images = [
            foodProductData.image,
            ...existingFoodProduct.images.filter(img => img !== foodProductData.image)
          ];
        } else {
          // Keep existing array
          foodProductData.images = [...existingFoodProduct.images];
        }
      } else {
        // No existing images, create new array with main image
        foodProductData.images = [foodProductData.image];
      }
      console.log(`Created/updated images array from main image: ${foodProductData.images ? foodProductData.images.length : 0} items`);
    }

    // Handle numeric fields - ensure they are numbers
    ['minOrderQuantity', 'dailyCapacity', 'currentAvailable', 'pricePerUnit'].forEach(field => {
      if (foodProductData[field] !== undefined) {
        foodProductData[field] = Number(foodProductData[field]);
        if (isNaN(foodProductData[field])) {
          throw new Error(`Field ${field} must be a valid number`);
        }
      }
    });

    // Set countInStock from currentAvailable
    if (foodProductData.currentAvailable !== undefined) {
      foodProductData.countInStock = foodProductData.currentAvailable;
    }

    // Set price from pricePerUnit
    if (foodProductData.pricePerUnit !== undefined) {
      foodProductData.price = foodProductData.pricePerUnit;
    }
    
    console.log('=== UPDATE WITH PRODUCT - PROCESSED DATA ===');
    console.log('Food-specific fields after processing:', {
      foodType: foodProductData.foodType,
      packagingType: foodProductData.packagingType,
      packagingSize: foodProductData.packagingSize,
      shelfLife: foodProductData.shelfLife,
      storageInstruction: foodProductData.storageInstruction,
      flavorType: foodProductData.flavorType,
      ingredients: foodProductData.ingredients,
      allergens: foodProductData.allergens,
      usage: foodProductData.usage,
      image: foodProductData.image,
      images: foodProductData.images
    });

    // Update FoodProduct - IMPORTANT: Use { new: true, runValidators: true, setDefaultsOnInsert: false }
    // setDefaultsOnInsert: false prevents MongoDB from applying schema defaults
    const foodProduct = await this.findByIdAndUpdate(
      foodProductId,
      foodProductData,
      { 
        new: true,
        runValidators: false, // Disable validators for update to be more lenient
        setDefaultsOnInsert: false // IMPORTANT: Don't apply schema defaults
      }
    );

    if (!foodProduct) {
      throw new Error('Food product not found');
    }
    
    console.log('=== UPDATE WITH PRODUCT - AFTER UPDATE ===');
    console.log('Food product after update:', {
      foodType: foodProduct.foodType,
      packagingType: foodProduct.packagingType,
      packagingSize: foodProduct.packagingSize,
      shelfLife: foodProduct.shelfLife,
      storageInstruction: foodProduct.storageInstruction,
      flavorType: foodProduct.flavorType,
      ingredients: foodProduct.ingredients,
      allergens: foodProduct.allergens,
      usage: foodProduct.usage,
      image: foodProduct.image,
      images: foodProduct.images
    });

    // Update Product reference nếu có thay đổi
    if (productData.manufacturerName || productData.productName) {
      const productUpdate = {
        ...(productData.manufacturerName && { manufacturerName: productData.manufacturerName }),
        ...(productData.productName && { productName: productData.productName }),
      };
      
      const updatedProduct = await Product.findOneAndUpdate(
        { productId: foodProductId, type: 'food' },
        productUpdate,
        { new: true }
      );

      if (!updatedProduct) {
        console.warn(`Product reference not found for FoodProduct ${foodProductId}`);
      }
    }

    return foodProduct;
  } catch (error) {
    console.error('Error in updateWithProduct:', error);
    // Add more context to the error for better debugging
    if (error instanceof Error) {
      throw new Error(`Failed to update food product: ${error.message}`);
    } else {
      throw new Error('Failed to update food product due to unknown error');
    }
  }
};

// Static method để delete product với error handling
foodProductSchema.statics.deleteWithProduct = async function(foodProductId: string) {
  try {
    console.log('=== DELETE FOOD PRODUCT WITH REFERENCE ===');
    console.log('Food Product ID:', foodProductId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(foodProductId)) {
      throw new Error('Invalid food product ID format');
    }

    // Check if FoodProduct exists
    const foodProduct = await this.findById(foodProductId);
    if (!foodProduct) {
      console.log('Food product not found for deletion');
      throw new Error('Food product not found');
    }

    console.log('Food product found:', {
      name: foodProduct.name,
      manufacturer: foodProduct.manufacturer,
      user: foodProduct.user
    });

    // Delete FoodProduct first
    console.log('Deleting FoodProduct document...');
    const deletedFoodProduct = await this.findByIdAndDelete(foodProductId);
    
    if (!deletedFoodProduct) {
      throw new Error('Failed to delete food product from database');
    }
    console.log('FoodProduct deleted successfully');

    // Find and delete Product reference
    console.log('Looking for Product reference...');
    const productReference = await Product.findOne({ 
      productId: foodProductId, 
      type: 'food' 
    });

    if (productReference) {
      console.log('Product reference found:', productReference._id);
      const deletedReference = await Product.findByIdAndDelete(productReference._id);
      if (deletedReference) {
        console.log('Product reference deleted successfully');
      } else {
        console.warn('Failed to delete Product reference');
      }
    } else {
      console.warn(`Product reference not found for FoodProduct ${foodProductId}`);
    }

    console.log('Delete operation completed');
    return deletedFoodProduct;
  } catch (error) {
    console.error('Error in deleteWithProduct:', error);
    // Add more context to the error for better debugging
    if (error instanceof Error) {
      throw new Error(`Failed to delete food product: ${error.message}`);
    } else {
      throw new Error('Failed to delete food product due to unknown error');
    }
  }
};

const FoodProduct = mongoose.model<IFoodProduct>("FoodProduct", foodProductSchema);

export default FoodProduct;