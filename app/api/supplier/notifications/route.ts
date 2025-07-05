import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const generateMockNotifications = (supplierId: string) => {
  const notifications = [
    {
      id: new ObjectId().toString(),
      type: "order",
      title: "Nueva Orden Recibida",
      message: "Se ha recibido una nueva orden de compra #PO-2024-001 por $15,450.00. Requiere tu confirmación.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isRead: false,
      priority: "high",
      data: { orderId: "PO-2024-001", amount: 15450 }
    },
    {
      id: new ObjectId().toString(),
      type: "payment",
      title: "Pago Procesado",
      message: "El pago de la orden #PO-2024-002 ha sido procesado exitosamente. Monto: $8,320.00",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      priority: "medium",
      data: { orderId: "PO-2024-002", amount: 8320 }
    },
    {
      id: new ObjectId().toString(),
      type: "product",
      title: "Producto Aprobado",
      message: "Tu producto 'Laptop HP ProBook 450' ha sido aprobado y ya está disponible en el catálogo.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: "low",
      data: { productId: "PROD-001" }
    }
  ];

  return notifications;
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    const notifications = generateMockNotifications(supplierId);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}