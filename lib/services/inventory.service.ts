import { InventoryRepository } from '@/lib/repositories/inventory.repository';
import { MovementRepository } from '@/lib/repositories/movement.repository';
import { ProductRepository } from '@/lib/repositories/product.repository';
import { 
  StockAdjustmentParams, 
  StockTransferParams, 
  StockReservationParams, 
  StockConsumptionParams,
  ServiceResponse,
  StockItem,
  InventoryStatsResponse
} from '@/lib/types/inventory.types';
import { getLocationName } from '@/lib/utils/location.utils';

/**
 * Inventory service - Business logic layer
 */
export class InventoryService {

  /**
   * Get all inventory records
   */
  static async getAllInventory(): Promise<ServiceResponse<StockItem[]>> {
    return await InventoryRepository.findAllWithProducts();
  }

  /**
   * Get inventory by product
   */
  static async getInventoryByProduct(productId: string) {
    return await InventoryRepository.findByProduct(productId);
  }

  /**
   * Get inventory by location
   */
  static async getInventoryByLocation(locationId: string) {
    return await InventoryRepository.findByLocation(locationId);
  }

  /**
   * Get inventory summary
   */
  static async getInventorySummary() {
    return await InventoryRepository.getSummary();
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(): Promise<ServiceResponse<InventoryStatsResponse>> {
    return await InventoryRepository.getStats();
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts() {
    return await InventoryRepository.getLowStockProducts();
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts() {
    return await InventoryRepository.getOutOfStockProducts();
  }

  /**
   * Get expiring batches
   */
  static async getExpiringBatches(days: number = 30) {
    return await InventoryRepository.getExpiringBatches(days);
  }

  /**
   * Adjust stock (increase or decrease)
   */
  static async adjustStock(params: StockAdjustmentParams): Promise<ServiceResponse<any>> {
    try {
      // Get existing inventory
      const inventoryResult = await InventoryRepository.findByProductAndLocation(
        params.productId, 
        params.locationId
      );

      if (!inventoryResult.success) {
        return inventoryResult;
      }

      let updatedInventory;
      
      if (!inventoryResult.data) {
        // Create new inventory record
        const createResult = await InventoryRepository.create({
          product_id: params.productId,
          location_id: params.locationId,
          location_name: getLocationName(params.locationId),
          total_available: Math.max(0, params.quantity),
          total_reserved: 0,
          total_quarantine: 0,
          total_unit: params.unit,
          last_updated_by: params.userId
        });

        if (!createResult.success) {
          return createResult;
        }

        updatedInventory = createResult.data;
      } else {
        // Update existing inventory
        const newTotal = Math.max(0, inventoryResult.data.total_available + params.quantity);
        const updateResult = await InventoryRepository.update(inventoryResult.data.id, {
          total_available: newTotal,
          last_updated_by: params.userId
        });

        if (!updateResult.success) {
          return updateResult;
        }

        updatedInventory = updateResult.data;
      }

      // Create movement record
      const movementResult = await MovementRepository.create({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: params.productId,
        movement_type: params.quantity > 0 ? 'IN' : 'OUT',
        from_location: params.quantity < 0 ? params.locationId : undefined,
        to_location: params.quantity > 0 ? params.locationId : undefined,
        quantity: Math.abs(params.quantity),
        unit: params.unit,
        reason: params.reason,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId,
        batch_id: params.batchId
      });

      if (!movementResult.success) {
        return movementResult;
      }

      return {
        success: true,
        data: {
          inventory: updatedInventory,
          movement: movementResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Transfer stock between locations
   */
  static async transferStock(params: StockTransferParams): Promise<ServiceResponse<any>> {
    try {
      // Check source inventory
      const sourceResult = await InventoryRepository.findByProductAndLocation(
        params.productId, 
        params.fromLocationId
      );

      if (!sourceResult.success || !sourceResult.data) {
        return {
          success: false,
          error: 'Source inventory not found'
        };
      }

      if (sourceResult.data.total_available < params.quantity) {
        return {
          success: false,
          error: 'Insufficient stock for transfer'
        };
      }

      // Update source inventory
      const sourceUpdateResult = await InventoryRepository.update(sourceResult.data.id, {
        total_available: sourceResult.data.total_available - params.quantity,
        last_updated_by: params.userId
      });

      if (!sourceUpdateResult.success) {
        return sourceUpdateResult;
      }

      // Get or create destination inventory
      const destResult = await InventoryRepository.findByProductAndLocation(
        params.productId, 
        params.toLocationId
      );

      let updatedDestInventory;
      
      if (!destResult.success || !destResult.data) {
        // Create new destination inventory
        const createResult = await InventoryRepository.create({
          product_id: params.productId,
          location_id: params.toLocationId,
          location_name: getLocationName(params.toLocationId),
          total_available: params.quantity,
          total_reserved: 0,
          total_quarantine: 0,
          total_unit: params.unit,
          last_updated_by: params.userId
        });

        if (!createResult.success) {
          return createResult;
        }

        updatedDestInventory = createResult.data;
      } else {
        // Update existing destination inventory
        const updateResult = await InventoryRepository.update(destResult.data.id, {
          total_available: destResult.data.total_available + params.quantity,
          last_updated_by: params.userId
        });

        if (!updateResult.success) {
          return updateResult;
        }

        updatedDestInventory = updateResult.data;
      }

      // Create movement records
      const outMovementResult = await MovementRepository.create({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-OUT`,
        product_id: params.productId,
        movement_type: 'TRANSFER_OUT',
        from_location: params.fromLocationId,
        to_location: params.toLocationId,
        quantity: params.quantity,
        unit: params.unit,
        reason: 'Transfer to ' + params.toLocationId,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId,
        batch_id: params.batchId
      });

      const inMovementResult = await MovementRepository.create({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-IN`,
        product_id: params.productId,
        movement_type: 'TRANSFER_IN',
        from_location: params.fromLocationId,
        to_location: params.toLocationId,
        quantity: params.quantity,
        unit: params.unit,
        reason: 'Transfer from ' + params.fromLocationId,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId,
        batch_id: params.batchId
      });

      return {
        success: true,
        data: {
          movements: [outMovementResult.data, inMovementResult.data]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Reserve stock
   */
  static async reserveStock(params: StockReservationParams): Promise<ServiceResponse<any>> {
    try {
      const inventoryResult = await InventoryRepository.findByProductAndLocation(
        params.productId, 
        params.locationId
      );

      if (!inventoryResult.success || !inventoryResult.data) {
        return {
          success: false,
          error: 'Inventory not found'
        };
      }

      if (inventoryResult.data.total_available < params.quantity) {
        return {
          success: false,
          error: 'Insufficient available stock for reservation'
        };
      }

      // Update inventory
      const updateResult = await InventoryRepository.update(inventoryResult.data.id, {
        total_available: inventoryResult.data.total_available - params.quantity,
        total_reserved: inventoryResult.data.total_reserved + params.quantity,
        last_updated_by: params.userId
      });

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          inventory: updateResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Consume stock
   */
  static async consumeStock(params: StockConsumptionParams): Promise<ServiceResponse<any>> {
    try {
      const inventoryResult = await InventoryRepository.findByProductAndLocation(
        params.productId, 
        params.locationId
      );

      if (!inventoryResult.success || !inventoryResult.data) {
        return {
          success: false,
          error: 'Inventory not found'
        };
      }

      if (inventoryResult.data.total_available < params.quantity) {
        return {
          success: false,
          error: 'Insufficient available stock for consumption'
        };
      }

      // Update inventory
      const updateResult = await InventoryRepository.update(inventoryResult.data.id, {
        total_available: inventoryResult.data.total_available - params.quantity,
        last_updated_by: params.userId
      });

      if (!updateResult.success) {
        return updateResult;
      }

      // Create movement record
      const movementResult = await MovementRepository.create({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: params.productId,
        movement_type: 'OUT',
        from_location: params.locationId,
        quantity: params.quantity,
        unit: params.unit,
        reason: params.consumedFor,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId,
        batch_id: params.batchId
      });

      if (!movementResult.success) {
        return movementResult;
      }

      return {
        success: true,
        data: {
          inventory: updateResult.data,
          movement: movementResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Release reservation
   */
  static async releaseReservation(
    productId: string,
    locationId: string,
    quantity: number,
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      const inventoryResult = await InventoryRepository.findByProductAndLocation(
        productId, 
        locationId
      );

      if (!inventoryResult.success || !inventoryResult.data) {
        return {
          success: false,
          error: 'Inventory not found'
        };
      }

      if (inventoryResult.data.total_reserved < quantity) {
        return {
          success: false,
          error: 'Cannot release more than reserved quantity'
        };
      }

      // Update inventory
      const updateResult = await InventoryRepository.update(inventoryResult.data.id, {
        total_available: inventoryResult.data.total_available + quantity,
        total_reserved: inventoryResult.data.total_reserved - quantity,
        last_updated_by: userId
      });

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          inventory: updateResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}