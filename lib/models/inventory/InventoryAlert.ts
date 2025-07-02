import mongoose, { Schema, Document } from 'mongoose';
import { AlertPriority, AlertType } from '@/types/inventory';

export interface IInventoryAlert extends Document {
  _id: mongoose.Types.ObjectId;
  type: AlertType;
  priority: AlertPriority;
  message: string;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  expirationDate?: Date;
  metadata?: Record<string, any>;
  status: 'active' | 'dismissed' | 'resolved';
  createdBy: string;
  dismissedBy?: string;
  dismissedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryAlertSchema = new Schema<IInventoryAlert>({
  type: {
    type: String,
    enum: Object.values(AlertType),
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(AlertPriority),
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productName: {
    type: String,
    trim: true,
    required: false
  },
  currentStock: {
    type: Number,
    min: 0,
    required: false
  },
  minStock: {
    type: Number,
    min: 0,
    required: false
  },
  expirationDate: {
    type: Date,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'dismissed', 'resolved'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true
  },
  dismissedBy: {
    type: String,
    required: false
  },
  dismissedAt: {
    type: Date,
    required: false
  },
  resolvedBy: {
    type: String,
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'inventory_alerts'
});

// Índices para optimizar consultas
InventoryAlertSchema.index({ status: 1, priority: -1, createdAt: -1 });
InventoryAlertSchema.index({ productId: 1, status: 1 });
InventoryAlertSchema.index({ type: 1, status: 1 });
InventoryAlertSchema.index({ createdBy: 1, status: 1 });

// Métodos de instancia
InventoryAlertSchema.methods.dismiss = function(userId: string) {
  this.status = 'dismissed';
  this.dismissedBy = userId;
  this.dismissedAt = new Date();
  return this.save();
};

InventoryAlertSchema.methods.resolve = function(userId: string) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

// Métodos estáticos
InventoryAlertSchema.statics.createLowStockAlert = function(productId: string, productName: string, currentStock: number, minStock: number, createdBy: string) {
  return this.create({
    type: AlertType.LOW_STOCK,
    priority: currentStock === 0 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
    message: `Stock bajo para ${productName}. Stock actual: ${currentStock}, Stock mínimo: ${minStock}`,
    productId,
    productName,
    currentStock,
    minStock,
    createdBy,
    metadata: {
      stockDifference: minStock - currentStock,
      isOutOfStock: currentStock === 0
    }
  });
};

InventoryAlertSchema.statics.createExpiryAlert = function(productId: string, productName: string, expirationDate: Date, createdBy: string) {
  const daysUntilExpiry = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  let priority = AlertPriority.LOW;
  if (daysUntilExpiry <= 0) {
    priority = AlertPriority.CRITICAL;
  } else if (daysUntilExpiry <= 3) {
    priority = AlertPriority.HIGH;
  } else if (daysUntilExpiry <= 7) {
    priority = AlertPriority.MEDIUM;
  }

  const message = daysUntilExpiry <= 0 
    ? `${productName} ha vencido el ${expirationDate.toLocaleDateString()}`
    : `${productName} vence en ${daysUntilExpiry} días (${expirationDate.toLocaleDateString()})`;

  return this.create({
    type: daysUntilExpiry <= 0 ? AlertType.EXPIRED_PRODUCT : AlertType.EXPIRY_WARNING,
    priority,
    message,
    productId,
    productName,
    expirationDate,
    createdBy,
    metadata: {
      daysUntilExpiry,
      isExpired: daysUntilExpiry <= 0
    }
  });
};

InventoryAlertSchema.statics.getActiveAlerts = function(filters: any = {}) {
  const query = { status: 'active', ...filters };
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('productId', 'name sku category');
};

InventoryAlertSchema.statics.getAlertsByPriority = function(priority: AlertPriority) {
  return this.find({ status: 'active', priority })
    .sort({ createdAt: -1 })
    .populate('productId', 'name sku category');
};

InventoryAlertSchema.statics.getAlertsByType = function(type: AlertType) {
  return this.find({ status: 'active', type })
    .sort({ priority: -1, createdAt: -1 })
    .populate('productId', 'name sku category');
};

// Middleware para limpiar alertas duplicadas
InventoryAlertSchema.pre('save', async function(next) {
  if (this.isNew && this.productId && this.type) {
    // Evitar alertas duplicadas del mismo tipo para el mismo producto
    const Model = this.constructor as any;
    const existingAlert = await Model.findOne({
      productId: this.productId,
      type: this.type,
      status: 'active'
    });

    if (existingAlert) {
      // Actualizar la alerta existente en lugar de crear una nueva
      existingAlert.message = this.message;
      existingAlert.priority = this.priority;
      existingAlert.metadata = this.metadata;
      existingAlert.updatedAt = new Date();
      await existingAlert.save();
      
      // Prevenir la creación de la nueva alerta
      const error = new Error('Alert already exists for this product and type');
      return next(error);
    }
  }
  next();
});

const InventoryAlert = mongoose.models.InventoryAlert || mongoose.model<IInventoryAlert>('InventoryAlert', InventoryAlertSchema);

export default InventoryAlert;