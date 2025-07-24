import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

    // Obtener todos los proveedores sin user_id
    const unlinkedSuppliers = await SupabaseInventoryService.getUnlinkedSuppliers();

    // Obtener todos los usuarios con rol proveedor
    const allUsers = await clerk.users.getUserList({ limit: 100 });
    const providerUsers = allUsers.data.filter(u => 
      (u.publicMetadata?.role as string) === "proveedor"
    );

    // Obtener proveedores ya vinculados
    const linkedSuppliers = await SupabaseInventoryService.getLinkedSuppliers();

    const response = {
      unlinkedSuppliers: unlinkedSuppliers.map(s => ({
        id: s.id,
        supplier_id: s.supplier_id,
        name: s.name,
        code: s.code,
        email: s.contact_email
      })),
      providerUsers: providerUsers.map(u => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.emailAddresses[0]?.emailAddress
      })),
      linkedSuppliers: linkedSuppliers.map(s => ({
        supplier_id: s.supplier_id,
        name: s.name,
        user_id: s.user_id,
        email: s.contact_email
      })),
      instructions: {
        method: "POST",
        body: {
          supplier_id: "SUP-123456 (example)",
          user_id: "user_xxx (Clerk user ID)"
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in Supabase supplier link GET:', error);
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
    const { supplier_id, user_id: targetUserId } = body;

    if (!supplier_id || !targetUserId) {
      return NextResponse.json(
        { error: 'Se requiere supplier_id y user_id' },
        { status: 400 }
      );
    }

    // Verificar que el usuario objetivo existe y es proveedor
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetUserRole = (targetUser.publicMetadata?.role as string) || "customer";

    if (targetUserRole !== "proveedor") {
      return NextResponse.json(
        { error: 'El usuario objetivo debe tener rol de proveedor' },
        { status: 400 }
      );
    }

    // Buscar el proveedor en Supabase
    const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplier_id);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya está vinculado
    if (supplier.user_id && supplier.user_id !== targetUserId) {
      return NextResponse.json(
        { error: 'Este proveedor ya está vinculado a otro usuario' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya tiene otro proveedor
    const existingSupplier = await SupabaseInventoryService.getSupplierByUserId(targetUserId);
    if (existingSupplier && existingSupplier.id !== supplier.id) {
      return NextResponse.json(
        { error: 'Este usuario ya está vinculado a otro proveedor' },
        { status: 400 }
      );
    }

    // Vincular el proveedor al usuario
    const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, {
      user_id: targetUserId,
      updated_by: userId,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Proveedor vinculado exitosamente',
      supplier: {
        id: updatedSupplier.id,
        supplier_id: updatedSupplier.supplier_id,
        name: updatedSupplier.name,
        user_id: updatedSupplier.user_id
      },
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress,
        name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()
      }
    });

  } catch (error) {
    console.error('Error in Supabase supplier link POST:', error);
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
    const { supplier_id } = body;

    if (!supplier_id) {
      return NextResponse.json(
        { error: 'Se requiere supplier_id' },
        { status: 400 }
      );
    }

    // Buscar el proveedor
    const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplier_id);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si está vinculado
    if (!supplier.user_id) {
      return NextResponse.json(
        { error: 'Este proveedor no está vinculado a ningún usuario' },
        { status: 400 }
      );
    }

    // Desvincular el proveedor (establecer user_id como null)
    const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, {
      user_id: undefined,
      updated_by: userId,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Proveedor desvinculado exitosamente',
      supplier: {
        id: updatedSupplier.id,
        supplier_id: updatedSupplier.supplier_id,
        name: updatedSupplier.name,
        user_id: updatedSupplier.user_id
      }
    });

  } catch (error) {
    console.error('Error in Supabase supplier link DELETE:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}