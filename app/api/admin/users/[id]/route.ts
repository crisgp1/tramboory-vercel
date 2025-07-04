import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, isGerente } from "@/lib/server-role-utils"

/**
 * GET /api/admin/users/[id] - Obtener un usuario específico
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
    
    // Formatear respuesta
    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata?.role as string) || "customer",
      isActive: !user.banned,
      createdAt: user.createdAt,
      imageUrl: user.imageUrl
    }
    
    return NextResponse.json(formattedUser)
    
  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id] - Actualizar un usuario
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
    
    // Solo los admin pueden actualizar cualquier usuario
    // Los gerentes solo pueden actualizar a vendedores y clientes
    const targetUser = await clerk.users.getUser(params.id)
    const targetRole = (targetUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole) && 
        !(isGerente(userRole) && 
          (targetRole === "vendedor" || targetRole === "customer"))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Obtener datos del request
    const data = await req.json()
    const { firstName, lastName, email, role, isActive } = data
    
    // Validar datos
    if (!firstName && !lastName && !email && role === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: "No se proporcionaron datos para actualizar" },
        { status: 400 }
      )
    }
    
    // Construir parámetros de actualización
    const updateParams: any = {}
    
    if (firstName) updateParams.firstName = firstName
    if (lastName) updateParams.lastName = lastName
    
    // Si se actualizó el email, actualizar las direcciones de correo
    if (email) {
      // Nota: en una implementación real, esto debería ser más complejo
      // para manejar la verificación de emails y preservar emails existentes
      updateParams.emailAddresses = [{ email }]
    }
    
    // Actualizar usuario en Clerk
    const updatedUser = await clerk.users.updateUser(params.id, updateParams)
    
    // Actualizar metadata si se especificó un rol
    if (role !== undefined) {
      await clerk.users.updateUser(params.id, {
        publicMetadata: { ...updatedUser.publicMetadata, role }
      })
    }
    
    // Actualizar estado si se especificó
    if (isActive !== undefined) {
      if (!isActive) {
        await clerk.users.lockUser(params.id)
      } else {
        await clerk.users.unlockUser(params.id)
      }
    }
    
    // Obtener el usuario actualizado
    const refreshedUser = await clerk.users.getUser(params.id)
    
    // Formatear respuesta
    const formattedUser = {
      id: refreshedUser.id,
      firstName: refreshedUser.firstName,
      lastName: refreshedUser.lastName,
      email: refreshedUser.emailAddresses[0]?.emailAddress,
      role: (refreshedUser.publicMetadata?.role as string) || "customer",
      isActive: !refreshedUser.banned,
      createdAt: refreshedUser.createdAt,
      imageUrl: refreshedUser.imageUrl
    }
    
    return NextResponse.json({
      success: true,
      user: formattedUser
    })
    
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id] - Actualizar parcialmente un usuario (ej: solo su estado)
 */
export async function PATCH(
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
    
    // Solo los admin pueden actualizar cualquier usuario
    // Los gerentes solo pueden actualizar a vendedores y clientes
    const targetUser = await clerk.users.getUser(params.id)
    const targetRole = (targetUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole) && 
        !(isGerente(userRole) && 
          (targetRole === "vendedor" || targetRole === "customer"))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Obtener datos del request
    const data = await req.json()
    const { isActive } = data
    
    // Validar datos
    if (isActive === undefined) {
      return NextResponse.json(
        { error: "No se proporcionaron datos para actualizar" },
        { status: 400 }
      )
    }
    
    // Actualizar estado
    if (!isActive) {
      await clerk.users.lockUser(params.id)
    } else {
      await clerk.users.unlockUser(params.id)
    }
    
    // Obtener el usuario actualizado
    const refreshedUser = await clerk.users.getUser(params.id)
    
    // Formatear respuesta
    const formattedUser = {
      id: refreshedUser.id,
      firstName: refreshedUser.firstName,
      lastName: refreshedUser.lastName,
      email: refreshedUser.emailAddresses[0]?.emailAddress,
      role: (refreshedUser.publicMetadata?.role as string) || "customer",
      isActive: !refreshedUser.banned,
      createdAt: refreshedUser.createdAt,
      imageUrl: refreshedUser.imageUrl
    }
    
    return NextResponse.json({
      success: true,
      user: formattedUser
    })
    
  } catch (error: any) {
    console.error("Error al actualizar estado de usuario:", error)
    return NextResponse.json(
      { error: "Error al actualizar estado de usuario" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id] - Eliminar un usuario
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y roles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Solo admin puede eliminar usuarios
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(userId)
    const userRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Eliminar usuario en Clerk
    await clerk.users.deleteUser(params.id)
    
    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente"
    })
    
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}