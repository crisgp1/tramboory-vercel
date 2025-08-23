import mongoose, { Schema, Document } from 'mongoose';

export interface IEventTheme extends Document {
  name: string;
  description?: string;
  imageUrl?: string;
  packages: {
    name: string;
    pieces: number;
    price: number;
  }[];
  themes: string[];
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
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  packages: [{
    name: {
      type: String,
      required: [true, 'El nombre del paquete es requerido'],
      trim: true
    },
    pieces: {
      type: Number,
      required: [true, 'El número de piezas es requerido'],
      min: [1, 'Debe tener al menos 1 pieza']
    },
    price: {
      type: Number,
      required: [true, 'El precio del paquete es requerido'],
      min: [0, 'El precio no puede ser negativo']
    }
  }],
  themes: [{
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
EventThemeSchema.index({ name: 1 });
EventThemeSchema.index({ isActive: 1 });

export default mongoose.models.EventTheme || mongoose.model<IEventTheme>('EventTheme', EventThemeSchema);