import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SupabaseInventoryClientService } from "@/lib/supabase/inventory-client";

/**
 * GET /api/supplier/profile
 *
 * Fetches the profile data for the authenticated supplier using unified system
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get user role first
    const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/users/${userId}/role`, {
      cache: "no-store"
    });
    
    if (!roleResponse.ok) {
      return NextResponse.json({ error: "Error al obtener rol del usuario" }, { status: 500 });
    }
    
    const { role } = await roleResponse.json();
    
    // Check if user has supplier, admin, or manager role
    if (role !== "proveedor" && role !== "admin" && role !== "gerente") {
      return NextResponse.json({ error: "No tiene permisos de proveedor" }, { status: 403 });
    }

    // Get supplier by user ID from unified system
    let supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
    
    // If admin or manager and no supplier found, get any active supplier for demo
    if (!supplier && (role === "admin" || role === "gerente")) {
      const suppliers = await SupabaseInventoryClientService.getAllSuppliers(true);
      supplier = suppliers.length > 0 ? suppliers[0] : null;
      console.log("🔍 Admin/Manager - Using active supplier for demo:", supplier ? supplier.name : "None found");
    }
    
    if (!supplier) {
      return NextResponse.json({ error: "No se encontró proveedor asociado" }, { status: 404 });
    }

    // Return the unified supplier data
    return NextResponse.json(supplier);
    
  } catch (error) {
    console.error("Error fetching supplier profile:", error);
    return NextResponse.json({ error: "Error al obtener el perfil del proveedor" }, { status: 500 });
  }
}

/**
 * PUT /api/supplier/profile
 *
 * Updates the profile data for the authenticated supplier
 * TODO: Implement profile updates using the unified Supabase system
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get user role
    const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/users/${userId}/role`, {
      cache: "no-store"
    });
    
    if (!roleResponse.ok) {
      return NextResponse.json({ error: "Error al obtener rol del usuario" }, { status: 500 });
    }
    
    const { role } = await roleResponse.json();
    
    if (role !== "proveedor" && role !== "admin" && role !== "gerente") {
      return NextResponse.json({ error: "No tiene permisos de proveedor" }, { status: 403 });
    }

    // Get current supplier
    let supplier = await SupabaseInventoryClientService.getSupplierByUserId(userId);
    
    // If admin or manager and no supplier found, get any active supplier for demo
    if (!supplier && (role === "admin" || role === "gerente")) {
      const suppliers = await SupabaseInventoryClientService.getAllSuppliers(true);
      supplier = suppliers.length > 0 ? suppliers[0] : null;
    }
    
    if (!supplier) {
      return NextResponse.json({ error: "No se encontró proveedor asociado" }, { status: 404 });
    }

    // Get the update data from the request
    const updateData = await request.json();

    // TODO: Implement supplier profile update in Supabase
    // For now, return the current supplier data
    console.warn("Supplier profile update not yet implemented for unified system");
    
    return NextResponse.json(supplier);
    
  } catch (error) {
    console.error("Error updating supplier profile:", error);
    return NextResponse.json({ error: "Error al actualizar el perfil del proveedor" }, { status: 500 });
  }
}