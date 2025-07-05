import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/lib/models/inventory/Supplier';
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

    await dbConnect();
    const params = await context.params;

    const supplier = await Supplier.findById(params.id).lean();

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(supplier);

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

    await dbConnect();
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
      const existingByUserId = await Supplier.findOne({ userId: realUserId });
      
      if (existingByUserId) {
        // Si ya existe, actualizarlo en lugar de crear uno nuevo
        console.log("🔄 Supplier already exists for user, updating instead of creating", {
          existingId: existingByUserId._id,
          userId: realUserId
        });
        
        // Verificar que el código no exista en otro proveedor
        if (supplierData.code !== existingByUserId.code) {
          const existingCode = await Supplier.findOne({ 
            code: supplierData.code,
            _id: { $ne: existingByUserId._id }
          });
          if (existingCode) {
            return NextResponse.json(
              { error: 'Ya existe otro proveedor con este código' },
              { status: 409 }
            );
          }
        }
        
        // Actualizar el proveedor existente
        const updatedSupplier = await Supplier.findByIdAndUpdate(
          existingByUserId._id,
          {
            ...supplierData,
            updatedBy: userId,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
        
        console.log("✅ Existing supplier updated successfully");
        return NextResponse.json(updatedSupplier);
      }

      // Si no existe, verificar que el código no exista
      const existingCode = await Supplier.findOne({ code: supplierData.code });
      if (existingCode) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este código' },
          { status: 409 }
        );
      }

      // Generar supplierId único
      const supplierCount = await Supplier.countDocuments();
      const supplierId = `SUP${String(supplierCount + 1).padStart(6, '0')}`;

      // Crear nuevo proveedor con datos completos
      const supplier = new Supplier({
        ...supplierData,
        supplierId,
        userId: realUserId,
        deliveryInfo: {
          leadTimeDays: 1,
          deliveryZones: []
        },
        rating: {
          quality: supplierData.rating?.quality || 3,
          reliability: supplierData.rating?.delivery || 3,
          pricing: supplierData.rating?.price || 3,
          overall: 3
        },
        isPreferred: false,
        createdBy: userId,
        updatedBy: userId
      });

      await supplier.save();

      console.log("✅ User converted to supplier successfully:", {
        supplierId: supplier.supplierId,
        name: supplier.name,
        code: supplier.code,
        userId: supplier.userId,
        _id: supplier._id.toString()
      });
      
      // Verificar que se guardó correctamente
      const savedSupplier = await Supplier.findById(supplier._id);
      console.log("✅ Verification - Supplier saved in DB:", savedSupplier ? "Yes" : "No");
      if (savedSupplier) {
        console.log("✅ Saved supplier userId:", savedSupplier.userId);
      }
      
      return NextResponse.json(supplier, { status: 201 });

    } else {
      // Actualización normal de proveedor existente
      const existingSupplier = await Supplier.findById(params.id);
      if (!existingSupplier) {
        return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
      }

      // Validar datos de actualización
      const updateData = {
        ...body,
        updatedBy: userId
      };

      // Verificar unicidad de código si se está actualizando
      if (body.code && body.code !== existingSupplier.code) {
        const existingCode = await Supplier.findOne({ 
          code: body.code,
          _id: { $ne: params.id }
        });
        if (existingCode) {
          return NextResponse.json(
            { error: 'Ya existe un proveedor con este código' },
            { status: 409 }
          );
        }
      }

      // Actualizar proveedor
      const updatedSupplier = await Supplier.findByIdAndUpdate(
        params.id,
        updateData,
        { new: true, runValidators: true }
      );

      return NextResponse.json(updatedSupplier);
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

    await dbConnect();
    const params = await context.params;

    // Verificar que el proveedor existe
    const supplier = await Supplier.findById(params.id);
    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    const deletedSupplier = await Supplier.findByIdAndUpdate(
      params.id,
      {
        isActive: false,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
        metadata: {
          ...supplier.metadata,
          deletedAt: new Date(),
          deletedBy: userId
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'Proveedor eliminado exitosamente',
      supplier: deletedSupplier
    });

  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}