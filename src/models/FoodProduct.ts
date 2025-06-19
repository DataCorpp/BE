import mongoose, { Document, Schema } from "mongoose";

// Định nghĩa interface cho FoodProduct
export interface IFoodProduct extends Document {
  name: string;
  category: string;
  manufacturer: string;
  image: string;
  price: string;
  pricePerUnit?: number;
  rating: number;
  productType: string;
  description: string;
  minOrderQuantity: number;
  leadTime: string;
  leadTimeUnit?: string;
  sustainable: boolean;
  sku?: string;
  unitType?: string;
  currentAvailable?: number;
  ingredients?: string[];
  flavorType?: string[];
  usage?: string[];
  packagingSize?: string;
  shelfLife?: string;
  manufacturerRegion?: string;
}

// Schema cho FoodProduct
const foodProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "/placeholder.svg",
    },
    price: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
    },
    rating: {
      type: Number,
      default: 4.0,
    },
    productType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    minOrderQuantity: {
      type: Number,
      required: true,
    },
    leadTime: {
      type: String,
      required: true,
    },
    leadTimeUnit: {
      type: String,
      default: "weeks",
    },
    sustainable: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
    },
    unitType: {
      type: String,
      default: "units",
    },
    currentAvailable: {
      type: Number,
    },
    ingredients: [{
      type: String,
    }],
    flavorType: [{
      type: String,
      enum: ["salty", "sweet", "spicy", "umami", "sour"],
    }],
    usage: [{
      type: String,
    }],
    packagingSize: {
      type: String,
    },
    shelfLife: {
      type: String,
    },
    manufacturerRegion: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const FoodProduct = mongoose.model<IFoodProduct>("FoodProduct", foodProductSchema);

export default FoodProduct; 