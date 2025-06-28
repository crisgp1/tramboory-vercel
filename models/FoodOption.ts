import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodOption extends Document {
  name: string;
  description: string;
  basePrice: number;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  extras: {
    name: string;
    price: number;
    isRequired: boolean;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodOptionSchema = new Schema<IFoodOption>({
  name: {
    type: String,
    required: [true, 'El nombre de la opción de comida es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  basePrice: {
    type: Number,
    required: [true, 'El precio base es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: {
      values: ['main', 'appetizer', 'dessert', 'beverage'],
      message: 'La categoría debe ser: main, appetizer, dessert o beverage'
    }
  },
  extras: [{
    name: {
      type: String,
      required: [true, 'El nombre del extra es requerido'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'El precio del extra es requerido'],
      min: [0, 'El precio no puede ser negativo']
    },
    isRequired: {
      type: Boolean,
      default: false
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
FoodOptionSchema.index({ name: 1 });
FoodOptionSchema.index({ category: 1 });
FoodOptionSchema.index({ isActive: 1 });

export default mongoose.models.FoodOption || mongoose.model<IFoodOption>('FoodOption', FoodOptionSchema);