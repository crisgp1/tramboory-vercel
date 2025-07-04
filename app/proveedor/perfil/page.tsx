import { Metadata } from "next";
import SupplierProfile from "@/components/supplier/SupplierProfile";

export const metadata: Metadata = {
  title: "Perfil de Proveedor | Portal de Proveedores",
  description: "Gestiona tu información, términos comerciales y datos de contacto",
};

export default function SupplierProfilePage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <SupplierProfile />
    </main>
  );
}