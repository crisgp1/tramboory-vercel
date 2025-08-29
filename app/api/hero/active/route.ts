import { NextResponse } from 'next/server';
import { HeroContent } from '@/models/HeroContent';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Obtener el hero activo (público)
export async function GET() {
  try {
    await connectToDatabase();
    
    const activeHero = await HeroContent.getActive();
    
    if (!activeHero) {
      // Si no hay hero activo, devolver uno por defecto
      const defaultHero = {
        mainTitle: "Celebra con",
        brandTitle: "Tramboory",
        subtitle: "Experiencias mágicas diseñadas para crear recuerdos inolvidables en el cumpleaños de tus pequeños en Zapopan.",
        primaryButton: {
          text: "Reserva tu fiesta",
          action: "signup"
        },
        secondaryButton: {
          text: "Ver Galería",
          href: "/galeria"
        },
        backgroundMedia: {
          type: "video",
          url: "/assets/video/background.webm"
        },
        showGlitter: true,
        isActive: true,
        promotion: {
          show: false,
          text: "",
          highlightColor: "yellow"
        }
      };
      
      return NextResponse.json({
        success: true,
        data: defaultHero
      });
    }
    
    return NextResponse.json({
      success: true,
      data: activeHero
    });
  } catch (error) {
    console.error('Error fetching active hero:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el hero activo' },
      { status: 500 }
    );
  }
}