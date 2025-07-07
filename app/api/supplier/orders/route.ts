import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/inventory/PurchaseOrder";
import { PurchaseOrderStatus } from "@/types/inventory";

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

    // Fetch orders for the specific supplier
    const orders = await PurchaseOrder.find({ supplierId })
      .sort({ createdAt: -1 })
      .lean();

    // Transform the orders to match the expected format
    const transformedOrders = orders.map(order => ({
      _id: (order._id as any).toString(),
      purchaseOrderId: order.purchaseOrderId,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      expectedDeliveryDate: order.expectedDeliveryDate?.toISOString(),
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName || "Producto",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: order.subtotal,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      total: order.total,
      notes: order.notes,
      buyer: order.buyer ? {
        name: order.buyer.name || "N/A",
        email: order.buyer.email || "N/A",
        phone: order.buyer.phone || "N/A",
        department: order.buyer.department || "N/A"
      } : undefined,
      deliveryAddress: order.deliveryAddress ? {
        street: order.deliveryAddress.street || "",
        city: order.deliveryAddress.city || "",
        state: order.deliveryAddress.state || "",
        zipCode: order.deliveryAddress.zipCode || ""
      } : undefined
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}