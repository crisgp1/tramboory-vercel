import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { auth } from '@clerk/nextjs/server'
import { SupplierPenalty, PenaltyConcept, PenaltySeverity, PenaltyStatus } from '@/types/supplier-penalties'
import { Schema, model, models } from 'mongoose'

// Supplier penalty management API routes

// Define Mongoose schema for penalties
const SupplierPenaltySchema = new Schema({
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  concept: { type: String, enum: Object.values(PenaltyConcept), required: true },
  severity: { type: String, enum: Object.values(PenaltySeverity), required: true },
  description: { type: String, required: true },
  penaltyValue: { type: Number, required: true },
  monetaryPenalty: { type: Number },
  appliedBy: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: { type: String, enum: Object.values(PenaltyStatus), default: PenaltyStatus.ACTIVE },
  evidence: [{ type: String }],
  notes: { type: String }
}, { timestamps: true })

const PenaltyModel = models.SupplierPenalty || model('SupplierPenalty', SupplierPenaltySchema)

// GET - Obtener penalizaciones
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    await dbConnect()

    // Construir filtros
    const filter: any = {}
    if (supplierId) filter.supplierId = supplierId
    if (status) filter.status = status

    // Obtener penalizaciones con paginación
    const penalties = await PenaltyModel
      .find(filter)
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await PenaltyModel.countDocuments(filter)

    return NextResponse.json({
      penalties,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching penalties:', error)
    return NextResponse.json(
      { error: 'Error al obtener penalizaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva penalización
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      supplierId,
      supplierName,
      concept,
      severity,
      description,
      penaltyValue,
      monetaryPenalty,
      notes
    } = body

    // Validaciones
    if (!supplierId || !supplierName || !concept || !severity || !description || !penaltyValue) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (!Object.values(PenaltyConcept).includes(concept)) {
      return NextResponse.json(
        { error: 'Concepto de penalización inválido' },
        { status: 400 }
      )
    }

    if (!Object.values(PenaltySeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Severidad inválida' },
        { status: 400 }
      )
    }

    if (penaltyValue <= 0 || penaltyValue > 100) {
      return NextResponse.json(
        { error: 'Los puntos de penalización deben estar entre 1 y 100' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Crear la penalización
    const penalty: Omit<SupplierPenalty, '_id'> = {
      supplierId,
      supplierName,
      concept,
      severity,
      description: description.trim(),
      penaltyValue,
      monetaryPenalty: monetaryPenalty || undefined,
      appliedBy: userId,
      appliedAt: new Date(),
      status: PenaltyStatus.ACTIVE,
      notes: notes?.trim() || undefined
    }

    // Calcular fecha de expiración basada en severidad
    const expirationDays = {
      [PenaltySeverity.MINOR]: 30,      // 1 mes
      [PenaltySeverity.MODERATE]: 60,   // 2 meses
      [PenaltySeverity.MAJOR]: 90,      // 3 meses
      [PenaltySeverity.CRITICAL]: 180   // 6 meses
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays[severity])
    penalty.expiresAt = expiresAt

    const result = await PenaltyModel.create(penalty)

    // Actualizar el score del proveedor
    await updateSupplierScore(supplierId, penaltyValue, 'subtract')

    // Registrar en logs/auditoría
    await logPenaltyAction({
      action: 'PENALTY_APPLIED',
      supplierId,
      supplierName,
      penaltyId: result._id.toString(),
      concept,
      severity,
      points: penaltyValue,
      appliedBy: userId,
      timestamp: new Date()
    })

    return NextResponse.json({
      message: 'Penalización aplicada exitosamente',
      penaltyId: result._id,
      penalty: result
    })

  } catch (error) {
    console.error('Error creating penalty:', error)
    return NextResponse.json(
      { error: 'Error al aplicar penalización' },
      { status: 500 }
    )
  }
}

// Función auxiliar para actualizar el score del proveedor
async function updateSupplierScore(supplierId: string, points: number, operation: 'add' | 'subtract') {
  try {
    const Supplier = models.Supplier || (await import('@/lib/models/inventory/Supplier')).default
    const scoreChange = operation === 'add' ? points : -points
    
    await Supplier.findByIdAndUpdate(
      supplierId,
      { 
        $inc: { 'performance.penaltyScore': scoreChange },
        $set: { 'performance.lastUpdated': new Date() }
      },
      { upsert: false }
    )
  } catch (error) {
    console.error('Error updating supplier score:', error)
  }
}

// Función auxiliar para logging
async function logPenaltyAction(logData: any) {
  try {
    const LogSchema = new Schema({
      action: String,
      supplierId: String,
      supplierName: String,
      penaltyId: String,
      concept: String,
      severity: String,
      points: Number,
      appliedBy: String,
      timestamp: { type: Date, default: Date.now }
    })
    
    const LogModel = models.SupplierPenaltyLog || model('SupplierPenaltyLog', LogSchema)
    await LogModel.create(logData)
  } catch (error) {
    console.error('Error logging penalty action:', error)
  }
}