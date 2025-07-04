import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, isGerente } from "@/lib/server-role-utils"
import { UserRole } from "@/lib/roles"

// Tipos para los usuarios de Clerk
interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  publicMetadata: { role?: string } | null;
  banned: boolean;
  createdAt: string;
  imageUrl: string;
}

// Tipo para el usuario formateado que devolvemos
interface FormattedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
  imageUrl: string;
}

/**
 * GET /api/admin/users - Lista de usuarios con filtrado y paginación
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación y roles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Verificar que sea admin o gerente
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(userId)
    const userRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole) && !isGerente(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Obtener parámetros de consulta
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""
    const role = url.searchParams.get("role") || ""
    const status = url.searchParams.get("status") || ""
    
    // Construir parámetros para la consulta a Clerk
    const filterParams: any = {
      limit,
      offset: (page - 1) * limit,
      orderBy: "-created_at"
    }
    
    // Aplicar filtro de búsqueda
    if (search) {
      filterParams.query = search
    }
    
    // Obtener usuarios de Clerk
    const users = await clerk.users.getUserList(filterParams)
    
    // Asegurar que tenemos un array para trabajar con él
    const userArray = Array.isArray(users.data) ? users.data : (users as any).data || []
    console.log("🔍 Users API Debug - usuarios obtenidos:", userArray.length)
    
    // Aplicar filtros adicionales que no soporta directamente la API de Clerk
    let filteredUsers = userArray as unknown as ClerkUser[]
    
    // Filtrar por rol si se especificó
    if (role && role !== "all") {
      filteredUsers = filteredUsers.filter((user: ClerkUser) => 
        (user.publicMetadata?.role as string) === role
      )
    }
    
    // Filtrar por estado si se especificó
    if (status && status !== "all") {
      const isActive = status === "active"
      filteredUsers = filteredUsers.filter((user: ClerkUser) => user.banned !== isActive)
    }
    
    // Formatear la respuesta
    const formattedUsers: FormattedUser[] = filteredUsers.map((user: ClerkUser) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata?.role as string) || "customer",
      isActive: !user.banned,
      createdAt: user.createdAt,
      imageUrl: user.imageUrl
    }))
    
    // Obtener el total de usuarios para paginación
    // Nota: esto es una aproximación, ya que Clerk no proporciona un count directo
    const totalUsers = filteredUsers.length || 0
    
    return NextResponse.json({
      users: formattedUsers,
      total: totalUsers,
      page,
      limit
    })
    
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users - Crear un nuevo usuario
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación y roles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Verificar que sea admin
    const clerk = await clerkClient()
    const currentUser = await clerk.users.getUser(userId)
    const userRole = (currentUser.publicMetadata?.role as string) || "customer"
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    // Obtener datos del request
    const data = await req.json()
    const { firstName, lastName, email, password, role } = data
    
    // Validar datos
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }
    
    // Crear usuario en Clerk
    const newUser = await clerk.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
      publicMetadata: { role },
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.emailAddresses[0]?.emailAddress,
        role: (newUser.publicMetadata?.role as string) || "customer",
        isActive: !newUser.banned,
        createdAt: newUser.createdAt
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}