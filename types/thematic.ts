export interface ThematicImage {
  id?: string
  url: string
  alt?: string
  order: number
}

export interface Thematic {
  _id?: string
  id?: string
  
  // Basic info
  title: string
  description: string
  slug: string
  
  // Main image (cover)
  coverImage: {
    url: string
    alt?: string
  }
  
  // Gallery images
  images: ThematicImage[]
  
  // Settings
  isActive: boolean
  order: number
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}