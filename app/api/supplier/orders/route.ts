import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current supplier info to verify user is a supplier
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (supplierError || !supplierData) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Build query to get purchase orders for this supplier
    let query = supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierData.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toUpperCase());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching supplier orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform the orders to match the expected format
    const transformedOrders = (orders || []).map(order => ({
      id: order.id,
      purchase_order_id: order.purchase_order_id,
      supplier_name: order.supplier_name,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      expected_delivery_date: order.expected_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      delivery_location: order.delivery_location,
      payment_method: order.payment_method,
      payment_credit_days: order.payment_credit_days,
      payment_due_date: order.payment_due_date,
      notes: order.notes,
      internal_notes: order.internal_notes,
      attachments: order.attachments || [],
      // Note: Items will need to be implemented when purchase_order_items table is created
      items: [],
      created_at: order.created_at,
      updated_at: order.updated_at,
      // Status timestamps
      approved_by: order.approved_by,
      approved_at: order.approved_at,
      ordered_by: order.ordered_by,
      ordered_at: order.ordered_at,
      received_by: order.received_by,
      received_at: order.received_at,
      cancelled_by: order.cancelled_by,
      cancelled_at: order.cancelled_at,
      cancellation_reason: order.cancellation_reason
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length,
      supplier: supplierData
    });

  } catch (error) {
    console.error("Error in supplier orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a supplier
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (supplierError || !supplierData) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const body = await request.json();
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    // Verify the order belongs to this supplier
    const { data: existingOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', orderId)
      .eq('supplier_id', supplierData.id)
      .single();

    if (orderError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order status
    const updateData: any = {
      status: status.toUpperCase(),
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    // Add appropriate timestamp based on status
    const now = new Date().toISOString();
    switch (status.toUpperCase()) {
      case 'APPROVED':
        updateData.approved_by = userId;
        updateData.approved_at = now;
        break;
      case 'ORDERED':
        updateData.ordered_by = userId;
        updateData.ordered_at = now;
        break;
      case 'RECEIVED':
        updateData.received_by = userId;
        updateData.received_at = now;
        break;
      case 'CANCELLED':
        updateData.cancelled_by = userId;
        updateData.cancelled_at = now;
        if (notes) updateData.cancellation_reason = notes;
        break;
    }

    if (notes && status.toUpperCase() !== 'CANCELLED') {
      updateData.notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('supplier_id', supplierData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Orden ${status.toLowerCase()} exitosamente`
    });

  } catch (error) {
    console.error("Error updating supplier order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}