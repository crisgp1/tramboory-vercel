import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Dashboard from "@/components/dashboard/Dashboard"
import { UserRole, DEFAULT_ROLE } from "@/lib/roles"

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  console.log("🔍 Dashboard Page Debug:", {
    userId,
    userRole: user?.publicMetadata?.role,
    publicMetadata: user?.publicMetadata,
    fullUser: user
  })

  if (!userId) {
    console.log("🚫 No userId, redirecting to home")
    redirect("/")
  }

  // Verificar el rol del usuario - usar clerkClient para obtener datos frescos
  let userRole = (user?.publicMetadata?.role as UserRole) || DEFAULT_ROLE
  
  // Si el rol es customer pero sabemos que debería ser admin, obtener datos frescos
  if (userRole === "customer") {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server")
      const clerk = await clerkClient()
      const freshUser = await clerk.users.getUser(userId)
      const freshRole = (freshUser.publicMetadata?.role as UserRole) || DEFAULT_ROLE
      
      console.log("🔄 Fresh role check:", {
        originalRole: userRole,
        freshRole,
        freshMetadata: freshUser.publicMetadata
      })
      
      userRole = freshRole
    } catch (error) {
      console.error("❌ Error getting fresh user data:", error)
    }
  }

  console.log("🔍 Dashboard Role Check:", {
    userRole,
    isCustomer: userRole === "customer",
    shouldRedirect: userRole === "customer"
  })

  // Solo admin, gerente, proveedor y vendedor pueden acceder al dashboard
  if (userRole === "customer") {
    console.log("🚫 Customer trying to access dashboard, redirecting to reservaciones")
    redirect("/reservaciones")
  }

  console.log("✅ Dashboard access granted for role:", userRole)
  return <Dashboard />
}