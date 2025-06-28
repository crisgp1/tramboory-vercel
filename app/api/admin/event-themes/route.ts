import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventTheme from '@/models/EventTheme';

export async function GET() {
  try {
    await dbConnect();
    const eventThemes = await EventTheme.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: eventThemes
    });
  } catch (error) {
    console.error('Error fetching event themes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los temas de eventos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const eventTheme = new EventTheme(body);
    await eventTheme.save();
    
    return NextResponse.json({
      success: true,
      data: eventTheme
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event theme:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el tema de evento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const eventTheme = await EventTheme.findByIdAndUpdate(
      _id,
      updateData,
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

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del tema de evento requerido' },
        { status: 400 }
      );
    }
    
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