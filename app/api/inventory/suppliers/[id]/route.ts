import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/lib/models/inventory/Supplier';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para actualizar proveedores
const UpdateSupplierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url().optional(),
    contactPerson: z.string().optional()
  }).optional(),
  paymentTerms: z.object({
    creditDays: z.number().min(0).optional(),
    paymentMethod: z.string().optional(),
    currency: z.string().optional(),
    discountTerms: z.string().optional()
  }).optional(),
  categories: z.array(z.string()).optional(),
  rating: z.object({
    quality: z.number().min(1).max(5).optional(),
    delivery: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    price: z.number().min(1).max(5).optional()
  }).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

// GET /api/inventory/suppliers/[id] - Obtener proveedor específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer proveedores' }, { status: 403 });
    }

    await dbConnect();

    const supplier = await Supplier.findById(params.id).lean();

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(supplier);

  } catch (error) {
    console.error('Error getting supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/suppliers/[id] - Actualizar proveedor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'update')) {
      return NextResponse.json({ error: 'Sin permisos para actualizar proveedores' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validar datos
    const validationResult = UpdateSupplierSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Verificar que el proveedor existe
    const existingSupplier = await Supplier.findById(params.id);
    if (!existingSupplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Verificar unicidad de código si se está actualizando
    if (updateData.code && updateData.code !== existingSupplier.code) {
      const existingCode = await Supplier.findOne({ 
        code: updateData.code,
        _id: { $ne: params.id }
      });
      if (existingCode) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este código' },
          { status: 409 }
        );
      }
    }

    // Actualizar proveedor
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      params.id,
      {
        ...updateData,
        lastUpdatedBy: userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedSupplier);

  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/suppliers/[id] - Eliminar proveedor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'delete')) {
      return NextResponse.json({ error: 'Sin permisos para eliminar proveedores' }, { status: 403 });
    }

    await dbConnect();

    // Verificar que el proveedor existe
    const supplier = await Supplier.findById(params.id);
    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    const deletedSupplier = await Supplier.findByIdAndUpdate(
      params.id,
      {
        isActive: false,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
        metadata: {
          ...supplier.metadata,
          deletedAt: new Date(),
          deletedBy: userId
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'Proveedor eliminado exitosamente',
      supplier: deletedSupplier
    });

  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}