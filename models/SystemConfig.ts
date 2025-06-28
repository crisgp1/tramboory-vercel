import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  restDay: number;
  restDayFee: number;
  businessHours: {
    start: string;
    end: string;
  };
  advanceBookingDays: number;
  maxConcurrentEvents: number;
  defaultEventDuration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  restDay: {
    type: Number,
    required: [true, 'El día de descanso es requerido'],
    min: [0, 'El día debe estar entre 0 (domingo) y 6 (sábado)'],
    max: [6, 'El día debe estar entre 0 (domingo) y 6 (sábado)']
  },
  restDayFee: {
    type: Number,
    required: [true, 'El cargo por día de descanso es requerido'],
    min: [0, 'El cargo no puede ser negativo']
  },
  businessHours: {
    start: {
      type: String,
      required: [true, 'La hora de inicio es requerida'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    end: {
      type: String,
      required: [true, 'La hora de cierre es requerida'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    }
  },
  advanceBookingDays: {
    type: Number,
    required: [true, 'Los días de anticipación son requeridos'],
    min: [1, 'Debe requerir al menos 1 día de anticipación']
  },
  maxConcurrentEvents: {
    type: Number,
    required: [true, 'El máximo de eventos simultáneos es requerido'],
    min: [1, 'Debe permitir al menos 1 evento simultáneo']
  },
  defaultEventDuration: {
    type: Number,
    required: [true, 'La duración predeterminada del evento es requerida'],
    min: [1, 'La duración mínima es 1 hora'],
    max: [24, 'La duración máxima es 24 horas']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Solo debe existir una configuración del sistema
SystemConfigSchema.index({}, { unique: true });

export default mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);