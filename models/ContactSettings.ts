import mongoose from 'mongoose'

const ContactSettingsSchema = new mongoose.Schema({
  // Información básica
  businessName: {
    type: String,
    required: true,
    default: 'Tramboory'
  },
  tagline: {
    type: String,
    default: 'El mejor salón de fiestas infantiles en Zapopan'
  },
  
  // Datos de contacto
  phones: [{
    number: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: 'Principal'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  emails: [{
    email: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: 'General'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // WhatsApp
  whatsapp: {
    number: {
      type: String,
      required: true,
      default: '523312345678'
    },
    message: {
      type: String,
      default: 'Hola! Me gustaría información sobre los servicios de Tramboory para organizar una fiesta.'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Dirección
  address: {
    street: {
      type: String,
      required: true,
      default: 'P.º Solares 1639'
    },
    neighborhood: {
      type: String,
      default: 'Solares Residencial'
    },
    city: {
      type: String,
      default: 'Zapopan'
    },
    state: {
      type: String,
      default: 'Jalisco'
    },
    zipCode: {
      type: String,
      default: '45019'
    },
    references: [String]
  },
  
  // Horarios
  schedules: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: {
      type: String,
      default: '09:00'
    },
    closeTime: {
      type: String,
      default: '18:00'
    },
    notes: String
  }],
  
  // Redes sociales
  socialMedia: {
    facebook: String,
    instagram: String,
    tiktok: String,
    youtube: String
  },
  
  // Enlaces de mapas
  maps: {
    googleMaps: {
      type: String,
      default: 'https://maps.app.goo.gl/VVE54ydTWC3HgyB5A'
    },
    waze: {
      type: String,
      default: 'https://waze.com/ul?q=P.º%20Solares%201639%20Solares%20Residencial%20Zapopan&navigate=yes'
    },
    embedUrl: String
  },
  
  // Información bancaria
  bankingInfo: {
    bankName: {
      type: String,
      default: 'BBVA México',
      maxlength: [100, 'El nombre del banco no puede exceder 100 caracteres'],
      validate: {
        validator: function(v: string) {
          if (!v) return false;
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,]*$/.test(v);
        },
        message: 'El nombre del banco contiene caracteres no permitidos'
      }
    },
    accountHolder: {
      type: String,
      default: 'Tramboory S.A. de C.V.',
      maxlength: [150, 'El nombre del titular no puede exceder 150 caracteres'],
      validate: {
        validator: function(v: string) {
          if (!v) return false;
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\,\&]*$/.test(v);
        },
        message: 'El nombre del titular contiene caracteres no permitidos'
      }
    },
    clabe: {
      type: String,
      default: '',
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Opcional cuando está deshabilitado
          return /^[0-9]{18}$/.test(v);
        },
        message: 'La CLABE debe tener exactamente 18 dígitos'
      }
    },
    accountNumber: {
      type: String,
      maxlength: [20, 'El número de cuenta no puede exceder 20 caracteres'],
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Es opcional
          return /^[0-9]*$/.test(v);
        },
        message: 'El número de cuenta solo puede contener números'
      }
    },
    paymentAddress: {
      type: String,
      default: '',
      maxlength: [200, 'La dirección de pago no puede exceder 200 caracteres'],
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Es opcional
          return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,\#]*$/.test(v);
        },
        message: 'La dirección contiene caracteres no permitidos'
      }
    },
    paymentInstructions: {
      type: String,
      default: 'Realiza tu transferencia y envía el comprobante por WhatsApp para confirmar tu reservación.',
      maxlength: [500, 'Las instrucciones no pueden exceder 500 caracteres']
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Configuración de descuentos
  discountSettings: {
    cashDiscount: {
      enabled: {
        type: Boolean,
        default: false
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      description: {
        type: String,
        default: 'Descuento por pago en efectivo',
        maxlength: [100, 'La descripción no puede exceder 100 caracteres'],
        validate: {
          validator: function(v: string) {
            if (!v) return false;
            return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,\%]*$/.test(v);
          },
          message: 'La descripción contiene caracteres no permitidos'
        }
      },
      appliesTo: {
        type: String,
        enum: ['remaining', 'total'],
        default: 'remaining'
      }
    }
  },
  
  // Metadatos
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: String
  
}, {
  timestamps: true
})

// Solo debe existir una configuración de contacto
ContactSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } })

export default mongoose.models.ContactSettings || mongoose.model('ContactSettings', ContactSettingsSchema)