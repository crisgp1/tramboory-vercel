import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { InventoryService } from '@/lib/services/inventory.service';

// GET /api/inventory - Obtener resumen del inventario
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get inventory summary from services
    const summaryResult = await InventoryService.getInventorySummary();
    const statsResult = await InventoryService.getInventoryStats();
    const lowStockResult = await InventoryService.getLowStockProducts();
    const expiringResult = await InventoryService.getExpiringBatches(7);

    // Check if any service failed
    if (!summaryResult.success || !statsResult.success || !lowStockResult.success || !expiringResult.success) {
      const errors = [
        !summaryResult.success ? summaryResult.error : null,
        !statsResult.success ? statsResult.error : null,
        !lowStockResult.success ? lowStockResult.error : null,
        !expiringResult.success ? expiringResult.error : null
      ].filter(Boolean);

      return NextResponse.json(
        { error: 'Failed to fetch inventory data: ' + errors.join(', ') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult.data,
        stats: statsResult.data,
        lowStockProducts: lowStockResult.data?.slice(0, 10) || [], // Top 10
        expiringBatches: expiringResult.data?.slice(0, 10) || [], // Top 10
      }
    });

  } catch (error) {
    console.error('Error getting inventory data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Documentación de la API de inventario (mantener para compatibilidad)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const apiDocumentation = {
      name: 'Inventory Management API',
      version: '1.0.0',
      description: 'API completa para gestión de inventario con soporte para productos, stock, movimientos, alertas y proveedores',
      endpoints: {
        products: {
          'GET /api/inventory/products': {
            description: 'Obtener lista de productos con filtros',
            parameters: {
              page: 'Número de página (default: 1)',
              limit: 'Elementos por página (default: 50)',
              search: 'Búsqueda por nombre, SKU, código de barras o descripción',
              category: 'Filtrar por categoría',
              isActive: 'Filtrar por estado activo (true/false)',
              sortBy: 'Campo para ordenar (default: name)',
              sortOrder: 'Orden ascendente o descendente (asc/desc)'
            }
          },
          'POST /api/inventory/products': {
            description: 'Crear nuevo producto',
            requiredFields: ['name', 'category', 'sku', 'units']
          },
          'GET /api/inventory/products/[id]': {
            description: 'Obtener producto específico por ID'
          },
          'PUT /api/inventory/products/[id]': {
            description: 'Actualizar producto existente'
          },
          'DELETE /api/inventory/products/[id]': {
            description: 'Eliminar producto (soft delete)'
          }
        },
        stock: {
          'GET /api/inventory/stock': {
            description: 'Obtener inventario con filtros',
            parameters: {
              productId: 'ID del producto',
              locationId: 'ID de la ubicación',
              lowStock: 'Filtrar productos con stock bajo (true/false)',
              expiringSoon: 'Filtrar productos próximos a caducar (true/false)',
              expiryDays: 'Días para considerar próximo a caducar (default: 7)'
            }
          },
          'POST /api/inventory/stock': {
            description: 'Realizar operaciones de stock',
            operations: {
              adjust: 'Ajustar stock (entrada/salida)',
              transfer: 'Transferir stock entre ubicaciones',
              reserve: 'Reservar stock',
              consume: 'Consumir stock',
              release_reservation: 'Liberar reserva'
            }
          }
        },
        movements: {
          'GET /api/inventory/movements': {
            description: 'Obtener historial de movimientos',
            parameters: {
              productId: 'ID del producto',
              locationId: 'ID de la ubicación',
              type: 'Tipo de movimiento (ENTRADA/SALIDA/TRANSFERENCIA/AJUSTE)',
              userId: 'ID del usuario que realizó el movimiento',
              startDate: 'Fecha de inicio (ISO string)',
              endDate: 'Fecha de fin (ISO string)'
            }
          }
        },
        alerts: {
          'GET /api/inventory/alerts': {
            description: 'Obtener alertas activas',
            parameters: {
              productId: 'ID del producto',
              locationId: 'ID de la ubicación',
              type: 'Tipo de alerta (LOW_STOCK/EXPIRY_WARNING/etc.)'
            }
          },
          'PUT /api/inventory/alerts': {
            description: 'Resolver alerta',
            requiredFields: ['alertId']
          }
        },
        reports: {
          'GET /api/inventory/reports': {
            description: 'Generar reportes de inventario',
            parameters: {
              type: 'Tipo de reporte (summary/valuation/combined)',
              locationId: 'ID de la ubicación (opcional)'
            }
          }
        },
        suppliers: {
          'GET /api/inventory/suppliers': {
            description: 'Obtener lista de proveedores',
            parameters: {
              page: 'Número de página',
              limit: 'Elementos por página',
              search: 'Búsqueda por nombre, código o email',
              category: 'Filtrar por categoría',
              isActive: 'Filtrar por estado activo'
            }
          },
          'POST /api/inventory/suppliers': {
            description: 'Crear nuevo proveedor',
            requiredFields: ['name', 'code']
          },
          'GET /api/inventory/suppliers/[id]': {
            description: 'Obtener proveedor específico'
          },
          'PUT /api/inventory/suppliers/[id]': {
            description: 'Actualizar proveedor'
          },
          'DELETE /api/inventory/suppliers/[id]': {
            description: 'Eliminar proveedor (soft delete)'
          }
        }
      },
      features: {
        authentication: 'Autenticación requerida con Clerk',
        permissions: 'Control de permisos por operación',
        validation: 'Validación de datos con Zod',
        pagination: 'Paginación en endpoints de listado',
        filtering: 'Filtros avanzados y búsqueda',
        sorting: 'Ordenamiento configurable',
        transactions: 'Operaciones transaccionales con MongoDB',
        eventSourcing: 'Registro completo de movimientos',
        notifications: 'Sistema de alertas automáticas',
        unitConversion: 'Conversión automática entre unidades',
        batchTracking: 'Seguimiento de lotes con FIFO/LIFO',
        costCalculation: 'Cálculo de costos y valoración'
      },
      status: 'Active',
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(apiDocumentation);

  } catch (error) {
    console.error('Error getting API documentation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}