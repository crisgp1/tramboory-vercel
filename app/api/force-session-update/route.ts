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

    const clerk = await clerkClient()
    
    // 1. Obtener el usuario actual para verificar su rol
    const user = await clerk.users.getUser(userId)
    const currentRole = user.publicMetadata?.role || "customer"
    
    console.log(`🔍 Usuario ${userId} tiene rol: ${currentRole}`)
    
    // 2. Obtener todas las sesiones activas del usuario
    const sessions = await clerk.sessions.getSessionList({ userId })
    console.log(`📋 Encontradas ${sessions.data.length} sesiones activas`)
    
    // 3. Para cada sesión activa, forzar la actualización de los claims
    const updatePromises = sessions.data.map(async (session) => {
      try {
        // Revocar la sesión actual para forzar una nueva autenticación
        await clerk.sessions.revokeSession(session.id)
        console.log(`✅ Sesión ${session.id} revocada`)
        return { sessionId: session.id, status: 'revoked' }
      } catch (error) {
        console.error(`❌ Error revocando sesión ${session.id}:`, error)
        return { sessionId: session.id, status: 'error', error: error instanceof Error ? error.message : String(error) }
      }
    })
    
    const results = await Promise.all(updatePromises)
    
    // 4. También forzar una actualización de metadatos para asegurar consistencia
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: currentRole,
        lastUpdated: new Date().toISOString()
      }
    })
    
    return NextResponse.json(
      { 
        message: "Sesiones actualizadas exitosamente",
        userId,
        currentRole,
        sessionsProcessed: results.length,
        results,
        action: "All sessions revoked - user must login again"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error forcing session update:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}