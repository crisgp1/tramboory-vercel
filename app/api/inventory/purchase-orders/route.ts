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

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construir filtros
    const filters: any = {};
    
    if (search) {
      filters.$or = [
        { purchaseOrderId: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (supplierId) {
      filters.supplierId = supplierId;
    }

    if (status) {
      filters.status = status;
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Configurar ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrder.countDocuments(filters)
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting purchase orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/purchase-orders - Crear nueva orden de compra
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'create')) {
      return NextResponse.json({ error: 'Sin permisos para crear órdenes de compra' }, { status: 403 });
    }

    await dbConnect();

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

    // Verificar que el proveedor existe
    const supplier = await Supplier.findOne({ _id: orderData.supplierId });
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que todos los productos existen
    const productIds = orderData.items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Uno o más productos no fueron encontrados' },
        { status: 404 }
      );
    }

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
    const orderCount = await PurchaseOrder.countDocuments();
    const purchaseOrderId = `PO${String(orderCount + 1).padStart(6, '0')}`;

    // Crear orden de compra
    const purchaseOrder = new PurchaseOrder({
      ...orderData,
      purchaseOrderId,
      supplierName: supplier.name, // Denormalizar nombre del proveedor
      expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate) : undefined,
      createdBy: userId,
      updatedBy: userId
    });

    await purchaseOrder.save();

    return NextResponse.json(purchaseOrder, { status: 201 });

  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}