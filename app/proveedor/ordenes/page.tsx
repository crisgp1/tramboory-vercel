import { Metadata } from "next";
import SupplierOrdersPanel from "@/components/supplier/SupplierOrdersPanel";

export const metadata: Metadata = {
  title: "Órdenes de Compra | Portal de Proveedores",
  description: "Gestiona tus órdenes de compra, entregas y pagos",
};

export default function SupplierOrdersPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Órdenes de Compra</h1>
      <SupplierOrdersPanel />
    </>
  );
}