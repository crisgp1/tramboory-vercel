import { ProductRepository } from '@/lib/repositories/product.repository';
import { ProductRow, ProductInsert, ProductUpdate, ServiceResponse, ProductWithoutInventory } from '@/lib/types/inventory.types';

/**
 * Product service - Business logic layer
 */
export class ProductService {

  /**
   * Get all products with filters
   */
  static async getAllProducts(filters?: {
    activeOnly?: boolean;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  }): Promise<ServiceResponse<ProductRow[]>> {
    return await ProductRepository.findAll(filters);
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<ServiceResponse<ProductRow>> {
    return await ProductRepository.findById(id);
  }

  /**
   * Create new product
   */
  static async createProduct(productData: Omit<ProductInsert, 'product_id'>): Promise<ServiceResponse<ProductRow>> {
    // Generate unique product ID
    const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const productWithId: ProductInsert = {
      ...productData,
      product_id: productId
    };

    return await ProductRepository.create(productWithId);
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, updates: ProductUpdate): Promise<ServiceResponse<ProductRow>> {
    return await ProductRepository.update(id, updates);
  }

  /**
   * Search products
   */
  static async searchProducts(searchTerm: string): Promise<ServiceResponse<ProductRow[]>> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: false,
        error: 'Search term must be at least 2 characters long'
      };
    }

    return await ProductRepository.search(searchTerm.trim());
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string): Promise<ServiceResponse<ProductRow[]>> {
    if (!category || category.trim() === '') {
      return {
        success: false,
        error: 'Category is required'
      };
    }

    return await ProductRepository.findByCategory(category);
  }

  /**
   * Get products without inventory records
   */
  static async getProductsWithoutInventory(): Promise<ServiceResponse<ProductWithoutInventory[]>> {
    return await ProductRepository.findWithoutInventory();
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(id: string, userId: string): Promise<ServiceResponse<void>> {
    if (!id || !userId) {
      return {
        success: false,
        error: 'Product ID and user ID are required'
      };
    }

    // Check if product exists
    const productResult = await ProductRepository.findById(id);
    if (!productResult.success) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    return await ProductRepository.delete(id, userId);
  }

  /**
   * Validate product data
   */
  static validateProductData(productData: Partial<ProductInsert>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!productData.name || productData.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!productData.category || productData.category.trim().length === 0) {
      errors.push('Product category is required');
    }

    if (!productData.sku || productData.sku.trim().length === 0) {
      errors.push('Product SKU is required');
    }

    if (!productData.base_unit || productData.base_unit.trim().length === 0) {
      errors.push('Base unit is required');
    }

    if (!productData.stock_unit || productData.stock_unit.trim().length === 0) {
      errors.push('Stock unit is required');
    }

    if (productData.stock_minimum !== undefined && productData.stock_minimum < 0) {
      errors.push('Stock minimum cannot be negative');
    }

    if (productData.stock_reorder_point !== undefined && productData.stock_reorder_point < 0) {
      errors.push('Stock reorder point cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get product categories (from existing products)
   */
  static async getProductCategories(): Promise<ServiceResponse<string[]>> {
    try {
      const productsResult = await ProductRepository.findAll({ activeOnly: true });
      
      if (!productsResult.success) {
        return {
          success: false,
          error: productsResult.error
        };
      }

      const categories = Array.from(
        new Set(productsResult.data?.map(product => product.category).filter(Boolean))
      ).sort();

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if SKU is unique
   */
  static async isSkuUnique(sku: string, excludeProductId?: string): Promise<ServiceResponse<boolean>> {
    try {
      const searchResult = await ProductRepository.search(sku);
      
      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error
        };
      }

      const existingProducts = searchResult.data?.filter(product => 
        product.sku === sku && (!excludeProductId || product.id !== excludeProductId)
      ) || [];

      return {
        success: true,
        data: existingProducts.length === 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}