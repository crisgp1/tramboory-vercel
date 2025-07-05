import mongoose, { Schema, Document } from 'mongoose';

// Interface para el documento de Supplier
export interface ISupplier extends Document {
  supplierId: string;
  code: string;
  name: string;
  description?: string;
  userId?: string; // ID del usuario de Clerk vinculado a este proveedor
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  };
  paymentTerms: {
    creditDays: number;
    paymentMethod: 'cash' | 'credit' | 'transfer' | 'check';
    currency: string;
    discountTerms?: string;
  };
  deliveryInfo: {
    leadTimeDays: number;
    minimumOrder?: number;
    deliveryZones: string[];
  };
  rating: {
    quality: number; // 1-5
    reliability: number; // 1-5
    pricing: number; // 1-5
    overall: number; // Calculado automáticamente
  };
  isActive: boolean;
  isPreferred: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de Mongoose
const SupplierSchema = new Schema<ISupplier>({
  supplierId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
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
  userId: {
    type: String,
    trim: true,
    index: true,
    unique: true,
    sparse: true // Permite null/undefined y mantiene la unicidad solo para valores no nulos
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    }
  },
  paymentTerms: {
    creditDays: {
      type: Number,
      required: true,
      min: 0,
      max: 365,
      default: 0
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'credit', 'transfer', 'check'],
      default: 'cash'
    },
    currency: {
      type: String,
      required: true,
      default: 'MXN',
      uppercase: true
    },
    discountTerms: {
      type: String,
      trim: true
    }
  },
  deliveryInfo: {
    leadTimeDays: {
      type: Number,
      required: true,
      min: 0,
      max: 365,
      default: 1
    },
    minimumOrder: {
      type: Number,
      min: 0
    },
    deliveryZones: [{
      type: String,
      trim: true
    }]
  },
  rating: {
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    pricing: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  isPreferred: {
    type: Boolean,
    required: true,
    default: false,
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
  collection: 'suppliers'
});

// Índices compuestos
SupplierSchema.index({ name: 'text', description: 'text' });
SupplierSchema.index({ isActive: 1, isPreferred: -1, 'rating.overall': -1 });
SupplierSchema.index({ createdAt: -1 });

// Middleware pre-save para calcular rating overall
SupplierSchema.pre('save', function(next) {
  if (this.isModified('rating.quality') || this.isModified('rating.reliability') || this.isModified('rating.pricing')) {
    const { quality, reliability, pricing } = this.rating;
    this.rating.overall = Math.round(((quality + reliability + pricing) / 3) * 100) / 100;
  }
  next();
});

// Métodos de instancia
SupplierSchema.methods.updateRating = function(quality: number, reliability: number, pricing: number) {
  this.rating.quality = quality;
  this.rating.reliability = reliability;
  this.rating.pricing = pricing;
  return this.save();
};

SupplierSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

SupplierSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

SupplierSchema.methods.setPreferred = function(preferred: boolean = true) {
  this.isPreferred = preferred;
  return this.save();
};

// Métodos estáticos
SupplierSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ 'rating.overall': -1, name: 1 });
};

SupplierSchema.statics.findPreferred = function() {
  return this.find({ isActive: true, isPreferred: true }).sort({ 'rating.overall': -1, name: 1 });
};

SupplierSchema.statics.findByRating = function(minRating: number = 3) {
  return this.find({ 
    isActive: true, 
    'rating.overall': { $gte: minRating } 
  }).sort({ 'rating.overall': -1, name: 1 });
};

SupplierSchema.statics.searchByName = function(searchTerm: string) {
  return this.find({
    isActive: true,
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: 'textScore' } });
};

// Virtual para obtener información completa de contacto
SupplierSchema.virtual('fullContactInfo').get(function() {
  const contact = this.contactInfo;
  return {
    ...contact,
    hasEmail: !!contact.email,
    hasPhone: !!contact.phone,
    hasAddress: !!contact.address,
    isComplete: !!(contact.email && contact.phone && contact.address)
  };
});

// Virtual para obtener estadísticas de entrega
SupplierSchema.virtual('deliveryStats').get(function() {
  return {
    leadTime: this.deliveryInfo.leadTimeDays,
    hasMinimumOrder: !!this.deliveryInfo.minimumOrder,
    deliveryZoneCount: this.deliveryInfo.deliveryZones.length,
    canDeliver: this.deliveryInfo.deliveryZones.length > 0
  };
});

// Configurar virtuals en JSON
SupplierSchema.set('toJSON', { virtuals: true });
SupplierSchema.set('toObject', { virtuals: true });

// Crear y exportar el modelo
const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
export { SupplierSchema };