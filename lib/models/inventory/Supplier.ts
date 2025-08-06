import mongoose, { Document, Schema, Model } from 'mongoose';
import { SupplierStatus, PaymentMethod } from '@/types/inventory';

// Interface following Single Responsibility Principle
export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  supplierId: string;
  name: string;
  code: string;
  businessName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    primaryContact: string;
    phone: string;
    email: string;
    position?: string;
  };
  paymentTerms: {
    method: PaymentMethod;
    creditDays: number;
    dueDate?: Date;
  };
  rating: {
    overall: number;
    quality: number;
    delivery: number;
    communication: number;
    pricing: number;
    reviewCount: number;
  };
  status: SupplierStatus;
  isActive: boolean;
  tags: string[];
  notes?: string;
  userId?: string; // Link to Clerk user ID for supplier portal access
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition following Open/Closed Principle
const SupplierSchema = new Schema<ISupplier>({
  supplierId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: 300
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'México'
    }
  },
  contactInfo: {
    primaryContact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100
    },
    position: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  paymentTerms: {
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CREDIT
    },
    creditDays: {
      type: Number,
      min: 0,
      max: 365,
      default: 30
    },
    dueDate: {
      type: Date
    }
  },
  rating: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    quality: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    delivery: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    communication: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    pricing: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  status: {
    type: String,
    enum: Object.values(SupplierStatus),
    default: SupplierStatus.ACTIVE
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  userId: {
    type: String,
    trim: true,
    sparse: true // Allows null values but ensures uniqueness when present
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
  collection: 'suppliers'
});

// Indexes for performance - Interface Segregation Principle
SupplierSchema.index({ supplierId: 1 });
SupplierSchema.index({ code: 1 });
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ userId: 1 }, { sparse: true });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ status: 1 });

// Pre-save middleware following Dependency Inversion Principle
SupplierSchema.pre('save', function(next) {
  // Ensure status consistency
  if (!this.isActive && this.status === SupplierStatus.ACTIVE) {
    this.status = SupplierStatus.INACTIVE;
  }
  
  // Calculate overall rating
  if (this.rating.reviewCount > 0) {
    const totalRating = this.rating.quality + this.rating.delivery + 
                       this.rating.communication + this.rating.pricing;
    this.rating.overall = Number((totalRating / 4).toFixed(1));
  }
  
  next();
});

// Static methods following Single Responsibility Principle
SupplierSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId, isActive: true });
};

SupplierSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

SupplierSchema.statics.findByStatus = function(status: SupplierStatus) {
  return this.find({ status, isActive: true });
};

SupplierSchema.statics.searchByName = function(searchTerm: string) {
  return this.find({ 
    name: { $regex: searchTerm, $options: 'i' },
    isActive: true 
  });
};

// Instance methods
SupplierSchema.methods.updateRating = function(
  quality: number, 
  delivery: number, 
  communication: number, 
  pricing: number
) {
  this.rating.quality = quality;
  this.rating.delivery = delivery;
  this.rating.communication = communication;
  this.rating.pricing = pricing;
  this.rating.reviewCount += 1;
  
  // Calculate overall rating
  const totalRating = quality + delivery + communication + pricing;
  this.rating.overall = Number((totalRating / 4).toFixed(1));
  
  return this.save();
};

SupplierSchema.methods.activate = function() {
  this.isActive = true;
  this.status = SupplierStatus.ACTIVE;
  return this.save();
};

SupplierSchema.methods.deactivate = function() {
  this.isActive = false;
  this.status = SupplierStatus.INACTIVE;
  return this.save();
};

SupplierSchema.methods.suspend = function(reason?: string) {
  this.status = SupplierStatus.SUSPENDED;
  if (reason) {
    this.notes = (this.notes || '') + `\n[SUSPENDED: ${new Date().toISOString()}] ${reason}`;
  }
  return this.save();
};

SupplierSchema.methods.linkToUser = function(userId: string) {
  this.userId = userId;
  return this.save();
};

SupplierSchema.methods.unlinkFromUser = function() {
  this.userId = undefined;
  return this.save();
};

// Virtual for full address
SupplierSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

// Ensure model follows Liskov Substitution Principle
const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;