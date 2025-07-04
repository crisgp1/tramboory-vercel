import { Metadata } from "next";
import SupplierNotifications from "@/components/supplier/SupplierNotifications";

export const metadata: Metadata = {
  title: "Notificaciones | Portal de Proveedores",
  description: "Recibe alertas sobre órdenes, productos y eventos importantes",
};

export default function SupplierNotificationsPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <SupplierNotifications />
    </main>
  );
}