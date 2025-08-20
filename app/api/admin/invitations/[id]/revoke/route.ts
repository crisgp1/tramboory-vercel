import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: invitationId } = await params

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 })
    }

    // Revoke invitation using Clerk
    const client = await clerkClient()
    await client.invitations.revokeInvitation(invitationId)

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully"
    })
  } catch (error: any) {
    console.error("Error revoking invitation:", error)
    
    // Handle specific Clerk errors
    if (error.status === 404) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Error revoking invitation" },
      { status: 500 }
    )
  }
}