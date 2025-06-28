import mongoose, { Schema, Document } from 'mongoose';

export interface IEventTheme extends Document {
  name: string;
  description: string;
  packages: {
    name: string;
    price: number;
    features: string[];
  }[];
  variations: {
    name: string;
    additionalCost: number;
    description: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventThemeSchema = new Schema<IEventTheme>({
  name: {
    type: String,
    required: [true, 'El nombre del tema es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  packages: [{
    name: {
      type: String,
      required: [true, 'El nombre del paquete es requerido'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'El precio del paquete es requerido'],
      min: [0, 'El precio no puede ser negativo']
    },
    features: [{
      type: String,
      trim: true
    }]
  }],
  variations: [{
    name: {
      type: String,
      required: [true, 'El nombre de la variación es requerido'],
      trim: true
    },
    additionalCost: {
      type: Number,
      required: [true, 'El costo adicional es requerido'],
      min: [0, 'El costo no puede ser negativo']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
EventThemeSchema.index({ name: 1 });
EventThemeSchema.index({ isActive: 1 });

export default mongoose.models.EventTheme || mongoose.model<IEventTheme>('EventTheme', EventThemeSchema);