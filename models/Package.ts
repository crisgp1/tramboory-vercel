import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description: string;
  pricing: {
    weekday: number;
    weekend: number;
    holiday: number;
  };
  duration: number;
  maxGuests: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>({
  name: {
    type: String,
    required: [true, 'El nombre del paquete es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  pricing: {
    weekday: {
      type: Number,
      required: [true, 'El precio entre semana es requerido'],
      min: [0, 'El precio no puede ser negativo']
    },
    weekend: {
      type: Number,
      required: [true, 'El precio de fin de semana es requerido'],
      min: [0, 'El precio no puede ser negativo']
    },
    holiday: {
      type: Number,
      required: [true, 'El precio de día festivo es requerido'],
      min: [0, 'El precio no puede ser negativo']
    }
  },
  duration: {
    type: Number,
    required: [true, 'La duración es requerida'],
    min: [1, 'La duración mínima es 1 hora'],
    max: [24, 'La duración máxima es 24 horas']
  },
  maxGuests: {
    type: Number,
    required: [true, 'El número máximo de invitados es requerido'],
    min: [1, 'Debe permitir al menos 1 invitado']
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
PackageSchema.index({ name: 1 });
PackageSchema.index({ isActive: 1 });
PackageSchema.index({ 'pricing.weekday': 1 });

export default mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);