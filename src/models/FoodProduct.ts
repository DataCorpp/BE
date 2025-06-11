import mongoose, { Document, Schema } from "mongoose";

// Định nghĩa interface cho FoodProduct
export interface IFoodProduct extends Document {
  productName: string;
  category: string;
  flavorType: string[];
  ingredients: string[];
  usage: string[];
  packagingSize: string;
  shelfLife: string;
  manufacturerName: string;
  manufacturerRegion: string;
}

// Schema cho FoodProduct
const foodProductSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    flavorType: [{
      type: String,
      enum: ["salty", "sweet", "spicy", "umami", "sour"],
      required: true,
    }],
    ingredients: [{
      type: String,
      required: true,
    }],
    usage: [{
      type: String,
      required: true,
    }],
    packagingSize: {
      type: String,
      required: true,
    },
    shelfLife: {
      type: String,
      required: true,
    },
    manufacturerName: {
      type: String,
      required: true,
    },
    manufacturerRegion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FoodProduct = mongoose.model<IFoodProduct>("FoodProduct", foodProductSchema);

export default FoodProduct; 