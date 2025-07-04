import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/inventory/Product';
import Inventory from '@/lib/models/inventory/Inventory';
import InventoryMovement from '@/lib/models/inventory/InventoryMovement';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { productId, locationId, quantity, unit, reason, notes, batchId, costPerUnit, expiryDate } = body;

    let result: any = {};

    await session.withTransaction(async () => {
      // Verificar que el producto existe
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Verificar que NO existe inventario para este producto
      const existingInventory = await Inventory.findOne({ productId }).session(session);
      if (existingInventory) {
        throw new Error('Este producto ya tiene registros de inventario');
      }

      // Crear registro de inventario inicial
      const inventory = new Inventory({
        productId,
        locationId,
        locationName: getLocationName(locationId),
        batches: [{
          batchId: batchId || `INIT-${Date.now()}`,
          quantity: parseFloat(quantity),
          unit: product.units.base.code,
          costPerUnit: parseFloat(costPerUnit) || 0,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          receivedDate: new Date(),
          status: 'available'
        }],
        totals: {
          available: parseFloat(quantity),
          reserved: 0,
          quarantine: 0,
          unit: product.units.base.code
        },
        lastUpdatedBy: userId
      });

      await inventory.save({ session });

      // Crear movimiento
      const movement = new InventoryMovement({
        movementId: `INIT-${Date.now()}`,
        type: 'ENTRADA',
        productId,
        toLocation: locationId,
        quantity: parseFloat(quantity),
        unit: product.units.base.code,
        reason,
        notes,
        performedBy: userId,
        performedByName: userId,
        cost: costPerUnit ? {
          unitCost: parseFloat(costPerUnit),
          totalCost: parseFloat(costPerUnit) * parseFloat(quantity),
          currency: 'MXN'
        } : undefined
      });

      await movement.save({ session });

      result = { inventory, movement };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error('Error initiating movement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  } finally {
    await session.endSession();
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