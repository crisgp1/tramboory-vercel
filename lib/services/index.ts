/**
 * Main export file for all inventory services
 */

// Services
export { ProductService } from './product.service';
export { InventoryService } from './inventory.service';

// Repositories
export { ProductRepository } from '../repositories/product.repository';
export { InventoryRepository } from '../repositories/inventory.repository';
export { MovementRepository } from '../repositories/movement.repository';

// Utils
export { getLocationName, isValidLocationId, getAvailableLocationIds, AVAILABLE_LOCATIONS } from '../utils/location.utils';

// Types
export * from '../types/inventory.types';

/**
 * Legacy compatibility - Single import point for existing code
 * This allows gradual migration from the monolithic service
 */
export class InventoryManager {
  // Product methods
  static async getAllProducts(activeOnly: boolean = true) {
    const { ProductService } = await import('./product.service');
    return ProductService.getAllProducts({ activeOnly });
  }

  static async getProductById(id: string) {
    const { ProductService } = await import('./product.service');
    return ProductService.getProductById(id);
  }

  static async createProduct(productData: any) {
    const { ProductService } = await import('./product.service');
    return ProductService.createProduct(productData);
  }

  static async searchProducts(searchTerm: string) {
    const { ProductService } = await import('./product.service');
    return ProductService.searchProducts(searchTerm);
  }

  static async getProductsByCategory(category: string) {
    const { ProductService } = await import('./product.service');
    return ProductService.getProductsByCategory(category);
  }

  static async getProductsWithoutInventory() {
    const { ProductService } = await import('./product.service');
    return ProductService.getProductsWithoutInventory();
  }

  // Inventory methods
  static async getAllInventoryRecords() {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getAllInventory();
  }

  static async getInventoryByProduct(productId: string) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getInventoryByProduct(productId);
  }

  static async getInventoryByLocation(locationId: string) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getInventoryByLocation(locationId);
  }

  static async getInventorySummary() {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getInventorySummary();
  }

  static async getInventoryStats() {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getInventoryStats();
  }

  static async getLowStockProducts() {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getLowStockProducts();
  }

  static async getOutOfStockProducts() {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getOutOfStockProducts();
  }

  static async getExpiringBatches(days: number = 30) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.getExpiringBatches(days);
  }

  // Stock operations
  static async adjustStock(params: any) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.adjustStock(params);
  }

  static async transferStock(params: any) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.transferStock(params);
  }

  static async reserveStock(params: any) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.reserveStock(params);
  }

  static async consumeStock(params: any) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.consumeStock(params);
  }

  static async releaseReservation(productId: string, locationId: string, quantity: number, userId: string) {
    const { InventoryService } = await import('./inventory.service');
    return InventoryService.releaseReservation(productId, locationId, quantity, userId);
  }
}