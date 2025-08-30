import { NextRequest, NextResponse } from 'next/server';
import { CarouselCard } from '@/models/CarouselCard';
import dbConnect from '@/lib/mongodb';

// GET - Obtener tarjeta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const card = await CarouselCard.findById(id).lean();
    
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Tarjeta no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...card,
        id: card._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching carousel card:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la tarjeta' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarjeta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }
    
    const updateData = {
      ...body,
      // Asegurar valores por defecto
      backgroundMedia: {
        type: body.backgroundMedia?.type || 'gradient',
        url: body.backgroundMedia?.url || undefined,
        fallbackImage: body.backgroundMedia?.fallbackImage || undefined,
        alt: body.backgroundMedia?.alt || undefined
      }
    };
    
    const card = await CarouselCard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Tarjeta no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...card.toObject(),
        id: card._id.toString()
      },
      message: 'Tarjeta actualizada correctamente'
    });
  } catch (error) {
    console.error('Error updating carousel card:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la tarjeta' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarjeta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const card = await CarouselCard.findById(id);
    
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Tarjeta no encontrada' },
        { status: 404 }
      );
    }
    
    await CarouselCard.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Tarjeta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting carousel card:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la tarjeta' },
      { status: 500 }
    );
  }
}