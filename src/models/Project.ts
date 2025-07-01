import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'in_review' | 'paused' | 'completed' | 'cancelled';
  
  // Product Information
  selectedProduct?: {
    id: string;
    name: string;
    type: 'PRODUCT' | 'CATEGORY' | 'FOODTYPE';
    image?: string;
    category?: string;
  };
  
  // Supplier Information
  selectedSupplierType?: {
    id: number;
    name: string;
  };
  
  // Project Requirements
  volume: string;
  units: string;
  packaging: string[];
  packagingObjects: Array<{
    id: number;
    name: string;
    material: string;
  }>;
  
  // Location & Requirements
  location: string[];
  allergen: string[];
  certification: string[];
  additional?: string;
  
  // Project Settings
  anonymous: boolean;
  hideFromCurrent: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Matching & Communication
  matchingManufacturers?: Array<{
    manufacturerId: string;
    matchScore: number;
    contactedAt?: Date;
    status: 'pending' | 'contacted' | 'responded' | 'rejected';
  }>;
  
  // Project Lifecycle
  timeline?: Array<{
    event: string;
    date: Date;
    description?: string;
  }>;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'in_review', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Product Information
  selectedProduct: {
    id: String,
    name: String,
    type: {
      type: String,
      enum: ['PRODUCT', 'CATEGORY', 'FOODTYPE']
    },
    image: String,
    category: String
  },
  
  // Supplier Information  
  selectedSupplierType: {
    id: Number,
    name: String
  },
  
  // Project Requirements
  volume: {
    type: String,
    required: true
  },
  units: {
    type: String,
    required: true
  },
  packaging: [{
    type: String
  }],
  packagingObjects: [{
    id: Number,
    name: String,
    material: String
  }],
  
  // Location & Requirements
  location: [{
    type: String
  }],
  allergen: [{
    type: String
  }],
  certification: [{
    type: String
  }],
  additional: {
    type: String,
    maxlength: 1000
  },
  
  // Project Settings
  anonymous: {
    type: Boolean,
    default: false
  },
  hideFromCurrent: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Matching & Communication
  matchingManufacturers: [{
    manufacturerId: String,
    matchScore: Number,
    contactedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'contacted', 'responded', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Project Lifecycle
  timeline: [{
    event: String,
    date: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ProjectSchema.index({ createdBy: 1, status: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'selectedProduct.name': 'text', description: 'text' });

// Virtual for project age
ProjectSchema.virtual('projectAge').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to add timeline events
ProjectSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline = [{
      event: 'project_created',
      date: new Date(),
      description: 'Project created and submitted for review'
    }];
  }
  
  if (this.isModified('status') && !this.isNew) {
    this.timeline = this.timeline || [];
    this.timeline.push({
      event: `status_changed_to_${this.status}`,
      date: new Date(),
      description: `Project status changed to ${this.status}`
    });
  }
  
  next();
});

export default mongoose.model<IProject>('Project', ProjectSchema); 