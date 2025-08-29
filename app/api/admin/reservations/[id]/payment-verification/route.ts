import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { action } = await request.json();
    const { id: reservationId } = await params;

    console.log('Payment verification request:', { reservationId, action });

    if (!reservationId || !action) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Acción inválida' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Error de conexión a la base de datos' },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Determine the new payment status based on action
    const newPaymentStatus = action === 'verify' ? 'verified' : 'rejected';
    
    console.log('Updating payment status:', { reservationId, newPaymentStatus });
    
    // Update the reservation payment status
    const result = await db.collection('reservations').updateOne(
      { _id: new ObjectId(reservationId) },
      { 
        $set: { 
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString(),
          // Also update the reservation status to confirmed if payment is verified
          ...(action === 'verify' && { status: 'confirmed' })
        }
      }
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

    console.log(`Payment ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
    return NextResponse.json(
      {
        success: true,
        message: `Pago ${action === 'verify' ? 'verificado' : 'rechazado'} exitosamente`,
        data: { 
          paymentStatus: newPaymentStatus,
          ...(action === 'verify' && { status: 'confirmed' })
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating payment verification:', error);
    
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