import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import path from "path";

export const metadata = {
  title: "Portal de Proveedores | Tramboory",
  description: "Gestión de órdenes, productos y perfil para proveedores",
};

async function validateSupplierRole() {
  const { userId } = await auth();
  
  if (!userId) {
    return false;
  }
  
  // Construir la URL absoluta usando path y la variable de entorno
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const apiPath = path.join("/api/users", userId, "role");
  const url = baseUrl + apiPath;
  const response = await fetch(url, {
    cache: "no-store",
  });
  
  if (!response.ok) {
    return false;
  }
  
  const { role } = await response.json();
  return role === "proveedor" || role === "admin" || role === "gerente";
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