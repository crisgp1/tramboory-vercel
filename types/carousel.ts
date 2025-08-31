export interface CarouselCard {
  _id?: string
  id?: string
  
  // Contenido de la tarjeta
  title: string // "Fiestas Épicas 🎉"
  description: string
  icon: string // Nombre del icono React (ej: 'GiPartyPopper')
  emoji: string // Emoji individual (ej: '🎉')
  
  // Media de fondo (video o imagen)
  backgroundMedia: {
    type: 'video' | 'image' | 'gradient'
    url?: string // URL del video o imagen
    fallbackImage?: string // Imagen de respaldo para videos
    alt?: string // Texto alternativo
  }
  
  // Colores y estilo
  gradientColors: string // Ej: 'from-pink-500 to-purple-600'
  
  // Configuración
  isActive: boolean
  order: number // Para ordenar las tarjetas

  // Programación de publicación (opcional)
  scheduling?: {
    enabled: boolean
    publishDate: Date | null
    expireDate: Date | null
    autoActivate: boolean
    status?: 'pending' | 'published' | 'expired'
  }
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface CarouselSettings {
  cards: CarouselCard[]
  autoplaySpeed: number // Velocidad del autoplay en ms
  showArrows: boolean
  showDots: boolean
}