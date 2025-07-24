import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para actualizar/crear proveedores
const SupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().optional(),
  userId: z.string().optional(),
  contactInfo: z.object({
    email: z.string().email('Email inválido').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    contactPerson: z.string().optional()
  }).optional(),
  paymentTerms: z.object({
    creditDays: z.number().min(0).max(365).default(0),
    paymentMethod: z.enum(['cash', 'credit', 'transfer', 'check']).default('cash'),
    currency: z.string().default('MXN'),
    discountTerms: z.string().optional()
  }).optional(),
  rating: z.object({
    quality: z.number().min(1).max(5).default(3),
    delivery: z.number().min(1).max(5).default(3),
    service: z.number().min(1).max(5).default(3),
    price: z.number().min(1).max(5).default(3)
  }).optional(),
  isActive: z.boolean().default(true)
});

// GET /api/inventory/suppliers/[id] - Obtener proveedor específico
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
      return NextResponse.json({ error: 'Sin permisos para leer proveedores' }, { status: 403 });
    }

    const params = await context.params;

    try {
      const supplier = await SupabaseInventoryService.getSupplierById(params.id);
      return NextResponse.json(supplier);
    } catch (error) {
      if (error.message?.includes('No rows found')) {
        return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error getting supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/suppliers/[id] - Actualizar proveedor o convertir usuario en proveedor
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
      return NextResponse.json({ error: 'Sin permisos para actualizar proveedores' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();

    console.log("🔍 PUT Supplier Debug:", {
      id: params.id,
      isUserFormat: params.id.startsWith('user_'),
      bodyKeys: Object.keys(body)
    });

    // Verificar si es un usuario temporal (formato: user_USERID)
    const isUserConversion = params.id.startsWith('user_');
    
    if (isUserConversion) {
      // Extraer el userId real del ID temporal
      const realUserId = params.id.substring(5); // Remove "user_" prefix (5 characters)
      
      console.log("🔄 Converting user to supplier:", {
        tempId: params.id,
        realUserId: realUserId
      });

      // Validar datos como creación completa
      const validationResult = SupplierSchema.safeParse({
        ...body,
        userId: realUserId
      });
      
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

      // Verificar si ya existe un proveedor con este userId
      const existingByUserId = await SupabaseInventoryService.getSupplierByUserId(realUserId);
      
      if (existingByUserId) {
        // Si ya existe, actualizarlo en lugar de crear uno nuevo
        console.log("🔄 Supplier already exists for user, updating instead of creating", {
          existingId: existingByUserId.id,
          userId: realUserId
        });
        
        // Actualizar el proveedor existente
        const updatedSupplier = await SupabaseInventoryService.updateSupplier(
          existingByUserId.id,
          {
            name: supplierData.name,
            contact_email: supplierData.contactInfo?.email,
            contact_phone: supplierData.contactInfo?.phone,
            contact_address: supplierData.contactInfo?.address,
            contact_person: supplierData.contactInfo?.contactPerson,
            credit_days: supplierData.paymentTerms?.creditDays || 0,
            rating_quality: supplierData.rating?.quality || 3,
            rating_delivery: supplierData.rating?.delivery || 3,
            rating_service: supplierData.rating?.service || 3,
            rating_price: supplierData.rating?.price || 3,
            rating_overall: 3,
            is_active: supplierData.isActive
          }
        );
        
        console.log("✅ Existing supplier updated successfully");
        return NextResponse.json(updatedSupplier);
      }

      // Crear nuevo proveedor
      const allSuppliers = await SupabaseInventoryService.getAllSuppliers(false);
      const supplierCount = allSuppliers.length;
      const supplierId = `SUP${String(supplierCount + 1).padStart(6, '0')}`;

      const supplier = await SupabaseInventoryService.createSupplier({
        supplier_id: supplierId,
        name: supplierData.name,
        description: supplierData.description,
        user_id: realUserId,
        contact_email: supplierData.contactInfo?.email,
        contact_phone: supplierData.contactInfo?.phone,
        contact_address: supplierData.contactInfo?.address,
        contact_person: supplierData.contactInfo?.contactPerson,
        credit_days: supplierData.paymentTerms?.creditDays || 0,
        payment_method: supplierData.paymentTerms?.paymentMethod || 'cash',
        currency: supplierData.paymentTerms?.currency || 'MXN',
        rating_quality: supplierData.rating?.quality || 3,
        rating_delivery: supplierData.rating?.delivery || 3,
        rating_service: supplierData.rating?.service || 3,
        rating_price: supplierData.rating?.price || 3,
        rating_overall: 3,
        is_active: supplierData.isActive,
        is_preferred: false
      });

      console.log("✅ User converted to supplier successfully:", {
        supplierId: supplier.supplier_id,
        name: supplier.name,
        userId: supplier.user_id,
        id: supplier.id
      });
      
      return NextResponse.json(supplier, { status: 201 });

    } else {
      // Actualización normal de proveedor existente
      try {
        const existingSupplier = await SupabaseInventoryService.getSupplierById(params.id);
        
        // Actualizar proveedor
        const updatedSupplier = await SupabaseInventoryService.updateSupplier(
          params.id,
          {
            name: body.name,
            description: body.description,
            contact_email: body.contactInfo?.email,
            contact_phone: body.contactInfo?.phone,
            contact_address: body.contactInfo?.address,
            contact_person: body.contactInfo?.contactPerson,
            credit_days: body.paymentTerms?.creditDays,
            payment_method: body.paymentTerms?.paymentMethod,
            currency: body.paymentTerms?.currency,
            rating_quality: body.rating?.quality,
            rating_delivery: body.rating?.delivery,
            rating_service: body.rating?.service,
            rating_price: body.rating?.price,
            is_active: body.isActive
          }
        );

        return NextResponse.json(updatedSupplier);
      } catch (error) {
        if (error.message?.includes('No rows found')) {
          return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
        }
        throw error;
      }
    }

  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/suppliers/[id] - Eliminar proveedor (soft delete)
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
      return NextResponse.json({ error: 'Sin permisos para eliminar proveedores' }, { status: 403 });
    }

    const params = await context.params;

    try {
      // Verificar que el proveedor existe
      const supplier = await SupabaseInventoryService.getSupplierById(params.id);

      // Soft delete - marcar como inactivo
      const deletedSupplier = await SupabaseInventoryService.updateSupplier(
        params.id,
        {
          is_active: false
        }
      );

      return NextResponse.json({ 
        message: 'Proveedor eliminado exitosamente',
        supplier: deletedSupplier
      });
    } catch (error) {
      if (error.message?.includes('No rows found')) {
        return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}