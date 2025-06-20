import mongoose, { Document, Schema } from "mongoose";
import Product, { IProduct } from "./Product";

// Định nghĩa interface cho FoodProduct - extend từ IProduct
export interface IFoodProduct extends IProduct {
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

// Schema cho FoodProduct - extend từ Product base schema
const foodProductSchema = new Schema({
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
    required: true,
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
});

// Index cho tìm kiếm hiệu quả
foodProductSchema.index({ foodType: 1 });
foodProductSchema.index({ flavorType: 1 });
foodProductSchema.index({ allergens: 1 });
foodProductSchema.index({ manufacturer: 1 });
foodProductSchema.index({ originCountry: 1 });
foodProductSchema.index({ sku: 1 });

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

// Tạo discriminator từ Product base model
const FoodProduct = Product.discriminator<IFoodProduct>("food", foodProductSchema);

export default FoodProduct; 