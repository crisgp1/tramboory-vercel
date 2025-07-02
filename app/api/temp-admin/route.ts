import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { z } from "zod"
import { UserRole, ROLES } from "@/lib/roles"

const updateRoleSchema = z.object({
  role: z.enum(["customer", "admin", "proveedor", "vendedor", "gerente"]),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role: newRole } = updateRoleSchema.extend({
      userId: z.string()
    }).parse(body)

    console.log("🔄 Cambiando rol temporal:", { userId, newRole })

    // Actualizar el rol del usuario sin restricciones
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: newRole
      }
    })

    console.log("✅ Rol cambiado exitosamente")

    return NextResponse.json(
      { 
        message: "Rol actualizado exitosamente",
        role: newRole,
        roleInfo: ROLES[newRole]
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("❌ Error actualizando rol:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
