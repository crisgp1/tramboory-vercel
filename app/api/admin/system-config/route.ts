import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';

export async function GET() {
  try {
    await dbConnect();
    const systemConfig = await SystemConfig.findOne({});
    
    return NextResponse.json({
      success: true,
      data: systemConfig
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la configuración del sistema' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Verificar si ya existe una configuración
    const existingConfig = await SystemConfig.findOne({});
    if (existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una configuración del sistema. Use PUT para actualizar.' },
        { status: 400 }
      );
    }
    
    const systemConfig = new SystemConfig(body);
    await systemConfig.save();
    
    return NextResponse.json({
      success: true,
      data: systemConfig
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating system config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la configuración del sistema' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Buscar la configuración existente o crear una nueva
    let systemConfig = await SystemConfig.findOne({});
    
    if (systemConfig) {
      // Actualizar configuración existente
      Object.assign(systemConfig, body);
      await systemConfig.save();
    } else {
      // Crear nueva configuración si no existe
      systemConfig = new SystemConfig(body);
      await systemConfig.save();
    }
    
    return NextResponse.json({
      success: true,
      data: systemConfig
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la configuración del sistema' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    
    const systemConfig = await SystemConfig.findOneAndDelete({});
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuración del sistema no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuración del sistema eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting system config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la configuración del sistema' },
      { status: 500 }
    );
  }
}