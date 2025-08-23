import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  // Basic Information
  code: string;
  name: string;
  description?: string;
  
  // Discount Configuration
  discountType: 'percentage' | 'fixed_amount' | 'free_service';
  discountValue: number; // Percentage (1-100) or fixed amount in MXN
  freeServiceId?: mongoose.Types.ObjectId; // For free_service type
  
  // Applicability
  applicableTo: 'total' | 'package' | 'food' | 'extras' | 'specific_service';
  specificServiceIds?: mongoose.Types.ObjectId[]; // For specific services
  
  // Usage Limits
  maxUses?: number; // null = unlimited
  usedCount: number;
  maxUsesPerCustomer?: number; // null = unlimited per customer
  
  // Date/Time Restrictions
  validFrom: Date;
  validUntil: Date;
  
  // Day of Week Restrictions (0 = Sunday, 1 = Monday, etc.)
  validDays?: number[]; // [1,2,3,4,5] for Mon-Fri only
  
  // Time Restrictions
  validTimeFrom?: string; // "09:00"
  validTimeTo?: string; // "17:00"
  
  // Minimum Requirements
  minOrderAmount?: number; // Minimum total to apply coupon
  minGuests?: number; // Minimum number of guests
  
  // Package/Service Restrictions
  validPackageIds?: mongoose.Types.ObjectId[]; // Only valid for specific packages
  excludedPackageIds?: mongoose.Types.ObjectId[]; // Excluded packages
  validFoodOptionIds?: mongoose.Types.ObjectId[]; // Only valid for specific food options
  
  // Customer Restrictions
  newCustomersOnly: boolean; // Only for first-time customers
  excludedCustomerEmails?: string[]; // Blacklisted customers
  allowedCustomerEmails?: string[]; // Whitelist (if empty, all allowed)
  
  // Status and Metadata
  isActive: boolean;
  createdBy: string; // Admin user ID or email
  notes?: string; // Internal admin notes
  
  // Usage Analytics
  analytics: {
    totalUsage: number;
    totalDiscountGiven: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: [true, 'El código de cupón es requerido'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'El código debe tener al menos 3 caracteres'],
    maxlength: [20, 'El código no puede exceder 20 caracteres'],
    match: [/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números']
  },
  
  name: {
    type: String,
    required: [true, 'El nombre del cupón es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  
  discountType: {
    type: String,
    required: [true, 'El tipo de descuento es requerido'],
    enum: {
      values: ['percentage', 'fixed_amount', 'free_service'],
      message: 'El tipo de descuento debe ser: percentage, fixed_amount o free_service'
    }
  },
  
  discountValue: {
    type: Number,
    required: [true, 'El valor del descuento es requerido'],
    min: [0, 'El valor del descuento no puede ser negativo'],
    validate: {
      validator: function(this: ICoupon, value: number) {
        if (this.discountType === 'percentage') {
          return value > 0 && value <= 100;
        }
        return value > 0;
      },
      message: 'El valor del descuento debe ser entre 1-100 para porcentajes'
    }
  },
  
  freeServiceId: {
    type: Schema.Types.ObjectId,
    ref: 'ExtraService'
  },
  
  applicableTo: {
    type: String,
    required: [true, 'El campo de aplicación es requerido'],
    enum: {
      values: ['total', 'package', 'food', 'extras', 'specific_service'],
      message: 'El campo de aplicación debe ser: total, package, food, extras o specific_service'
    }
  },
  
  specificServiceIds: [{
    type: Schema.Types.ObjectId,
    ref: 'ExtraService'
  }],
  
  maxUses: {
    type: Number,
    min: [1, 'El máximo de usos debe ser al menos 1'],
    default: null
  },
  
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'El conteo de usos no puede ser negativo']
  },
  
  maxUsesPerCustomer: {
    type: Number,
    min: [1, 'El máximo de usos por cliente debe ser al menos 1'],
    default: null
  },
  
  validFrom: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  
  validUntil: {
    type: Date,
    required: [true, 'La fecha de expiración es requerida'],
    validate: {
      validator: function(this: ICoupon, value: Date) {
        return value > this.validFrom;
      },
      message: 'La fecha de expiración debe ser posterior a la fecha de inicio'
    }
  },
  
  validDays: [{
    type: Number,
    min: [0, 'El día debe estar entre 0-6'],
    max: [6, 'El día debe estar entre 0-6']
  }],
  
  validTimeFrom: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'El formato de hora debe ser HH:MM']
  },
  
  validTimeTo: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'El formato de hora debe ser HH:MM']
  },
  
  minOrderAmount: {
    type: Number,
    min: [0, 'El monto mínimo no puede ser negativo']
  },
  
  minGuests: {
    type: Number,
    min: [1, 'El mínimo de invitados debe ser al menos 1']
  },
  
  validPackageIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Package'
  }],
  
  excludedPackageIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Package'
  }],
  
  validFoodOptionIds: [{
    type: Schema.Types.ObjectId,
    ref: 'FoodOption'
  }],
  
  newCustomersOnly: {
    type: Boolean,
    default: false
  },
  
  excludedCustomerEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  allowedCustomerEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: String,
    required: [true, 'El creador del cupón es requerido'],
    trim: true
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  
  analytics: {
    totalUsage: {
      type: Number,
      default: 0,
      min: [0, 'El uso total no puede ser negativo']
    },
    totalDiscountGiven: {
      type: Number,
      default: 0,
      min: [0, 'El descuento total no puede ser negativo']
    },
    avgOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'El valor promedio no puede ser negativo']
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: [0, 'La tasa de conversión no puede ser negativa'],
      max: [100, 'La tasa de conversión no puede exceder 100%']
    }
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
CouponSchema.index({ createdBy: 1 });
CouponSchema.index({ discountType: 1 });
CouponSchema.index({ applicableTo: 1 });

// Middleware para actualizar analytics
CouponSchema.methods.updateAnalytics = function(discountAmount: number, orderValue: number) {
  this.analytics.totalUsage += 1;
  this.analytics.totalDiscountGiven += discountAmount;
  this.analytics.avgOrderValue = 
    (this.analytics.avgOrderValue * (this.analytics.totalUsage - 1) + orderValue) / this.analytics.totalUsage;
  
  return this.save();
};

// Método para validar si el cupón es aplicable
CouponSchema.methods.isValidForReservation = function(reservation: any, customerEmail: string) {
  const now = new Date();
  
  // Check if active and within date range
  if (!this.isActive || now < this.validFrom || now > this.validUntil) {
    return { valid: false, reason: 'Cupón expirado o inactivo' };
  }
  
  // Check usage limits
  if (this.maxUses && this.usedCount >= this.maxUses) {
    return { valid: false, reason: 'Cupón agotado' };
  }
  
  // Check day restrictions
  if (this.validDays && this.validDays.length > 0) {
    const eventDay = new Date(reservation.eventDate).getDay();
    if (!this.validDays.includes(eventDay)) {
      return { valid: false, reason: 'Cupón no válido para este día' };
    }
  }
  
  // Check time restrictions
  if (this.validTimeFrom && this.validTimeTo) {
    const eventTime = reservation.eventTime;
    if (eventTime < this.validTimeFrom || eventTime > this.validTimeTo) {
      return { valid: false, reason: 'Cupón no válido para este horario' };
    }
  }
  
  // Check minimum requirements
  if (this.minOrderAmount && reservation.pricing.subtotal < this.minOrderAmount) {
    return { valid: false, reason: `Monto mínimo requerido: $${this.minOrderAmount}` };
  }
  
  if (this.minGuests) {
    const totalGuests = (reservation.guestCount?.adults || 0) + (reservation.guestCount?.kids || 0);
    if (totalGuests < this.minGuests) {
      return { valid: false, reason: `Mínimo ${this.minGuests} invitados requeridos` };
    }
  }
  
  // Check customer restrictions
  if (this.allowedCustomerEmails && this.allowedCustomerEmails.length > 0) {
    if (!this.allowedCustomerEmails.includes(customerEmail.toLowerCase())) {
      return { valid: false, reason: 'Cupón no disponible para este cliente' };
    }
  }
  
  if (this.excludedCustomerEmails && this.excludedCustomerEmails.includes(customerEmail.toLowerCase())) {
    return { valid: false, reason: 'Cupón no disponible para este cliente' };
  }
  
  return { valid: true, reason: 'Cupón válido' };
};

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);