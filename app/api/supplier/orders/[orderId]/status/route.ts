import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import PurchaseOrder from "@/lib/models/inventory/PurchaseOrder";
import { PurchaseOrderStatus } from "@/types/inventory";

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { orderId } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = Object.values(PurchaseOrderStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Find and update the order
    const order = await PurchaseOrder.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update the status
    order.status = status;
    order.updatedAt = new Date();

    // Add status change history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      userId,
      note: `Status changed to ${status} by supplier`
    });

    await order.save();

    return NextResponse.json({ 
      success: true, 
      message: "Order status updated successfully" 
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}