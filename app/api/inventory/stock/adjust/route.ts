import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import InventoryService, { StockAdjustmentParams } from '@/lib/services/inventory/inventoryService';
import { MovementType } from '@/types/inventory';
import dbConnect from '@/lib/mongodb';

// Validation schema for stock adjustment
const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  type: z.nativeEnum(MovementType),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  batchId: z.string().optional(),
  costPerUnit: z.number().positive().optional(),
  expiryDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = stockAdjustmentSchema.parse(body);

    // Determine the actual quantity based on movement type
    let adjustmentQuantity = validatedData.quantity;
    
    // For outbound movements, make quantity negative
    if ([MovementType.SALIDA, MovementType.MERMA].includes(validatedData.type)) {
      adjustmentQuantity = -Math.abs(validatedData.quantity);
    }
    
    // For inbound movements, ensure quantity is positive
    if ([MovementType.ENTRADA].includes(validatedData.type)) {
      adjustmentQuantity = Math.abs(validatedData.quantity);
    }

    // Prepare parameters for InventoryService
    const adjustmentParams: StockAdjustmentParams = {
      productId: validatedData.productId,
      locationId: validatedData.locationId,
      quantity: adjustmentQuantity,
      unit: validatedData.unit,
      reason: validatedData.reason,
      userId,
      batchId: validatedData.batchId,
      cost: validatedData.costPerUnit,
      expiryDate: validatedData.expiryDate,
      notes: validatedData.notes
    };

    // Execute stock adjustment
    const result = await InventoryService.adjustStock(adjustmentParams);

    if (!result.success) {
      console.error('Stock adjustment failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to adjust stock' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stock adjustment completed successfully',
      data: {
        inventory: result.inventory,
        movement: result.movement
      }
    });

  } catch (error) {
    console.error('Stock adjustment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}