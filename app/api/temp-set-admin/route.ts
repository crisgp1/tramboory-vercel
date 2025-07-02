import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Temporary endpoint to set admin role - REMOVE IN PRODUCTION
    const clerk = await clerkClient()
    
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "admin"
      }
    })

    return NextResponse.json(
      { 
        message: "Rol actualizado exitosamente a admin",
        userId,
        role: "admin"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error actualizando rol:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}