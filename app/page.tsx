import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { HomePage } from "@/components/home/HomePage"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    // Obtener el rol del usuario para redirigir apropiadamente
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const role = (user.publicMetadata?.role as string) || "customer"
    
    // Redirigir según el rol
    if (role === "proveedor") {
      redirect("/proveedor") 
    } else if (["admin", "gerente", "vendedor"].includes(role)) {
      redirect("/dashboard")
    } else {
      redirect("/reservaciones")
    }

  }

  return <HomePage />
}
