import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId: currentUserId } = await auth()
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar que el usuario actual es admin o gerente
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(currentUserId)
    const currentUserRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    if (!["admin", "gerente"].includes(currentUserRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para ver esta información" },
        { status: 403 }
      )
    }

    // Obtener todos los usuarios con rol proveedor
    const users = await clerk.users.getUserList({
      limit: 100 // Ajustar según necesidades
    })

    const providerUsers = users.data
      .filter(user => (user.publicMetadata?.role as string) === "proveedor")
      .map(user => ({
        id: user.id,
        email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Usuario sin nombre",
        imageUrl: user.imageUrl,
        createdAt: user.createdAt
      }))

    return NextResponse.json({
      success: true,
      users: providerUsers
    })

  } catch (error) {
    console.error("Error obteniendo usuarios proveedores:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}