import { NextRequest, NextResponse } from 'next/server';
import { HeroContent } from '@/models/HeroContent';
import dbConnect from '@/lib/mongodb';

// POST - Activar un hero específico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    // Verificar que el hero existe
    const hero = await HeroContent.findById(id);
    
    if (!hero) {
      return NextResponse.json(
        { success: false, error: 'Hero no encontrado' },
        { status: 404 }
      );
    }
    
    // Usar el método estático para activar
    await HeroContent.activate(id);
    
    // Obtener el hero actualizado
    const updatedHero = await HeroContent.findById(id);
    
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