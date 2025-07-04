import { NextRequest, NextResponse } from "next/server";
import { validateSupplierAccess } from "@/lib/supplier-auth";
import dbConnect from "@/lib/mongodb";

/**
 * PUT /api/supplier/notifications/mark-all-read
 * 
 * Marks all notifications for the supplier as read
 */
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    
    // Validate supplier access
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para acceder a esta información" }, { status: 403 });
    }

    // Mark all notifications as read for this supplier
    const result = await db.collection("supplierNotifications").updateMany(
      { 
        supplierId: supplier._id.toString(),
        isRead: false
      },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ 
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Error al marcar las notificaciones como leídas" }, { status: 500 });
  }
}