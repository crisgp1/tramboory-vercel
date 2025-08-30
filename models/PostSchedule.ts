import mongoose, { Schema, Document } from 'mongoose';

export interface IPostSchedule extends Document {
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: Date;
  publishedDate?: Date;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  author: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  platform: 'website' | 'social' | 'newsletter' | 'all';
  socialMediaSettings?: {
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
  publishAttempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostScheduleSchema = new Schema<IPostSchedule>({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'El contenido es requerido'],
    trim: true,
    maxlength: [5000, 'El contenido no puede exceder 5000 caracteres']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'La fecha de programación es requerida'],
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'La fecha de programación debe ser futura'
    }
  },
  publishedDate: Date,
  status: {
    type: String,
    enum: ['scheduled', 'published', 'cancelled', 'failed'],
    default: 'scheduled'
  },
  author: {
    type: String,
    required: [true, 'El autor es requerido'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  platform: {
    type: String,
    enum: ['website', 'social', 'newsletter', 'all'],
    default: 'website'
  },
  socialMediaSettings: {
    instagram: {
      type: Boolean,
      default: false
    },
    facebook: {
      type: Boolean,
      default: false
    },
    tiktok: {
      type: Boolean,
      default: false
    }
  },
  publishAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastError: String
}, {
  timestamps: true
});

// Índices para mejorar las consultas
PostScheduleSchema.index({ scheduledDate: 1 });
PostScheduleSchema.index({ status: 1 });
PostScheduleSchema.index({ author: 1 });
PostScheduleSchema.index({ createdAt: -1 });

export default mongoose.models.PostSchedule || mongoose.model<IPostSchedule>('PostSchedule', PostScheduleSchema);