import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'

// Modelo para mensajes de contacto
const ContactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['cumpleanos', 'tematica', 'bautizo', 'comunion', 'graduacion', 'otro'],
  },
  eventDate: {
    type: String,
    trim: true,
  },
  guestCount: {
    type: String,
    enum: ['1-20', '21-40', '41-60', '61-80', '81-100', '100+'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['nuevo', 'contactado', 'cotizado', 'cerrado'],
    default: 'nuevo',
  },
  source: {
    type: String,
    default: 'website',
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
})

// Índices para optimizar consultas
ContactMessageSchema.index({ createdAt: -1 })
ContactMessageSchema.index({ status: 1 })
ContactMessageSchema.index({ eventType: 1 })

const ContactMessage = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema)

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { name, email, phone, eventType, eventDate, guestCount, message } = body

    // Validaciones básicas
    if (!name || !email || !phone || !eventType || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Obtener información adicional de la request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Crear nuevo mensaje de contacto
    const contactMessage = new ContactMessage({
      name,
      email,
      phone,
      eventType,
      eventDate,
      guestCount,
      message,
      ipAddress,
      userAgent,
    })

    await contactMessage.save()

    // En un entorno de producción, aquí podrías:
    // 1. Enviar email de notificación al equipo
    // 2. Enviar email de confirmación al cliente
    // 3. Integrar con CRM
    // 4. Enviar notificación a Slack/Teams

    return NextResponse.json(
      { 
        message: 'Mensaje enviado correctamente',
        id: contactMessage._id 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error processing contact form:', error)
    
    // Log más detallado para debugging
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para obtener mensajes (solo para admins)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // En producción deberías verificar autenticación de admin aquí
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const query: any = {}
    if (status && status !== 'todos') {
      query.status = status
    }

    const messages = await ContactMessage
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()

    const total = await ContactMessage.countDocuments(query)

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching contact messages:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}