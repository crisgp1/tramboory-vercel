import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { MovementType } from '@/types/inventory';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// GET /api/inventory/movements - Obtener movimientos de inventario
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer movimientos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('productId');
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let result;
    if (productId) {
      result = await SupabaseInventoryService.getMovementsByProduct(productId, limit);
    } else if (locationId) {
      result = await SupabaseInventoryService.getMovementsByLocation(locationId, limit);
    } else {
      // For general movements, we can extend the service later
      result = [];
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error getting movements:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}