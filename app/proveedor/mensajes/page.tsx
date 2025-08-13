import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Supplier from "@/lib/models/inventory/Supplier";
import { SupabaseInventoryClientService } from "@/lib/supabase/inventory-client";
import SupplierMessaging from "@/components/supplier/SupplierMessaging";

export const metadata: Metadata = {
  title: "Mensajes | Portal de Proveedores",
  description: "Comunícate directamente con compradores y gestiona conversaciones",
};

// Supabase version
async function getSupplierByUserIdSupabase(userId: string, userRole: string) {
  try {
    // Si es admin o gerente, intentar encontrar cualquier proveedor activo
    if (userRole === "admin" || userRole === "gerente") {
      // Primero intentar buscar por user_id vinculado
      let supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
      
      // Si no hay coincidencia, buscar cualquier proveedor activo para mostrar vista de ejemplo
      if (!supplier) {
        const suppliers = await SupabaseInventoryClientService.getAllSuppliers(true);
        supplier = suppliers.length > 0 ? suppliers[0] : null;
      }
      
      return supplier;
    }
    
    // Para usuarios con rol proveedor, buscar por user_id vinculado
    const supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
    return supplier;

  } catch (error) {
    console.error("Error getting supplier from Supabase:", error);
    return null;
  }
}

// MongoDB fallback version
async function getSupplierByUserIdMongoDB(userId: string, userRole: string) {
  await dbConnect();
  
  // Si es admin o gerente, intentar encontrar cualquier proveedor activo
  if (userRole === "admin" || userRole === "gerente") {
    // Primero intentar buscar por userId vinculado
    let supplier = await Supplier.findOne({
      userId: userId
    });
    
    // Si no hay coincidencia, buscar cualquier proveedor activo para mostrar vista de ejemplo
    if (!supplier) {
      supplier = await Supplier.findOne({ isActive: true });
    }
    
    return supplier;
  }
  
  // Para usuarios con rol proveedor, buscar por userId vinculado
  const supplier = await Supplier.findOne({
    userId: userId
  });
  
  return supplier;
}

async function getUserRole(userId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/users/${userId}/role`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return "customer";
  const { role } = await response.json();
  return role;
}

export default async function SupplierMessagesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const userRole = await getUserRole(userId);
  
  // Try Supabase first, fallback to MongoDB if needed
  let supplier = await getSupplierByUserIdSupabase(userId, userRole);
  
  // If no supplier found in Supabase, try MongoDB as fallback
  if (!supplier) {
    console.log("🔄 Fallback to MongoDB for supplier lookup");
    supplier = await getSupplierByUserIdMongoDB(userId, userRole);
  }
  
  // Si es admin o gerente, permitir acceso incluso sin proveedor
  if (userRole === "admin" || userRole === "gerente") {
    const supplierId = supplier?.supplier_id || supplier?.supplierId || "default-admin-supplier";
    return <SupplierMessaging supplierId={supplierId} />;
  }
  
  // Para otros roles, requerir proveedor asociado
  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No se encontró proveedor</h1>
          <p className="text-gray-600">No hay un proveedor asociado a tu cuenta.</p>
        </div>
      </div>
    );
  }

  return <SupplierMessaging supplierId={supplier.supplier_id || supplier.supplierId} />;
}