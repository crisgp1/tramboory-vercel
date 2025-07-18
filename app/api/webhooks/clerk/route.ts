import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { headers } from "next/headers"
import { clerkClient } from "@clerk/nextjs/server"
import { DEFAULT_ROLE } from "@/lib/roles"

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === "user.created") {
    try {
      const { id } = evt.data
      
      // Asignar rol por defecto al nuevo usuario
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          role: DEFAULT_ROLE
        }
      })

      console.log(`Rol por defecto asignado al usuario ${id}: ${DEFAULT_ROLE}`)
    } catch (error) {
      console.error("Error asignando rol por defecto:", error)
      return new Response("Error processing webhook", { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}