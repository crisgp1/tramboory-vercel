import { NextRequest, NextResponse } from "next/server";
import { validateSupplierAccess } from "@/lib/supplier-auth";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/supplier/notifications
 * 
 * Fetches notifications for the authenticated supplier
 * Supports filtering by type, pagination, and more
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    
    // Build query based on parameters
    const query: any = {
      supplierId: supplier._id.toString()
    };
    
    // Add type filter if provided
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await db.collection("supplierNotifications").countDocuments(query);
    
    // Get notifications with pagination
    const notifications = await db.collection("supplierNotifications")
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching supplier notifications:", error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

/**
 * POST /api/supplier/notifications
 * 
 * Creates a test notification (for development purposes)
 * In production, this would be called by internal systems
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    
    // Validate supplier access (only for development)
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para esta operación" }, { status: 403 });
    }

    // Get notification data from request
    const data = await request.json();
    
    // Create a test notification
    const notification = {
      userId: supplier.userId,
      supplierId: supplier._id.toString(),
      type: data.type || "INFORMATION_REQUEST",
      title: data.title || "Notificación de Prueba",
      message: data.message || "Esta es una notificación de prueba creada para desarrollo.",
      metadata: data.metadata || {
        requiredAction: data.requiredAction || false
      },
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    // Insert the notification
    const result = await db.collection("supplierNotifications").insertOne(notification);
    
    if (!result.insertedId) {
      return NextResponse.json({ error: "Error al crear la notificación" }, { status: 500 });
    }
    
    // Return the created notification
    return NextResponse.json({
      ...notification,
      _id: result.insertedId
    });
  } catch (error) {
    console.error("Error creating supplier notification:", error);
    return NextResponse.json({ error: "Error al crear la notificación" }, { status: 500 });
  }
}