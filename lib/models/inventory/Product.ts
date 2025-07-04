import mongoose, { Schema, Document } from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/types/inventory';

// Interfaces locales para el modelo Product
interface IUnit {
  code: string;
  name: string;
  category: 'volume' | 'weight' | 'piece' | 'length';
}

interface IAlternativeUnit extends IUnit {
  conversionFactor: number;
  conversionType: 'fixed_volume' | 'contains' | 'weight';
  containedUnit?: string;
}

interface IUnits {
  base: IUnit;
  alternatives: IAlternativeUnit[];
}

interface IPricingTier {
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  pricePerUnit: number;
  type: 'retail' | 'wholesale' | 'bulk';
}

interface ISupplierReference {
  supplierId: string;
  supplierName: string;
  isPreferred: boolean;
  lastPurchasePrice?: number;
  leadTimeDays: number;
}

interface IStockLevels {
  minimum: number;
  reorderPoint: number;
  unit: string;
}

interface IExpiryInfo {
  hasExpiry: boolean;
  shelfLifeDays?: number;
  warningDays?: number;
}

type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Interface para el documento de Product
export interface IProduct extends Document {
  productId: string;
  name: string;
  description?: string;
  category: ProductCategory;
  sku?: string; // Stock Keeping Unit
  barcode?: string;
  baseUnit: string;
  units: IUnits;
  pricing: {
    tieredPricing: IPricingTier[];
    lastCost?: number;
    averageCost?: number;
  };
  suppliers: ISupplierReference[];
  stockLevels: IStockLevels;
  expiryInfo?: IExpiryInfo;
  specifications?: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    color?: string;
    brand?: string;
    model?: string;
  };
  images?: string[];
  tags?: string[];
  isActive: boolean;
  isPerishable: boolean;
  requiresBatch: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquemas
const UnitSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['volume', 'weight', 'piece', 'length'] 
  }
}, { _id: false });

const AlternativeUnitSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['volume', 'weight', 'piece', 'length'] 
  },
  conversionFactor: { type: Number, required: true, min: 0.001 },
  conversionType: { 
    type: String, 
    required: true, 
    enum: ['fixed_volume', 'contains', 'weight'] 
  },
  containedUnit: { type: String }
}, { _id: false });

const UnitsSchema = new Schema({
  base: { type: UnitSchema, required: true },
  alternatives: [AlternativeUnitSchema]
}, { _id: false });

const PricingTierSchema = new Schema({
  minQuantity: { type: Number, required: true, min: 0 },
  maxQuantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true, min: 0.01 },
  type: { 
    type: String, 
    required: true, 
    enum: ['retail', 'wholesale', 'bulk'] 
  }
}, { _id: false });

const SupplierReferenceSchema = new Schema({
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  isPreferred: { type: Boolean, default: false },
  lastPurchasePrice: { type: Number, min: 0 },
  leadTimeDays: { type: Number, min: 0, default: 1 }
}, { _id: false });

const StockLevelsSchema = new Schema({
  minimum: { type: Number, required: true, min: 0 },
  reorderPoint: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true }
}, { _id: false });

const ExpiryInfoSchema = new Schema({
  hasExpiry: { type: Boolean, required: true, default: false },
  shelfLifeDays: { type: Number, min: 1 },
  warningDays: { type: Number, min: 1, default: 7 }
}, { _id: false });

const DimensionsSchema = new Schema({
  length: { type: Number, required: true, min: 0 },
  width: { type: Number, required: true, min: 0 },
  height: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, default: 'cm' }
}, { _id: false });

const SpecificationsSchema = new Schema({
  weight: { type: Number, min: 0 },
  dimensions: DimensionsSchema,
  color: { type: String, trim: true },
  brand: { type: String, trim: true },
  model: { type: String, trim: true }
}, { _id: false });

// Schema principal de Product
const ProductSchema = new Schema<IProduct>({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['Alimentos', 'Bebidas', 'Insumos de Limpieza', 'Materiales de Cocina', 'Decoración', 'Servicios', 'Otros']
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    unique: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  baseUnit: {
    type: String,
    required: true
  },
  units: {
    type: UnitsSchema,
    required: true
  },
  pricing: {
    tieredPricing: [PricingTierSchema],
    lastCost: { type: Number, min: 0 },
    averageCost: { type: Number, min: 0 }
  },
  suppliers: [SupplierReferenceSchema],
  stockLevels: {
    type: StockLevelsSchema,
    required: true
  },
  expiryInfo: ExpiryInfoSchema,
  specifications: SpecificationsSchema,
  images: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true, lowercase: true }],
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  isPerishable: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  requiresBatch: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'products'
});

// Índices compuestos
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ 'suppliers.supplierId': 1 });
ProductSchema.index({ isPerishable: 1, isActive: 1 });
// Índices para sku y barcode ya están definidos en el schema con unique: true y sparse: true
// No es necesario definirlos nuevamente aquí

// Validaciones personalizadas
ProductSchema.pre('validate', function(next) {
  // Validar que el baseUnit esté en las unidades definidas
  const baseUnitCode = this.baseUnit;
  const hasBaseUnit = this.units.base.code === baseUnitCode ||
                     this.units.alternatives.some((alt: IAlternativeUnit) => alt.code === baseUnitCode);
  
  if (!hasBaseUnit) {
    this.invalidate('baseUnit', 'La unidad base debe estar definida en las unidades del producto');
  }

  // Validar que stockLevels.unit sea válida
  const stockUnit = this.stockLevels.unit;
  const hasStockUnit = this.units.base.code === stockUnit ||
                      this.units.alternatives.some((alt: IAlternativeUnit) => alt.code === stockUnit);
  
  if (!hasStockUnit) {
    this.invalidate('stockLevels.unit', 'La unidad de stock debe estar definida en las unidades del producto');
  }

  // Validar que reorderPoint >= minimum
  if (this.stockLevels.reorderPoint < this.stockLevels.minimum) {
    this.invalidate('stockLevels.reorderPoint', 'El punto de reorden debe ser mayor o igual al stock mínimo');
  }

  // Si es perecedero, debe tener información de caducidad
  if (this.isPerishable && (!this.expiryInfo || !this.expiryInfo.hasExpiry)) {
    this.invalidate('expiryInfo', 'Los productos perecederos deben tener información de caducidad');
  }

  next();
});

// Middleware pre-save
ProductSchema.pre('save', function(next) {
  // Asegurar que isPerishable coincida con expiryInfo.hasExpiry
  if (this.expiryInfo && this.expiryInfo.hasExpiry) {
    this.isPerishable = true;
  }

  // Ordenar pricing tiers por cantidad mínima
  if (this.pricing.tieredPricing && this.pricing.tieredPricing.length > 0) {
    this.pricing.tieredPricing.sort((a, b) => a.minQuantity - b.minQuantity);
  }

  next();
});

// Métodos de instancia
ProductSchema.methods.addSupplier = function(supplierData: ISupplierReference) {
  const existingIndex = this.suppliers.findIndex((s: any) => s.supplierId === supplierData.supplierId);
  
  if (existingIndex >= 0) {
    this.suppliers[existingIndex] = supplierData;
  } else {
    this.suppliers.push(supplierData);
  }
  
  return this.save();
};

ProductSchema.methods.removeSupplier = function(supplierId: string) {
  this.suppliers = this.suppliers.filter((s: any) => s.supplierId !== supplierId);
  return this.save();
};

ProductSchema.methods.setPreferredSupplier = function(supplierId: string) {
  this.suppliers.forEach((supplier: any) => {
    supplier.isPreferred = supplier.supplierId === supplierId;
  });
  return this.save();
};

ProductSchema.methods.updateStockLevels = function(minimum: number, reorderPoint: number, unit: string) {
  this.stockLevels = { minimum, reorderPoint, unit };
  return this.save();
};

ProductSchema.methods.addPricingTier = function(tier: IPricingTier) {
  this.pricing.tieredPricing.push(tier);
  return this.save();
};

ProductSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

ProductSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Métodos estáticos
ProductSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

ProductSchema.statics.findByCategory = function(category: string) {
  return this.find({ isActive: true, category }).sort({ name: 1 });
};

ProductSchema.statics.findPerishable = function() {
  return this.find({ isActive: true, isPerishable: true }).sort({ name: 1 });
};

ProductSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ 
    isActive: true, 
    'suppliers.supplierId': supplierId 
  }).sort({ name: 1 });
};

ProductSchema.statics.searchProducts = function(searchTerm: string) {
  return this.find({
    isActive: true,
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: 'textScore' } });
};

ProductSchema.statics.findLowStock = function() {
  // Esta función requerirá una agregación con la colección de inventario
  // Se implementará en el servicio de inventario
  return this.find({ isActive: true });
};

// Virtuals
ProductSchema.virtual('preferredSupplier').get(function() {
  return this.suppliers.find(s => s.isPreferred) || this.suppliers[0] || null;
});

ProductSchema.virtual('hasMultipleUnits').get(function() {
  return this.units.alternatives.length > 0;
});

ProductSchema.virtual('totalSuppliers').get(function() {
  return this.suppliers.length;
});

ProductSchema.virtual('basePrice').get(function() {
  const baseTier = this.pricing.tieredPricing.find(tier => tier.unit === this.baseUnit);
  return baseTier?.pricePerUnit || 0;
});

// Configurar virtuals en JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
export { ProductSchema };