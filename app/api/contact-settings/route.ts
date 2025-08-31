import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbConnect from '@/lib/mongodb'
import ContactSettings from '@/models/ContactSettings'

// GET - Obtener configuración de contacto
export async function GET() {
  try {
    await dbConnect()
    
    let settings = await ContactSettings.findOne({ isActive: true }).lean()
    
    // Si no existe, crear configuración por defecto
    if (!settings) {
      settings = await ContactSettings.create({
        businessName: 'Tramboory',
        tagline: 'El mejor salón de fiestas infantiles en Zapopan',
        phones: [
          { number: '33 1234 5678', label: 'Principal', isPrimary: true }
        ],
        emails: [
          { email: 'hola@tramboory.com', label: 'General', isPrimary: true },
          { email: 'eventos@tramboory.com', label: 'Eventos', isPrimary: false }
        ],
        whatsapp: {
          number: '523312345678',
          message: 'Hola! Me gustaría información sobre los servicios de Tramboory para organizar una fiesta.',
          enabled: true
        },
        address: {
          street: 'P.º Solares 1639',
          neighborhood: 'Solares Residencial',
          city: 'Zapopan',
          state: 'Jalisco',
          zipCode: '45019',
          references: ['En Solares Residencial', 'Ubicado en Solares Lake']
        },
        schedules: [
          { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
          { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
          { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
          { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
          { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
          { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
          { day: 'sunday', isOpen: false, notes: 'Solo eventos programados' }
        ],
        socialMedia: {
          instagram: 'https://instagram.com/tramboory',
          facebook: 'https://facebook.com/tramboory'
        },
        maps: {
          googleMaps: 'https://maps.app.goo.gl/VVE54ydTWC3HgyB5A',
          waze: 'https://waze.com/ul?q=P.º%20Solares%201639%20Solares%20Residencial%20Zapopan&navigate=yes'
        },
        bankingInfo: {
          bankName: 'BBVA México',
          accountHolder: 'Tramboory S.A. de C.V.',
          clabe: '',
          accountNumber: '',
          paymentAddress: '',
          paymentInstructions: 'Realiza tu transferencia y envía el comprobante por WhatsApp para confirmar tu reservación.',
          enabled: true
        },
        discountSettings: {
          cashDiscount: {
            enabled: false,
            percentage: 0,
            description: 'Descuento por pago en efectivo',
            appliesTo: 'remaining'
          }
        }
      })
    } else {
      // Si ya existe pero le faltan campos bancarios, agregarlos
      let needsUpdate = false;
      
      if (!(settings as any).bankingInfo) {
        (settings as any).bankingInfo = {
          bankName: 'BBVA México',
          accountHolder: 'Tramboory S.A. de C.V.',
          clabe: '',
          accountNumber: '',
          paymentAddress: '',
          paymentInstructions: 'Realiza tu transferencia y envía el comprobante por WhatsApp para confirmar tu reservación.',
          enabled: true
        };
        needsUpdate = true;
      }
      
      if (!(settings as any).discountSettings) {
        (settings as any).discountSettings = {
          cashDiscount: {
            enabled: false,
            percentage: 0,
            description: 'Descuento por pago en efectivo',
            appliesTo: 'remaining'
          }
        };
        needsUpdate = true;
      }
      
      // Actualizar en la base de datos si hubo cambios
      if (needsUpdate) {
        await ContactSettings.findOneAndUpdate(
          { isActive: true },
          {
            bankingInfo: (settings as any).bankingInfo,
            discountSettings: (settings as any).discountSettings,
            updatedAt: new Date()
          }
        );
      }
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching contact settings:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración de contacto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración de contacto
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const body = await request.json()
    
    // Agregar metadatos de actualización
    body.lastUpdatedBy = userId
    body.updatedAt = new Date()

    // Buscar configuración existente
    let settings = await ContactSettings.findOne({ isActive: true })
    
    if (settings) {
      // Actualizar existente
      Object.assign(settings, body)
      await settings.save()
    } else {
      // Crear nueva
      settings = await ContactSettings.create({
        ...body,
        isActive: true
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating contact settings:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración de contacto' },
      { status: 500 }
    )
  }
}