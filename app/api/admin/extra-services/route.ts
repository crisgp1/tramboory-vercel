import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExtraService from '@/models/ExtraService';

export async function GET() {
  try {
    await dbConnect();
    const extraServices = await ExtraService.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: extraServices
    });
  } catch (error) {
    console.error('Error fetching extra services:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los servicios extra' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const extraService = new ExtraService(body);
    await extraService.save();
    
    return NextResponse.json({
      success: true,
      data: extraService
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating extra service:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el servicio extra' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const extraService = await ExtraService.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!extraService) {
      return NextResponse.json(
        { success: false, error: 'Servicio extra no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: extraService
    });
  } catch (error) {
    console.error('Error updating extra service:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el servicio extra' },
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
        { success: false, error: 'ID del servicio extra requerido' },
        { status: 400 }
      );
    }
    
    const extraService = await ExtraService.findByIdAndDelete(id);
    
    if (!extraService) {
      return NextResponse.json(
        { success: false, error: 'Servicio extra no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Servicio extra eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting extra service:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el servicio extra' },
      { status: 500 }
    );
  }
}