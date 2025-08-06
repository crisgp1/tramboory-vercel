import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ProductRepository } from '@/lib/repositories/product.repository';
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer inventario' }, { status: 403 });
    }

    const params = await context.params;

    const result = await ProductRepository.findById(params.id);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.data);

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'update')) {
      return NextResponse.json({ error: 'Sin permisos para actualizar productos' }, { status: 403 });
    }

    const params = await context.params;

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

    const updateData = {
      ...validationResult.data,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    // Actualizar producto usando Supabase repository
    const result = await ProductRepository.update(params.id, updateData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/products/[id] - Eliminar producto (following industry best practices)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'delete')) {
      return NextResponse.json({ error: 'Sin permisos para eliminar productos' }, { status: 403 });
    }

    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const forceHardDelete = searchParams.get('force') === 'true';

    // Step 1: Check deletion eligibility (following SAP/Oracle approach)
    const eligibilityCheck = await ProductRepository.checkDeletionEligibility(params.id);
    
    if (!eligibilityCheck.success || !eligibilityCheck.data) {
      return NextResponse.json({ 
        error: 'Error al verificar elegibilidad de eliminación',
        details: eligibilityCheck.error
      }, { status: 500 });
    }

    const { canDelete, canDeactivate, blockers, report } = eligibilityCheck.data;

    // Step 2: Handle deletion based on dependencies (industry standard approach)
    if (forceHardDelete) {
      // Hard delete requested - only allow if no dependencies (Oracle/SAP style)
      if (!canDelete) {
        return NextResponse.json({
          error: 'Eliminación física bloqueada por dependencias existentes',
          blockers,
          recommendation: 'Use eliminación lógica (desactivar) en lugar de eliminar físicamente',
          report
        }, { status: 409 }); // Conflict
      }

      // Proceed with hard deletion
      const hardDeleteResult = await ProductRepository.hardDelete(params.id, userId);
      
      if (!hardDeleteResult.success) {
        return NextResponse.json({ 
          error: hardDeleteResult.error
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Producto eliminado físicamente',
        type: 'HARD_DELETE',
        report
      });

    } else {
      // Default: Soft delete (industry standard - Odoo, NetSuite, SAP approach)
      const deactivateResult = await ProductRepository.deactivate(params.id, userId);
      
      if (!deactivateResult.success) {
        return NextResponse.json({ 
          error: deactivateResult.error
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Producto desactivado exitosamente (eliminación lógica)',
        type: 'SOFT_DELETE',
        product: deactivateResult.data,
        note: 'El producto se mantiene en el sistema para preservar la integridad referencial',
        blockers: blockers.length > 0 ? blockers : undefined,
        report: blockers.length > 0 ? report : undefined
      });
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}