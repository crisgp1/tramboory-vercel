import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ProductRepository } from '@/lib/repositories/product.repository';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// GET /api/inventory/products/[id]/check-deletion - Check deletion eligibility
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
      return NextResponse.json({ error: 'Sin permisos para verificar productos' }, { status: 403 });
    }

    const params = await context.params;

    // Perform comprehensive deletion eligibility check
    const eligibilityCheck = await ProductRepository.checkDeletionEligibility(params.id);
    
    if (!eligibilityCheck.success || !eligibilityCheck.data) {
      return NextResponse.json({ 
        error: 'Error al verificar elegibilidad de eliminación',
        details: eligibilityCheck.error
      }, { status: 500 });
    }

    const { canDelete, canDeactivate, blockers, report } = eligibilityCheck.data;

    return NextResponse.json({
      productId: params.id,
      canDelete,
      canDeactivate,
      blockers,
      analysis: {
        report,
        recommendation: canDelete ? 
          'Producto puede eliminarse físicamente sin afectar integridad referencial' :
          'Se recomienda eliminación lógica (desactivar) siguiendo mejores prácticas de la industria',
        industry_standard: 'SAP, Odoo y NetSuite recomiendan eliminación lógica para productos con historial'
      }
    });

  } catch (error) {
    console.error('Error checking product deletion eligibility:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}