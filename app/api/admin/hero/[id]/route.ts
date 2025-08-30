import { NextRequest, NextResponse } from 'next/server';
import { HeroContent } from '@/models/HeroContent';
import dbConnect from '@/lib/mongodb';

// GET - Obtener un hero específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    
    
    const { id } = await params;const { id } = await params;const { id } = await params;try {
    await dbConnect();
    
    const hero = await HeroContent.findById(id).lean();
    
    if (!hero) {
      return NextResponse.json(
        { success: false, error: 'Hero no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: hero
    });
  } catch (error) {
    console.error('Error fetching hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el hero' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un hero
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    
    
    const { id } = await params;const { id } = await params;const { id } = await params;try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.mainTitle || !body.subtitle) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos requeridos deben estar llenos' },
        { status: 400 }
      );
    }
    
    const updateData = {
      ...body,
      // Asegurar que la promoción tenga valores por defecto
      promotion: {
        show: body.promotion?.show || false,
        text: body.promotion?.text || '',
        highlightColor: body.promotion?.highlightColor || 'yellow',
        expiryDate: body.promotion?.expiryDate || null
      }
    };
    
    const hero = await HeroContent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!hero) {
      return NextResponse.json(
        { success: false, error: 'Hero no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: hero
    });
  } catch (error) {
    console.error('Error updating hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el hero' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un hero
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    
    
    const { id } = await params;const { id } = await params;const { id } = await params;try {
    await dbConnect();
    
    const hero = await HeroContent.findById(id);
    
    if (!hero) {
      return NextResponse.json(
        { success: false, error: 'Hero no encontrado' },
        { status: 404 }
      );
    }
    
    // No permitir eliminar el hero activo si es el único
    if (hero.isActive) {
      const activeCount = await HeroContent.countDocuments({ isActive: true });
      const totalCount = await HeroContent.countDocuments();
      
      if (activeCount === 1 && totalCount > 1) {
        return NextResponse.json(
          { success: false, error: 'No se puede eliminar el hero activo. Activa otro hero primero.' },
          { status: 400 }
        );
      }
    }
    
    await HeroContent.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Hero eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el hero' },
      { status: 500 }
    );
  }
}