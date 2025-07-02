import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import InventoryService from '@/lib/services/inventory/inventoryService';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema para ajuste de stock
const StockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'ID del producto es requerido'),
  locationId: z.string().min(1, 'ID de ubicación es requerido'),
  quantity: z.number().refine(val => val !== 0, 'La cantidad no puede ser cero'),
  unit: z.string().min(1, 'La unidad es requerida'),
  reason: z.string().min(1, 'La razón es requerida'),
  batchId: z.string().optional(),
  cost: z.number().min(0).optional(),
  expiryDate: z.string().transform(str => str ? new Date(str) : undefined).optional(),
  notes: z.string().optional()
});

// Schema para transferencia de stock
const StockTransferSchema = z.object({
  productId: z.string().min(1, 'ID del producto es requerido'),
  fromLocationId: z.string().min(1, 'Ubicación origen es requerida'),
  toLocationId: z.string().min(1, 'Ubicación destino es requerida'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string().min(1, 'La unidad es requerida'),
  batchId: z.string().optional(),
  notes: z.string().optional()
});

// Schema para reserva de stock
const StockReservationSchema = z.object({
  productId: z.string().min(1, 'ID del producto es requerido'),
  locationId: z.string().min(1, 'ID de ubicación es requerido'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string().min(1, 'La unidad es requerida'),
  reservedFor: z.string().min(1, 'Propósito de la reserva es requerido'),
  expiresAt: z.string().transform(str => str ? new Date(str) : undefined).optional(),
  notes: z.string().optional()
});

// GET /api/inventory/stock - Obtener inventario con filtros
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer inventario' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      productId: searchParams.get('productId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      lowStock: searchParams.get('lowStock') === 'true',
      expiringSoon: searchParams.get('expiringSoon') === 'true',
      expiryDays: parseInt(searchParams.get('expiryDays') || '7'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      sortBy: searchParams.get('sortBy') || 'lastUpdated',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    };

    const result = await InventoryService.getInventory(queryParams);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error getting inventory:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/stock - Realizar operaciones de stock
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'update')) {
      return NextResponse.json({ error: 'Sin permisos para modificar inventario' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { operation } = body;

    switch (operation) {
      case 'adjust': {
        const validationResult = StockAdjustmentSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Datos inválidos para ajuste de stock',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const params = {
          ...validationResult.data,
          userId
        };

        const result = await InventoryService.adjustStock(params);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'Stock ajustado exitosamente',
          inventory: result.inventory,
          movement: result.movement
        });
      }

      case 'transfer': {
        const validationResult = StockTransferSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Datos inválidos para transferencia de stock',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const params = {
          ...validationResult.data,
          userId
        };

        const result = await InventoryService.transferStock(params);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'Transferencia realizada exitosamente',
          movements: result.movements
        });
      }

      case 'reserve': {
        const validationResult = StockReservationSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Datos inválidos para reserva de stock',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const params = {
          ...validationResult.data,
          userId
        };

        const result = await InventoryService.reserveStock(params);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'Stock reservado exitosamente',
          inventory: result.inventory
        });
      }

      case 'consume': {
        const consumeSchema = z.object({
          productId: z.string().min(1),
          locationId: z.string().min(1),
          quantity: z.number().positive(),
          unit: z.string().min(1),
          consumedFor: z.string().min(1),
          batchId: z.string().optional(),
          notes: z.string().optional()
        });

        const validationResult = consumeSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Datos inválidos para consumo de stock',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const params = {
          ...validationResult.data,
          userId
        };

        const result = await InventoryService.consumeStock(params);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'Stock consumido exitosamente',
          inventory: result.inventory,
          movement: result.movement
        });
      }

      case 'release_reservation': {
        const releaseSchema = z.object({
          productId: z.string().min(1),
          locationId: z.string().min(1),
          quantity: z.number().positive()
        });

        const validationResult = releaseSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Datos inválidos para liberar reserva',
              details: validationResult.error.errors
            },
            { status: 400 }
          );
        }

        const { productId, locationId, quantity } = validationResult.data;

        const result = await InventoryService.releaseReservation(
          productId,
          locationId,
          quantity,
          userId
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'Reserva liberada exitosamente',
          inventory: result.inventory
        });
      }

      default:
        return NextResponse.json(
          { error: 'Operación no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in stock operation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}