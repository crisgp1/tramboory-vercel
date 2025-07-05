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

    // Obtener todos los proveedores en la base de datos
    const allSuppliers = await Supplier.find({}).lean();

    // Obtener todos los usuarios con rol proveedor
    const allUsers = await clerk.users.getUserList({ limit: 100 });
    const providerUsers = allUsers.data.filter(u => 
      (u.publicMetadata?.role as string) === "proveedor"
    );

    // Buscar proveedor específico para este usuario
    const mySupplier = await Supplier.findOne({ userId });

    const debugInfo = {
      currentUser: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: userRole
      },
      allSuppliers: allSuppliers.map(s => ({
        id: s._id.toString(),
        name: s.name,
        code: s.code,
        userId: s.userId,
        supplierId: s.supplierId
      })),
      providerUsers: providerUsers.map(u => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        role: (u.publicMetadata?.role as string) || "customer"
      })),
      mySupplier: mySupplier ? {
        id: mySupplier._id.toString(),
        name: mySupplier.name,
        code: mySupplier.code,
        userId: mySupplier.userId,
        supplierId: mySupplier.supplierId
      } : null,
      lookupResults: {
        searchUserId: userId,
        foundSupplier: !!mySupplier,
        supplierCount: allSuppliers.length,
        providerUserCount: providerUsers.length
      }
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error in debug supplier lookup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}