import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { UserRole } from "@/lib/roles"
import { SupplierFactory } from "@/lib/services/SupplierFactory"
import { SupplierInvitationData } from "@/lib/types/supplier.types"

// GET - List all invitations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all invitations using the correct Clerk method
    const client = await clerkClient()
    const invitations = await client.invitations.getInvitationList()

    return NextResponse.json({
      invitations: invitations.data.map((invitation: any) => ({
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
        metadata: invitation.publicMetadata
      }))
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json(
      { error: "Error fetching invitations" },
      { status: 500 }
    )
  }
}

// POST - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      role = "customer",
      redirectUrl,
      expiresInDays = 30,
      metadata = {}
    } = body

    // Validaciones mejoradas
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validar rol
    const validRoles = ["customer", "admin", "proveedor", "vendedor", "gerente"] as UserRole[]
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Construir URL de redirección segura
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const finalRedirectUrl = redirectUrl || `${baseUrl}/auth/sign-up`

    // Limpiar y validar metadata para Clerk
    const cleanMetadata: Record<string, any> = {
      role: role as UserRole,
      invitedBy: userId,
      invitedAt: new Date().toISOString()
    }

    // Agregar metadata adicional solo si son valores válidos
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Convertir a string si no es un tipo primitivo válido
        if (typeof value === 'object') {
          cleanMetadata[key] = JSON.stringify(value)
        } else {
          cleanMetadata[key] = String(value)
        }
      }
    })

    console.log('Creating invitation with data:', {
      emailAddress: email,
      redirectUrl: finalRedirectUrl,
      publicMetadata: cleanMetadata
    })

    // Create invitation with metadata using the correct Clerk method
    const client = await clerkClient()
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: finalRedirectUrl,
      publicMetadata: cleanMetadata
    })

    let supplierResult = null;

    // 🚀 NUEVA FUNCIONALIDAD: Auto-crear proveedor si el rol es "proveedor"
    if (role === "proveedor") {
      try {
        const supplierInvitationData: SupplierInvitationData = {
          email: email,
          role: "proveedor",
          supplier_name: metadata.supplier_name || undefined,
          supplier_code: metadata.supplier_code || undefined,
          expires_in_days: expiresInDays,
          redirect_url: redirectUrl,
          metadata: {
            department: metadata.department || '',
            notes: metadata.notes || '',
            auto_create_supplier: true
          }
        };

        supplierResult = await SupplierFactory.createPortalSupplier(
          supplierInvitationData,
          userId
        );

        if (!supplierResult.success) {
          console.error("Error creating supplier for invitation:", supplierResult.error);
          // No fallar la invitación si falla la creación del proveedor
          // Se puede crear manualmente después
        }
      } catch (supplierError) {
        console.error("Error in supplier auto-creation:", supplierError);
        // No fallar la invitación principal
      }
    }

    const response: any = {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
        createdAt: invitation.createdAt,
        metadata: invitation.publicMetadata
      }
    };

    // Incluir información del proveedor creado si aplica
    if (supplierResult?.success && supplierResult.supplier) {
      response.supplier = {
        id: supplierResult.supplier.id,
        supplier_id: supplierResult.supplier.supplier_id,
        name: supplierResult.supplier.name,
        code: supplierResult.supplier.code,
        status: supplierResult.supplier.status,
        type: supplierResult.supplier.type
      };
      response.message = `Invitación enviada y proveedor ${supplierResult.supplier.name} creado automáticamente`;
    } else if (role === "proveedor" && (!supplierResult || !supplierResult.success)) {
      response.warning = "Invitación enviada exitosamente, pero el proveedor debe crearse manualmente";
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error creating invitation:", error)
    
    // Log full error for debugging
    console.error("Full error object:", {
      message: error.message,
      status: error.status,
      clerkTraceId: error.clerkTraceId,
      errors: error.errors,
      clerkError: error.clerkError
    })
    
    // Handle specific Clerk errors
    if (error.clerkError && error.status) {
      switch (error.status) {
        case 422:
          // Unprocessable Entity - validation errors
          const validationErrors = error.errors || []
          const errorMessages = validationErrors.map((err: any) => err.message || err.longMessage || 'Validation error').join(', ')
          return NextResponse.json(
            {
              error: "Validation error",
              details: errorMessages || "Invalid data provided for invitation",
              clerkTraceId: error.clerkTraceId
            },
            { status: 422 }
          )
        
        case 409:
          return NextResponse.json(
            { error: "User with this email already exists or has a pending invitation" },
            { status: 409 }
          )
        
        case 400:
          return NextResponse.json(
            {
              error: "Bad request",
              details: error.message || "Invalid request data",
              clerkTraceId: error.clerkTraceId
            },
            { status: 400 }
          )
        
        default:
          return NextResponse.json(
            {
              error: "Clerk API error",
              details: error.message || "Unknown error from Clerk",
              clerkTraceId: error.clerkTraceId
            },
            { status: error.status }
          )
      }
    }
    
    // Handle other specific errors
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: "User with this email already exists or has a pending invitation" },
        { status: 409 }
      )
    }
    
    // Generic error fallback
    return NextResponse.json(
      {
        error: "Error creating invitation",
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
}