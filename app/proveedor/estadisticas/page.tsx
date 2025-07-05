import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Supplier from "@/lib/models/inventory/Supplier";
import SupplierStatsDashboard from "@/components/supplier/SupplierStatsDashboard";

export const metadata: Metadata = {
  title: "Estadísticas | Portal de Proveedores",
  description: "Visualiza tu rendimiento, ventas y métricas clave como proveedor",
};

async function getSupplierByUserId(userId: string, userRole: string) {
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

export default async function SupplierStatsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const userRole = await getUserRole(userId);
  const supplier = await getSupplierByUserId(userId, userRole);
  
  // Si es admin o gerente, permitir acceso incluso sin proveedor
  if (userRole === "admin" || userRole === "gerente") {
    const supplierId = supplier?.supplierId || "default-admin-supplier";
    return <SupplierStatsDashboard supplierId={supplierId} />;
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

  return <SupplierStatsDashboard supplierId={supplier.supplierId} />;
}