import mongoose, { Document, Schema } from "mongoose";

// Define interface for Manufacturer
export interface IManufacturer extends Document {
  name: string;
  location: string;
  establish: number;
  industry: string;
  certification: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Manufacturer
const manufacturerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Manufacturer name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    establish: {
      type: Number,
      validate: {
        validator: function(v: number) {
          return v > 0 && v <= new Date().getFullYear();
        },
        message: props => `${props.value} is not a valid establishment year!`
      }
    },
    industry: {
      type: String,
      trim: true,
    },
    certification: {
      type: String,
      trim: true,
    },
    contact: {
      email: {
        type: String,
        required: [true, "Email is required"],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
    image: {
      type: String,
      default: "/manufacturer-placeholder.svg",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const Manufacturer = mongoose.model<IManufacturer>("Manufacturer", manufacturerSchema);

export default Manufacturer; 