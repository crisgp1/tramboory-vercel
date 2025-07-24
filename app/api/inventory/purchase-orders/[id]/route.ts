import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { z } from 'zod';
import { PurchaseOrderStatus } from '@/types/inventory';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para items de orden de compra
const PurchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es requerido'),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string().min(1, 'La unidad es requerida'),
  unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  totalPrice: z.number().min(0, 'El precio total debe ser mayor o igual a 0'),
  notes: z.string().optional()
});

// Schema de validación para actualizar órdenes de compra
const UpdatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'El ID del proveedor es requerido').optional(),
  supplierName: z.string().min(1, 'El nombre del proveedor es requerido').optional(),
  status: z.enum(Object.values(PurchaseOrderStatus) as [string, ...string[]]).optional(),
  items: z.array(PurchaseOrderItemSchema).min(1, 'Debe haber al menos un item').optional(),
  subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0').optional(),
  tax: z.number().min(0, 'El impuesto debe ser mayor o igual a 0').optional(),
  taxRate: z.number().min(0).max(1, 'La tasa de impuesto debe estar entre 0 y 1').optional(),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0').optional(),
  currency: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  deliveryLocation: z.string().min(1, 'La ubicación de entrega es requerida').optional(),
  paymentTerms: z.object({
    method: z.enum(['cash', 'credit', 'transfer', 'check']),
    creditDays: z.number().min(0).max(365)
  }).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
});

// Schema para cambios de estado
const StatusChangeSchema = z.object({
  action: z.enum(['approve', 'order', 'receive', 'cancel']),
  reason: z.string().optional(), // Para cancelaciones
  actualDeliveryDate: z.string().optional() // Para recepciones
});

// GET /api/inventory/purchase-orders/[id] - Obtener orden de compra específica
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
      return NextResponse.json({ error: 'Sin permisos para leer órdenes de compra' }, { status: 403 });
    }

    const params = await context.params;

    try {
      const order = await SupabaseInventoryService.getPurchaseOrderById(params.id);
      return NextResponse.json(order);
    } catch (error) {
      if (error.message?.includes('No rows found')) {
        return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error getting purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/purchase-orders/[id] - Actualizar orden de compra (placeholder implementation)
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
      return NextResponse.json({ error: 'Sin permisos para actualizar órdenes de compra' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    
    // Verificar si es un cambio de estado
    if (body.action) {
      return handleStatusChange(params.id, body, userId);
    }

    // Validar datos para actualización normal
    const validationResult = UpdatePurchaseOrderSchema.safeParse(body);
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

    try {
      // Buscar la orden existente
      const existingOrder = await SupabaseInventoryService.getPurchaseOrderById(params.id);

      // Actualizar la orden usando Supabase
      const updatedOrder = await SupabaseInventoryService.updatePurchaseOrder(
        params.id,
        {
          status: updateData.status,
          subtotal: updateData.subtotal,
          tax_amount: updateData.tax,
          total_amount: updateData.total,
          currency: updateData.currency,
          expected_delivery_date: updateData.expectedDeliveryDate,
          delivery_location: updateData.deliveryLocation,
          notes: updateData.notes,
          internal_notes: updateData.internalNotes
        }
      );

      return NextResponse.json(updatedOrder);
    } catch (error) {
      if (error.message?.includes('No rows found')) {
        return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/purchase-orders/[id] - Eliminar orden de compra (placeholder implementation)
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
      return NextResponse.json({ error: 'Sin permisos para eliminar órdenes de compra' }, { status: 403 });
    }

    const params = await context.params;

    // TODO: Implement proper purchase order deletion with Supabase
    // This is a placeholder implementation
    return NextResponse.json({ 
      message: 'Purchase order deletion not implemented with Supabase yet' 
    });

  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para manejar cambios de estado (placeholder implementation)
async function handleStatusChange(orderId: string, body: any, userId: string) {
  const validationResult = StatusChangeSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Datos inválidos para cambio de estado',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { action, reason, actualDeliveryDate } = validationResult.data;

  try {
    const order = await SupabaseInventoryService.getPurchaseOrderById(orderId);
    
    // TODO: Implement proper state change logic with Supabase
    // This is a placeholder implementation
    let newStatus = order.status;
    
    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        break;
      case 'order':
        newStatus = 'ORDERED';
        break;
      case 'receive':
        newStatus = 'RECEIVED';
        break;
      case 'cancel':
        newStatus = 'CANCELLED';
        break;
    }

    const updatedOrder = await SupabaseInventoryService.updatePurchaseOrder(
      orderId,
      { status: newStatus }
    );

    return NextResponse.json(updatedOrder);

  } catch (error: any) {
    if (error.message?.includes('No rows found')) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado de la orden' },
      { status: 400 }
    );
  }
}