import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { ProductRepository } from '@/lib/repositories/product.repository';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, locationId, quantity, unit, reason, notes, batchId, costPerUnit, expiryDate } = body;

    // Verificar que el producto existe
    const productResponse = await ProductRepository.findById(productId);
    if (!productResponse.success || !productResponse.data) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Verificar que NO existe inventario para este producto en esta ubicación
    const existingInventory = await SupabaseInventoryService.getInventoryByProduct(productId);
    const locationInventory = existingInventory.find(inv => inv.location_id === locationId);
    if (locationInventory) {
      return NextResponse.json({ error: 'Este producto ya tiene registros de inventario en esta ubicación' }, { status: 400 });
    }

    // Usar el servicio de Supabase para ajustar el stock (crear inventario inicial)
    const result = await SupabaseInventoryService.adjustStock({
      productId,
      locationId,
      quantity: parseFloat(quantity),
      unit: unit || productResponse.data.base_unit,
      reason: reason || 'Inventario inicial',
      userId,
      batchId: batchId || `INIT-${Date.now()}`,
      cost: costPerUnit ? parseFloat(costPerUnit) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      notes
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error('Error initiating movement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

function getLocationName(locationId: string): string {
  const locationMap: Record<string, string> = {
    'almacen': 'Almacén Principal',
    'cocina': 'Cocina',
    'salon': 'Salón',
    'bodega': 'Bodega',
    'recepcion': 'Recepción'
  };
  return locationMap[locationId] || locationId;
}