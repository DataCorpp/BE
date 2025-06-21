import mongoose, { Document, Schema } from "mongoose";
import Product from "./Product";

// Định nghĩa interface cho FoodProduct - collection độc lập
export interface IFoodProduct extends Document {
  // Basic Product Info (cho việc display, search nhanh)
  user: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  countInStock: number;
  image: string;
  rating: number;
  numReviews: number;

  // Manufacturer & Origin Details
  manufacturer: string; // tên nhà sản xuất (manufacturerName trong form)
  originCountry: string; // quốc gia xuất xứ
  manufacturerRegion?: string; // khu vực sản xuất

  // Production Details
  minOrderQuantity: number;
  dailyCapacity: number; // công suất hàng ngày
  currentAvailable?: number;
  unitType: string;
  
  // Pricing
  pricePerUnit: number;
  priceCurrency: string; // USD, JPY, EUR, CNY
  
  // Lead Time
  leadTime: string;
  leadTimeUnit: string; // weeks, days, months
  
  // Sustainability
  sustainable: boolean;
  
  // Product Code
  sku?: string;

  // Food-specific Details
  foodType: string; // Miso, Soy Sauce, Dressing, etc.
  flavorType: string[]; // Sweet, Salty, Umami, etc.
  ingredients: string[]; // danh sách nguyên liệu
  allergens: string[]; // danh sách chất gây dị ứng
  usage: string[]; // cách sử dụng

  // Packaging Details
  packagingType: string; // Bottle, Can, Jar, etc.
  packagingSize: string; // 100g, 500ml, etc.

  // Storage & Shelf Life
  shelfLife: string; // 1 year, 6 months, etc.
  shelfLifeStartDate?: string; // ngày sản xuất
  shelfLifeEndDate?: string; // ngày hết hạn
  storageInstruction: string; // hướng dẫn bảo quản
}

// Schema cho FoodProduct - collection độc lập
const foodProductSchema = new Schema({
  // Basic Product Info
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  countInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  image: {
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
  manufacturerRegion: {
    type: String,
  },

  // Production Details
  minOrderQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  dailyCapacity: {
    type: Number,
    required: true,
    min: 1,
  },
  currentAvailable: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitType: {
    type: String,
    required: true,
    enum: ["units", "kg", "g", "liters", "ml", "packs", "bottles", "boxes", "bags", "cans"],
  },

  // Pricing
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  priceCurrency: {
    type: String,
    required: true,
    enum: ["USD", "JPY", "EUR", "CNY"],
    default: "USD",
  },

  // Lead Time
  leadTime: {
    type: String,
    required: true,
  },
  leadTimeUnit: {
    type: String,
    required: true,
    enum: ["days", "weeks", "months"],
    default: "weeks",
  },

  // Sustainability
  sustainable: {
    type: Boolean,
    default: false,
  },

  // Product Code
  sku: {
    type: String,
    unique: true,
    sparse: true, // cho phép null/undefined và vẫn unique
  },

  // Food-specific Details
  foodType: {
    type: String,
    required: true,
    enum: [
      "Miso", "Soy Sauce", "Dressing", "Vinegar", "Cooking Oil", 
      "Paste", "Marinade", "Soup Base", "Seasoning Mix", "Sauce",
      "Pickle", "Fermented", "Instant Food", "Snack", "Dessert",
      "Beverage Mix", "Health Food", "Other"
    ],
  },
  flavorType: [{
    type: String,
    enum: [
      "Sweet", "Salty", "Sour", "Bitter", "Umami", "Spicy", 
      "Mild", "Rich", "Fresh", "Smoky", "Nutty", "Fruity",
      "Herbal", "Earthy", "Floral", "Creamy", "Tangy", "Aromatic"
    ],
  }],
  ingredients: [{
    type: String,
  }],
  allergens: [{
    type: String,
    enum: [
      "Gluten", "Peanuts", "Tree Nuts", "Soy", "Dairy", "Eggs",
      "Fish", "Shellfish", "Sesame", "Mustard", "Celery", "Sulphites",
      "Lupin", "Molluscs"
    ],
  }],
  usage: [{
    type: String,
  }],

  // Packaging Details
  packagingType: {
    type: String,
    required: true,
    enum: [
      "Bottle", "Can", "Jar", "Pouch", "Box", "Bag", 
      "Vacuum Pack", "Tube", "Tray", "Sachet"
    ],
  },
  packagingSize: {
    type: String,
    required: true,
  },

  // Storage & Shelf Life
  shelfLife: {
    type: String,
    required: true,
  },
  shelfLifeStartDate: {
    type: Date,
  },
  shelfLifeEndDate: {
    type: Date,
  },
  storageInstruction: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
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
  // Validate shelf life dates if provided
  if (this.shelfLifeStartDate && this.shelfLifeEndDate) {
    if (this.shelfLifeStartDate >= this.shelfLifeEndDate) {
      next(new Error('Shelf life start date must be before end date'));
      return;
    }
  }

  // Auto-generate SKU if not provided
  if (!this.sku && this.isNew) {
    const prefix = this.foodType.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${prefix}${timestamp}`;
  }

  next();
});


// Static method để tạo product với error handling (không dùng transaction)
foodProductSchema.statics.createWithProduct = async function(
  productData: { manufacturerName: string; productName: string; [key: string]: any },
  foodProductData: any
) {
  let foodProduct = null;
  let product = null;

  try {
    // Tạo FoodProduct trước
    foodProduct = new this(foodProductData);
    await foodProduct.save();

    // Tạo Product reference
    product = new Product({
      manufacturerName: productData.manufacturerName,
      productName: productData.productName,
      type: 'food',
      productId: foodProduct._id,
    });
    
    await product.save();
    return { product, foodProduct };
  } catch (error) {
    // Cleanup nếu có lỗi
    if (foodProduct && foodProduct._id) {
      try {
        await this.findByIdAndDelete(foodProduct._id);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    throw error;
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
    // Update FoodProduct
    const foodProduct = await this.findByIdAndUpdate(
      foodProductId,
      foodProductData,
      { new: true }
    );

    if (!foodProduct) {
      throw new Error('Food product not found');
    }

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
    throw error;
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
    throw error;
  }
};

const FoodProduct = mongoose.model<IFoodProduct>("FoodProduct", foodProductSchema);

export default FoodProduct; 