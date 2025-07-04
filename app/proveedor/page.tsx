import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Supplier from "@/lib/models/inventory/Supplier";
import PurchaseOrder from "@/lib/models/inventory/PurchaseOrder";
import Product from "@/lib/models/inventory/Product";
import { PurchaseOrderStatus } from "@/types/inventory";
import SupplierDashboardClient from "../../components/supplier/SupplierDashboardClient";

// Función para obtener el ID del proveedor basado en el usuario autenticado
async function getSupplierByUserId(userId: string) {
  await dbConnect();
  
  // Nota: Esta es una simplificación. En un sistema real,
  // tendría que haber una relación entre usuarios de Clerk y proveedores
  // Aquí asumimos que el código del proveedor es el mismo que el userId
  // Para un sistema en producción, se necesitaría una tabla de mapeo
  
  const supplier = await Supplier.findOne({
    // En producción: reemplazar esta lógica con la correcta para mapear usuarios a proveedores
    code: userId.substring(0, 10) // Usando primeros 10 caracteres del userId como ejemplo
  });
  
  return supplier;
}

async function getSupplierDashboardData(supplierId: string) {
  await dbConnect();
  
  // Obtener datos del proveedor
  const supplier = await Supplier.findOne({ supplierId });
  
  if (!supplier) {
    return null;
  }
  
  // Obtener estadísticas de órdenes
  const orderStats = await PurchaseOrder.aggregate([
    { $match: { supplierId } },
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Formatear estadísticas de órdenes
  const orders = {
    pending: 0,
    approved: 0,
    ordered: 0,
    received: 0,
    total: 0
  };
  
  orderStats.forEach((stat) => {
    if (stat._id === PurchaseOrderStatus.PENDING) orders.pending = stat.count;
    if (stat._id === PurchaseOrderStatus.APPROVED) orders.approved = stat.count;
    if (stat._id === PurchaseOrderStatus.ORDERED) orders.ordered = stat.count;
    if (stat._id === PurchaseOrderStatus.RECEIVED) orders.received = stat.count;
    orders.total += stat.count;
  });
  
  // Obtener estadísticas de productos
  const products = await Product.aggregate([
    { $match: { 'suppliers.supplierId': supplierId } },
    { $group: {
        _id: "$isActive",
        count: { $sum: 1 }
      }
    }
  ]);
  
  const productStats = {
    active: 0,
    inactive: 0,
    total: 0
  };
  
  products.forEach((stat) => {
    if (stat._id === true) productStats.active = stat.count;
    if (stat._id === false) productStats.inactive = stat.count;
    productStats.total += stat.count;
  });
  
  // Obtener órdenes recientes
  const recentOrders = await PurchaseOrder.find({ supplierId })
    .sort({ updatedAt: -1 })
    .limit(5);
  
  // Formatear actividad reciente basada en órdenes
  const recentActivity = recentOrders.map(order => {
    let type = "", title = "", status = "info";
    
    switch(order.status) {
      case PurchaseOrderStatus.PENDING:
        type = "order_created";
        title = "Nueva Orden Recibida";
        status = "info";
        break;
      case PurchaseOrderStatus.APPROVED:
        type = "order_approved";
        title = "Orden Aprobada";
        status = "success";
        break;
      case PurchaseOrderStatus.ORDERED:
        type = "order_in_process";
        title = "Orden En Proceso";
        status = "warning";
        break;
      case PurchaseOrderStatus.RECEIVED:
        type = "order_completed";
        title = "Orden Completada";
        status = "primary";
        break;
      default:
        break;
    }
    
    return {
      id: order._id.toString(),
      type,
      title,
      description: `Orden ${order.purchaseOrderId} - ${order.items.length} productos - Total: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(order.total)}`,
      timestamp: order.updatedAt.toISOString(),
      status
    };
  });
  
  return {
    supplier: {
      _id: supplier._id.toString(),
      name: supplier.name,
      code: supplier.code,
      rating: supplier.rating.overall,
      isActive: supplier.isActive,
      contactInfo: supplier.contactInfo
    },
    orders,
    products: productStats,
    recentActivity
  };
}

// Nueva función para obtener el rol del usuario
async function getUserRole(userId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/users/${userId}/role`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return "customer";
  const { role } = await response.json();
  return role;
}

export default async function ProveedorDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const userRole = await getUserRole(userId);
  const supplier = await getSupplierByUserId(userId);

  if (!supplier && userRole === "proveedor") {
    // Si es proveedor pero no tiene proveedor asociado
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso No Configurado</h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta no está vinculada a ningún proveedor. Por favor contacta al administrador.
          </p>
          <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg">
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  // Si es admin o gerente y no tiene proveedor, mostrar dashboard vacío o mensaje especial
  if (!supplier && (userRole === "admin" || userRole === "gerente")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vista de Proveedor (Admin/Gerente)</h1>
          <p className="text-gray-600 mb-6">
            No tienes un proveedor asociado, pero puedes ver esta vista como administrador o gerente.
          </p>
          <SupplierDashboardClient dashboardData={null} />
        </div>
      </div>
    );
  }

  const dashboardData = await getSupplierDashboardData(supplier.supplierId);
  
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Error al cargar los datos del dashboard</p>
      </div>
    );
  }
  
  // Serialize and pass the data to the client component
  return <SupplierDashboardClient dashboardData={dashboardData} />;
}