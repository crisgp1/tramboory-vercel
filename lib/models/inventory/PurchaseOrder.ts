import mongoose, { Schema, Document } from 'mongoose';
import { PurchaseOrderStatus } from '@/types/inventory';

// Interface para items de la orden de compra
export interface IPurchaseOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string; // Denormalizado
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// Interface para el documento de PurchaseOrder
export interface IPurchaseOrder extends Document {
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string; // Denormalizado
  status: PurchaseOrderStatus;
  items: IPurchaseOrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryLocation: string;
  paymentTerms: {
    method: 'cash' | 'credit' | 'transfer' | 'check';
    creditDays: number;
    dueDate?: Date;
  };
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
  attachments?: string[];
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquema para items
const PurchaseOrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.001,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'La cantidad debe ser un número válido'
    }
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'El precio unitario debe ser un número válido'
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'El precio total debe ser un número válido'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: false });

// Sub-esquema para términos de pago
const PaymentTermsSchema = new Schema({
  method: {
    type: String,
    required: true,
    enum: ['cash', 'credit', 'transfer', 'check'],
    default: 'cash'
  },
  creditDays: {
    type: Number,
    required: true,
    min: 0,
    max: 365,
    default: 0
  },
  dueDate: {
    type: Date
  }
}, { _id: false });

// Schema principal de PurchaseOrder
const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  purchaseOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  supplierId: {
    type: String,
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(PurchaseOrderStatus),
    default: PurchaseOrderStatus.DRAFT,
    index: true
  },
  items: {
    type: [PurchaseOrderItemSchema],
    required: true,
    validate: {
      validator: function(items: IPurchaseOrderItem[]) {
        return items.length > 0;
      },
      message: 'La orden debe tener al menos un item'
    }
  },
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
    default: 0.16 // 16% IVA México
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
    uppercase: true
  },
  expectedDeliveryDate: {
    type: Date,
    index: true
  },
  actualDeliveryDate: {
    type: Date,
    index: true
  },
  deliveryLocation: {
    type: String,
    required: true,
    trim: true
  },
  paymentTerms: {
    type: PaymentTermsSchema,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  approvedBy: {
    type: String,
    index: true
  },
  approvedAt: {
    type: Date,
    index: true
  },
  orderedBy: {
    type: String,
    index: true
  },
  orderedAt: {
    type: Date,
    index: true
  },
  receivedBy: {
    type: String,
    index: true
  },
  receivedAt: {
    type: Date,
    index: true
  },
  cancelledBy: {
    type: String,
    index: true
  },
  cancelledAt: {
    type: Date,
    index: true
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  attachments: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'purchase_orders'
});

// Índices compuestos
PurchaseOrderSchema.index({ supplierId: 1, status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ status: 1, expectedDeliveryDate: 1 });
PurchaseOrderSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ 'items.productId': 1, status: 1 });

// Validaciones personalizadas
PurchaseOrderSchema.pre('validate', function(next) {
  // Validar que los totales de items coincidan con el subtotal
  const calculatedSubtotal = this.items.reduce((sum: number, item: IPurchaseOrderItem) => 
    sum + item.totalPrice, 0);
  
  const tolerance = 0.01;
  if (Math.abs(this.subtotal - calculatedSubtotal) > tolerance) {
    this.invalidate('subtotal', 'El subtotal debe coincidir con la suma de los items');
  }

  // Validar que el total coincida con subtotal + tax
  const calculatedTotal = this.subtotal + this.tax;
  if (Math.abs(this.total - calculatedTotal) > tolerance) {
    this.invalidate('total', 'El total debe coincidir con subtotal + impuestos');
  }

  // Validar que el tax coincida con subtotal * taxRate
  const calculatedTax = this.subtotal * this.taxRate;
  if (Math.abs(this.tax - calculatedTax) > tolerance) {
    this.invalidate('tax', 'El impuesto debe coincidir con subtotal * tasa de impuesto');
  }

  // Validar fechas según el estado
  if (this.status === PurchaseOrderStatus.APPROVED && !this.approvedBy) {
    this.invalidate('approvedBy', 'approvedBy es requerido para órdenes aprobadas');
  }

  if (this.status === PurchaseOrderStatus.ORDERED && !this.orderedBy) {
    this.invalidate('orderedBy', 'orderedBy es requerido para órdenes enviadas');
  }

  if (this.status === PurchaseOrderStatus.RECEIVED && !this.receivedBy) {
    this.invalidate('receivedBy', 'receivedBy es requerido para órdenes recibidas');
  }

  if (this.status === PurchaseOrderStatus.CANCELLED && !this.cancelledBy) {
    this.invalidate('cancelledBy', 'cancelledBy es requerido para órdenes canceladas');
  }

  next();
});

// Middleware pre-save
PurchaseOrderSchema.pre('save', function(next) {
  // Recalcular totales automáticamente
  (this as any).recalculateTotals();

  // Calcular fecha de vencimiento de pago
  if (this.paymentTerms.creditDays > 0 && this.receivedAt && !this.paymentTerms.dueDate) {
    const dueDate = new Date(this.receivedAt);
    dueDate.setDate(dueDate.getDate() + this.paymentTerms.creditDays);
    this.paymentTerms.dueDate = dueDate;
  }

  // Establecer fechas automáticamente según el estado
  const now = new Date();
  switch (this.status) {
    case PurchaseOrderStatus.APPROVED:
      if (!this.approvedAt) this.approvedAt = now;
      break;
    case PurchaseOrderStatus.ORDERED:
      if (!this.orderedAt) this.orderedAt = now;
      break;
    case PurchaseOrderStatus.RECEIVED:
      if (!this.receivedAt) this.receivedAt = now;
      if (!this.actualDeliveryDate) this.actualDeliveryDate = now;
      break;
    case PurchaseOrderStatus.CANCELLED:
      if (!this.cancelledAt) this.cancelledAt = now;
      break;
  }

  next();
});

// Métodos de instancia
PurchaseOrderSchema.methods.recalculateTotals = function() {
  // Recalcular totales de items
  this.items.forEach((item: IPurchaseOrderItem) => {
    item.totalPrice = item.quantity * item.unitPrice;
  });

  // Recalcular subtotal
  this.subtotal = this.items.reduce((sum: number, item: IPurchaseOrderItem) => 
    sum + item.totalPrice, 0);

  // Recalcular impuestos
  this.tax = this.subtotal * this.taxRate;

  // Recalcular total
  this.total = this.subtotal + this.tax;

  return this;
};

PurchaseOrderSchema.methods.addItem = function(itemData: Omit<IPurchaseOrderItem, 'totalPrice'>) {
  const item = {
    ...itemData,
    totalPrice: itemData.quantity * itemData.unitPrice
  };
  
  this.items.push(item);
  this.recalculateTotals();
  return this.save();
};

PurchaseOrderSchema.methods.removeItem = function(productId: string) {
  this.items = this.items.filter((item: IPurchaseOrderItem) => 
    item.productId.toString() !== productId);
  this.recalculateTotals();
  return this.save();
};

PurchaseOrderSchema.methods.updateItem = function(productId: string, updates: Partial<IPurchaseOrderItem>) {
  const item = this.items.find((item: IPurchaseOrderItem) => 
    item.productId.toString() === productId);
  
  if (!item) {
    throw new Error(`Item con productId ${productId} no encontrado`);
  }

  Object.assign(item, updates);
  if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
    item.totalPrice = item.quantity * item.unitPrice;
  }
  
  this.recalculateTotals();
  return this.save();
};

PurchaseOrderSchema.methods.approve = function(userId: string) {
  if (this.status !== PurchaseOrderStatus.PENDING) {
    throw new Error('Solo se pueden aprobar órdenes pendientes');
  }
  
  this.status = PurchaseOrderStatus.APPROVED;
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

PurchaseOrderSchema.methods.order = function(userId: string) {
  if (this.status !== PurchaseOrderStatus.APPROVED) {
    throw new Error('Solo se pueden enviar órdenes aprobadas');
  }
  
  this.status = PurchaseOrderStatus.ORDERED;
  this.orderedBy = userId;
  this.orderedAt = new Date();
  return this.save();
};

PurchaseOrderSchema.methods.receive = function(userId: string, actualDeliveryDate?: Date) {
  if (this.status !== PurchaseOrderStatus.ORDERED) {
    throw new Error('Solo se pueden recibir órdenes enviadas');
  }
  
  this.status = PurchaseOrderStatus.RECEIVED;
  this.receivedBy = userId;
  this.receivedAt = new Date();
  this.actualDeliveryDate = actualDeliveryDate || new Date();
  return this.save();
};

PurchaseOrderSchema.methods.cancel = function(userId: string, reason: string) {
  if ([PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(this.status)) {
    throw new Error('No se pueden cancelar órdenes recibidas o ya canceladas');
  }
  
  this.status = PurchaseOrderStatus.CANCELLED;
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

PurchaseOrderSchema.methods.canBeModified = function(): boolean {
  return [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING].includes(this.status);
};

PurchaseOrderSchema.methods.canBeApproved = function(): boolean {
  return this.status === PurchaseOrderStatus.PENDING;
};

PurchaseOrderSchema.methods.canBeOrdered = function(): boolean {
  return this.status === PurchaseOrderStatus.APPROVED;
};

PurchaseOrderSchema.methods.canBeReceived = function(): boolean {
  return this.status === PurchaseOrderStatus.ORDERED;
};

PurchaseOrderSchema.methods.canBeCancelled = function(): boolean {
  return ![PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(this.status);
};

// Métodos estáticos
PurchaseOrderSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ supplierId }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.findByStatus = function(status: PurchaseOrderStatus) {
  return this.find({ status }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.findPending = function() {
  return this.find({ status: PurchaseOrderStatus.PENDING }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    status: PurchaseOrderStatus.ORDERED,
    expectedDeliveryDate: { $lt: now }
  }).sort({ expectedDeliveryDate: 1 });
};

PurchaseOrderSchema.statics.findByProduct = function(productId: string) {
  return this.find({ 'items.productId': productId }).sort({ createdAt: -1 });
};

PurchaseOrderSchema.statics.getSupplierStats = function(supplierId: string, startDate?: Date, endDate?: Date) {
  const matchStage: any = { supplierId };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' },
        averageValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Virtuals
PurchaseOrderSchema.virtual('isOverdue').get(function() {
  return this.status === PurchaseOrderStatus.ORDERED && 
         this.expectedDeliveryDate && 
         this.expectedDeliveryDate < new Date();
});

PurchaseOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.expectedDeliveryDate) return null;
  const diffTime = this.expectedDeliveryDate.getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

PurchaseOrderSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

PurchaseOrderSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum: number, item: IPurchaseOrderItem) => sum + item.quantity, 0);
});

PurchaseOrderSchema.virtual('averageItemPrice').get(function() {
  if (this.items.length === 0) return 0;
  return this.subtotal / this.items.length;
});

PurchaseOrderSchema.virtual('isPaymentOverdue').get(function() {
  return this.paymentTerms.dueDate && this.paymentTerms.dueDate < new Date();
});

// Configurar virtuals en JSON
PurchaseOrderSchema.set('toJSON', { virtuals: true });
PurchaseOrderSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const PurchaseOrder = mongoose.models.PurchaseOrder || 
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
export { PurchaseOrderSchema };