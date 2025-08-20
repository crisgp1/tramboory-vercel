import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ProductService } from '@/lib/services/product.service';
import { z } from 'zod';

// Función temporal para verificar permisos (se puede mejorar más adelante)
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  // Por ahora, permitir a todos los usuarios autenticados
  // En producción, esto debería verificar roles específicos
  return true;
}

// Schema de validación para crear/actualizar productos (simplificado para Supabase)
const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  sku: z.string().min(1, 'El SKU es requerido'),
  barcode: z.string().optional(),
  base_unit: z.string().min(1, 'La unidad base es requerida'),
  stock_minimum: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0').default(0),
  stock_reorder_point: z.number().min(0, 'El punto de reorden debe ser mayor o igual a 0').default(0),
  stock_unit: z.string().min(1, 'La unidad de stock es requerida'),
  last_cost: z.number().min(0).optional(),
  average_cost: z.number().min(0).optional(),
  spec_weight: z.number().min(0).optional(),
  spec_length: z.number().min(0).optional(),
  spec_width: z.number().min(0).optional(),
  spec_height: z.number().min(0).optional(),
  spec_dimensions_unit: z.string().default('cm').optional(),
  spec_color: z.string().optional(),
  spec_brand: z.string().optional(),
  spec_model: z.string().optional(),
  is_active: z.boolean().default(true),
  is_perishable: z.boolean().default(false),
  requires_batch: z.boolean().default(true),
  expiry_has_expiry: z.boolean().default(false),
  expiry_shelf_life_days: z.number().min(1).optional(),
  expiry_warning_days: z.number().min(1).default(7).optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const withoutMovements = searchParams.get('withoutMovements') === 'true';
    const approvalStatus = searchParams.get('approvalStatus'); // pending, approved, rejected
    
    let products: any[] = [];
    let result;

    if (withoutMovements) {
      // Get products without inventory movements
      result = await ProductService.getProductsWithoutInventory();
    } else if (search) {
      result = await ProductService.searchProducts(search);
    } else if (category) {
      result = await ProductService.getProductsByCategory(category);
    } else {
      const activeOnly = isActive !== 'false';
      result = await ProductService.getAllProducts({
        activeOnly,
        approvalStatus: approvalStatus as 'pending' | 'approved' | 'rejected' | undefined
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    products = result.data || [];

    return NextResponse.json({
      success: true,
      products,
      total: products.length
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

    // Generar productId único
    const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create product using new service
    const result = await ProductService.createProduct({
      name: productData.name,
      description: productData.description,
      category: productData.category,
      sku: productData.sku,
      barcode: productData.barcode && productData.barcode.trim() !== '' ? productData.barcode.trim() : undefined,
      base_unit: productData.base_unit,
      stock_minimum: productData.stock_minimum,
      stock_reorder_point: productData.stock_reorder_point,
      stock_unit: productData.stock_unit,
      last_cost: productData.last_cost,
      average_cost: productData.average_cost,
      spec_weight: productData.spec_weight,
      spec_length: productData.spec_length,
      spec_width: productData.spec_width,
      spec_height: productData.spec_height,
      spec_dimensions_unit: productData.spec_dimensions_unit,
      spec_color: productData.spec_color,
      spec_brand: productData.spec_brand,
      spec_model: productData.spec_model,
      is_active: productData.is_active,
      is_perishable: productData.is_perishable,
      requires_batch: productData.requires_batch,
      expiry_has_expiry: productData.expiry_has_expiry,
      expiry_shelf_life_days: productData.expiry_shelf_life_days,
      expiry_warning_days: productData.expiry_warning_days,
      images: productData.images,
      tags: productData.tags,
      created_by: userId,
      updated_by: userId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log(`✅ Product ${result.data?.name || 'unknown'} created successfully`);

    return NextResponse.json({
      success: true,
      product: result.data
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle Supabase specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Ya existe un producto con este SKU o código de barras' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}