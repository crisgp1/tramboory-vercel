import mongoose, { Schema, Document } from 'mongoose';
import { MovementType, IMovementReference, IMovementCost } from '@/types/inventory';

// Interface para el documento de InventoryMovement
export interface IInventoryMovement extends Document {
  movementId: string;
  type: MovementType;
  productId: mongoose.Types.ObjectId;
  fromLocation?: string;
  toLocation?: string;
  quantity: number;
  unit: string;
  batchId?: string;
  reason?: string;
  reference?: IMovementReference;
  cost?: IMovementCost;
  performedBy: string;
  performedByName: string;
  notes?: string;
  metadata?: Record<string, any>;
  isReversed: boolean;
  reversalMovementId?: string;
  originalMovementId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquema para Reference
const ReferenceSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['purchase_order', 'sales_order', 'adjustment', 'transfer']
  },
  id: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Sub-esquema para Cost
const CostSchema = new Schema({
  unitCost: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'El costo unitario debe ser un número válido'
    }
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'El costo total debe ser un número válido'
    }
  },
  currency: {
    type: String,
    required: true,
    default: 'MXN',
    uppercase: true,
    trim: true
  }
}, { _id: false });

// Schema principal de InventoryMovement
const InventoryMovementSchema = new Schema<IInventoryMovement>({
  movementId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(MovementType),
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
    index: true
  },
  fromLocation: {
    type: String,
    trim: true,
    index: true
  },
  toLocation: {
    type: String,
    trim: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: function(value: number) {
        return value > 0 && !isNaN(value) && isFinite(value);
      },
      message: 'La cantidad debe ser un número positivo válido'
    }
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  batchId: {
    type: String,
    trim: true,
    index: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 200
  },
  reference: ReferenceSchema,
  cost: CostSchema,
  performedBy: {
    type: String,
    required: true,
    index: true
  },
  performedByName: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isReversed: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  reversalMovementId: {
    type: String,
    index: true
  },
  originalMovementId: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  collection: 'inventory_movements'
});

// Índices compuestos
InventoryMovementSchema.index({ productId: 1, createdAt: -1 });
InventoryMovementSchema.index({ type: 1, createdAt: -1 });
InventoryMovementSchema.index({ performedBy: 1, createdAt: -1 });
InventoryMovementSchema.index({ 'reference.type': 1, 'reference.id': 1 });
InventoryMovementSchema.index({ fromLocation: 1, toLocation: 1, createdAt: -1 });
InventoryMovementSchema.index({ batchId: 1, createdAt: -1 });
InventoryMovementSchema.index({ isReversed: 1, createdAt: -1 });

// Validaciones personalizadas
InventoryMovementSchema.pre('validate', function(next) {
  // Validar ubicaciones según el tipo de movimiento
  switch (this.type) {
    case MovementType.ENTRADA:
      if (!this.toLocation) {
        this.invalidate('toLocation', 'La ubicación de destino es requerida para entradas');
      }
      if (this.fromLocation) {
        this.invalidate('fromLocation', 'Las entradas no deben tener ubicación de origen');
      }
      break;

    case MovementType.SALIDA:
      if (!this.fromLocation) {
        this.invalidate('fromLocation', 'La ubicación de origen es requerida para salidas');
      }
      if (this.toLocation) {
        this.invalidate('toLocation', 'Las salidas no deben tener ubicación de destino');
      }
      break;

    case MovementType.TRANSFERENCIA:
      if (!this.fromLocation || !this.toLocation) {
        this.invalidate('fromLocation', 'Las transferencias requieren ubicación de origen y destino');
        this.invalidate('toLocation', 'Las transferencias requieren ubicación de origen y destino');
      }
      if (this.fromLocation === this.toLocation) {
        this.invalidate('toLocation', 'La ubicación de destino debe ser diferente a la de origen');
      }
      break;

    case MovementType.AJUSTE:
      if (!this.toLocation) {
        this.invalidate('toLocation', 'La ubicación es requerida para ajustes');
      }
      if (!this.reason) {
        this.invalidate('reason', 'La razón es requerida para ajustes');
      }
      break;

    case MovementType.MERMA:
      if (!this.fromLocation) {
        this.invalidate('fromLocation', 'La ubicación de origen es requerida para mermas');
      }
      if (!this.reason) {
        this.invalidate('reason', 'La razón es requerida para mermas');
      }
      break;
  }

  // Validar que el costo total coincida con unitCost * quantity
  if (this.cost) {
    const expectedTotal = this.cost.unitCost * this.quantity;
    const tolerance = 0.01; // Tolerancia de 1 centavo
    if (Math.abs(this.cost.totalCost - expectedTotal) > tolerance) {
      this.invalidate('cost.totalCost', 'El costo total debe coincidir con el costo unitario multiplicado por la cantidad');
    }
  }

  next();
});

// Middleware pre-save
InventoryMovementSchema.pre('save', function(next) {
  // Calcular costo total si no está definido
  if (this.cost && this.cost.unitCost && !this.cost.totalCost) {
    this.cost.totalCost = this.cost.unitCost * this.quantity;
  }

  next();
});

// Métodos de instancia
InventoryMovementSchema.methods.reverse = function(performedBy: string, performedByName: string, reason?: string) {
  if (this.isReversed) {
    throw new Error('Este movimiento ya ha sido revertido');
  }

  // Crear movimiento de reversión
  const reversalData = {
    movementId: `REV-${this.movementId}`,
    type: this.getReversalType(),
    productId: this.productId,
    fromLocation: this.toLocation, // Intercambiar ubicaciones
    toLocation: this.fromLocation,
    quantity: this.quantity,
    unit: this.unit,
    batchId: this.batchId,
    reason: reason || `Reversión de ${this.movementId}`,
    cost: this.cost,
    performedBy,
    performedByName,
    notes: `Reversión automática de movimiento ${this.movementId}`,
    originalMovementId: this.movementId,
    metadata: {
      ...this.metadata,
      isReversal: true,
      originalMovement: this.movementId
    }
  };

  // Marcar este movimiento como revertido
  this.isReversed = true;
  this.reversalMovementId = reversalData.movementId;

  return { reversalData, originalMovement: this.save() };
};

InventoryMovementSchema.methods.getReversalType = function(): MovementType {
  switch (this.type) {
    case MovementType.ENTRADA:
      return MovementType.SALIDA;
    case MovementType.SALIDA:
      return MovementType.ENTRADA;
    case MovementType.TRANSFERENCIA:
      return MovementType.TRANSFERENCIA; // Las transferencias se revierten con otra transferencia
    case MovementType.AJUSTE:
      return MovementType.AJUSTE; // Los ajustes se revierten con otro ajuste
    case MovementType.MERMA:
      return MovementType.ENTRADA; // Las mermas se revierten con entradas
    default:
      throw new Error(`Tipo de movimiento ${this.type} no puede ser revertido`);
  }
};

InventoryMovementSchema.methods.canBeReversed = function(): boolean {
  return !this.isReversed && !this.originalMovementId; // No es reversión ni ya fue revertido
};

// Métodos estáticos
InventoryMovementSchema.statics.findByProduct = function(productId: string, limit: number = 50) {
  return this.find({ productId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId');
};

InventoryMovementSchema.statics.findByLocation = function(location: string, limit: number = 50) {
  return this.find({
    $or: [
      { fromLocation: location },
      { toLocation: location }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId');
};

InventoryMovementSchema.statics.findByType = function(type: MovementType, limit: number = 50) {
  return this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId');
};

InventoryMovementSchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ performedBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('productId');
};

InventoryMovementSchema.statics.findByReference = function(referenceType: string, referenceId: string) {
  return this.find({
    'reference.type': referenceType,
    'reference.id': referenceId
  })
    .sort({ createdAt: -1 })
    .populate('productId');
};

InventoryMovementSchema.statics.findByBatch = function(batchId: string) {
  return this.find({ batchId })
    .sort({ createdAt: -1 })
    .populate('productId');
};

InventoryMovementSchema.statics.getMovementHistory = function(
  productId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { productId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('productId');
};

InventoryMovementSchema.statics.getLocationTransfers = function(
  fromLocation?: string,
  toLocation?: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { type: MovementType.TRANSFERENCIA };
  
  if (fromLocation) query.fromLocation = fromLocation;
  if (toLocation) query.toLocation = toLocation;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('productId');
};

InventoryMovementSchema.statics.getCostAnalysis = function(
  productId: string,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {
    productId: new mongoose.Types.ObjectId(productId),
    cost: { $exists: true }
  };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost.totalCost' },
        averageUnitCost: { $avg: '$cost.unitCost' },
        minUnitCost: { $min: '$cost.unitCost' },
        maxUnitCost: { $max: '$cost.unitCost' },
        movementCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Virtuals
InventoryMovementSchema.virtual('isEntry').get(function() {
  return this.type === MovementType.ENTRADA ||
         (this.type === MovementType.AJUSTE && this.quantity > 0);
});

InventoryMovementSchema.virtual('isExit').get(function() {
  return this.type === MovementType.SALIDA ||
         this.type === MovementType.MERMA ||
         (this.type === MovementType.AJUSTE && this.quantity < 0);
});

InventoryMovementSchema.virtual('isTransfer').get(function() {
  return this.type === MovementType.TRANSFERENCIA;
});

InventoryMovementSchema.virtual('totalValue').get(function() {
  return this.cost ? this.cost.totalCost : 0;
});

InventoryMovementSchema.virtual('unitValue').get(function() {
  return this.cost ? this.cost.unitCost : 0;
});

InventoryMovementSchema.virtual('hasReference').get(function() {
  return !!(this.reference && this.reference.type && this.reference.id);
});

// Configurar virtuals en JSON
InventoryMovementSchema.set('toJSON', { virtuals: true });
InventoryMovementSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const InventoryMovement = mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);

export default InventoryMovement;
export { InventoryMovementSchema };