import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      )
    }

    // Debug endpoint to check user metadata - REMOVE IN PRODUCTION
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)

    return NextResponse.json(
      { 
        userId,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        unsafeMetadata: user.unsafeMetadata,
        emailAddresses: user.emailAddresses.map(email => email.emailAddress),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error getting user data:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}