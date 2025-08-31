import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICarouselCard extends Document {
  // Contenido de la tarjeta
  title: string;
  description: string;
  icon: string; // Nombre del icono (ej: 'GiPartyPopper', 'FiShield')
  emoji: string; // Emoji para el título (ej: '🎉', '🛡️')
  
  // Media de fondo (video o imagen)
  backgroundMedia: {
    type: 'video' | 'image' | 'gradient';
    url?: string; // URL del video o imagen
    fallbackImage?: string; // Imagen de respaldo para videos
    alt?: string; // Texto alternativo
  };
  
  // Colores y estilo
  gradientColors: string; // Ej: 'from-pink-500 to-purple-600'
  
  // Configuración
  isActive: boolean;
  order: number; // Para ordenar las tarjetas
  
  // Metadata
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarouselCardModel extends Model<ICarouselCard> {
  getActiveCards(): Promise<ICarouselCard[]>;
}

const carouselCardSchema = new Schema<ICarouselCard>({
  // Contenido de la tarjeta
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  icon: { 
    type: String, 
    required: true,
    trim: true,
    default: 'GiPartyPopper'
  },
  emoji: { 
    type: String, 
    required: true,
    trim: true,
    default: '🎉'
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
    alt: { type: String, trim: true }
  },
  
  // Colores y estilo
  gradientColors: {
    type: String,
    required: true,
    default: 'from-purple-500 to-purple-600'
  },
  
  // Configuración
  isActive: { 
    type: Boolean, 
    default: true 
  },
  order: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdBy: { 
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para optimización
carouselCardSchema.index({ isActive: 1, order: 1 });
carouselCardSchema.index({ createdAt: -1 });

// Método estático para obtener tarjetas activas ordenadas
carouselCardSchema.statics.getActiveCards = function() {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
};

export const CarouselCard = (mongoose.models.CarouselCard || mongoose.model<ICarouselCard, ICarouselCardModel>('CarouselCard', carouselCardSchema)) as ICarouselCardModel;