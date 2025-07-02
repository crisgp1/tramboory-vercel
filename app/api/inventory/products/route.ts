import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/inventory/Product';
import { z } from 'zod';

// Función temporal para verificar permisos (se puede mejorar más adelante)
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  // Por ahora, permitir a todos los usuarios autenticados
  // En producción, esto debería verificar roles específicos
  return true;
}

// Schema de validación para crear/actualizar productos
const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  sku: z.string().min(1, 'El SKU es requerido'),
  barcode: z.string().optional(),
  units: z.object({
    base: z.object({
      code: z.string().min(1, 'El código de unidad base es requerido'),
      name: z.string().min(1, 'El nombre de unidad base es requerido'),
      category: z.string().min(1, 'La categoría de unidad es requerida')
    }),
    alternatives: z.array(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      category: z.string().min(1),
      conversionFactor: z.number().positive('El factor de conversión debe ser positivo'),
      conversionType: z.string().min(1),
      containedUnit: z.string().optional()
    })).default([])
  }),
  pricing: z.object({
    tieredPricing: z.array(z.object({
      minQuantity: z.number().min(0),
      maxQuantity: z.number().min(0),
      unit: z.string().min(1),
      pricePerUnit: z.number().min(0.01),
      type: z.enum(['retail', 'wholesale', 'bulk'])
    })).default([]),
    lastCost: z.number().min(0).optional(),
    averageCost: z.number().min(0).optional()
  }).optional(),
  stockLevels: z.object({
    minimum: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
    reorderPoint: z.number().min(0, 'El punto de reorden debe ser mayor o igual a 0'),
    unit: z.string().min(1, 'La unidad de stock es requerida')
  }),
  suppliers: z.array(z.object({
    supplierId: z.string().min(1),
    supplierName: z.string().min(1),
    isPreferred: z.boolean().default(false),
    lastPurchasePrice: z.number().min(0).optional(),
    leadTimeDays: z.number().min(0).default(1)
  })).default([]),
  expiryInfo: z.object({
    hasExpiry: z.boolean().default(false),
    shelfLifeDays: z.number().min(1).optional(),
    warningDays: z.number().min(1).default(7)
  }).optional(),
  specifications: z.object({
    weight: z.number().min(0).optional(),
    dimensions: z.object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
      unit: z.string().default('cm')
    }).optional(),
    color: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional()
  }).optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isPerishable: z.boolean().default(false),
  requiresBatch: z.boolean().default(true)
});

// GET /api/inventory/products - Obtener productos con filtros
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer inventario' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Construir filtros
    const filters: any = {};
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    // Configurar ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('suppliers', 'name contactInfo')
        .lean(),
      Product.countDocuments(filters)
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/products - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!await hasInventoryPermission(userId, 'create')) {
      return NextResponse.json({ error: 'Sin permisos para crear productos' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    
    // Validar datos
    const validationResult = ProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const productData = validationResult.data;

    // Verificar que el SKU no exista
    const existingSku = await Product.findOne({ sku: productData.sku });
    if (existingSku) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este SKU' },
        { status: 409 }
      );
    }

    // Verificar que el código de barras no exista (si se proporciona)
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ barcode: productData.barcode });
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este código de barras' },
          { status: 409 }
        );
      }
    }

    // Generar productId único
    const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear producto con la estructura correcta para el modelo MongoDB
    const product = new Product({
      productId,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      sku: productData.sku,
      barcode: productData.barcode,
      baseUnit: productData.units.base.code,
      units: productData.units,
      pricing: productData.pricing || {
        tieredPricing: [],
        lastCost: 0,
        averageCost: 0
      },
      suppliers: productData.suppliers || [],
      stockLevels: productData.stockLevels,
      expiryInfo: productData.expiryInfo || {
        hasExpiry: false,
        warningDays: 7
      },
      specifications: productData.specifications,
      images: productData.images || [],
      tags: productData.tags || [],
      isActive: productData.isActive,
      isPerishable: productData.isPerishable || false,
      requiresBatch: productData.requiresBatch !== undefined ? productData.requiresBatch : true,
      createdBy: userId,
      updatedBy: userId
    });

    await product.save();

    // Poblar datos para respuesta
    await product.populate('suppliers', 'name contactInfo');

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}