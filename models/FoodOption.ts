import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodOption extends Document {
  name: string;
  description: string;
  basePrice: number;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  adultDishes: string[];
  kidsDishes: string[];
  adultDishImages?: { dish: string; image?: string }[];
  kidsDishImages?: { dish: string; image?: string }[];
  upgrades: {
    fromDish: string;
    toDish: string;
    additionalPrice: number;
    category: 'adult' | 'kids';
    image?: string;
  }[];
  mainImage?: string;
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
    required: false,
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
  adultDishes: [{
    type: String,
    trim: true
  }],
  kidsDishes: [{
    type: String,
    trim: true
  }],
  adultDishImages: [{
    dish: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: false
    }
  }],
  kidsDishImages: [{
    dish: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: false
    }
  }],
  upgrades: [{
    fromDish: {
      type: String,
      required: [true, 'El platillo base es requerido'],
      trim: true
    },
    toDish: {
      type: String,
      required: [true, 'El platillo de upgrade es requerido'],
      trim: true
    },
    additionalPrice: {
      type: Number,
      required: [true, 'El precio adicional es requerido'],
      min: [0, 'El precio adicional no puede ser negativo']
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: {
        values: ['adult', 'kids'],
        message: 'La categoría debe ser: adult o kids'
      }
    },
    image: {
      type: String,
      required: false
    }
  }],
  mainImage: {
    type: String,
    required: false
  },
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