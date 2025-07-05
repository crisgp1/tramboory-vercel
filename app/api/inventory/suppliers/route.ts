import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // 1. Obtener todos los proveedores de la base de datos
    const dbSuppliers = await Supplier.find({}).lean();
    console.log("🔍 DB Suppliers count:", dbSuppliers.length);
    console.log("🔍 DB Suppliers userIds:", dbSuppliers.map(s => ({ name: s.name, userId: s.userId })));

    // 2. Obtener todos los usuarios con rol proveedor de Clerk
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      limit: 100,
    });

    const providerUsers = clerkUsers.data.filter(user => 
      (user.publicMetadata?.role as string) === "proveedor"
    );
    console.log("🔍 Provider users count:", providerUsers.length);
    console.log("🔍 Provider users:", providerUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` })));

    // 3. Combinar datos - crear una lista unificada
    const allSuppliers = [];
    
    // Crear un mapa de userIds ya vinculados para búsqueda rápida
    const linkedUserIds = new Set(dbSuppliers.map(s => s.userId).filter(Boolean));

    // Agregar proveedores existentes en DB
    for (const dbSupplier of dbSuppliers) {
      const linkedUser = providerUsers.find(user => user.id === dbSupplier.userId);
      
      allSuppliers.push({
        ...dbSupplier,
        _id: dbSupplier._id.toString(),
        // Si hay usuario vinculado, actualizar con datos de Clerk
        ...(linkedUser && {
          contactInfo: {
            ...dbSupplier.contactInfo,
            email: linkedUser.emailAddresses[0]?.emailAddress || dbSupplier.contactInfo?.email,
          },
          userImageUrl: linkedUser.imageUrl,
          userFullName: `${linkedUser.firstName || ''} ${linkedUser.lastName || ''}`.trim(),
        }),
        isFromDb: true,
        totalOrders: 0, // Placeholder - calcular según orders reales
        totalSpent: 0,  // Placeholder - calcular según orders reales
        lastOrderDate: null
      });
    }

    // Agregar SOLO usuarios proveedor que NO están vinculados a ningún supplier
    const unlinkedUsers = providerUsers.filter(user => !linkedUserIds.has(user.id));
    console.log("🔍 Linked userIds:", Array.from(linkedUserIds));
    console.log("🔍 Unlinked users:", unlinkedUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` })));

    for (const user of unlinkedUsers) {
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                   user.emailAddresses[0]?.emailAddress || '';
      
      allSuppliers.push({
        _id: `user_${user.id}`,
        userId: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0],
        code: `USER_${user.id.slice(-6).toUpperCase()}`,
        description: 'Usuario proveedor - Información pendiente de completar',
        contactInfo: {
          email: email,
          phone: '',
          address: '',
          contactPerson: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        },
        paymentTerms: {
          creditDays: 30,
          paymentMethod: 'cash',
          currency: 'MXN'
        },
        rating: {
          quality: 3,
          delivery: 3,
          service: 3,
          price: 3,
          overall: 3
        },
        isActive: true,
        userImageUrl: user.imageUrl,
        userFullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        isFromDb: false,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
        createdAt: user.createdAt
      });
    }

    // 4. Aplicar filtros
    let filteredSuppliers = allSuppliers;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSuppliers = allSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.code.toLowerCase().includes(searchLower) ||
        (supplier.description && supplier.description.toLowerCase().includes(searchLower)) ||
        supplier.contactInfo.email.toLowerCase().includes(searchLower)
      );
    }

    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredSuppliers = filteredSuppliers.filter(supplier => supplier.isActive === activeFilter);
    }

    // 5. Aplicar ordenamiento
    filteredSuppliers.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a];
      let bValue = b[sortBy as keyof typeof b];
      
      // Manejar campos anidados
      if (sortBy === 'email') {
        aValue = a.contactInfo.email;
        bValue = b.contactInfo.email;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 6. Aplicar paginación
    const total = filteredSuppliers.length;
    const skip = (page - 1) * limit;
    const paginatedSuppliers = filteredSuppliers.slice(skip, skip + limit);

    return NextResponse.json({
      suppliers: paginatedSuppliers,
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

    // Si se proporciona userId, verificar que el usuario existe y es proveedor
    if (supplierData.userId) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(supplierData.userId);
        const userRole = (user.publicMetadata?.role as string) || "customer";
        
        if (userRole !== "proveedor") {
          return NextResponse.json(
            { error: 'El usuario debe tener rol de proveedor' },
            { status: 400 }
          );
        }

        // Verificar que el usuario no esté ya vinculado a otro proveedor
        const existingSupplier = await Supplier.findOne({ userId: supplierData.userId });
        if (existingSupplier) {
          return NextResponse.json(
            { error: 'Este usuario ya está vinculado a otro proveedor' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Usuario no encontrado o inválido' },
          { status: 400 }
        );
      }
    }

    // Generar supplierId único
    const supplierCount = await Supplier.countDocuments();
    const supplierId = `SUP${String(supplierCount + 1).padStart(6, '0')}`;

    // Crear proveedor con valores por defecto para campos requeridos
    const supplier = new Supplier({
      ...supplierData,
      supplierId,
      userId: supplierData.userId, // Incluir userId si está presente
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