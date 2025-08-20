import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { InventoryService } from '@/lib/services/inventory.service';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Función para obtener productos más activos
async function getTopProducts(locationId?: string, limit: number = 5) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // Obtener productos con movimientos de inventario
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select(`
        product_id,
        quantity,
        products (
          name,
          sku
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000); // Obtener suficientes movimientos para análisis

    if (!movements || movements.length === 0) {
      return [];
    }

    // Agrupar movimientos por producto y calcular estadísticas
    const productStats = new Map();
    
    for (const movement of movements) {
      const productId = movement.product_id;
      const product = (movement as any).products;
      
      if (!product) continue;
      
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          productName: product.name,
          sku: product.sku,
          totalMovements: 0,
          currentStock: 0,
          value: 0
        });
      }
      
      const stats = productStats.get(productId);
      stats.totalMovements += 1;
    }

    // Obtener información de inventario actual para estos productos
    const productIds = Array.from(productStats.keys());
    const { data: inventory } = await supabase
      .from('inventory')
      .select('product_id, total_available')
      .in('product_id', productIds);

    // Combinar datos de movimientos con inventario actual
    if (inventory) {
      for (const inv of inventory) {
        const stats = productStats.get(inv.product_id);
        if (stats) {
          stats.currentStock = inv.total_available || 0;
          stats.value = stats.currentStock * 10; // Estimación de valor
        }
      }
    }

    // Convertir a array y ordenar por número de movimientos
    return Array.from(productStats.values())
      .sort((a, b) => b.totalMovements - a.totalMovements)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

// Función para obtener breakdown por categorías
async function getCategoryBreakdown(locationId?: string) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // Obtener productos aprobados con inventario
    const { data: inventory } = await supabase
      .from('inventory')
      .select(`
        total_available,
        products!inner (
          category
        )
      `)
      .gt('total_available', 0);

    if (!inventory || inventory.length === 0) {
      return [];
    }

    // Agrupar por categoría
    const categoryStats = new Map();
    let totalValue = 0;
    
    for (const item of inventory) {
      const product = (item as any).products;
      const category = product?.category || 'Sin Categoría';
      const stock = item.total_available || 0;
      const estimatedValue = stock * 10; // Estimación de valor por unidad
      
      totalValue += estimatedValue;
      
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          category,
          productCount: 0,
          totalValue: 0,
          percentage: 0
        });
      }
      
      const stats = categoryStats.get(category);
      stats.productCount += 1;
      stats.totalValue += estimatedValue;
    }

    // Calcular porcentajes y convertir a array
    const result = Array.from(categoryStats.values()).map(stat => ({
      ...stat,
      percentage: totalValue > 0 ? Math.round((stat.totalValue / totalValue) * 100) : 0
    }));

    return result.sort((a, b) => b.totalValue - a.totalValue);
      
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    return [];
  }
}

// Función para obtener movimientos recientes
async function getRecentMovements(locationId?: string, limit: number = 10) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // Obtener movimientos recientes con información del producto
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select(`
        created_at,
        movement_type,
        quantity,
        unit,
        products (
          name,
          sku,
          base_unit
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!movements || movements.length === 0) {
      return [];
    }

    return movements.map((movement: any) => ({
      date: movement.created_at,
      type: movement.movement_type,
      productName: movement.products?.name || 'Producto desconocido',
      quantity: movement.quantity || 0,
      unit: movement.products?.base_unit || movement.unit || 'unidades',
      value: (movement.quantity || 0) * 10 // Estimación de valor
    }));
      
  } catch (error) {
    console.error('Error getting recent movements:', error);
    return [];
  }
}

// GET /api/inventory/reports - Obtener reportes de inventario
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer reportes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const locationId = searchParams.get('locationId') || undefined;

    switch (reportType) {
      case 'summary': {
        const [statsResult, topProducts, categoryBreakdown, movements] = await Promise.all([
          InventoryService.getInventoryStats(),
          getTopProducts(locationId),
          getCategoryBreakdown(locationId),
          getRecentMovements(locationId)
        ]);

        const stats = statsResult.data || { totalProducts: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 };

        // Ajustar el summary para que coincida con la interfaz esperada
        const reportData = {
          summary: {
            totalProducts: stats.totalProducts,
            totalValue: stats.totalValue,
            lowStockItems: stats.lowStockProducts,
            expiringSoon: 0 // TODO: Implement expiring items count
          },
          topProducts,
          categoryBreakdown,
          movements
        };

        return NextResponse.json(reportData);
      }

      case 'movements': {
        const movements = await getRecentMovements(locationId, 50);
        const statsResult = await InventoryService.getInventoryStats();
        const stats = statsResult.data || { totalProducts: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 };
        
        const reportData = {
          summary: {
            totalProducts: stats.totalProducts,
            totalValue: stats.totalValue,
            lowStockItems: stats.lowStockProducts,
            expiringSoon: 0 // TODO: Implement expiring items count
          },
          topProducts: [],
          categoryBreakdown: [],
          movements
        };

        return NextResponse.json(reportData);
      }

      case 'valuation': {
        // TODO: Implement proper valuation calculation
        const statsResult = await InventoryService.getInventoryStats();
        const stats = statsResult.data || { totalProducts: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 };

        const reportData = {
          summary: {
            totalProducts: stats.totalProducts,
            totalValue: stats.totalValue,
            lowStockItems: stats.lowStockProducts,
            expiringSoon: 0
          },
          topProducts: [],
          categoryBreakdown: [],
          movements: [],
          valuation: { totalValue: stats.totalValue }
        };

        return NextResponse.json(reportData);
      }

      case 'alerts': {
        const [alerts, statsResult] = await Promise.all([
          SupabaseInventoryService.getActiveAlerts(),
          InventoryService.getInventoryStats()
        ]);

        const stats = statsResult.data || { totalProducts: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 };

        const reportData = {
          summary: {
            totalProducts: stats.totalProducts,
            totalValue: stats.totalValue,
            lowStockItems: stats.lowStockProducts,
            expiringSoon: 0
          },
          topProducts: [],
          categoryBreakdown: [],
          movements: [],
          alerts
        };

        return NextResponse.json(reportData);
      }

      case 'categories': {
        const [categoryBreakdown, statsResult] = await Promise.all([
          getCategoryBreakdown(locationId),
          InventoryService.getInventoryStats()
        ]);

        const stats = statsResult.data || { totalProducts: 0, totalValue: 0, lowStockProducts: 0, outOfStockProducts: 0 };

        const reportData = {
          summary: {
            totalProducts: stats.totalProducts,
            totalValue: stats.totalValue,
            lowStockItems: stats.lowStockProducts,
            expiringSoon: 0
          },
          topProducts: [],
          categoryBreakdown,
          movements: []
        };

        return NextResponse.json(reportData);
      }

      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido. Use: summary, movements, valuation, alerts, o categories' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}