import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment proof upload request received');
    
    const formData = await request.formData();
    const reservationId = formData.get('reservationId') as string;
    const reference = formData.get('reference') as string;
    const notes = formData.get('notes') as string;
    const paymentProof = formData.get('paymentProof') as File;

    console.log('Form data:', { reservationId, reference, notes, paymentProof: paymentProof?.name });

    if (!reservationId || !paymentProof) {
      console.log('Missing required data');
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos' },
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
    
    // Upload file to Vercel Blob storage
    console.log('Uploading file to Vercel Blob...');
    const blob = await put(`payment-proofs/${reservationId}-${paymentProof.name}`, paymentProof, {
      access: 'public',
    });

    console.log('File uploaded to Blob:', blob.url);
    
    // Store file metadata with blob URL
    const paymentProofData = {
      filename: paymentProof.name,
      size: paymentProof.size,
      type: paymentProof.type,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
      reference: reference || undefined,
      notes: notes || undefined
    };

    console.log('Updating reservation:', reservationId);
    
    // Update the reservation with payment proof and set status to verifying
    const result = await db.collection('reservations').updateOne(
      { _id: new ObjectId(reservationId) },
      { 
        $set: { 
          paymentStatus: 'verifying',
          paymentProof: paymentProofData,
          updatedAt: new Date().toISOString()
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

    console.log('Payment proof uploaded successfully');
    return NextResponse.json(
      {
        success: true,
        message: 'Comprobante de pago subido exitosamente',
        data: { paymentStatus: 'verifying' }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error uploading payment proof:', error);
    
    // Ensure we always return valid JSON
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