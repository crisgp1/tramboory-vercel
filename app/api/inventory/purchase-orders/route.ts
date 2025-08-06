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

// Schema de validación para crear/actualizar órdenes de compra
const PurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'El ID del proveedor es requerido'),
  supplierName: z.string().min(1, 'El nombre del proveedor es requerido'),
  status: z.enum(Object.values(PurchaseOrderStatus) as [string, ...string[]]).default(PurchaseOrderStatus.DRAFT),
  items: z.array(PurchaseOrderItemSchema).min(1, 'Debe haber al menos un item'),
  subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0'),
  tax: z.number().min(0, 'El impuesto debe ser mayor o igual a 0'),
  taxRate: z.number().min(0).max(1, 'La tasa de impuesto debe estar entre 0 y 1').default(0.16),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  currency: z.string().default('MXN'),
  expectedDeliveryDate: z.string().optional(),
  deliveryLocation: z.string().min(1, 'La ubicación de entrega es requerida'),
  paymentTerms: z.object({
    method: z.enum(['cash', 'credit', 'transfer', 'check']).default('cash'),
    creditDays: z.number().min(0).max(365).default(0)
  }),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
});

// GET /api/inventory/purchase-orders - Obtener órdenes de compra
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer órdenes de compra' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    try {
      let orders;
      
      if (status) {
        orders = await SupabaseInventoryService.getPurchaseOrdersByStatus(status as any);
      } else {
        orders = await SupabaseInventoryService.getAllPurchaseOrders();
      }

      // Simple pagination (not optimal for large datasets)
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = orders.slice(startIndex, endIndex);

      return NextResponse.json({
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total: orders.length,
          totalPages: Math.ceil(orders.length / limit)
        }
      });
    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Error getting purchase orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/purchase-orders - Crear nueva orden de compra (placeholder implementation)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'create')) {
      return NextResponse.json({ error: 'Sin permisos para crear órdenes de compra' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validar datos
    const validationResult = PurchaseOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const orderData = validationResult.data;

    try {
      // Verificar que el proveedor existe
      const supplier = await SupabaseInventoryService.getSupplierById(orderData.supplierId);
      
      // Validar cálculos
      const calculatedSubtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tolerance = 0.01;
      
      if (Math.abs(orderData.subtotal - calculatedSubtotal) > tolerance) {
        return NextResponse.json(
          { error: 'El subtotal no coincide con la suma de los items' },
          { status: 400 }
        );
      }

      const calculatedTax = orderData.subtotal * orderData.taxRate;
      if (Math.abs(orderData.tax - calculatedTax) > tolerance) {
        return NextResponse.json(
          { error: 'El impuesto no coincide con el cálculo esperado' },
          { status: 400 }
        );
      }

      const calculatedTotal = orderData.subtotal + orderData.tax;
      if (Math.abs(orderData.total - calculatedTotal) > tolerance) {
        return NextResponse.json(
          { error: 'El total no coincide con subtotal + impuestos' },
          { status: 400 }
        );
      }

      // Generar purchaseOrderId único
      const allOrders = await SupabaseInventoryService.getAllPurchaseOrders();
      const orderCount = allOrders.length;
      const purchaseOrderId = `PO${String(orderCount + 1).padStart(6, '0')}`;

      // Crear orden de compra
      const purchaseOrder = await SupabaseInventoryService.createPurchaseOrder({
        purchase_order_id: purchaseOrderId,
        supplier_id: orderData.supplierId,
        supplier_name: orderData.supplierName,
        status: (orderData.status || 'DRAFT') as "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "RECEIVED" | "CANCELLED",
        subtotal: orderData.subtotal,
        tax_rate: orderData.taxRate,
        tax: orderData.tax,
        total: orderData.total,
        currency: orderData.currency,
        expected_delivery_date: orderData.expectedDeliveryDate,
        delivery_location: orderData.deliveryLocation,
        payment_method: orderData.paymentTerms.method,
        payment_credit_days: orderData.paymentTerms.creditDays,
        notes: orderData.notes,
        internal_notes: orderData.internalNotes,
        created_by: 'user', // TODO: Use actual user ID
        updated_by: 'user'  // TODO: Use actual user ID
      });

      // Create purchase order items
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(item => ({
          purchase_order_id: purchaseOrder.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: item.notes
        }));

        try {
          await SupabaseInventoryService.createPurchaseOrderItems(itemsToInsert);
        } catch (itemsError) {
          console.error('Error creating purchase order items:', itemsError);
          // Continue anyway, don't fail the whole order
        }
      }

      return NextResponse.json(purchaseOrder, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message?.includes('No rows found')) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}