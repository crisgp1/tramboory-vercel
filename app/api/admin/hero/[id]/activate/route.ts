import { NextRequest, NextResponse } from 'next/server';
import { HeroContent } from '@/models/HeroContent';
import { connectToDatabase } from '@/lib/mongodb';

// POST - Activar un hero específico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Verificar que el hero existe
    const hero = await HeroContent.findById(params.id);
    
    if (!hero) {
      return NextResponse.json(
        { success: false, error: 'Hero no encontrado' },
        { status: 404 }
      );
    }
    
    // Usar el método estático para activar
    await HeroContent.activate(params.id);
    
    // Obtener el hero actualizado
    const updatedHero = await HeroContent.findById(params.id);
    
    return NextResponse.json({
      success: true,
      data: updatedHero,
      message: 'Hero activado correctamente'
    });
  } catch (error) {
    console.error('Error activating hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al activar el hero' },
      { status: 500 }
    );
  }
}