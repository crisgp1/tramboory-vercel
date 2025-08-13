import { Metadata } from "next";
import SupplierProductManager from "@/components/supplier/SupplierProductManager";

export const metadata: Metadata = {
  title: "Gestión de Productos | Portal de Proveedores",
  description: "Administra tus productos, precios e inventario",
};

export default function SupplierProductsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Productos</h1>
      <SupplierProductManager />
    </>
  );
}