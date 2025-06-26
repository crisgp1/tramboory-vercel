import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { z } from "zod"
import crypto from "crypto"

const client = new MongoClient(process.env.MONGODB_URI!)

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    // Verificar si el usuario existe
    const user = await users.findOne({ 
      email: email.toLowerCase() 
    })

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json(
        { message: "Si el email existe, recibirás un enlace de recuperación" },
        { status: 200 }
      )
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Guardar el token en la base de datos
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        }
      }
    )

    // Aquí normalmente enviarías un email con el token
    // Por ahora solo devolvemos el token para desarrollo
    console.log(`Reset token para ${email}: ${resetToken}`)

    return NextResponse.json(
      { message: "Si el email existe, recibirás un enlace de recuperación" },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error en forgot password:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}