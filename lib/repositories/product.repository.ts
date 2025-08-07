import { BaseRepository } from './base.repository';
import { ProductRow, ProductInsert, ProductUpdate, ServiceResponse, ProductWithoutInventory } from '@/lib/types/inventory.types';
import { ProductIntegrityService } from '@/lib/services/product-integrity.service';

/**
 * Product repository for database operations
 */
export class ProductRepository extends BaseRepository {
  
  /**
   * Get all products with optional filters
   */
  static async findAll(filters?: {
    activeOnly?: boolean;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ServiceResponse<ProductRow[]>> {
    try {
      let query = this.supabase
        .from('products')
        .select('*');

      // Apply filters
      if (filters?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = this.applySearch(query, filters.search, ['name', 'description', 'sku']);
      }

      // Apply pagination
      query = this.applyPagination(query, filters?.page, filters?.limit);

      // Order by name
      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'Get products');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get products');
    }
  }

  /**
   * Get product by ID
   */
  static async findById(id: string): Promise<ServiceResponse<ProductRow>> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          product_units(*),
          product_pricing_tiers(*),
          product_suppliers(
            suppliers(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return this.handleError(error, 'Get product by ID');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Get product by ID');
    }
  }

  /**
   * Create new product
   */
  static async create(productData: ProductInsert): Promise<ServiceResponse<ProductRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Create product');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Create product');
    }
  }

  /**
   * Update product
   */
  static async update(id: string, updates: ProductUpdate): Promise<ServiceResponse<ProductRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Update product');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Update product');
    }
  }

  /**
   * Search products by text
   */
  static async search(searchTerm: string): Promise<ServiceResponse<ProductRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return this.handleError(error, 'Search products');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Search products');
    }
  }

  /**
   * Get products by category
   */
  static async findByCategory(category: string): Promise<ServiceResponse<ProductRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return this.handleError(error, 'Get products by category');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return this.handleError(error, 'Get products by category');
    }
  }

  /**
   * Get products without inventory records
   */
  static async findWithoutInventory(): Promise<ServiceResponse<ProductWithoutInventory[]>> {
    try {
      // First get all products
      const { data: allProducts, error: productsError } = await this.supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category,
          base_unit,
          is_active
        `)
        .eq('is_active', true)
        .order('name');

      if (productsError) {
        return this.handleError(productsError, 'Get products without inventory');
      }

      // Then get product IDs that have inventory
      const { data: inventoryData, error: inventoryError } = await this.supabase
        .from('inventory')
        .select('product_id')
        .or('total_available.gt.0,total_reserved.gt.0,total_quarantine.gt.0');

      if (inventoryError) {
        return this.handleError(inventoryError, 'Get inventory products');
      }

      // Filter out products that have inventory
      const productsWithInventory = new Set(inventoryData?.map(item => item.product_id) || []);
      const productsWithoutInventory = (allProducts || []).filter(
        product => !productsWithInventory.has(product.id)
      );

      return {
        success: true,
        data: productsWithoutInventory
      };
    } catch (error) {
      return this.handleError(error, 'Get products without inventory');
    }
  }

  /**
   * Check if product can be safely deleted (following industry best practices)
   */
  static async checkDeletionEligibility(id: string): Promise<ServiceResponse<{
    canDelete: boolean;
    canDeactivate: boolean;
    blockers: string[];
    report: string;
  }>> {
    try {
      const integrityCheck = await ProductIntegrityService.checkProductDependencies(id);
      const blockers = await ProductIntegrityService.getDeletionBlockers(id);
      const report = await ProductIntegrityService.generateDeletionReport(id);

      return {
        success: true,
        data: {
          canDelete: integrityCheck.canDelete,
          canDeactivate: integrityCheck.canDeactivate,
          blockers,
          report
        }
      };
    } catch (error) {
      return this.handleError(error, 'Check deletion eligibility');
    }
  }

  /**
   * Soft delete product (deactivate - industry standard approach)
   * This is the recommended approach following SAP, Odoo, NetSuite practices
   */
  static async deactivate(id: string, userId: string, reason?: string): Promise<ServiceResponse<ProductRow>> {
    try {
      // Check if product exists
      const productCheck = await this.findById(id);
      if (!productCheck.success || !productCheck.data) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      // Perform integrity check
      const eligibilityCheck = await this.checkDeletionEligibility(id);
      if (!eligibilityCheck.success || !eligibilityCheck.data?.canDeactivate) {
        return {
          success: false,
          error: 'Product cannot be deactivated due to system constraints'
        };
      }

      // Soft delete (deactivate)
      const { data, error } = await this.supabaseAdmin
        .from('products')
        .update({
          is_active: false,
          updated_by: userId,
          updated_at: new Date().toISOString(),
          // Add metadata about deactivation
          tags: productCheck.data.tags ? 
            [...(productCheck.data.tags || []), `deactivated:${new Date().toISOString()}`] :
            [`deactivated:${new Date().toISOString()}`]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Deactivate product');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Deactivate product');
    }
  }

  /**
   * Hard delete product (physical deletion - only for products with no dependencies)
   * Following Oracle/SAP approach: only delete if NO references exist
   */
  static async hardDelete(id: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      // Mandatory integrity check before hard deletion
      const canDelete = await ProductIntegrityService.canProductBeDeleted(id);
      
      if (!canDelete) {
        const blockers = await ProductIntegrityService.getDeletionBlockers(id);
        return {
          success: false,
          error: `Cannot delete product due to existing dependencies: ${blockers.join('; ')}`
        };
      }

      // Proceed with hard deletion only if no dependencies exist
      const { error } = await this.supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        return this.handleError(error, 'Hard delete product');
      }

      return {
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'Hard delete product');
    }
  }

  /**
   * Reactivate a deactivated product
   */
  static async reactivate(id: string, userId: string): Promise<ServiceResponse<ProductRow>> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('products')
        .update({
          is_active: true,
          updated_by: userId,
          updated_at: new Date().toISOString(),
          // Remove deactivation tag
          tags: null // Could be enhanced to properly filter tags array
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Reactivate product');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, 'Reactivate product');
    }
  }

  /**
   * Legacy delete method - now redirects to deactivate (following industry best practices)
   * @deprecated Use deactivate() instead for better clarity
   */
  static async delete(id: string, userId: string): Promise<ServiceResponse<void>> {
    const result = await this.deactivate(id, userId, 'Legacy delete call');
    return {
      success: result.success,
      error: result.error
    };
  }
}