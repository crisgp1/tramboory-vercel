import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const category = searchParams.get('category');

    // Build query to get only products created by this supplier
    let query = supabase
      .from('products')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        query = query.eq('approval_status', 'pending');
      } else if (statusFilter === 'approved') {
        query = query.eq('approval_status', 'approved');
      } else if (statusFilter === 'rejected') {
        query = query.eq('approval_status', 'rejected');
      }
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching supplier products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      total: products?.length || 0,
      supplier: supplierData
    });

  } catch (error) {
    console.error('Error in supplier products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Generate product ID
    const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create product with supplier as creator
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        product_id: productId,
        name: body.name,
        description: body.description,
        category: body.category,
        sku: body.sku,
        barcode: body.barcode && body.barcode.trim() !== '' ? body.barcode.trim() : null,
        base_unit: body.base_unit,
        stock_minimum: body.stock_minimum || 0,
        stock_reorder_point: body.stock_reorder_point || 0,
        stock_unit: body.stock_unit || body.base_unit,
        last_cost: body.last_cost,
        average_cost: body.average_cost || body.last_cost,
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_perishable: body.is_perishable || false,
        requires_batch: body.requires_batch !== undefined ? body.requires_batch : true,
        expiry_has_expiry: body.expiry_has_expiry || body.is_perishable || false,
        expiry_shelf_life_days: body.expiry_shelf_life_days,
        expiry_warning_days: body.expiry_warning_days || 7,
        images: body.images || [],
        tags: body.tags || [],
        approval_status: 'pending', // New products need approval
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un producto con este SKU' },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Producto creado exitosamente. Está pendiente de aprobación.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating supplier product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}