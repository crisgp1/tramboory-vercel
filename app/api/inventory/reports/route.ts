import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import InventoryService from '@/lib/services/inventory/inventoryService';
import Product from '@/lib/models/inventory/Product';
import Inventory from '@/lib/models/inventory/Inventory';
import InventoryMovement from '@/lib/models/inventory/InventoryMovement';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// Función para obtener productos más activos
async function getTopProducts(locationId?: string, limit: number = 5) {
  try {
    const matchStage: any = {};
    if (locationId) {
      matchStage.$or = [
        { fromLocation: locationId },
        { toLocation: locationId }
      ];
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$productId',
          totalMovements: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalMovements: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'inventories',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$productId', '$$productId'] },
                ...(locationId ? { locationId } : {})
              }
            }
          ],
          as: 'inventory'
        }
      }
    ];

    const results = await InventoryMovement.aggregate(pipeline);
    
    return results.map(item => ({
      productName: item.product.name,
      sku: item.product.sku || (item.product._id as any).toString().slice(-8),
      totalMovements: item.totalMovements,
      currentStock: item.inventory[0]?.totals?.available || 0,
      value: (item.inventory[0]?.totals?.available || 0) * (item.product.cost || 0)
    }));
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

// Función para obtener breakdown por categorías
async function getCategoryBreakdown(locationId?: string) {
  try {
    const matchStage: any = {};
    if (locationId) {
      matchStage.locationId = locationId;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          productCount: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: ['$totals.available', { $ifNull: ['$product.cost', 0] }]
            }
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ];

    const results = await Inventory.aggregate(pipeline);
    const totalValue = results.reduce((sum, item) => sum + item.totalValue, 0);
    
    return results.map(item => ({
      category: item._id || 'Sin categoría',
      productCount: item.productCount,
      totalValue: item.totalValue,
      percentage: totalValue > 0 ? Math.round((item.totalValue / totalValue) * 100) : 0
    }));
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    return [];
  }
}

// Función para obtener movimientos recientes
async function getRecentMovements(locationId?: string, limit: number = 10) {
  try {
    const matchStage: any = {};
    if (locationId) {
      matchStage.$or = [
        { fromLocation: locationId },
        { toLocation: locationId }
      ];
    }

    const movements = await InventoryMovement.find(matchStage)
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return movements.map(movement => ({
      date: movement.createdAt.toISOString(),
      type: movement.type,
      productName: (movement.productId as any)?.name || 'Producto desconocido',
      quantity: movement.quantity,
      unit: movement.unit,
      value: movement.cost?.totalCost || 0
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

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const locationId = searchParams.get('locationId') || undefined;

    switch (reportType) {
      case 'summary': {
        const [summary, topProducts, categoryBreakdown, movements] = await Promise.all([
          InventoryService.getInventorySummary(locationId),
          getTopProducts(locationId),
          getCategoryBreakdown(locationId),
          getRecentMovements(locationId)
        ]);

        // Ajustar el summary para que coincida con la interfaz esperada
        const reportData = {
          summary: {
            totalProducts: summary.totalProducts,
            totalValue: summary.totalValue,
            lowStockItems: summary.lowStockItems,
            expiringSoon: summary.expiringSoonItems
          },
          topProducts,
          categoryBreakdown,
          movements
        };

        return NextResponse.json(reportData);
      }

      case 'movements': {
        const movements = await getRecentMovements(locationId, 50);
        const summary = await InventoryService.getInventorySummary(locationId);
        
        const reportData = {
          summary: {
            totalProducts: summary.totalProducts,
            totalValue: summary.totalValue,
            lowStockItems: summary.lowStockItems,
            expiringSoon: summary.expiringSoonItems
          },
          topProducts: [],
          categoryBreakdown: [],
          movements
        };

        return NextResponse.json(reportData);
      }

      case 'valuation': {
        const [valuation, summary] = await Promise.all([
          InventoryService.calculateStockValuation(locationId),
          InventoryService.getInventorySummary(locationId)
        ]);

        const reportData = {
          summary: {
            totalProducts: summary.totalProducts,
            totalValue: summary.totalValue,
            lowStockItems: summary.lowStockItems,
            expiringSoon: summary.expiringSoonItems
          },
          topProducts: [],
          categoryBreakdown: [],
          movements: [],
          valuation
        };

        return NextResponse.json(reportData);
      }

      case 'alerts': {
        const [alerts, summary] = await Promise.all([
          InventoryService.getActiveAlerts(undefined, locationId),
          InventoryService.getInventorySummary(locationId)
        ]);

        const reportData = {
          summary: {
            totalProducts: summary.totalProducts,
            totalValue: summary.totalValue,
            lowStockItems: summary.lowStockItems,
            expiringSoon: summary.expiringSoonItems
          },
          topProducts: [],
          categoryBreakdown: [],
          movements: [],
          alerts
        };

        return NextResponse.json(reportData);
      }

      case 'categories': {
        const [categoryBreakdown, summary] = await Promise.all([
          getCategoryBreakdown(locationId),
          InventoryService.getInventorySummary(locationId)
        ]);

        const reportData = {
          summary: {
            totalProducts: summary.totalProducts,
            totalValue: summary.totalValue,
            lowStockItems: summary.lowStockItems,
            expiringSoon: summary.expiringSoonItems
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