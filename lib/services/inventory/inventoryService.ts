import mongoose from 'mongoose';
import Product from '@/lib/models/inventory/Product';
import Inventory from '@/lib/models/inventory/Inventory';
import InventoryMovement from '@/lib/models/inventory/InventoryMovement';
import InventoryAlert from '@/lib/models/inventory/InventoryAlert';
import PurchaseOrder from '@/lib/models/inventory/PurchaseOrder';
import Supplier from '@/lib/models/inventory/Supplier';
import { UnitConverterService } from './unitConverterService';
import { CostCalculatorService } from './costCalculatorService';
import { NotificationService } from './notificationService';
import { 
  MovementType, 
  AlertType, 
  AlertPriority,
  PurchaseOrderStatus
} from '@/types/inventory';
import { generateInventoryId, generateBatchId } from '@/lib/utils/inventory/helpers';

// Interfaces para parámetros de servicio
export interface StockAdjustmentParams {
  productId: string;
  locationId: string;
  quantity: number;
  unit: string;
  reason: string;
  userId: string;
  batchId?: string;
  cost?: number;
  expiryDate?: Date;
  notes?: string;
}

export interface StockTransferParams {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unit: string;
  userId: string;
  batchId?: string;
  notes?: string;
}

export interface StockReservationParams {
  productId: string;
  locationId: string;
  quantity: number;
  unit: string;
  userId: string;
  reservedFor: string;
  expiresAt?: Date;
  notes?: string;
}

export interface StockConsumptionParams {
  productId: string;
  locationId: string;
  quantity: number;
  unit: string;
  userId: string;
  consumedFor: string;
  batchId?: string;
  notes?: string;
}

export interface InventoryQueryParams {
  productId?: string;
  locationId?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
  expiryDays?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MovementQueryParams {
  productId?: string;
  locationId?: string;
  type?: MovementType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface StockValuationResult {
  totalValue: number;
  byLocation: Record<string, number>;
  byProduct: Record<string, number>;
  byCategory: Record<string, number>;
  calculatedAt: Date;
}

export class InventoryService {
  /**
   * Ajusta el stock de un producto (entrada o salida)
   */
  static async adjustStock(params: StockAdjustmentParams): Promise<{
    success: boolean;
    inventory?: any;
    movement?: any;
    error?: string;
  }> {
    const session = await mongoose.startSession();
    
    try {
      let result: any = {};

      await session.withTransaction(async () => {
        // Validar producto existe
        const product = await Product.findById(params.productId).session(session);
        if (!product) {
          throw new Error('Producto no encontrado');
        }

        // Convertir cantidad a unidad base
        const conversionResult = UnitConverterService.convert(
          params.quantity,
          params.unit,
          product.units.base.code,
          product.units
        );

        if (!conversionResult.success) {
          throw new Error(`Error en conversión de unidades: ${conversionResult.error}`);
        }

        const baseQuantity = conversionResult.convertedValue;

        // Buscar o crear registro de inventario
        let inventory = await Inventory.findOne({
          productId: params.productId,
          locationId: params.locationId
        }).session(session);

        if (!inventory) {
          inventory = new Inventory({
            productId: params.productId,
            locationId: params.locationId,
            locationName: params.locationId, // En producción obtener nombre real
            batches: [],
            totals: {
              available: 0,
              reserved: 0,
              quarantine: 0,
              unit: product.units.base.code
            },
            lastUpdatedBy: params.userId
          });
        }

        // Determinar tipo de movimiento
        const movementType = baseQuantity > 0 ? MovementType.ENTRADA : MovementType.SALIDA;
        const absoluteQuantity = Math.abs(baseQuantity);

        // Validar stock suficiente para salidas
        if (movementType === MovementType.SALIDA && inventory.totals.available < absoluteQuantity) {
          throw new Error(`Stock insuficiente. Disponible: ${inventory.totals.available}, Solicitado: ${absoluteQuantity}`);
        }

        // Procesar entrada
        if (movementType === MovementType.ENTRADA) {
          const batchId = params.batchId || generateBatchId();
          const cost = params.cost || 0;

          await inventory.addBatch({
            batchId,
            quantity: absoluteQuantity,
            unit: product.baseUnit,
            costPerUnit: cost,
            expiryDate: params.expiryDate,
            receivedDate: new Date(),
            status: 'available'
          });
        }

        // Procesar salida (FIFO)
        if (movementType === MovementType.SALIDA) {
          await inventory.consumeQuantity(absoluteQuantity, 'FIFO');
        }

        // Actualizar timestamps
        inventory.lastUpdatedBy = params.userId;
        await inventory.save({ session });

        // Crear movimiento
        const movementId = generateInventoryId('MOVEMENT');
        const movement = new InventoryMovement({
          movementId,
          type: movementType,
          productId: params.productId,
          fromLocation: movementType === MovementType.SALIDA ? params.locationId : undefined,
          toLocation: movementType === MovementType.ENTRADA ? params.locationId : undefined,
          quantity: absoluteQuantity,
          unit: product.units.base.code,
          batchId: params.batchId,
          reason: params.reason,
          cost: params.cost ? {
            unitCost: params.cost,
            totalCost: params.cost * absoluteQuantity,
            currency: 'MXN'
          } : undefined,
          performedBy: params.userId,
          performedByName: params.userId, // En producción obtener nombre real
          notes: params.notes
        });

        await movement.save({ session });

        // Verificar alertas
        await this.checkAndCreateAlerts(params.productId, params.locationId, session);

        result = { inventory, movement };
      });

      return { success: true, ...result };

    } catch (error) {
      console.error('Error adjusting stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Transfiere stock entre ubicaciones
   */
  static async transferStock(params: StockTransferParams): Promise<{
    success: boolean;
    movements?: any[];
    error?: string;
  }> {
    const session = await mongoose.startSession();
    
    try {
      const movements: any[] = [];

      await session.withTransaction(async () => {
        // Salida de ubicación origen
        const outResult = await this.adjustStock({
          productId: params.productId,
          locationId: params.fromLocationId,
          quantity: -params.quantity,
          unit: params.unit,
          reason: `Transferencia a ${params.toLocationId}`,
          userId: params.userId,
          batchId: params.batchId,
          notes: params.notes
        });

        if (!outResult.success) {
          throw new Error(outResult.error || 'Error en transferencia de salida');
        }

        // Entrada a ubicación destino
        const inResult = await this.adjustStock({
          productId: params.productId,
          locationId: params.toLocationId,
          quantity: params.quantity,
          unit: params.unit,
          reason: `Transferencia desde ${params.fromLocationId}`,
          userId: params.userId,
          batchId: params.batchId,
          notes: params.notes
        });

        if (!inResult.success) {
          throw new Error(inResult.error || 'Error en transferencia de entrada');
        }

        if (outResult.movement) movements.push(outResult.movement);
        if (inResult.movement) movements.push(inResult.movement);
      });

      return { success: true, movements };

    } catch (error) {
      console.error('Error transferring stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Reserva stock para un evento o propósito específico
   */
  static async reserveStock(params: StockReservationParams): Promise<{
    success: boolean;
    inventory?: any;
    error?: string;
  }> {
    const session = await mongoose.startSession();
    
    try {
      let inventory: any = null;

      await session.withTransaction(async () => {
        // Buscar inventario
        inventory = await Inventory.findOne({
          productId: params.productId,
          locationId: params.locationId
        }).session(session);

        if (!inventory) {
          throw new Error('Inventario no encontrado');
        }

        // Convertir cantidad a unidad base
        const product = await Product.findById(params.productId).session(session);
        if (!product) {
          throw new Error('Producto no encontrado');
        }

        const conversionResult = UnitConverterService.convert(
          params.quantity,
          params.unit,
          product.units.base.code,
          product.units
        );

        if (!conversionResult.success) {
          throw new Error(`Error en conversión de unidades: ${conversionResult.error}`);
        }

        const baseQuantity = conversionResult.convertedValue;

        // Validar stock disponible
        if (inventory.totals.available < baseQuantity) {
          throw new Error(`Stock insuficiente para reservar. Disponible: ${inventory.totals.available}, Solicitado: ${baseQuantity}`);
        }

        // Reservar cantidad
        await inventory.reserveQuantity(baseQuantity);

        // Crear movimiento de reserva
        const movementId = generateInventoryId('MOVEMENT');
        const movement = new InventoryMovement({
          movementId,
          type: MovementType.AJUSTE, // Usamos AJUSTE para reservas
          productId: params.productId,
          toLocation: params.locationId,
          quantity: baseQuantity,
          unit: product.units.base.code,
          reason: `Reserva para ${params.reservedFor}`,
          performedBy: params.userId,
          performedByName: params.userId,
          notes: params.notes,
          metadata: {
            reservedFor: params.reservedFor,
            expiresAt: params.expiresAt,
            isReservation: true
          }
        });

        await movement.save({ session });
      });

      return { success: true, inventory };

    } catch (error) {
      console.error('Error reserving stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Consume stock reservado o disponible
   */
  static async consumeStock(params: StockConsumptionParams): Promise<{
    success: boolean;
    inventory?: any;
    movement?: any;
    error?: string;
  }> {
    return await this.adjustStock({
      ...params,
      quantity: -params.quantity,
      reason: `Consumo para ${params.consumedFor}`
    });
  }

  /**
   * Libera una reserva de stock
   */
  static async releaseReservation(
    productId: string,
    locationId: string,
    quantity: number,
    userId: string
  ): Promise<{
    success: boolean;
    inventory?: any;
    error?: string;
  }> {
    const session = await mongoose.startSession();
    
    try {
      let inventory: any = null;

      await session.withTransaction(async () => {
        inventory = await Inventory.findOne({
          productId,
          locationId
        }).session(session);

        if (!inventory) {
          throw new Error('Inventario no encontrado');
        }

        // Liberar reserva
        await inventory.releaseReservation(quantity);

        // Crear movimiento de liberación
        const movementId = generateInventoryId('MOVEMENT');
        const movement = new InventoryMovement({
          movementId,
          type: MovementType.AJUSTE,
          productId,
          toLocation: locationId,
          quantity,
          unit: inventory.totals.unit,
          reason: 'Liberación de reserva',
          performedBy: userId,
          performedByName: userId,
          metadata: {
            isReservationRelease: true
          }
        });

        await movement.save({ session });
      });

      return { success: true, inventory };

    } catch (error) {
      console.error('Error releasing reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Obtiene el inventario con filtros
   */
  static async getInventory(params: InventoryQueryParams = {}): Promise<{
    inventories: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        productId,
        locationId,
        lowStock,
        expiringSoon,
        expiryDays = 7,
        page = 1,
        limit = 50,
        sortBy = 'lastUpdated',
        sortOrder = 'desc'
      } = params;

      // Construir filtros
      const filters: any = {};
      
      if (productId) filters.productId = productId;
      if (locationId) filters.locationId = locationId;

      // Filtro de productos próximos a caducar
      if (expiringSoon) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        
        filters['batches.expiryDate'] = {
          $lte: expiryDate,
          $gte: new Date()
        };
      }

      // Ejecutar consulta
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [inventories, total] = await Promise.all([
        Inventory.find(filters)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('productId', 'name category stockLevels')
          .lean(),
        Inventory.countDocuments(filters)
      ]);

      // Filtrar stock bajo después del populate si es necesario
      let filteredInventories = inventories;
      if (lowStock) {
        filteredInventories = inventories.filter((inv: any) => {
          const product = inv.productId;
          return product && inv.totals.available <= (product.stockLevels?.minimum || 0);
        });
      }

      return {
        inventories: filteredInventories,
        total: lowStock ? filteredInventories.length : total,
        page,
        totalPages: Math.ceil((lowStock ? filteredInventories.length : total) / limit)
      };

    } catch (error) {
      console.error('Error getting inventory:', error);
      return {
        inventories: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Obtiene movimientos de inventario
   */
  static async getMovements(params: MovementQueryParams = {}): Promise<{
    movements: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        productId,
        locationId,
        type,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = params;

      // Construir filtros
      const filters: any = {};
      
      if (productId) filters.productId = productId;
      if (type) filters.type = type;
      if (userId) filters.performedBy = userId;

      if (locationId) {
        filters.$or = [
          { fromLocation: locationId },
          { toLocation: locationId }
        ];
      }

      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = startDate;
        if (endDate) filters.createdAt.$lte = endDate;
      }

      // Ejecutar consulta
      const skip = (page - 1) * limit;

      const [movements, total] = await Promise.all([
        InventoryMovement.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('productId', 'name category')
          .lean(),
        InventoryMovement.countDocuments(filters)
      ]);

      return {
        movements,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('Error getting movements:', error);
      return {
        movements: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Calcula la valoración del inventario
   */
  static async calculateStockValuation(locationId?: string): Promise<StockValuationResult> {
    try {
      const filters: any = {};
      if (locationId) filters.locationId = locationId;

      const inventories = await Inventory.find(filters)
        .populate('productId', 'name category')
        .lean();

      let totalValue = 0;
      const byLocation: Record<string, number> = {};
      const byProduct: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      for (const inventory of inventories) {
        const productValue = await CostCalculatorService.calculateInventoryValue(inventory.batches);

        totalValue += productValue.totalValue;

        // Por ubicación
        if (!byLocation[inventory.locationId]) {
          byLocation[inventory.locationId] = 0;
        }
        byLocation[inventory.locationId] += productValue.totalValue;

        // Por producto
        const productId = inventory.productId.toString();
        if (!byProduct[productId]) {
          byProduct[productId] = 0;
        }
        byProduct[productId] += productValue.totalValue;

        // Por categoría
        const product = inventory.productId as any;
        if (product && product.category) {
          if (!byCategory[product.category]) {
            byCategory[product.category] = 0;
          }
          byCategory[product.category] += productValue.totalValue;
        }
      }

      return {
        totalValue,
        byLocation,
        byProduct,
        byCategory,
        calculatedAt: new Date()
      };

    } catch (error) {
      console.error('Error calculating stock valuation:', error);
      return {
        totalValue: 0,
        byLocation: {},
        byProduct: {},
        byCategory: {},
        calculatedAt: new Date()
      };
    }
  }

  /**
   * Verifica y crea alertas automáticas
   */
  private static async checkAndCreateAlerts(
    productId: string,
    locationId: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    try {
      const [product, inventory] = await Promise.all([
        Product.findById(productId).session(session || null),
        Inventory.findOne({ productId, locationId }).session(session || null)
      ]);

      if (!product || !inventory) return;

      const alerts: any[] = [];

      // Alerta de stock bajo
      if (product.stockLevels?.minimum && inventory.totals.available <= product.stockLevels.minimum) {
        const alertId = generateInventoryId('ALERT');
        alerts.push({
          alertId,
          type: AlertType.LOW_STOCK,
          priority: inventory.totals.available === 0 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
          productId,
          locationId,
          title: `Stock bajo: ${product.name}`,
          message: `El stock actual (${inventory.totals.available}) está por debajo del mínimo (${product.stockLevels.minimum})`,
          threshold: product.stockLevels.minimum,
          currentValue: inventory.totals.available,
          unit: inventory.totals.unit,
          isActive: true,
          createdBy: 'system'
        });
      }

      // Alerta de punto de reorden
      if (product.stockLevels?.reorderPoint && inventory.totals.available <= product.stockLevels.reorderPoint) {
        const alertId = generateInventoryId('ALERT');
        alerts.push({
          alertId,
          type: AlertType.REORDER_POINT,
          priority: AlertPriority.MEDIUM,
          productId,
          locationId,
          title: `Punto de reorden alcanzado: ${product.name}`,
          message: `Es momento de realizar un pedido. Stock actual: ${inventory.totals.available}`,
          threshold: product.stockLevels.reorderPoint,
          currentValue: inventory.totals.available,
          unit: inventory.totals.unit,
          isActive: true,
          createdBy: 'system'
        });
      }

      // Alertas de productos próximos a caducar
      const now = new Date();
      const warningDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 días

      for (const batch of inventory.batches) {
        if (batch.expiryDate && batch.quantity > 0) {
          if (batch.expiryDate <= now) {
            // Producto caducado
            const alertId = generateInventoryId('ALERT');
            alerts.push({
              alertId,
              type: AlertType.EXPIRED_PRODUCT,
              priority: AlertPriority.CRITICAL,
              productId,
              locationId,
              batchId: batch.batchId,
              title: `Producto caducado: ${product.name}`,
              message: `El lote ${batch.batchId} caducó el ${batch.expiryDate.toLocaleDateString()}`,
              expiryDate: batch.expiryDate,
              isActive: true,
              createdBy: 'system'
            });
          } else if (batch.expiryDate <= warningDate) {
            // Producto próximo a caducar
            const daysUntilExpiry = Math.ceil((batch.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            const alertId = generateInventoryId('ALERT');
            alerts.push({
              alertId,
              type: AlertType.EXPIRY_WARNING,
              priority: daysUntilExpiry <= 3 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
              productId,
              locationId,
              batchId: batch.batchId,
              title: `Producto próximo a caducar: ${product.name}`,
              message: `El lote ${batch.batchId} caduca en ${daysUntilExpiry} días`,
              expiryDate: batch.expiryDate,
              isActive: true,
              createdBy: 'system',
              metadata: { daysUntilExpiry }
            });
          }
        }
      }

      // Guardar alertas
      if (alerts.length > 0) {
        await InventoryAlert.insertMany(alerts, { session });

        // Enviar notificaciones (sin await para no bloquear)
        for (const alert of alerts) {
          this.sendAlertNotification(alert, product.name).catch(console.error);
        }
      }

    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Envía notificación de alerta
   */
  private static async sendAlertNotification(alert: any, productName: string): Promise<void> {
    try {
      // Aquí determinaríamos a quién enviar la notificación basado en roles y permisos
      // Por ahora usamos un userId genérico
      const userId = 'admin'; // En producción, esto vendría de la configuración de alertas

      const notificationData = {
        userId,
        type: alert.type,
        priority: alert.priority,
        productName,
        productId: alert.productId,
        locationName: alert.locationId, // En producción, obtendríamos el nombre real
        currentStock: alert.currentValue,
        threshold: alert.threshold,
        unit: alert.unit || 'unidad',
        expiryDate: alert.expiryDate,
        batchId: alert.batchId,
        daysUntilExpiry: alert.metadata?.daysUntilExpiry
      };

      switch (alert.type) {
        case AlertType.LOW_STOCK:
          await NotificationService.sendLowStockAlert(notificationData);
          break;
        case AlertType.EXPIRY_WARNING:
          await NotificationService.sendExpiryWarning(notificationData);
          break;
        case AlertType.REORDER_POINT:
          await NotificationService.sendReorderPointAlert(notificationData);
          break;
        case AlertType.EXPIRED_PRODUCT:
          await NotificationService.sendExpiredProductAlert(notificationData);
          break;
      }

    } catch (error) {
      console.error('Error sending alert notification:', error);
    }
  }

  /**
   * Obtiene alertas activas
   */
  static async getActiveAlerts(
    productId?: string,
    locationId?: string,
    type?: AlertType
  ): Promise<any[]> {
    try {
      const filters: any = { isActive: true };
      
      if (productId) filters.productId = productId;
      if (locationId) filters.locationId = locationId;
      if (type) filters.type = type;

      return await InventoryAlert.find(filters)
        .populate('productId', 'name category')
        .sort({ priority: -1, createdAt: -1 })
        .lean();

    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Marca una alerta como resuelta
   */
  static async resolveAlert(
    alertId: string,
    userId: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const result = await InventoryAlert.findOneAndUpdate(
        { alertId },
        {
          isActive: false,
          isAcknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
          acknowledgedNotes: resolution
        },
        { new: true }
      );

      return !!result;

    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Obtiene resumen del inventario
   */
  static async getInventorySummary(locationId?: string): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    expiredItems: number;
    expiringSoonItems: number;
    activeAlerts: number;
    lastUpdated: Date;
  }> {
    try {
      const filters: any = {};
      if (locationId) filters.locationId = locationId;

      const [
        inventories,
        activeAlerts,
        valuation
      ] = await Promise.all([
        Inventory.find(filters).populate('productId', 'name stockLevels').lean(),
        InventoryAlert.countDocuments({ ...filters, isActive: true }),
        this.calculateStockValuation(locationId)
      ]);

      let lowStockItems = 0;
      let expiredItems = 0;
      let expiringSoonItems = 0;
      const now = new Date();
      const warningDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      for (const inventory of inventories) {
        const product = inventory.productId as any;
        
        // Stock bajo
        if (product && product.stockLevels?.minimum && inventory.totals.available <= product.stockLevels.minimum) {
          lowStockItems++;
        }

        // Productos caducados y próximos a caducar
        for (const batch of inventory.batches) {
          if (batch.expiryDate && batch.quantity > 0) {
            if (batch.expiryDate <= now) {
              expiredItems++;
            } else if (batch.expiryDate <= warningDate) {
              expiringSoonItems++;
            }
          }
        }
      }

      return {
        totalProducts: inventories.length,
        totalValue: valuation.totalValue,
        lowStockItems,
        expiredItems,
        expiringSoonItems,
        activeAlerts,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        expiredItems: 0,
        expiringSoonItems: 0,
        activeAlerts: 0,
        lastUpdated: new Date()
      };
    }
  }
}

export default InventoryService;