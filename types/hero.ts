export interface HeroContent {
  _id?: string
  id?: string
  // Texto principal
  mainTitle: string // "Celebra con"
  brandTitle: string // "Tramboory"
  subtitle: string
  
  // Botones de acción
  primaryButton: {
    text: string
    href?: string
    action?: 'signup' | 'dashboard' | 'custom'
  }
  secondaryButton: {
    text: string
    href: string
  }
  
  // Media de fondo
  backgroundMedia: {
    type: 'video' | 'image' | 'gradient'
    url?: string // URL del video o imagen
    fallbackImage?: string // Imagen de respaldo para videos
    alt?: string // Texto alternativo para imágenes
    overlayColor?: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'teal' | 'red' | 'indigo' // Color del overlay
    overlayOpacity?: number // Opacidad del overlay (0-100)
  }
  
  // Configuraciones adicionales
  showGlitter: boolean
  isActive: boolean
  
  // Promociones especiales (opcional)
  promotion?: {
    show: boolean
    text: string
    highlightColor: 'yellow' | 'red' | 'green' | 'blue' | 'purple'
    expiryDate?: string
  }
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface HeroSettings {
  heroes: HeroContent[]
  activeHeroId: string
}