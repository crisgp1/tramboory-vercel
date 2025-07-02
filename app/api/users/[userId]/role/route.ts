import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { z } from "zod"
import { UserRole, ROLES, canAccessRole } from "@/lib/roles"

const updateRoleSchema = z.object({
  role: z.enum(["customer", "admin", "proveedor", "vendedor", "gerente"]),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener el usuario actual para verificar permisos
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(currentUserId)
    const currentUserRole = (currentUser.publicMetadata?.role as UserRole) || "customer"

    const body = await request.json()
    const { role: newRole } = updateRoleSchema.parse(body)

    // Verificar si el usuario actual puede cambiar roles
    if (!canAccessRole(currentUserRole, newRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para asignar este rol" },
        { status: 403 }
      )
    }

    // Actualizar el rol del usuario
    const params = await context.params;
    await clerk.users.updateUserMetadata(params.userId, {
      publicMetadata: {
        role: newRole
      }
    })

    return NextResponse.json(
      { 
        message: "Rol actualizado exitosamente",
        role: newRole,
        roleInfo: ROLES[newRole]
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error actualizando rol:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo permitir ver el propio rol o si es admin/gerente
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(currentUserId)
    const currentUserRole = (currentUser.publicMetadata?.role as UserRole) || "customer"
    
    const params = await context.params;
    if (currentUserId !== params.userId && !["admin", "gerente"].includes(currentUserRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para ver este rol" },
        { status: 403 }
      )
    }

    const user = await clerk.users.getUser(params.userId)
    const userRole = (user.publicMetadata?.role as UserRole) || "customer"

    return NextResponse.json(
      {
        userId: params.userId,
        role: userRole,
        roleInfo: ROLES[userRole]
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error obteniendo rol:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}