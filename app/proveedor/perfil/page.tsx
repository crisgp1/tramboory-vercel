import { Metadata } from "next";
import SupplierProfile from "@/components/supplier/SupplierProfile";

export const metadata: Metadata = {
  title: "Perfil de Proveedor | Portal de Proveedores",
  description: "Gestiona tu información, términos comerciales y datos de contacto",
};

export default function SupplierProfilePage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil de Proveedor</h1>
      <SupplierProfile />
    </>
  );
}