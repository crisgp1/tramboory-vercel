import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/lib/models/inventory/Supplier';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Obtener información del usuario actual
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string) || "customer";

    // Solo permitir a admin y gerente
    if (userRole !== "admin" && userRole !== "gerente") {
      return NextResponse.json(
        { error: 'Solo administradores pueden acceder a esta ruta' },
        { status: 403 }
      );
    }

    // Obtener todos los proveedores sin userId
    const unlinkedSuppliers = await Supplier.find({ 
      $or: [
        { userId: null },
        { userId: { $exists: false } },
        { userId: "" }
      ]
    }).lean();

    // Obtener todos los usuarios con rol proveedor
    const allUsers = await clerk.users.getUserList({ limit: 100 });
    const providerUsers = allUsers.data.filter(u => 
      (u.publicMetadata?.role as string) === "proveedor"
    );

    // Obtener proveedores ya vinculados
    const linkedSuppliers = await Supplier.find({
      userId: { $ne: null, $exists: true, $ne: "" }
    }).lean();

    const response = {
      unlinkedSuppliers: unlinkedSuppliers.map(s => ({
        id: s._id.toString(),
        supplierId: s.supplierId,
        name: s.name,
        code: s.code,
        email: s.contactInfo?.email
      })),
      providerUsers: providerUsers.map(u => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.emailAddresses[0]?.emailAddress
      })),
      linkedSuppliers: linkedSuppliers.map(s => ({
        supplierId: s.supplierId,
        name: s.name,
        userId: s.userId,
        email: s.contactInfo?.email
      })),
      instructions: {
        method: "POST",
        body: {
          supplierId: "SUP000001 (example)",
          userId: "user_xxx (Clerk user ID)"
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in link supplier GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que es admin o gerente
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string) || "customer";

    if (userRole !== "admin" && userRole !== "gerente") {
      return NextResponse.json(
        { error: 'Solo administradores pueden vincular proveedores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { supplierId, userId: targetUserId } = body;

    if (!supplierId || !targetUserId) {
      return NextResponse.json(
        { error: 'Se requiere supplierId y userId' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar que el usuario objetivo existe y es proveedor
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetUserRole = (targetUser.publicMetadata?.role as string) || "customer";

    if (targetUserRole !== "proveedor") {
      return NextResponse.json(
        { error: 'El usuario objetivo debe tener rol de proveedor' },
        { status: 400 }
      );
    }

    // Buscar el proveedor
    const supplier = await Supplier.findOne({ supplierId });
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya está vinculado
    if (supplier.userId && supplier.userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Este proveedor ya está vinculado a otro usuario' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya tiene otro proveedor
    const existingSupplier = await Supplier.findOne({ 
      userId: targetUserId,
      _id: { $ne: supplier._id }
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Este usuario ya está vinculado a otro proveedor' },
        { status: 400 }
      );
    }

    // Vincular el proveedor al usuario
    supplier.userId = targetUserId;
    supplier.updatedBy = userId;
    supplier.updatedAt = new Date();
    await supplier.save();

    return NextResponse.json({
      success: true,
      message: 'Proveedor vinculado exitosamente',
      supplier: {
        id: supplier._id.toString(),
        supplierId: supplier.supplierId,
        name: supplier.name,
        userId: supplier.userId
      },
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress,
        name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()
      }
    });

  } catch (error) {
    console.error('Error in link supplier POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que es admin o gerente
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string) || "customer";

    if (userRole !== "admin" && userRole !== "gerente") {
      return NextResponse.json(
        { error: 'Solo administradores pueden desvincular proveedores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { supplierId } = body;

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Se requiere supplierId' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Buscar el proveedor
    const supplier = await Supplier.findOne({ supplierId });
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si está vinculado
    if (!supplier.userId) {
      return NextResponse.json(
        { error: 'Este proveedor no está vinculado a ningún usuario' },
        { status: 400 }
      );
    }

    // Desvincular el proveedor (establecer userId como null)
    supplier.userId = null;
    supplier.updatedBy = userId;
    supplier.updatedAt = new Date();
    await supplier.save();

    return NextResponse.json({
      success: true,
      message: 'Proveedor desvinculado exitosamente',
      supplier: {
        id: supplier._id.toString(),
        supplierId: supplier.supplierId,
        name: supplier.name,
        userId: supplier.userId
      }
    });

  } catch (error) {
    console.error('Error in link supplier DELETE:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}