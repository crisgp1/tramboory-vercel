import { BaseRepository } from './base.repository';
import { InventoryMovementRow, InventoryMovementInsert, ServiceResponse } from '@/lib/types/inventory.types';

/**
 * Movement repository for database operations
 */
export class MovementRepository extends BaseRepository {

  /**
   * Create new inventory movement
   */
  static async create(movementData: InventoryMovementInsert): Promise<ServiceResponse<InventoryMovementRow>> {
    try {
      // Generate movement_id if not provided
      const movementWithId = {
        ...movementData,
        movement_id: movementData.movement_id || this.generateId('MOV')
      };

      const { data, error } = await this.supabaseAdmin
        .from('inventory_movements')
        .insert(movementWithId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Create inventory movement');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Create inventory movement');
    }
  }

  /**
   * Get movements by product
   */
  static async findByProduct(productId: string, limit: number = 50): Promise<ServiceResponse<InventoryMovementRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_movements')
        .select(`
          *,
          products(name, sku)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return this.handleError(error, 'Get movements by product');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get movements by product');
    }
  }

  /**
   * Get movements by location
   */
  static async findByLocation(location: string, limit: number = 50): Promise<ServiceResponse<InventoryMovementRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_movements')
        .select(`
          *,
          products(name, sku)
        `)
        .or(`from_location.eq.${location},to_location.eq.${location}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return this.handleError(error, 'Get movements by location');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get movements by location');
    }
  }

  /**
   * Get movements with filters
   */
  static async findWithFilters(filters: {
    productId?: string;
    locationId?: string;
    movementType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse<InventoryMovementRow[]>> {
    try {
      let query = this.supabase
        .from('inventory_movements')
        .select(`
          *,
          products(name, sku)
        `);

      // Apply filters
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters.locationId) {
        query = query.or(`from_location.eq.${filters.locationId},to_location.eq.${filters.locationId}`);
      }

      if (filters.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }

      if (filters.userId) {
        query = query.eq('performed_by', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply pagination
      query = this.applyPagination(query, filters.page, filters.limit);

      // Order by date
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'Get movements with filters');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get movements with filters');
    }
  }

  /**
   * Get movement by ID
   */
  static async findById(id: string): Promise<ServiceResponse<InventoryMovementRow>> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_movements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return this.handleError(error, 'Get movement by ID');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Get movement by ID');
    }
  }

  /**
   * Update movement (for reversals)
   */
  static async update(id: string, updates: Partial<InventoryMovementRow>): Promise<ServiceResponse<InventoryMovementRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('inventory_movements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Update movement');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Update movement');
    }
  }

  /**
   * Mark movement as reversed
   */
  static async reverse(
    originalMovementId: string, 
    reversalMovementId: string
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabaseAdmin
        .from('inventory_movements')
        .update({
          is_reversed: true,
          reversal_movement_id: reversalMovementId,
          updated_at: new Date().toISOString()
        })
        .eq('id', originalMovementId);

      if (error) {
        return this.handleError(error, 'Reverse movement');
      }

      return {
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'Reverse movement');
    }
  }
}