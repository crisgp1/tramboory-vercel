import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { auth } from '@clerk/nextjs/server'
import { PenaltyStatus } from '@/types/supplier-penalties'
import { Schema, model, models, isValidObjectId } from 'mongoose'

// Define Mongoose schema for penalties
const SupplierPenaltySchema = new Schema({
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  concept: { type: String, required: true },
  severity: { type: String, required: true },
  description: { type: String, required: true },
  penaltyValue: { type: Number, required: true },
  monetaryPenalty: { type: Number },
  appliedBy: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: { type: String, default: PenaltyStatus.ACTIVE },
  evidence: [{ type: String }],
  notes: { type: String },
  updatedBy: { type: String },
  updatedAt: { type: Date },
  reversedBy: { type: String },
  reversedAt: { type: Date }
}, { timestamps: true })

const PenaltyModel = models.SupplierPenalty || model('SupplierPenalty', SupplierPenaltySchema)

// GET - Obtener penalización específica
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await dbConnect()

    const penalty = await PenaltyModel.findById(id).lean()

    if (!penalty) {
      return NextResponse.json({ error: 'Penalización no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ penalty })

  } catch (error) {
    console.error('Error fetching penalty:', error)
    return NextResponse.json(
      { error: 'Error al obtener penalización' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar penalización
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await dbConnect()

    // Obtener penalización actual
    const currentPenalty = await PenaltyModel.findById(id)
    if (!currentPenalty) {
      return NextResponse.json({ error: 'Penalización no encontrada' }, { status: 404 })
    }

    const allowedUpdates = ['status', 'notes', 'expiresAt']
    const updates: any = {}
    
    // Solo permitir actualización de campos específicos
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key]
      }
    })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 })
    }

    // Agregar metadatos de actualización
    updates.updatedBy = userId
    updates.updatedAt = new Date()

    const result = await PenaltyModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )

    if (!result) {
      return NextResponse.json({ error: 'Penalización no encontrada' }, { status: 404 })
    }

    // Si se cambió el status, actualizar el score del proveedor
    if (updates.status && updates.status !== currentPenalty.status) {
      await handleStatusChange(currentPenalty, updates.status, userId)
    }

    return NextResponse.json({ message: 'Penalización actualizada exitosamente' })

  } catch (error) {
    console.error('Error updating penalty:', error)
    return NextResponse.json(
      { error: 'Error al actualizar penalización' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar/Revertir penalización
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await dbConnect()

    // Obtener la penalización antes de eliminar
    const penalty = await PenaltyModel.findById(id)
    if (!penalty) {
      return NextResponse.json({ error: 'Penalización no encontrada' }, { status: 404 })
    }

    // Marcar como revertida en lugar de eliminar físicamente
    const result = await PenaltyModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: PenaltyStatus.REVERSED,
          reversedBy: userId,
          reversedAt: new Date()
        }
      }
    )

    if (!result) {
      return NextResponse.json({ error: 'Penalización no encontrada' }, { status: 404 })
    }

    // Revertir los puntos del proveedor solo si estaba activa
    if (penalty.status === PenaltyStatus.ACTIVE) {
      await updateSupplierScore(penalty.supplierId, penalty.penaltyValue, 'add')
    }

    // Registrar en logs
    await logPenaltyAction({
      action: 'PENALTY_REVERSED',
      supplierId: penalty.supplierId,
      supplierName: penalty.supplierName,
      penaltyId: id,
      concept: penalty.concept,
      severity: penalty.severity,
      points: penalty.penaltyValue,
      reversedBy: userId,
      timestamp: new Date()
    })

    return NextResponse.json({ message: 'Penalización revertida exitosamente' })

  } catch (error) {
    console.error('Error deleting penalty:', error)
    return NextResponse.json(
      { error: 'Error al revertir penalización' },
      { status: 500 }
    )
  }
}

// Función auxiliar para manejar cambios de estado
async function handleStatusChange(currentPenalty: any, newStatus: PenaltyStatus, userId: string) {
  const oldStatus = currentPenalty.status
  
  // Lógica para ajustar puntos según el cambio de estado
  if (oldStatus === PenaltyStatus.ACTIVE && newStatus !== PenaltyStatus.ACTIVE) {
    // Se desactiva una penalización activa - devolver puntos
    await updateSupplierScore(currentPenalty.supplierId, currentPenalty.penaltyValue, 'add')
  } else if (oldStatus !== PenaltyStatus.ACTIVE && newStatus === PenaltyStatus.ACTIVE) {
    // Se activa una penalización inactiva - restar puntos
    await updateSupplierScore(currentPenalty.supplierId, currentPenalty.penaltyValue, 'subtract')
  }

  // Registrar el cambio
  await logPenaltyAction({
    action: 'PENALTY_STATUS_CHANGED',
    supplierId: currentPenalty.supplierId,
    supplierName: currentPenalty.supplierName,
    penaltyId: currentPenalty._id.toString(),
    oldStatus,
    newStatus,
    changedBy: userId,
    timestamp: new Date()
  })
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
      reversedBy: String,
      changedBy: String,
      oldStatus: String,
      newStatus: String,
      timestamp: { type: Date, default: Date.now }
    })
    
    const LogModel = models.SupplierPenaltyLog || model('SupplierPenaltyLog', LogSchema)
    await LogModel.create(logData)
  } catch (error) {
    console.error('Error logging penalty action:', error)
  }
}