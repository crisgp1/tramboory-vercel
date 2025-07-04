import mongoose, { Schema, Document } from 'mongoose';
import { IBatch, IInventoryTotals } from '../../../types/inventory/index';

// Interface para el documento de Inventory
export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  locationId: string;
  locationName: string;
  batches: IBatch[];
  totals: IInventoryTotals;
  lastMovementId?: string;
  lastUpdated: Date;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquema para Batch
const BatchSchema = new Schema({
  batchId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
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
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'El costo por unidad debe ser un número válido'
    }
  },
  expiryDate: {
    type: Date,
    index: true
  },
  receivedDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  supplierBatchCode: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'reserved', 'quarantine', 'expired'],
    default: 'available',
    index: true
  }
}, { 
  _id: false,
  timestamps: false 
});

// Sub-esquema para Totals
const TotalsSchema = new Schema({
  available: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reserved: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  quarantine: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  }
}, { 
  _id: false,
  timestamps: false 
});

// Schema principal de Inventory
const InventorySchema = new Schema<IInventory>({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
    index: true
  },
  locationId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  locationName: {
    type: String,
    required: true,
    trim: true
  },
  batches: [BatchSchema],
  totals: {
    type: TotalsSchema,
    required: true
  },
  lastMovementId: {
    type: String,
    index: true
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  lastUpdatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'inventory'
});

// Índices compuestos
InventorySchema.index({ productId: 1, locationId: 1 }, { unique: true });
InventorySchema.index({ 'batches.expiryDate': 1, 'batches.status': 1 });
InventorySchema.index({ 'batches.status': 1, lastUpdated: -1 });
InventorySchema.index({ locationId: 1, lastUpdated: -1 });
InventorySchema.index({ 'totals.available': 1, productId: 1 });

// Middleware pre-save para recalcular totales
InventorySchema.pre('save', function(next) {
  (this as any).recalculateTotals();
  this.lastUpdated = new Date();
  next();
});

// Métodos de instancia
InventorySchema.methods.recalculateTotals = function() {
  const totals = {
    available: 0,
    reserved: 0,
    quarantine: 0,
    unit: this.totals.unit
  };

  this.batches.forEach((batch: IBatch) => {
    switch (batch.status) {
      case 'available':
        totals.available += batch.quantity;
        break;
      case 'reserved':
        totals.reserved += batch.quantity;
        break;
      case 'quarantine':
        totals.quarantine += batch.quantity;
        break;
      // Los lotes expirados no se cuentan en totales
    }
  });

  this.totals = totals;
  return this;
};

InventorySchema.methods.addBatch = function(batchData: Omit<IBatch, 'batchId'> & { batchId?: string }) {
  // Generar batchId si no se proporciona
  if (!batchData.batchId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    batchData.batchId = `${timestamp}${random}`.toUpperCase().substr(0, 12);
  }

  this.batches.push(batchData as IBatch);
  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return this;
};

InventorySchema.methods.updateBatch = function(batchId: string, updates: Partial<IBatch>) {
  const batch = this.batches.find((b: IBatch) => b.batchId === batchId);
  if (!batch) {
    throw new Error(`Lote ${batchId} no encontrado`);
  }

  Object.assign(batch, updates);
  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return this;
};

InventorySchema.methods.removeBatch = function(batchId: string) {
  const initialLength = this.batches.length;
  this.batches = this.batches.filter((b: IBatch) => b.batchId !== batchId);
  
  if (this.batches.length === initialLength) {
    throw new Error(`Lote ${batchId} no encontrado`);
  }

  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return this;
};

InventorySchema.methods.reserveQuantity = function(quantity: number, batchId?: string) {
  if (batchId) {
    // Reservar de un lote específico
    const batch = this.batches.find((b: IBatch) => b.batchId === batchId);
    if (!batch) {
      throw new Error(`Lote ${batchId} no encontrado`);
    }
    if (batch.status !== 'available') {
      throw new Error(`Lote ${batchId} no está disponible`);
    }
    if (batch.quantity < quantity) {
      throw new Error(`Cantidad insuficiente en lote ${batchId}`);
    }

    batch.quantity -= quantity;
    if (batch.quantity === 0) {
      batch.status = 'reserved';
    }

    // Crear nuevo lote reservado
    this.batches.push({
      ...batch,
      batchId: `${batch.batchId}-R${Date.now()}`,
      quantity: quantity,
      status: 'reserved'
    } as IBatch);
  } else {
    // Reservar usando FIFO
    let remainingToReserve = quantity;
    const availableBatches = this.batches
      .filter((b: IBatch) => b.status === 'available' && b.quantity > 0)
      .sort((a: any, b: any) => a.receivedDate.getTime() - b.receivedDate.getTime());

    for (const batch of availableBatches) {
      if (remainingToReserve <= 0) break;

      const toReserve = Math.min(batch.quantity, remainingToReserve);
      batch.quantity -= toReserve;
      remainingToReserve -= toReserve;

      // Crear lote reservado
      this.batches.push({
        ...batch,
        batchId: `${batch.batchId}-R${Date.now()}`,
        quantity: toReserve,
        status: 'reserved'
      } as IBatch);
    }

    if (remainingToReserve > 0) {
      throw new Error(`Stock insuficiente. Faltante: ${remainingToReserve}`);
    }
  }

  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return this;
};

InventorySchema.methods.releaseReservation = function(quantity: number, batchId?: string) {
  if (batchId) {
    const batch = this.batches.find((b: IBatch) => b.batchId === batchId);
    if (!batch || batch.status !== 'reserved') {
      throw new Error(`Lote reservado ${batchId} no encontrado`);
    }

    // Encontrar el lote original
    const originalBatchId = batch.batchId.split('-R')[0];
    let originalBatch = this.batches.find((b: IBatch) => b.batchId === originalBatchId);
    
    if (!originalBatch) {
      // Crear nuevo lote disponible
      originalBatch = {
        ...batch,
        batchId: originalBatchId,
        quantity: 0,
        status: 'available'
      } as IBatch;
      this.batches.push(originalBatch);
    }

    originalBatch.quantity += quantity;
    batch.quantity -= quantity;

    if (batch.quantity <= 0) {
      this.batches = this.batches.filter((b: IBatch) => b.batchId !== batchId);
    }
  } else {
    // Liberar reservas usando LIFO
    let remainingToRelease = quantity;
    const reservedBatches = this.batches
      .filter((b: IBatch) => b.status === 'reserved' && b.quantity > 0)
      .sort((a: any, b: any) => b.receivedDate.getTime() - a.receivedDate.getTime());

    for (const batch of reservedBatches) {
      if (remainingToRelease <= 0) break;

      const toRelease = Math.min(batch.quantity, remainingToRelease);
      batch.quantity -= toRelease;
      remainingToRelease -= toRelease;

      // Devolver al lote original
      const originalBatchId = batch.batchId.split('-R')[0];
      let originalBatch = this.batches.find((b: IBatch) => b.batchId === originalBatchId);
      
      if (!originalBatch) {
        originalBatch = {
          ...batch,
          batchId: originalBatchId,
          quantity: toRelease,
          status: 'available'
        } as IBatch;
        this.batches.push(originalBatch);
      } else {
        originalBatch.quantity += toRelease;
      }

      if (batch.quantity <= 0) {
        this.batches = this.batches.filter((b: IBatch) => b.batchId !== batch.batchId);
      }
    }
  }

  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return this;
};

InventorySchema.methods.consumeQuantity = function(quantity: number, method: 'FIFO' | 'LIFO' = 'FIFO') {
  let remainingToConsume = quantity;
  const availableBatches = this.batches
    .filter((b: IBatch) => b.status === 'available' && b.quantity > 0);

  if (method === 'FIFO') {
    availableBatches.sort((a: any, b: any) => a.receivedDate.getTime() - b.receivedDate.getTime());
  } else {
    availableBatches.sort((a: any, b: any) => b.receivedDate.getTime() - a.receivedDate.getTime());
  }

  const consumedBatches: Array<{ batchId: string; quantity: number; costPerUnit: number }> = [];

  for (const batch of availableBatches) {
    if (remainingToConsume <= 0) break;

    const toConsume = Math.min(batch.quantity, remainingToConsume);
    batch.quantity -= toConsume;
    remainingToConsume -= toConsume;

    consumedBatches.push({
      batchId: batch.batchId,
      quantity: toConsume,
      costPerUnit: batch.costPerUnit
    });

    if (batch.quantity <= 0) {
      this.batches = this.batches.filter((b: IBatch) => b.batchId !== batch.batchId);
    }
  }

  if (remainingToConsume > 0) {
    throw new Error(`Stock insuficiente. Faltante: ${remainingToConsume}`);
  }

  this.recalculateTotals();
  // No hacer save() automáticamente para evitar ParallelSaveError
  return { consumedBatches, inventory: this };
};

InventorySchema.methods.markExpiredBatches = function() {
  const now = new Date();
  let hasChanges = false;

  this.batches.forEach((batch: IBatch) => {
    if (batch.expiryDate && batch.expiryDate <= now && batch.status !== 'expired') {
      batch.status = 'expired';
      hasChanges = true;
    }
  });

  if (hasChanges) {
    this.recalculateTotals();
    // No hacer save() automáticamente para evitar ParallelSaveError
    return Promise.resolve(this);
  }

  return Promise.resolve(this);
};

// Métodos estáticos
InventorySchema.statics.findByProduct = function(productId: string) {
  return this.find({ productId }).populate('productId');
};

InventorySchema.statics.findByLocation = function(locationId: string) {
  return this.find({ locationId }).populate('productId');
};

InventorySchema.statics.findLowStock = function() {
  // Esta función requerirá una agregación compleja
  // Se implementará en el servicio de inventario
  return this.find({});
};

InventorySchema.statics.findExpiringBatches = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    'batches.expiryDate': { $lte: futureDate },
    'batches.status': 'available'
  }).populate('productId');
};

// Virtuals
InventorySchema.virtual('totalStock').get(function() {
  return this.totals.available + this.totals.reserved + this.totals.quarantine;
});

InventorySchema.virtual('availableBatches').get(function() {
  return this.batches.filter((batch: IBatch) => batch.status === 'available');
});

InventorySchema.virtual('expiredBatches').get(function() {
  return this.batches.filter((batch: IBatch) => batch.status === 'expired');
});

InventorySchema.virtual('averageCost').get(function() {
  const availableBatches = this.batches.filter((batch: IBatch) => batch.status === 'available');
  if (availableBatches.length === 0) return 0;

  const totalValue = availableBatches.reduce((sum: number, batch: IBatch) => 
    sum + (batch.quantity * batch.costPerUnit), 0);
  const totalQuantity = availableBatches.reduce((sum: number, batch: IBatch) => 
    sum + batch.quantity, 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
});

// Configurar virtuals en JSON
InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;
export { InventorySchema };