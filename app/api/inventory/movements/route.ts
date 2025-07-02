import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import InventoryService from '@/lib/services/inventory/inventoryService';
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

    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      productId: searchParams.get('productId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      type: searchParams.get('type') as MovementType || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    };

    const result = await InventoryService.getMovements(queryParams);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error getting movements:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}