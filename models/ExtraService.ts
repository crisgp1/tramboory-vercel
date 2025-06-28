import mongoose, { Schema, Document } from 'mongoose';

export interface IExtraService extends Document {
  name: string;
  description: string;
  price: number;
  category: 'decoration' | 'entertainment' | 'catering' | 'photography' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExtraServiceSchema = new Schema<IExtraService>({
  name: {
    type: String,
    required: [true, 'El nombre del servicio extra es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: {
      values: ['decoration', 'entertainment', 'catering', 'photography', 'other'],
      message: 'La categoría debe ser: decoration, entertainment, catering, photography u other'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
ExtraServiceSchema.index({ name: 1 });
ExtraServiceSchema.index({ category: 1 });
ExtraServiceSchema.index({ isActive: 1 });

export default mongoose.models.ExtraService || mongoose.model<IExtraService>('ExtraService', ExtraServiceSchema);