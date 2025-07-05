import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata = {
  title: "Portal de Proveedores | Tramboory",
  description: "Gestión de órdenes, productos y perfil para proveedores",
};

async function validateSupplierRole() {
  const { userId } = await auth();
  
  if (!userId) {
    return false;
  }
  
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const role = (user.publicMetadata?.role as string) || "customer";
    
    return role === "proveedor" || role === "admin" || role === "gerente";
  } catch (error) {
    console.error("Error validating supplier role:", error);
    return false;
  }
}

export default async function SupplierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const hasAccess = await validateSupplierRole();
  
  if (!hasAccess) {
    redirect("/");
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}