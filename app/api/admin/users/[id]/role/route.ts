import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, isGerente, canManageUser } from "@/lib/server-role-utils"
import { UserRole } from "@/lib/roles"

/**
 * GET /api/admin/users/[id]/role - Obtener el rol de un usuario específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y roles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Verificar que sea admin o gerente
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(userId)
    const userRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole) && !isGerente(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Obtener el usuario solicitado
    let user
    try {
      user = await clerk.users.getUser(params.id)
      
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error al obtener usuario:", error)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    
    // Devolver el rol del usuario
    return NextResponse.json({
      userId: user.id,
      role: (user.publicMetadata?.role as string) || "customer"
    })
    
  } catch (error: any) {
    console.error("Error al obtener rol de usuario:", error)
    return NextResponse.json(
      { error: "Error al obtener rol de usuario" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id]/role - Actualizar el rol de un usuario
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y roles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Verificar que sea admin o gerente
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(userId)
    const userRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    // Obtener datos del request
    const data = await req.json()
    const { role } = data as { role: UserRole }
    
    if (!role) {
      return NextResponse.json(
        { error: "No se proporcionó un rol válido" },
        { status: 400 }
      )
    }
    
    // Validar permisos para asignar roles
    let targetUser
    try {
      targetUser = await clerk.users.getUser(params.id)
      
      if (!targetUser) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error al obtener usuario objetivo:", error)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    
    const targetRole = (targetUser.publicMetadata?.role as string) || "customer"
    
    // Solo los admin pueden cambiar cualquier rol
    // Los gerentes solo pueden gestionar vendedores y clientes
    if (!isAdmin(userRole)) {
      // Si no es admin, verificar si es gerente y si el rol target y el nuevo rol son permitidos
      if (isGerente(userRole)) {
        const allowedRoles = ["vendedor", "customer"]
        if (!allowedRoles.includes(targetRole) || !allowedRoles.includes(role)) {
          return NextResponse.json({ error: "No autorizado para cambiar este rol" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    
    // Actualizar el rol del usuario
    await clerk.users.updateUser(params.id, {
      publicMetadata: { 
        ...targetUser.publicMetadata,
        role 
      }
    })
    
    // Obtener el usuario actualizado
    const updatedUser = await clerk.users.getUser(params.id)
    
    // Respuesta
    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      role: (updatedUser.publicMetadata?.role as string) || "customer",
      message: `Rol actualizado a ${role} para el usuario ${updatedUser.firstName} ${updatedUser.lastName}`
    })
    
  } catch (error: any) {
    console.error("Error al actualizar rol:", error)
    return NextResponse.json(
      { error: "Error al actualizar rol" },
      { status: 500 }
    )
  }
}