import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Package from '@/models/Package';

export async function GET() {
  try {
    await dbConnect();
    const packages = await Package.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los paquetes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const packageDoc = new Package(body);
    await packageDoc.save();
    
    return NextResponse.json({
      success: true,
      data: packageDoc
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el paquete' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const packageDoc = await Package.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!packageDoc) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: packageDoc
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el paquete' },
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
        { success: false, error: 'ID del paquete requerido' },
        { status: 400 }
      );
    }
    
    const packageDoc = await Package.findByIdAndDelete(id);
    
    if (!packageDoc) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Paquete eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el paquete' },
      { status: 500 }
    );
  }
}