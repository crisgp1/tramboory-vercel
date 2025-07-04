import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/inventory/Product';
import Inventory from '@/lib/models/inventory/Inventory';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Obtener productos que NO tienen registros de inventario
    const productsWithInventory = await Inventory.distinct('productId');
    
    const productsWithoutInventory = await Product.find({
      _id: { $nin: productsWithInventory },
      isActive: true
    }).select('name sku category units').lean();

    return NextResponse.json({
      products: productsWithoutInventory
    });

  } catch (error) {
    console.error('Error getting products without inventory:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}