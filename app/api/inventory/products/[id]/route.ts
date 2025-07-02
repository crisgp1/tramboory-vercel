import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/inventory/Product';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para actualizar productos
const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().optional(),
  units: z.object({
    base: z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      symbol: z.string().optional()
    }),
    alternatives: z.array(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      symbol: z.string().optional(),
      conversionFactor: z.number().positive()
    })).default([])
  }).optional(),
  pricing: z.object({
    cost: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().default('MXN'),
    tiers: z.array(z.object({
      minQuantity: z.number().positive(),
      price: z.number().positive(),
      unit: z.string()
    })).default([])
  }).optional(),
  stockLevels: z.object({
    minimum: z.number().min(0).optional(),
    maximum: z.number().min(0).optional(),
    reorderPoint: z.number().min(0).optional(),
    reorderQuantity: z.number().min(0).optional()
  }).optional(),
  suppliers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

// GET /api/inventory/products/[id] - Obtener producto específico
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
      return NextResponse.json({ error: 'Sin permisos para leer inventario' }, { status: 403 });
    }

    await dbConnect();

    const product = await Product.findById(params.id)
      .populate('suppliers', 'name contactInfo')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/products/[id] - Actualizar producto
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
      return NextResponse.json({ error: 'Sin permisos para actualizar productos' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validar datos
    const validationResult = UpdateProductSchema.safeParse(body);
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

    // Verificar que el producto existe
    const existingProduct = await Product.findById(params.id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Verificar unicidad de SKU si se está actualizando
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await Product.findOne({ 
        sku: updateData.sku,
        _id: { $ne: params.id }
      });
      if (existingSku) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este SKU' },
          { status: 409 }
        );
      }
    }

    // Verificar unicidad de código de barras si se está actualizando
    if (updateData.barcode && updateData.barcode !== existingProduct.barcode) {
      const existingBarcode = await Product.findOne({ 
        barcode: updateData.barcode,
        _id: { $ne: params.id }
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este código de barras' },
          { status: 409 }
        );
      }
    }

    // Actualizar producto
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      {
        ...updateData,
        lastUpdatedBy: userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('suppliers', 'name contactInfo');

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/products/[id] - Eliminar producto (soft delete)
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
      return NextResponse.json({ error: 'Sin permisos para eliminar productos' }, { status: 403 });
    }

    await dbConnect();

    // Verificar que el producto existe
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    const deletedProduct = await Product.findByIdAndUpdate(
      params.id,
      {
        isActive: false,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
        metadata: {
          ...product.metadata,
          deletedAt: new Date(),
          deletedBy: userId
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente',
      product: deletedProduct
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}