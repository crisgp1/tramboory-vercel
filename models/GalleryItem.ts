import mongoose from 'mongoose'

const GalleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  src: {
    type: String,
    required: true,
    trim: true,
  },
  alt: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['superheroes', 'princesas', 'tematica', 'deportes', 'cumpleanos', 'otros'],
    required: true,
  },
  aspectRatio: {
    type: String,
    enum: ['portrait', 'landscape', 'square'],
    default: 'landscape',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Índice para optimizar consultas
GalleryItemSchema.index({ category: 1, active: 1, order: 1 })
GalleryItemSchema.index({ featured: 1, active: 1, order: 1 })

export default mongoose.models.GalleryItem || mongoose.model('GalleryItem', GalleryItemSchema)