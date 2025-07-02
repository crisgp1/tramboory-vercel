import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventTheme from '@/models/EventTheme';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = await context.params;
    
    const eventTheme = await EventTheme.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!eventTheme) {
      return NextResponse.json(
        { success: false, error: 'Tema de evento no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: eventTheme
    });
  } catch (error) {
    console.error('Error updating event theme:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el tema de evento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    
    const eventTheme = await EventTheme.findByIdAndDelete(id);
    
    if (!eventTheme) {
      return NextResponse.json(
        { success: false, error: 'Tema de evento no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tema de evento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting event theme:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el tema de evento' },
      { status: 500 }
    );
  }
}