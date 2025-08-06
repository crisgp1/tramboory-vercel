import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ProductRepository } from '@/lib/repositories/product.repository';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// POST /api/inventory/products/[id]/reactivate - Reactivate deactivated product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'update')) {
      return NextResponse.json({ error: 'Sin permisos para reactivar productos' }, { status: 403 });
    }

    const params = await context.params;

    // Check if product exists and is inactive
    const productCheck = await ProductRepository.findById(params.id);
    if (!productCheck.success) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (productCheck.data?.is_active) {
      return NextResponse.json({ 
        error: 'El producto ya está activo',
        product: productCheck.data
      }, { status: 400 });
    }

    // Reactivate the product
    const reactivateResult = await ProductRepository.reactivate(params.id, userId);
    
    if (!reactivateResult.success) {
      return NextResponse.json({ 
        error: reactivateResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Producto reactivado exitosamente',
      product: reactivateResult.data,
      note: 'El producto está nuevamente disponible para operaciones'
    });

  } catch (error) {
    console.error('Error reactivating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}