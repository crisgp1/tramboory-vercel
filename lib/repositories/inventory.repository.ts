import { BaseRepository } from './base.repository';
import { InventoryRow, InventoryInsert, InventoryUpdate, InventoryBatchRow, ServiceResponse, StockItem } from '@/lib/types/inventory.types';

/**
 * Inventory repository for database operations
 */
export class InventoryRepository extends BaseRepository {

  /**
   * Get all inventory records with product information
   */
  static async findAllWithProducts(): Promise<ServiceResponse<StockItem[]>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          location_id,
          total_available,
          total_reserved,
          total_quarantine,
          total_unit,
          last_movement_id,
          last_updated,
          products!inner(
            id,
            name,
            sku,
            category
          ),
          inventory_batches(
            id,
            batch_id,
            quantity,
            unit,
            cost_per_unit,
            expiry_date,
            received_date,
            status
          )
        `)
        .order('total_available', { ascending: false });

      if (error) {
        return this.handleError(error, 'Get inventory records');
      }

      // Transform the data to match frontend interface
      const transformedData: StockItem[] = data?.map(item => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          sku: item.products.sku,
          category: item.products.category
        },
        location_id: item.location_id,
        available_quantity: item.total_available,
        reserved_quantity: item.total_reserved,
        quarantine_quantity: item.total_quarantine,
        unit: item.total_unit,
        batches: item.inventory_batches?.map(batch => ({
          batch_id: batch.batch_id,
          quantity: batch.quantity,
          unit: batch.unit,
          cost_per_unit: batch.cost_per_unit,
          expiry_date: batch.expiry_date,
          received_date: batch.received_date,
          status: batch.status
        })),
        last_movement: item.last_movement_id ? {
          movement_type: 'STOCK_ADJUSTMENT',
          created_at: item.last_updated,
          quantity: 0
        } : undefined
      })) || [];

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      return this.handleError(error, 'Get inventory records');
    }
  }

  /**
   * Get inventory by product ID
   */
  static async findByProduct(productId: string): Promise<ServiceResponse<InventoryRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .select(`
          *,
          inventory_batches(*),
          products(name, category, sku, is_perishable)
        `)
        .eq('product_id', productId);

      if (error) {
        return this.handleError(error, 'Get inventory by product');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get inventory by product');
    }
  }

  /**
   * Get inventory by location
   */
  static async findByLocation(locationId: string): Promise<ServiceResponse<InventoryRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .select(`
          *,
          inventory_batches(*),
          products(name, category, sku)
        `)
        .eq('location_id', locationId);

      if (error) {
        return this.handleError(error, 'Get inventory by location');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get inventory by location');
    }
  }

  /**
   * Find inventory record for specific product and location
   */
  static async findByProductAndLocation(
    productId: string, 
    locationId: string
  ): Promise<ServiceResponse<InventoryRow | null>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return this.handleError(error, 'Find inventory by product and location');
      }

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      return this.handleError(error, 'Find inventory by product and location');
    }
  }

  /**
   * Create new inventory record
   */
  static async create(inventoryData: InventoryInsert): Promise<ServiceResponse<InventoryRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('inventory')
        .insert(inventoryData)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Create inventory record');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Create inventory record');
    }
  }

  /**
   * Update inventory record
   */
  static async update(id: string, updates: InventoryUpdate): Promise<ServiceResponse<InventoryRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Update inventory record');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Update inventory record');
    }
  }

  /**
   * Get inventory summary from view
   */
  static async getSummary(): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('v_product_inventory_summary')
        .select('*')
        .order('product_name');

      if (error) {
        return this.handleError(error, 'Get inventory summary');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get inventory summary');
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('v_product_inventory_summary')
        .select('*')
        .eq('is_low_stock', true)
        .order('total_available');

      if (error) {
        return this.handleError(error, 'Get low stock products');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get low stock products');
    }
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('v_product_inventory_summary')
        .select('*')
        .eq('is_out_of_stock', true)
        .order('product_name');

      if (error) {
        return this.handleError(error, 'Get out of stock products');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get out of stock products');
    }
  }

  /**
   * Get expiring batches
   */
  static async getExpiringBatches(days: number = 30): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('v_expiring_batches')
        .select('*')
        .lte('days_until_expiry', days)
        .order('expiry_date');

      if (error) {
        return this.handleError(error, 'Get expiring batches');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get expiring batches');
    }
  }

  /**
   * Get inventory statistics
   */
  static async getStats(): Promise<ServiceResponse<any>> {
    try {
      // Get total products
      const { count: totalProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get low stock products
      const { count: lowStockProducts } = await this.supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_low_stock', true);

      // Get out of stock products
      const { count: outOfStockProducts } = await this.supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_out_of_stock', true);

      // Get total inventory value
      const { data: inventoryValue } = await this.supabase
        .from('inventory_batches')
        .select('quantity, cost_per_unit')
        .eq('status', 'available');

      const totalValue = inventoryValue?.reduce((sum, batch) => 
        sum + (batch.quantity * batch.cost_per_unit), 0) || 0;

      const stats = {
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        outOfStockProducts: outOfStockProducts || 0,
        totalValue: Math.round(totalValue * 100) / 100
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return this.handleError(error, 'Get inventory stats');
    }
  }
}