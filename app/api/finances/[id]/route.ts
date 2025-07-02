import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';
import Reservation from '@/models/Reservation';
import mongoose from 'mongoose';

// GET - Obtener una transacción financiera específica
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await context.params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const finance = await Finance.findById(id)
      .populate('reservation.reservationId');
    
    if (!finance) {
      return NextResponse.json(
        { success: false, error: 'Transacción financiera no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: finance });
  } catch (error) {
    console.error('Error fetching finance:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la transacción financiera' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una transacción financiera
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await context.params;
    const body = await request.json();
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const {
      type,
      description,
      amount,
      date,
      category,
      subcategory,
      reservationId,
      tags,
      paymentMethod,
      reference,
      notes,
      status,
      createdBy
    } = body;
    
    // Buscar la transacción existente
    const existingFinance = await Finance.findById(id);
    if (!existingFinance) {
      return NextResponse.json(
        { success: false, error: 'Transacción financiera no encontrada' },
        { status: 404 }
      );
    }
    
    // Preparar datos de actualización
    const updateData: any = {};
    
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'El tipo debe ser "income" o "expense"' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    if (amount !== undefined) {
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { success: false, error: 'El monto debe ser un número positivo' },
          { status: 400 }
        );
      }
      updateData.amount = parseFloat(amount);
    }
    
    if (date !== undefined) {
      updateData.date = new Date(date);
    }
    
    if (category !== undefined) {
      if (!['reservation', 'operational', 'salary', 'other'].includes(category)) {
        return NextResponse.json(
          { success: false, error: 'Categoría inválida' },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    
    if (subcategory !== undefined) {
      updateData.subcategory = subcategory ? subcategory.trim() : null;
    }
    
    if (tags !== undefined) {
      updateData.tags = tags ? tags.map((tag: string) => tag.trim().toLowerCase()) : [];
    }
    
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }
    
    if (reference !== undefined) {
      updateData.reference = reference ? reference.trim() : null;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes ? notes.trim() : null;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (createdBy !== undefined) {
      updateData.createdBy = createdBy ? createdBy.trim() : null;
    }
    
    // Manejar relación con reserva
    if (reservationId !== undefined) {
      if (reservationId) {
        const reservation = await Reservation.findById(reservationId);
        if (reservation) {
          updateData.reservation = {
            reservationId: reservation._id,
            customerName: reservation.customer.name,
            eventDate: reservation.eventDate
          };
        } else {
          return NextResponse.json(
            { success: false, error: 'Reserva no encontrada' },
            { status: 404 }
          );
        }
      } else {
        updateData.reservation = null;
      }
    }
    
    // Actualizar la transacción
    const updatedFinance = await Finance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('reservation.reservationId');
    
    return NextResponse.json({ success: true, data: updatedFinance });
  } catch (error) {
    console.error('Error updating finance:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la transacción financiera' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una transacción financiera
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await context.params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const deletedFinance = await Finance.findByIdAndDelete(id);
    
    if (!deletedFinance) {
      return NextResponse.json(
        { success: false, error: 'Transacción financiera no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Transacción financiera eliminada exitosamente',
      data: deletedFinance
    });
  } catch (error) {
    console.error('Error deleting finance:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la transacción financiera' },
      { status: 500 }
    );
  }
}