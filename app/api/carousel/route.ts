import { NextRequest, NextResponse } from 'next/server';
import { CarouselCard } from '@/models/CarouselCard';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Obtener todas las tarjetas activas
export async function GET() {
  try {
    await connectToDatabase();
    
    const cards = await CarouselCard.getActiveCards();
    
    return NextResponse.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching carousel cards:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las tarjetas del carousel' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarjeta
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener el siguiente número de orden
    const lastCard = await CarouselCard.findOne().sort({ order: -1 });
    const nextOrder = (lastCard?.order || 0) + 1;
    
    const cardData = {
      ...body,
      order: body.order ?? nextOrder,
      // Asegurar valores por defecto
      backgroundMedia: {
        type: body.backgroundMedia?.type || 'gradient',
        url: body.backgroundMedia?.url || undefined,
        fallbackImage: body.backgroundMedia?.fallbackImage || undefined,
        alt: body.backgroundMedia?.alt || undefined
      }
    };
    
    const card = new CarouselCard(cardData);
    await card.save();
    
    return NextResponse.json({
      success: true,
      data: card,
      message: 'Tarjeta creada correctamente'
    });
  } catch (error) {
    console.error('Error creating carousel card:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la tarjeta' },
      { status: 500 }
    );
  }
}