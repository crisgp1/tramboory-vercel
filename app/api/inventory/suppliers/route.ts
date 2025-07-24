import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para crear/actualizar proveedores (Supabase)
const SupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().optional(),
  user_id: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional(),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  contact_person: z.string().optional(),
  payment_credit_days: z.number().min(0).max(365).default(0),
  payment_method: z.enum(['cash', 'credit', 'transfer', 'check']).default('cash'),
  payment_currency: z.string().default('MXN'),
  payment_discount_terms: z.string().optional(),
  delivery_lead_time_days: z.number().min(0).max(365).default(1),
  delivery_minimum_order: z.number().min(0).optional(),
  delivery_zones: z.array(z.string()).default([]),
  rating_quality: z.number().min(1).max(5).default(3),
  rating_reliability: z.number().min(1).max(5).default(3),
  rating_pricing: z.number().min(1).max(5).default(3),
  is_active: z.boolean().default(true),
  is_preferred: z.boolean().default(false)
});

// GET /api/inventory/suppliers - Obtener proveedores
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer proveedores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    // Get suppliers from Supabase
    const activeOnly = isActive !== 'false';
    const suppliers = await SupabaseInventoryService.getAllSuppliers(activeOnly);

    return NextResponse.json({
      success: true,
      suppliers,
      total: suppliers.length
    });

  } catch (error) {
    console.error('Error getting suppliers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/suppliers - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'create')) {
      return NextResponse.json({ error: 'Sin permisos para crear proveedores' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validar datos
    const validationResult = SupplierSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const supplierData = validationResult.data;

    // Generar supplierId único
    const supplierId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Crear proveedor usando Supabase
    const newSupplier = await SupabaseInventoryService.createSupplier({
      supplier_id: supplierId,
      code: supplierData.code,
      name: supplierData.name,
      description: supplierData.description,
      user_id: supplierData.user_id,
      contact_email: supplierData.contact_email,
      contact_phone: supplierData.contact_phone,
      contact_address: supplierData.contact_address,
      contact_person: supplierData.contact_person,
      payment_credit_days: supplierData.payment_credit_days,
      payment_method: supplierData.payment_method,
      payment_currency: supplierData.payment_currency,
      payment_discount_terms: supplierData.payment_discount_terms,
      delivery_lead_time_days: supplierData.delivery_lead_time_days,
      delivery_minimum_order: supplierData.delivery_minimum_order,
      delivery_zones: supplierData.delivery_zones,
      rating_quality: supplierData.rating_quality,
      rating_reliability: supplierData.rating_reliability,
      rating_pricing: supplierData.rating_pricing,
      is_active: supplierData.is_active,
      is_preferred: supplierData.is_preferred,
      created_by: userId,
      updated_by: userId
    });

    console.log(`✅ Proveedor ${newSupplier.name} creado en Supabase`);

    return NextResponse.json({
      success: true,
      supplier: newSupplier
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating supplier:', error);
    
    // Handle Supabase specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este código' },
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