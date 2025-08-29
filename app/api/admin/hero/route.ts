import { NextRequest, NextResponse } from 'next/server';
import { HeroContent } from '@/models/HeroContent';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Obtener todos los heroes
export async function GET() {
  try {
    await connectToDatabase();
    
    const heroes = await HeroContent.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: heroes
    });
  } catch (error) {
    console.error('Error fetching heroes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los heroes' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo hero
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.mainTitle || !body.subtitle) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos requeridos deben estar llenos' },
        { status: 400 }
      );
    }
    
    const heroData = {
      ...body,
      // Asegurar que la promoción tenga valores por defecto
      promotion: {
        show: body.promotion?.show || false,
        text: body.promotion?.text || '',
        highlightColor: body.promotion?.highlightColor || 'yellow',
        expiryDate: body.promotion?.expiryDate || null
      }
    };
    
    const hero = new HeroContent(heroData);
    const savedHero = await hero.save();
    
    return NextResponse.json({
      success: true,
      data: savedHero
    });
  } catch (error) {
    console.error('Error creating hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el hero' },
      { status: 500 }
    );
  }
}