import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { paymentStatus, amountPaid, paymentDate, paymentMethod, paymentNotes } = await request.json();
    const reservationId = params.id;

    console.log('Payment status update request:', { 
      reservationId, 
      paymentStatus, 
      amountPaid, 
      paymentDate, 
      paymentMethod 
    });

    if (!reservationId || !paymentStatus) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!['paid', 'partial'].includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'Estado de pago inválido' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    
    console.log('Updating payment status:', { reservationId, paymentStatus, amountPaid });
    
    // Update the reservation payment status
    const updateData: any = {
      paymentStatus,
      updatedAt: new Date().toISOString()
    };

    // Add payment details if provided
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
    }
    if (paymentDate) {
      updateData.paymentDate = paymentDate;
    }
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    if (paymentNotes) {
      updateData.paymentNotes = paymentNotes;
    }

    // If payment is complete, also confirm the reservation
    if (paymentStatus === 'paid') {
      updateData.status = 'confirmed';
    }

    const result = await db.collection('reservations').updateOne(
      { _id: new ObjectId(reservationId) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.log('Reservation not found');
      return NextResponse.json(
        { success: false, message: 'Reservación no encontrada' },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const statusMessage = paymentStatus === 'paid' ? 'pago completo' : 'anticipo';
    console.log(`Payment marked as ${statusMessage} successfully`);
    
    return NextResponse.json(
      {
        success: true,
        message: `Pago marcado como ${statusMessage} exitosamente`,
        data: { 
          paymentStatus,
          amountPaid,
          ...(paymentStatus === 'paid' && { status: 'confirmed' })
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating payment status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}