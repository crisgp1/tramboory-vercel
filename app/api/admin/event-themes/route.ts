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
