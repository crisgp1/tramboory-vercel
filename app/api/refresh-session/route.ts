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

    // Force session refresh by invalidating existing sessions
    const clerk = await clerkClient()
    
    // Get user sessions
    const sessions = await clerk.sessions.getSessionList({ userId })
    
    console.log(`Found ${sessions.data.length} sessions for user ${userId}`)
    
    // Revoke all sessions to force re-authentication with updated metadata
    for (const session of sessions.data) {
      await clerk.sessions.revokeSession(session.id)
      console.log(`Revoked session: ${session.id}`)
    }

    return NextResponse.json(
      { 
        message: "Sesiones revocadas exitosamente. El usuario necesita hacer login nuevamente.",
        userId,
        revokedSessions: sessions.data.length
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error refreshing session:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}