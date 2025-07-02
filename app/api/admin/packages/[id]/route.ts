import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PackageConfig from '@/models/PackageConfig';
import mongoose from 'mongoose';

// GET - Obtener paquete por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const packageConfig = await PackageConfig.findById(params.id);
    
    if (!packageConfig) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: packageConfig });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el paquete' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar paquete
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, number, maxGuests, pricing, description, isActive } = body;
    
    // Verificar que el número de paquete no exista en otro documento
    if (number) {
      const existingPackage = await PackageConfig.findOne({ 
        number, 
        _id: { $ne: params.id } 
      });
      if (existingPackage) {
        return NextResponse.json(
          { success: false, error: 'El número de paquete ya existe' },
          { status: 400 }
        );
      }
    }
    
    const updatedPackage = await PackageConfig.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(number && { number }),
        ...(maxGuests && { maxGuests }),
        ...(pricing && { pricing }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedPackage });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el paquete' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar paquete
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const deletedPackage = await PackageConfig.findByIdAndDelete(params.id);
    
    if (!deletedPackage) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Paquete eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el paquete' },
      { status: 500 }
    );
  }
}