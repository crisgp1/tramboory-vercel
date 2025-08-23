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
      // Si existe, actualizarla en lugar de fallar
      Object.assign(existingConfig, body);
      await existingConfig.save();
      
      return NextResponse.json({
        success: true,
        data: existingConfig
      });
    }
    
    // Si no existe, crear una nueva
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
    
    console.log('🔍 DEBUG: API received system config data:', {
      restDays: body.restDays,
      timeBlocks: body.timeBlocks,
      hasRestDays: !!body.restDays && body.restDays.length > 0,
      hasTimeBlocks: !!body.timeBlocks && body.timeBlocks.length > 0,
      fullBody: body
    });
    
    // Buscar la configuración existente o crear una nueva
    let systemConfig = await SystemConfig.findOne({});
    
    if (systemConfig) {
      // Actualizar configuración existente
      Object.assign(systemConfig, body);
      await systemConfig.save();
      console.log('🔍 DEBUG: Updated system config in DB:', {
        id: systemConfig._id,
        restDays: systemConfig.restDays,
        timeBlocks: systemConfig.timeBlocks
      });
    } else {
      // Crear nueva configuración si no existe
      systemConfig = new SystemConfig(body);
      await systemConfig.save();
      console.log('🔍 DEBUG: Created new system config in DB:', {
        id: systemConfig._id,
        restDays: systemConfig.restDays,
        timeBlocks: systemConfig.timeBlocks
      });
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