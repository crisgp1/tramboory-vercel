import { NextRequest, NextResponse } from "next/server";
import { validateSupplierAccess } from "@/lib/supplier-auth";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * PUT /api/supplier/notifications/[id]/read
 * 
 * Marks a specific notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    const { id } = params;
    
    // Validate supplier access
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para acceder a esta información" }, { status: 403 });
    }

    // Verify the notification exists and belongs to this supplier
    const notification = await db.collection("supplierNotifications").findOne({
      _id: new ObjectId(id),
      supplierId: supplier._id.toString()
    });

    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Mark notification as read
    const result = await db.collection("supplierNotifications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No se pudo marcar la notificación como leída" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Error al marcar la notificación como leída" }, { status: 500 });
  }
}