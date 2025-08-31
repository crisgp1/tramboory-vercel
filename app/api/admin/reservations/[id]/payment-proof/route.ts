import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reservationId } = await params;
  
  try {

    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: 'ID de reservación requerido' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

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
    
    // Get the reservation to check if payment proof exists
    const reservation = await db.collection('reservations').findOne(
      { _id: new ObjectId(reservationId) }
    );

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: 'Reservación no encontrada' },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!reservation.paymentProof) {
      return NextResponse.json(
        { success: false, message: 'No hay comprobante de pago disponible' },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the payment proof has a URL (new format with Vercel Blob)
    if (reservation.paymentProof.url) {
      // Redirect to the blob URL
      return NextResponse.redirect(reservation.paymentProof.url);
    } else {
      // Legacy data without actual file storage
      return NextResponse.json(
        {
          success: false,
          message: 'Archivo no disponible - comprobante subido antes de la implementación de almacenamiento',
          fileInfo: {
            filename: reservation.paymentProof.filename,
            uploadedAt: reservation.paymentProof.uploadedAt,
            reference: reservation.paymentProof.reference,
            notes: reservation.paymentProof.notes
          }
        },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error retrieving payment proof:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al recuperar el comprobante de pago',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}