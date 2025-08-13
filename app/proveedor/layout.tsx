import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import SupplierLayoutWrapper from "@/components/supplier/layout/SupplierLayoutWrapper";
import { SupabaseInventoryClientService } from "@/lib/supabase/inventory-client";

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

async function getUserRole(userId: string): Promise<string> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return (user.publicMetadata?.role as string) || "customer";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "customer";
  }
}

async function getSupplierByUserId(userId: string, userRole: string) {
  try {
    console.log("🔍 Getting supplier data from Supabase:", { userId, userRole });
    
    // Si es admin o gerente, intentar encontrar cualquier proveedor activo
    if (userRole === "admin" || userRole === "gerente") {
      // Primero intentar buscar por user_id vinculado
      let supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
      
      // Si no hay coincidencia, buscar cualquier proveedor activo para mostrar vista de ejemplo
      if (!supplier) {
        const suppliers = await SupabaseInventoryClientService.getAllSuppliers(true);
        supplier = suppliers.length > 0 ? suppliers[0] : null;
        console.log("🔍 Admin/Gerente - Using active supplier for demo:", supplier ? supplier.name : "None found");
      }
      
      return supplier;
    }
    
    // Para usuarios con rol proveedor, buscar por user_id vinculado
    const supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
    
    if (supplier) {
      console.log("✅ Supplier found in Supabase:", supplier.name);
    } else {
      console.log("❌ No supplier found for user:", userId);
    }
    
    return supplier;

  } catch (error) {
    console.error("❌ Error getting supplier from Supabase:", error);
    return null;
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

  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const userRole = await getUserRole(userId);
  const supplier = await getSupplierByUserId(userId, userRole);
  
  return (
    <SupplierLayoutWrapper
      userId={userId}
      userRole={userRole}
      initialSupplierData={supplier}
    >
      {children}
    </SupplierLayoutWrapper>
  );
}