import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IThematicImage {
  url: string
  alt?: string
  order: number
}

export interface IThematic extends Document {
  title: string
  description: string
  slug: string
  coverImage: {
    url: string
    alt?: string
  }
  images: IThematicImage[]
  isActive: boolean
  order: number
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface IThematicModel extends Model<IThematic> {
  findActive(): Promise<IThematic[]>
}

const ThematicImageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String },
  order: { type: Number, default: 0 }
})

const ThematicSchema = new Schema<IThematic>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  coverImage: {
    url: { type: String, required: true },
    alt: { type: String }
  },
  images: [ThematicImageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true
})

// Índices
ThematicSchema.index({ slug: 1 })
ThematicSchema.index({ isActive: 1, order: 1 })

// Métodos estáticos
ThematicSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
}

// Crear slug automáticamente si no existe
ThematicSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  next()
})

export default mongoose.models.Thematic || mongoose.model<IThematic, IThematicModel>('Thematic', ThematicSchema)