import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/reservaciones(.*)",
  "/bienvenida",
  "/proveedor(.*)", // Añadido para proteger rutas de proveedor
  "/inventario(.*)", // Proteger rutas de inventario
])

const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
])

const isReservacionesRoute = createRouteMatcher([
  "/reservaciones(.*)",
])

const isProveedorRoute = createRouteMatcher([
  "/proveedor(.*)",
])

const isInventarioRoute = createRouteMatcher([
  "/inventario(.*)",
])

// Roles que pueden acceder al dashboard
const DASHBOARD_ALLOWED_ROLES = ["admin", "gerente", "vendedor"]

// Roles que solo pueden acceder a rutas de cliente
const CLIENT_ONLY_ROLES = ["customer"]

export default clerkMiddleware(async (auth, req) => {
  // Skip middleware for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }
  
  if (isProtectedRoute(req)) {
    try {
      const { userId, sessionClaims } = await auth.protect()
      let role = (sessionClaims?.publicMetadata as any)?.role as string || "customer"
      const url = new URL(req.url)
      
      // Si no hay publicMetadata en sessionClaims, obtener directamente de Clerk
      if (!sessionClaims?.publicMetadata && userId) {
        try {
          const clerk = await clerkClient()
          const user = await clerk.users.getUser(userId)
          role = (user.publicMetadata?.role as string) || "customer"
          console.log("🔄 Rol obtenido directamente de Clerk:", role)
        } catch (error) {
          console.error("❌ Error obteniendo rol de Clerk:", error)
          role = "customer" // fallback
        }
      }
      
      // Logging detallado para debugging
      console.log("🔍 Middleware Debug:", {
        url: req.url,
        pathname: url.pathname,
        userId,
        role,
        sessionClaims: sessionClaims,
        publicMetadata: sessionClaims?.publicMetadata,
        roleSource: sessionClaims?.publicMetadata ? "sessionClaims" : "clerkClient",
        isDashboard: isDashboardRoute(req),
        isReservaciones: isReservacionesRoute(req)
      })
      
      // Verificar acceso al dashboard
      if (isDashboardRoute(req)) {
        console.log("🔍 Dashboard Access Check:", {
          role,
          url: req.url,
          isAllowed: DASHBOARD_ALLOWED_ROLES.includes(role)
        })
        
        // Redireccionar proveedores al portal especializado
        if (role === "proveedor") {
          console.log("🔄 Redirecting proveedor from dashboard to specialized portal")
          return NextResponse.redirect(new URL("/proveedor", req.url))
        }
        
        // Solo roles específicos pueden acceder al dashboard
        if (!DASHBOARD_ALLOWED_ROLES.includes(role)) {
          console.log(`🚫 Redirecting ${role} from dashboard to reservaciones`)
          return NextResponse.redirect(new URL("/reservaciones", req.url))
        }
        
        console.log("✅ Dashboard access granted for role:", role)
      }
      
      // Verificar acceso a sección de proveedor
      if (isProveedorRoute(req)) {
        console.log("🔍 Proveedor Route Access Check:", {
          role,
          url: req.url,
          isAllowed: ["admin", "gerente", "proveedor"].includes(role)
        })
        
        // Solo admin, gerente y proveedor pueden acceder
        if (!["admin", "gerente", "proveedor"].includes(role)) {
          console.log(`🚫 Redirecting ${role} from proveedor to reservaciones`)
          return NextResponse.redirect(new URL("/reservaciones", req.url))
        }
        
        console.log("✅ Proveedor access granted for role:", role)
      }
      
      // Verificar acceso al inventario general
      if (isInventarioRoute(req)) {
        console.log("🔍 Inventario Access Check:", {
          role,
          url: req.url,
          isAllowed: ["admin", "gerente", "vendedor"].includes(role)
        })
        
        // Proveedores no pueden acceder al inventario general
        if (role === "proveedor") {
          console.log("🚫 Redirecting proveedor from inventario to specialized portal")
          return NextResponse.redirect(new URL("/proveedor", req.url))
        }
        
        // Solo admin, gerente y vendedor pueden acceder
        if (!["admin", "gerente", "vendedor"].includes(role)) {
          console.log(`🚫 Redirecting ${role} from inventario`)
          return NextResponse.redirect(new URL("/reservaciones", req.url))
        }
        
        console.log("✅ Inventario access granted for role:", role)
      }
      
      // Verificar restricciones para clientes
      if (CLIENT_ONLY_ROLES.includes(role)) {
        // Los clientes solo pueden acceder a rutas específicas
        const allowedClientPaths = ["/reservaciones", "/bienvenida"]
        const isAllowedPath = allowedClientPaths.some(path =>
          url.pathname.startsWith(path)
        )
        
        if (!isAllowedPath && url.pathname !== "/") {
          console.log(`🚫 Redirecting customer from ${url.pathname} to reservaciones`)
          return NextResponse.redirect(new URL("/reservaciones", req.url))
        }
      }
      
    } catch (error) {
      console.error("❌ Middleware error:", error)
      // En caso de error, redirigir a la página principal
      return NextResponse.redirect(new URL("/", req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}