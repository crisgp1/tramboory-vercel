import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos de admin/gerente
    // TODO: Implementar verificación de roles adecuada
    
    const { id } = await params;
    const body = await request.json();
    const { action, rejection_reason } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
    }

    // Obtener el producto actual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verificar que el producto esté pendiente
    if (product.approval_status !== 'pending') {
      return NextResponse.json({ 
        error: `Product is already ${product.approval_status}` 
      }, { status: 400 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      updated_by: userId
    };

    if (action === 'approve') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_by = userId;
      updateData.rejected_at = new Date().toISOString();
      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }
    }

    // Actualizar producto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product approval:', updateError);
      return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
    }

    // TODO: Enviar notificación al proveedor del producto
    
    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: action === 'approve' ? 
        'Producto aprobado exitosamente' : 
        'Producto rechazado exitosamente'
    });

  } catch (error) {
    console.error('Error in product approval API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}