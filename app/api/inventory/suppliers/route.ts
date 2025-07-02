import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/lib/models/inventory/Supplier';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Schema de validación para crear/actualizar proveedores
const SupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  code: z.string().min(1, 'El código es requerido').max(50),
  description: z.string().optional(),
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
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filters.categories = category;
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    // Configurar ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta
    const skip = (page - 1) * limit;
    
    const [suppliers, total] = await Promise.all([
      Supplier.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Supplier.countDocuments(filters)
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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

    await dbConnect();

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

    // Verificar que el código no exista
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

    // Crear proveedor con valores por defecto para campos requeridos
    const supplier = new Supplier({
      ...supplierData,
      supplierId,
      // Agregar campos requeridos con valores por defecto
      deliveryInfo: {
        leadTimeDays: 1,
        deliveryZones: []
      },
      // Asegurar que rating tenga la estructura correcta
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

    return NextResponse.json(supplier, { status: 201 });

  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}