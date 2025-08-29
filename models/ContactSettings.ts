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