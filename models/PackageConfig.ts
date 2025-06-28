import mongoose, { Schema, Document } from 'mongoose';

export interface IPackageConfig extends Document {
  name: string;
  number: string;
  maxGuests: number;
  pricing: {
    mondayToThursday: number;
    fridayToSunday: number;
  };
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PackageConfigSchema = new Schema<IPackageConfig>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    mondayToThursday: {
      type: Number,
      required: true,
      min: 0
    },
    fridayToSunday: {
      type: Number,
      required: true,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.models.PackageConfig || mongoose.model<IPackageConfig>('PackageConfig', PackageConfigSchema);