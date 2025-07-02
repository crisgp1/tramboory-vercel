import mongoose, { Schema, Document } from 'mongoose';

export interface IFinance extends Document {
  // Tipo de transacción
  type: 'income' | 'expense';
  
  // Información básica
  description: string;
  amount: number;
  date: Date;
  
  // Categorización
  category: 'reservation' | 'operational' | 'salary' | 'other';
  subcategory?: string;
  
  // Relación con reserva (opcional)
  reservation?: {
    reservationId: mongoose.Types.ObjectId;
    customerName: string;
    eventDate: Date;
  };
  
  // Etiquetas para mejor organización
  tags: string[];
  
  // Información adicional
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  reference?: string; // Número de factura, recibo, etc.
  notes?: string;
  
  // Estado de la transacción
  status: 'pending' | 'completed' | 'cancelled';
  
  // Información de quien registró la transacción
  createdBy?: string; // ID del usuario que creó el registro
  
  // Estructura jerárquica para finanzas padre-hijo
  parentId?: mongoose.Types.ObjectId; // ID del registro padre (para children)
  isSystemGenerated?: boolean; // Si fue generado automáticamente por el sistema
  isEditable?: boolean; // Si puede ser editado por el usuario
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

const FinanceSchema = new Schema<IFinance>({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  category: {
    type: String,
    enum: ['reservation', 'operational', 'salary', 'other'],
    required: true
  },
  
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  reservation: {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation'
    },
    customerName: {
      type: String,
      trim: true
    },
    eventDate: {
      type: Date
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'check', 'other']
  },
  
  reference: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  
  createdBy: {
    type: String,
    trim: true
  },
  
  // Estructura jerárquica
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Finance'
  },
  
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  
  isEditable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
FinanceSchema.index({ type: 1 });
FinanceSchema.index({ category: 1 });
FinanceSchema.index({ date: -1 });
FinanceSchema.index({ status: 1 });
FinanceSchema.index({ 'reservation.reservationId': 1 });
FinanceSchema.index({ tags: 1 });
FinanceSchema.index({ createdAt: -1 });
FinanceSchema.index({ parentId: 1 }); // Para consultas de children
FinanceSchema.index({ isSystemGenerated: 1 });
FinanceSchema.index({ isEditable: 1 });

// Índice compuesto para consultas de rango de fechas por tipo
FinanceSchema.index({ type: 1, date: -1 });
FinanceSchema.index({ category: 1, date: -1 });
// Índice para consultas jerárquicas
FinanceSchema.index({ parentId: 1, createdAt: -1 });

export default mongoose.models.Finance || mongoose.model<IFinance>('Finance', FinanceSchema);