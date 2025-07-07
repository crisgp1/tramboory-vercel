import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { validateSupplierAccess } from "@/lib/supplier-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/supplier/products/[id]/price-history
 * 
 * Returns the price history for a product owned by the current supplier
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    const { id } = params;
    
    // Validate that the current user is a supplier and has access to this product
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para acceder a esta información" }, { status: 403 });
    }

    // Get the product to verify ownership
    const product = await db.collection("products").findOne({ 
      _id: new ObjectId(id),
      "suppliers.supplierId": supplier._id.toString()
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado o no tiene acceso" }, { status: 404 });
    }

    // Get price history from the price_history collection
    const priceHistory = await db.collection("price_history")
      .find({ 
        productId: id,
        supplierId: supplier._id.toString()
      })
      .sort({ date: -1 }) // Most recent first
      .limit(10)
      .toArray();

    // If no history exists yet, return an empty array
    if (!priceHistory || priceHistory.length === 0) {
      // Return current price as single entry
      return NextResponse.json({
        history: [{
          date: product.updatedAt || new Date(),
          costPrice: product.pricing?.lastCost || 0,
          unitPrice: product.pricing?.tieredPricing?.[0]?.pricePerUnit || 0
        }]
      });
    }

    return NextResponse.json({ history: priceHistory });
  } catch (error) {
    console.error("Error fetching product price history:", error);
    return NextResponse.json({ error: "Error al obtener el historial de precios" }, { status: 500 });
  }
}