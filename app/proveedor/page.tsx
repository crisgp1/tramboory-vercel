"use client";

import { useUser } from "@clerk/nextjs";
import { useRole } from "@/hooks/useRole";
import SupplierDashboardClient from "../../components/supplier/SupplierDashboardClient";

export default function ProveedorDashboard() {
  const { user } = useUser();
  const { role } = useRole();
  
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard de Proveedor</h1>
      <SupplierDashboardClient
        userId={user?.id}
        userRole={role}
        initialSupplierData={null}
      />
    </>
  );
}