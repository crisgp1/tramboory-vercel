import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import PurchaseOrder from '@/lib/models/inventory/PurchaseOrder';
import Product from '@/lib/models/inventory/Product';
import Supplier from '@/lib/models/inventory/Supplier';
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

    await dbConnect();
    const params = await context.params;

    const order = await PurchaseOrder.findById(params.id).lean();
    
    if (!order) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('Error getting purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/purchase-orders/[id] - Actualizar orden de compra
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

    await dbConnect();
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

    // Buscar la orden existente
    const existingOrder = await PurchaseOrder.findById(params.id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    // Verificar si la orden puede ser modificada
    if (!existingOrder.canBeModified()) {
      return NextResponse.json(
        { error: 'Esta orden no puede ser modificada en su estado actual' },
        { status: 400 }
      );
    }

    // Si se está actualizando el proveedor, verificar que existe
    if (updateData.supplierId) {
      const supplier = await Supplier.findOne({ _id: updateData.supplierId });
      if (!supplier) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        );
      }
      updateData.supplierName = supplier.name;
    }

    // Si se están actualizando los items, verificar productos
    if (updateData.items) {
      const productIds = updateData.items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: 'Uno o más productos no fueron encontrados' },
          { status: 404 }
        );
      }

      // Validar cálculos si se proporcionan
      if (updateData.subtotal !== undefined) {
        const calculatedSubtotal = updateData.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const tolerance = 0.01;
        
        if (Math.abs(updateData.subtotal - calculatedSubtotal) > tolerance) {
          return NextResponse.json(
            { error: 'El subtotal no coincide con la suma de los items' },
            { status: 400 }
          );
        }
      }
    }

    // Actualizar la orden
    Object.assign(existingOrder, updateData);
    existingOrder.updatedBy = userId;
    
    // Convertir fecha si se proporciona
    if (updateData.expectedDeliveryDate) {
      existingOrder.expectedDeliveryDate = new Date(updateData.expectedDeliveryDate);
    }

    // Recalcular totales si es necesario
    if (updateData.items) {
      existingOrder.recalculateTotals();
    }

    await existingOrder.save();

    return NextResponse.json(existingOrder);

  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/purchase-orders/[id] - Eliminar orden de compra
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

    await dbConnect();
    const params = await context.params;

    const order = await PurchaseOrder.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    // Solo permitir eliminar órdenes en estado DRAFT
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar órdenes en estado borrador' },
        { status: 400 }
      );
    }

    await PurchaseOrder.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Orden de compra eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para manejar cambios de estado
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

  const order = await PurchaseOrder.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
  }

  try {
    switch (action) {
      case 'approve':
        if (!order.canBeApproved()) {
          return NextResponse.json(
            { error: 'Esta orden no puede ser aprobada en su estado actual' },
            { status: 400 }
          );
        }
        await order.approve(userId);
        break;

      case 'order':
        if (!order.canBeOrdered()) {
          return NextResponse.json(
            { error: 'Esta orden no puede ser enviada en su estado actual' },
            { status: 400 }
          );
        }
        await order.order(userId);
        break;

      case 'receive':
        if (!order.canBeReceived()) {
          return NextResponse.json(
            { error: 'Esta orden no puede ser recibida en su estado actual' },
            { status: 400 }
          );
        }
        const deliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : undefined;
        await order.receive(userId, deliveryDate);
        break;

      case 'cancel':
        if (!order.canBeCancelled()) {
          return NextResponse.json(
            { error: 'Esta orden no puede ser cancelada en su estado actual' },
            { status: 400 }
          );
        }
        if (!reason) {
          return NextResponse.json(
            { error: 'Se requiere una razón para cancelar la orden' },
            { status: 400 }
          );
        }
        await order.cancel(userId, reason);
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    return NextResponse.json(order);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado de la orden' },
      { status: 400 }
    );
  }
}