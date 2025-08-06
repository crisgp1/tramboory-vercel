import mongoose, { Document, Schema, Model } from 'mongoose';
import { ProductStatus } from '@/types/inventory';

// Interface following Single Responsibility Principle - defines product data structure
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  location?: string;
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    costPrice: number;
    leadTime: number;
    minOrderQuantity: number;
    isPreferred: boolean;
  }>;
  status: ProductStatus;
  tags: string[];
  images: string[];
  expirationDate?: Date;
  batchNumber?: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition following Open/Closed Principle - extensible without modification
const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxStock: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  suppliers: [{
    supplierId: {
      type: String,
      required: true
    },
    supplierName: {
      type: String,
      required: true
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    leadTime: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    isPreferred: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  expirationDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'products'
});

// Indexes for performance - Interface Segregation Principle
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ 'suppliers.supplierId': 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ currentStock: 1 });

// Virtual for calculated available stock
ProductSchema.virtual('calculatedAvailableStock').get(function() {
  return Math.max(0, this.currentStock - this.reservedStock);
});

// Pre-save middleware following Dependency Inversion Principle
ProductSchema.pre('save', function(next) {
  // Update available stock calculation
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  
  // Ensure status consistency
  if (!this.isActive && this.status === ProductStatus.ACTIVE) {
    this.status = ProductStatus.INACTIVE;
  }
  
  next();
});

// Static methods following Single Responsibility Principle
ProductSchema.statics.findBySupplierId = function(supplierId: string) {
  return this.find({ 'suppliers.supplierId': supplierId, isActive: true });
};

ProductSchema.statics.findLowStock = function() {
  return this.find({ 
    $expr: { $lte: ['$currentStock', '$minStock'] },
    isActive: true 
  });
};

ProductSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

// Instance methods
ProductSchema.methods.isLowStock = function(): boolean {
  return this.currentStock <= this.minStock;
};

ProductSchema.methods.isOutOfStock = function(): boolean {
  return this.currentStock <= 0;
};

ProductSchema.methods.canFulfillOrder = function(quantity: number): boolean {
  return this.availableStock >= quantity;
};

ProductSchema.methods.addSupplier = function(supplier: any) {
  const existingIndex = this.suppliers.findIndex(s => s.supplierId === supplier.supplierId);
  
  if (existingIndex >= 0) {
    // Update existing supplier
    this.suppliers[existingIndex] = { ...this.suppliers[existingIndex], ...supplier };
  } else {
    // Add new supplier
    this.suppliers.push(supplier);
  }
  
  return this.save();
};

ProductSchema.methods.removeSupplier = function(supplierId: string) {
  this.suppliers = this.suppliers.filter(s => s.supplierId !== supplierId);
  return this.save();
};

// Ensure model follows Liskov Substitution Principle
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;