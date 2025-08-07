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
    const transformedOrders = orders.map(order => {
      const orderData = order as any;
      return {
        _id: (order._id as any).toString(),
        purchaseOrderId: orderData.purchaseOrderId,
        status: orderData.status,
        createdAt: orderData.createdAt.toISOString(),
        expectedDeliveryDate: orderData.expectedDeliveryDate?.toISOString(),
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || "Producto",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal: orderData.subtotal,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total,
        notes: orderData.notes,
        buyer: orderData.buyer ? {
          name: orderData.buyer.name || "N/A",
          email: orderData.buyer.email || "N/A",
          phone: orderData.buyer.phone || "N/A",
          department: orderData.buyer.department || "N/A"
        } : undefined,
        deliveryAddress: orderData.deliveryAddress ? {
          street: orderData.deliveryAddress.street || "",
          city: orderData.deliveryAddress.city || "",
          state: orderData.deliveryAddress.state || "",
          zipCode: orderData.deliveryAddress.zipCode || ""
        } : undefined
      };
    });

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}