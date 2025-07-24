import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { InventoryService } from '@/lib/services/inventory.service';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Función para obtener productos más activos (placeholder implementation)
async function getTopProducts(locationId?: string, limit: number = 5) {
  try {
    // TODO: Implement with proper Supabase query for product movement analysis
    // This is a placeholder that returns sample data structure
    return [
      {
        productName: "Producto Ejemplo 1",
        sku: "SKU001",
        totalMovements: 50,
        currentStock: 100,
        value: 500
      }
    ];
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

// Función para obtener breakdown por categorías (placeholder implementation)
async function getCategoryBreakdown(locationId?: string) {
  try {
    // TODO: Implement with proper Supabase query for category analysis
    // This is a placeholder that returns sample data structure
    return [
      {
        category: "Bebidas",
        productCount: 25,
        totalValue: 5000,
        percentage: 40
      },
      {
        category: "Alimentos",
        productCount: 30,
        totalValue: 3750,
        percentage: 30
      }
    ];
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    return [];
  }
}

// Función para obtener movimientos recientes (placeholder implementation)
async function getRecentMovements(locationId?: string, limit: number = 10) {
  try {
    // TODO: Implement with proper Supabase query for recent movements
    // This is a placeholder that returns sample data structure
    return [
      {
        date: new Date().toISOString(),
        type: "IN",
        productName: "Producto Ejemplo",
        quantity: 10,
        unit: "unidades",
        value: 100
      }
    ];
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