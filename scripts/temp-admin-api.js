// Script temporal para crear una API que permita cambiar roles sin restricciones
// Solo para uso de desarrollo

const fs = require('fs')
const path = require('path')

const tempApiContent = `import { NextRequest, NextResponse } from "next/server"
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
`

// Crear el directorio temporal
const tempDir = path.join(process.cwd(), 'app', 'api', 'temp-admin')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// Escribir el archivo temporal
const tempFile = path.join(tempDir, 'route.ts')
fs.writeFileSync(tempFile, tempApiContent)

console.log("✅ API temporal creada en /api/temp-admin")
console.log("🔄 Ahora puedes usar la siguiente función en la consola del navegador:")
console.log(`
async function changeToAdmin() {
  const response = await fetch('/api/temp-admin', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_2yvCESw1sdoMeeVPq22GoGajddZ',
      role: 'admin'
    })
  })
  const result = await response.json()
  console.log(result)
  if (response.ok) {
    setTimeout(() => window.location.reload(), 1000)
  }
}
changeToAdmin()
`)