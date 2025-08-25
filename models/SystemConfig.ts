import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  advanceBookingDays: number;
  minAdvanceBookingDays: number;
  maxConcurrentEvents: number;
  defaultEventDuration: number;
  timeBlocks: {
    name: string;
    days: number[];
    startTime: string;
    endTime: string;
    duration: number;
    halfHourBreak: boolean;
    maxEventsPerBlock: number;
  }[];
  restDays: {
    day: number;
    name: string;
    fee: number;
    canBeReleased: boolean;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  advanceBookingDays: {
    type: Number,
    required: [true, 'Los días de anticipación son requeridos'],
    min: [1, 'Debe requerir al menos 1 día de anticipación']
  },
  minAdvanceBookingDays: {
    type: Number,
    required: [true, 'Los días mínimos de anticipación son requeridos'],
    min: [0, 'No puede ser negativo'],
    default: 7
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
  timeBlocks: [{
    name: {
      type: String,
      required: [true, 'El nombre del bloque es requerido']
    },
    days: [{
      type: Number,
      min: [0, 'El día debe estar entre 0 (lunes) y 6 (domingo)'],
      max: [6, 'El día debe estar entre 0 (lunes) y 6 (domingo)']
    }],
    startTime: {
      type: String,
      required: [true, 'La hora de inicio del bloque es requerida'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    endTime: {
      type: String,
      required: [true, 'La hora de fin del bloque es requerida'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    duration: {
      type: Number,
      required: [true, 'La duración del evento es requerida'],
      min: [0.5, 'La duración mínima es 0.5 horas'],
      max: [24, 'La duración máxima es 24 horas']
    },
    halfHourBreak: {
      type: Boolean,
      default: true
    },
    maxEventsPerBlock: {
      type: Number,
      required: [true, 'El máximo de eventos por bloque es requerido'],
      min: [1, 'Debe permitir al menos 1 evento']
    }
  }],
  restDays: [{
    day: {
      type: Number,
      required: [true, 'El día es requerido'],
      min: [0, 'El día debe estar entre 0 (lunes) y 6 (domingo)'],
      max: [6, 'El día debe estar entre 0 (lunes) y 6 (domingo)']
    },
    name: {
      type: String,
      required: [true, 'El nombre del día es requerido']
    },
    fee: {
      type: Number,
      required: [true, 'El cargo es requerido'],
      min: [0, 'El cargo no puede ser negativo']
    },
    canBeReleased: {
      type: Boolean,
      default: true
    }
  }],
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