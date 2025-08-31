import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroContent extends Document {
  // Texto principal
  mainTitle: string;
  brandTitle: string;
  subtitle: string;
  
  // Botones de acción
  primaryButton: {
    text: string;
    href?: string;
    action: 'signup' | 'dashboard' | 'custom';
  };
  secondaryButton: {
    text: string;
    href: string;
  };
  
  // Media de fondo
  backgroundMedia: {
    type: 'video' | 'image' | 'gradient';
    url?: string;
    fallbackImage?: string;
    alt?: string;
  };
  
  // Configuraciones adicionales
  showGlitter: boolean;
  isActive: boolean;
  
  // Promociones especiales (opcional)
  promotion?: {
    show: boolean;
    text: string;
    highlightColor: 'yellow' | 'red' | 'green' | 'blue' | 'purple';
    expiryDate?: Date;
  };
  
  // Metadata
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHeroContentModel extends Model<IHeroContent> {
  getActive(): Promise<IHeroContent | null>;
  activate(id: string): Promise<any>;
}

const heroContentSchema = new Schema<IHeroContent>({
  // Texto principal
  mainTitle: { 
    type: String, 
    required: true,
    trim: true
  },
  brandTitle: { 
    type: String, 
    required: true,
    default: 'Tramboory',
    trim: true
  },
  subtitle: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Botones de acción
  primaryButton: {
    text: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    action: { 
      type: String, 
      required: true,
      enum: ['signup', 'dashboard', 'custom'],
      default: 'signup'
    }
  },
  secondaryButton: {
    text: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true }
  },
  
  // Media de fondo
  backgroundMedia: {
    type: { 
      type: String, 
      required: true,
      enum: ['video', 'image', 'gradient'],
      default: 'gradient'
    },
    url: { type: String, trim: true },
    fallbackImage: { type: String, trim: true },
    alt: { type: String, trim: true },
    overlayColor: {
      type: String,
      enum: ['purple', 'blue', 'green', 'orange', 'pink', 'teal', 'red', 'indigo'],
      default: 'purple'
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    }
  },
  
  // Configuraciones adicionales
  showGlitter: { 
    type: Boolean, 
    default: true 
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  
  // Promociones especiales (opcional)
  promotion: {
    show: { type: Boolean, default: false },
    text: { type: String, trim: true, default: '' },
    highlightColor: { 
      type: String,
      enum: ['yellow', 'red', 'green', 'blue', 'purple'],
      default: 'yellow'
    },
    expiryDate: { type: Date }
  },
  
  // Metadata
  createdBy: { 
    type: String,
    trim: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimización
heroContentSchema.index({ isActive: 1 });
heroContentSchema.index({ createdAt: -1 });

// Middleware para asegurar que solo haya un hero activo
heroContentSchema.pre('save', async function(next) {
  if (this.isActive) {
    // Desactivar todos los otros heroes si este va a ser activo
    await mongoose.model('HeroContent').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Método estático para obtener el hero activo
heroContentSchema.statics.getActive = function() {
  return this.findOne({ isActive: true });
};

// Método estático para activar un hero específico
heroContentSchema.statics.activate = function(id: string) {
  return this.bulkWrite([
    // Desactivar todos
    {
      updateMany: {
        filter: {},
        update: { $set: { isActive: false } }
      }
    },
    // Activar el seleccionado
    {
      updateOne: {
        filter: { _id: id },
        update: { $set: { isActive: true } }
      }
    }
  ]);
};

export const HeroContent = (mongoose.models.HeroContent || mongoose.model<IHeroContent, IHeroContentModel>('HeroContent', heroContentSchema)) as IHeroContentModel;