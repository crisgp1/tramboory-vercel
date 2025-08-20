import mongoose, { Document, Schema, Model } from 'mongoose';
import { PurchaseOrderStatus, PaymentMethod, PurchaseOrderItem, PaymentTerms } from '@/types/inventory';

// Interface following Single Responsibility Principle
export interface IPurchaseOrder extends Document {
  _id: mongoose.Types.ObjectId;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryLocation: string;
  paymentTerms: PaymentTerms;
  notes?: string;
  internalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  orderedBy?: string;
  orderedAt?: Date;
  receivedBy?: string;
  receivedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition following Open/Closed Principle
const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  purchaseOrderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplierId: {
    type: String,
    required: true,
    trim: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: Object.values(PurchaseOrderStatus),
    default: PurchaseOrderStatus.DRAFT
  },
  items: [{
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
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
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.16 // 16% IVA in Mexico
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'MXN',
    maxlength: 3
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  deliveryLocation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  paymentTerms: {
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true
    },
    creditDays: {
      type: Number,
      required: true,
      min: 0,
      max: 365
    },
    dueDate: {
      type: Date
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },
  orderedBy: {
    type: String,
    trim: true
  },
  orderedAt: {
    type: Date
  },
  receivedBy: {
    type: String,
    trim: true
  },
  receivedAt: {
    type: Date
  },
  cancelledBy: {
    type: String,
    trim: true
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
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
  collection: 'purchase_orders'
});

// Indexes for performance - Interface Segregation Principle
// Note: purchaseOrderId already has unique index from schema definition
PurchaseOrderSchema.index({ supplierId: 1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ createdAt: -1 });
PurchaseOrderSchema.index({ expectedDeliveryDate: 1 });
PurchaseOrderSchema.index({ approvedAt: -1 });

// Pre-save middleware following Dependency Inversion Principle
PurchaseOrderSchema.pre('save', function(next) {
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.tax = this.subtotal * this.taxRate;
  this.total = this.subtotal + this.tax;
  
  // Set due date based on payment terms
  if (this.paymentTerms.method === PaymentMethod.CREDIT && this.paymentTerms.creditDays > 0) {
    const orderDate = this.orderedAt || this.createdAt || new Date();
    this.paymentTerms.dueDate = new Date(orderDate.getTime() + (this.paymentTerms.creditDays * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Static methods following Single Responsibility Principle
PurchaseOrderSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ supplierId }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.findByStatus = function(status: PurchaseOrderStatus) {
  return this.find({ status }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.findOverdue = function() {
  const today = new Date();
  return this.find({
    status: { $in: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.APPROVED] },
    expectedDeliveryDate: { $lt: today }
  });
};

PurchaseOrderSchema.statics.findRecentBySupplier = function(supplierId: string, limit: number = 5) {
  return this.find({ supplierId })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

PurchaseOrderSchema.statics.getStatsBySupplier = function(supplierId: string) {
  return this.aggregate([
    { $match: { supplierId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);
};

// Instance methods
PurchaseOrderSchema.methods.approve = function(approvedBy: string) {
  this.status = PurchaseOrderStatus.APPROVED;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.updatedBy = approvedBy;
  return this.save();
};

PurchaseOrderSchema.methods.order = function(orderedBy: string) {
  if (this.status !== PurchaseOrderStatus.APPROVED) {
    throw new Error('Purchase order must be approved before ordering');
  }
  
  this.status = PurchaseOrderStatus.ORDERED;
  this.orderedBy = orderedBy;
  this.orderedAt = new Date();
  this.updatedBy = orderedBy;
  return this.save();
};

PurchaseOrderSchema.methods.receive = function(receivedBy: string, actualDeliveryDate?: Date) {
  if (this.status !== PurchaseOrderStatus.ORDERED) {
    throw new Error('Purchase order must be ordered before receiving');
  }
  
  this.status = PurchaseOrderStatus.RECEIVED;
  this.receivedBy = receivedBy;
  this.receivedAt = new Date();
  this.actualDeliveryDate = actualDeliveryDate || new Date();
  this.updatedBy = receivedBy;
  return this.save();
};

PurchaseOrderSchema.methods.cancel = function(cancelledBy: string, reason?: string) {
  if (this.status === PurchaseOrderStatus.RECEIVED) {
    throw new Error('Cannot cancel a received purchase order');
  }
  
  this.status = PurchaseOrderStatus.CANCELLED;
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.updatedBy = cancelledBy;
  return this.save();
};

PurchaseOrderSchema.methods.addItem = function(item: PurchaseOrderItem) {
  // Calculate total price for the item
  item.totalPrice = item.quantity * item.unitPrice;
  this.items.push(item);
  return this.save();
};

PurchaseOrderSchema.methods.removeItem = function(productId: string) {
  this.items = this.items.filter((item: any) => item.productId !== productId);
  return this.save();
};

PurchaseOrderSchema.methods.updateItem = function(productId: string, updates: Partial<PurchaseOrderItem>) {
  const itemIndex = this.items.findIndex((item: any) => item.productId === productId);
  
  if (itemIndex >= 0) {
    this.items[itemIndex] = { ...this.items[itemIndex], ...updates };
    // Recalculate total price
    this.items[itemIndex].totalPrice = this.items[itemIndex].quantity * this.items[itemIndex].unitPrice;
  }
  
  return this.save();
};

PurchaseOrderSchema.methods.isOverdue = function(): boolean {
  return !!(this.expectedDeliveryDate && 
           this.expectedDeliveryDate < new Date() &&
           this.status !== PurchaseOrderStatus.RECEIVED &&
           this.status !== PurchaseOrderStatus.CANCELLED);
};

PurchaseOrderSchema.methods.canBeApproved = function(): boolean {
  return this.status === PurchaseOrderStatus.PENDING && this.items.length > 0;
};

PurchaseOrderSchema.methods.canBeOrdered = function(): boolean {
  return this.status === PurchaseOrderStatus.APPROVED;
};

PurchaseOrderSchema.methods.canBeReceived = function(): boolean {
  return this.status === PurchaseOrderStatus.ORDERED;
};

PurchaseOrderSchema.methods.canBeCancelled = function(): boolean {
  return this.status !== PurchaseOrderStatus.RECEIVED && this.status !== PurchaseOrderStatus.CANCELLED;
};

// Virtual for days until delivery
PurchaseOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.expectedDeliveryDate) return null;
  
  const today = new Date();
  const diffTime = this.expectedDeliveryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
PurchaseOrderSchema.virtual('deliveryStatus').get(function() {
  if (this.status === PurchaseOrderStatus.RECEIVED) return 'delivered';
  if ((this as any).isOverdue()) return 'overdue';
  if (this.expectedDeliveryDate) {
    const daysUntil = (this as any).daysUntilDelivery;
    if (daysUntil !== null) {
      if (daysUntil <= 0) return 'due';
      if (daysUntil <= 3) return 'soon';
      return 'scheduled';
    }
  }
  return 'unknown';
});

// Ensure model follows Liskov Substitution Principle
const PurchaseOrder: Model<IPurchaseOrder> = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;