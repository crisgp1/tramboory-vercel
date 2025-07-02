import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import Finance from '@/models/Finance';
import mongoose from 'mongoose';

// Función para generar automáticamente finanza cuando se confirma una reserva
async function generateFinanceFromReservation(reservation: any) {
  try {
    // Verificar si ya existe una finanza para esta reserva
    const existingFinance = await Finance.findOne({
      'reservation.reservationId': reservation._id,
      isSystemGenerated: true
    });

    if (existingFinance) {
      console.log('Ya existe una finanza generada automáticamente para esta reserva');
      return existingFinance;
    }

    // Crear la finanza automáticamente
    const financeData = {
      type: 'income',
      description: `Ingreso por reserva - ${reservation.customer.name}`,
      amount: reservation.pricing.total,
      date: reservation.eventDate,
      category: 'reservation',
      subcategory: 'evento',
      reservation: {
        reservationId: reservation._id,
        customerName: reservation.customer.name,
        eventDate: reservation.eventDate
      },
      tags: [
        'reserva',
        'evento',
        'sistema',
        reservation.package.name.toLowerCase().replace(/\s+/g, '-')
      ],
      paymentMethod: 'cash', // Por defecto
      reference: `RES-${reservation._id.toString().slice(-8).toUpperCase()}`,
      notes: `Generado automáticamente al confirmar reserva. Evento: ${reservation.child.name} (${reservation.child.age} años)`,
      status: 'completed',
      isSystemGenerated: true,
      isEditable: false, // No puede ser editado, solo se pueden agregar children
      createdBy: 'sistema'
    };

    // Agregar etiquetas específicas según los servicios
    if (reservation.foodOption) {
      financeData.tags.push('comida');
    }
    if (reservation.extraServices && reservation.extraServices.length > 0) {
      financeData.tags.push('extras');
    }
    if (reservation.eventTheme) {
      financeData.tags.push('decoracion');
    }
    if (reservation.isRestDay) {
      financeData.tags.push('dia-descanso');
    }

    const newFinance = new Finance(financeData);
    await newFinance.save();

    console.log('Finanza generada automáticamente:', newFinance._id);
    return newFinance;
  } catch (error) {
    console.error('Error generando finanza automática:', error);
    throw error;
  }
}

// GET - Obtener reserva por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const reservation = await Reservation.findById(params.id)
      .populate('package.configId')
      .populate('foodOption.configId')
      .populate('extraServices.configId')
      .populate('eventTheme.configId');
    
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar reserva (principalmente para cambiar estado)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, ...updateData } = body;
    
    // Validar estado si se está actualizando
    if (status && !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }
    
    const updatedReservation = await Reservation.findByIdAndUpdate(
      params.id,
      {
        ...(status && { status }),
        ...updateData
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedReservation) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Si se está confirmando la reserva, generar automáticamente la finanza
    if (status === 'confirmed') {
      try {
        await generateFinanceFromReservation(updatedReservation);
      } catch (error) {
        console.error('Error generando finanza automática:', error);
        // No fallar la actualización de la reserva si hay error en la finanza
        // Solo logear el error
      }
    }
    
    return NextResponse.json({ success: true, data: updatedReservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const deletedReservation = await Reservation.findByIdAndDelete(params.id);
    
    if (!deletedReservation) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reserva eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la reserva' },
      { status: 500 }
    );
  }
}