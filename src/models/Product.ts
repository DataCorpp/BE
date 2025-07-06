import mongoose, { Document, Schema } from "mongoose";

// Định nghĩa interface cho Inventory (thành phần của sản phẩm)
interface IInventoryItem extends Document {
  id: number;
  name: string;
  category: string;
  status: string;
  quantity: number;
  unit: string;
  threshold: number;
  location: string;
}

// Định nghĩa interface cho Product cơ bản - chỉ lưu thông tin chung
export interface IProduct extends Document {
  manufacturerName: string; // tên nhà sản xuất
  productName: string; // tên sản phẩm
  type: string; // discriminator: 'food', 'beverage', 'health', 'other'
  productId: mongoose.Types.ObjectId; // ID tham chiếu đến collection con
  createdAt?: Date;
  updatedAt?: Date;
  user: mongoose.Types.ObjectId; // Tham chiếu user (manufacturer) sở hữu sản phẩm
}

// Schema cho Inventory
const InventoryItemSchema = new Schema<IInventoryItem>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  threshold: { type: Number, required: true },
  location: { type: String, required: true },
});

// Schema cơ bản cho Product - chỉ lưu thông tin chung
const productSchema = new Schema(
  {
    manufacturerName: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['food', 'beverage', 'health', 'other'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Reference sẽ được set động dựa trên type
    },
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm hiệu quả
productSchema.index({ type: 1 });
productSchema.index({ manufacturerName: 1 });
productSchema.index({ productName: 1 });
productSchema.index({ productId: 1 });
productSchema.index({ user: 1 });

// Compound index cho tìm kiếm kết hợp
productSchema.index({ type: 1, manufacturerName: 1 });
productSchema.index({ type: 1, productName: 'text', manufacturerName: 'text' });

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
