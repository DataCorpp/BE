//Quang Anh đang làm đừng động vào file này nhé---------------------------
//TO DO: Quang Anh đang làm đừng động vào file này nhé---------------------------

import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Manufacturer-specific settings
const manufacturerSettingsSchema = new Schema({
  productionCapacity: { type: Number, default: 0 },
  certifications: [{ type: String }],
  preferredCategories: [{ type: String }],
  minimumOrderValue: { type: Number, default: 0 },
});

// Brand-specific settings
const brandSettingsSchema = new Schema({
  marketSegments: [{ type: String }],
  brandValues: [{ type: String }],
  targetDemographics: [{ type: String }],
  productCategories: [{ type: String }],
});

// Retailer-specific settings
const retailerSettingsSchema = new Schema({
  storeLocations: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  customerBase: [{ type: String }],
  preferredCategories: [{ type: String }],
});

// Connection preferences schema
const connectionPreferencesSchema = new Schema({
  connectWith: [{ type: String }],
  industryInterests: [{ type: String }],
  interests: [{ type: String }],
  lookingFor: [{ type: String }],
});

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  companyName: string;
  role: string;
  status:
    | "online"
    | "away"
    | "busy"
    | "active"
    | "inactive"
    | "pending"
    | "suspended";
  profileComplete: boolean;
  lastLogin: Date;
  phone: string;
  website: string;
  address: string;
  description: string;
  avatar: string;
  industry: string;
  certificates: string;
  websiteUrl: string;
  companyDescription: string;
  establish: number;
  connectionPreferences: {
    connectWith: string[];
    industryInterests: string[];
    interests: string[];
    lookingFor: string[];
  };
  manufacturerSettings: {
    productionCapacity: number;
    certifications: string[];
    preferredCategories: string[];
    minimumOrderValue: number;
  };
  brandSettings: {
    marketSegments: string[];
    brandValues: string[];
    targetDemographics: string[];
    productCategories: string[];
  };
  retailerSettings: {
    storeLocations: number;
    averageOrderValue: number;
    customerBase: string[];
    preferredCategories: string[];
  };
  notifications: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: true,
      enum: ["manufacturer", "brand", "retailer", "admin"],
      default: "manufacturer",
    },
    status: {
      type: String,
      enum: [
        "online",
        "away",
        "busy",
        "active",
        "inactive",
        "pending",
        "suspended",
      ],
      default: "pending",
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    // Profile information
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    description: { type: String }, // Synchronized with companyDescription
    avatar: { type: String },

    // Fields from ProfileSetup
    industry: { type: String },
    certificates: { type: String },
    websiteUrl: { type: String },
    companyDescription: { type: String }, // Primary field, synchronized with description

    // Connection preferences
    connectionPreferences: connectionPreferencesSchema,

    // Role-specific settings
    manufacturerSettings: manufacturerSettingsSchema,
    brandSettings: brandSettingsSchema,
    retailerSettings: retailerSettingsSchema,

    // Notifications counter
    notifications: {
      type: Number,
      default: 0,
    },

    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Add establish field
    establish: { type: Number },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu người dùng nhập với mật khẩu đã hash
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
