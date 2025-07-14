import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
  // Información del paquete
  package: {
    configId: mongoose.Types.ObjectId;
    name: string;
    maxGuests: number;
    basePrice: number;
  };
  
  // Fecha y hora del evento
  eventDate: Date;
  eventTime: string;
  eventDuration?: number;
  eventBlock?: {
    name: string;
    startTime: string;
    endTime: string;
  };
  isRestDay: boolean;
  restDayFee: number;
  
  // Opciones de alimento
  foodOption?: {
    configId: mongoose.Types.ObjectId;
    name: string;
    basePrice: number;
    selectedExtras: Array<{
      name: string;
      price: number;
    }>;
  };
  
  // Extras específicos seleccionados
  extraServices: Array<{
    configId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  
  // Configuración del evento personalizado
  eventTheme?: {
    configId: mongoose.Types.ObjectId;
    name: string;
    selectedPackage: {
      name: string;
      pieces: number;
      price: number;
    };
    selectedTheme: string;
  };
  
  // Datos del usuario reservante
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  
  // Datos del niño
  child: {
    name: string;
    age: number;
  };
  
  // Comentarios especiales
  specialComments?: string;
  
  // Cálculos de precio
  pricing: {
    packagePrice: number;
    foodPrice: number;
    extrasPrice: number;
    themePrice: number;
    restDayFee: number;
    subtotal: number;
    total: number;
  };
  
  // Estado de la reserva
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  // Estado del pago
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  paymentDate?: Date;
  paymentNotes?: string;
  amountPaid?: number;
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  package: {
    configId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    maxGuests: {
      type: Number,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    }
  },
  
  eventDate: {
    type: Date,
    required: true
  },
  eventTime: {
    type: String,
    required: true
  },
  eventDuration: {
    type: Number,
    default: 4
  },
  eventBlock: {
    name: String,
    startTime: String,
    endTime: String
  },
  isRestDay: {
    type: Boolean,
    default: false
  },
  restDayFee: {
    type: Number,
    default: 0
  },
  
  foodOption: {
    configId: {
      type: Schema.Types.ObjectId,
      ref: 'FoodOption'
    },
    name: String,
    basePrice: Number,
    selectedExtras: [{
      name: String,
      price: Number
    }]
  },
  
  extraServices: [{
    configId: {
      type: Schema.Types.ObjectId,
      ref: 'ExtraService',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }],
  
  eventTheme: {
    configId: {
      type: Schema.Types.ObjectId,
      ref: 'EventTheme'
    },
    name: String,
    selectedPackage: {
      name: String,
      pieces: Number,
      price: Number
    },
    selectedTheme: String
  },
  
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  
  child: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 18
    }
  },
  
  specialComments: {
    type: String,
    trim: true
  },
  
  pricing: {
    packagePrice: {
      type: Number,
      required: true,
      default: 0
    },
    foodPrice: {
      type: Number,
      default: 0
    },
    extrasPrice: {
      type: Number,
      default: 0
    },
    themePrice: {
      type: Number,
      default: 0
    },
    restDayFee: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'other']
  },
  paymentDate: Date,
  paymentNotes: String,
  amountPaid: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
ReservationSchema.index({ eventDate: 1 });
ReservationSchema.index({ 'customer.email': 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ createdAt: -1 });

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);