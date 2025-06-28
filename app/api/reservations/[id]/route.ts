import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import mongoose from 'mongoose';

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