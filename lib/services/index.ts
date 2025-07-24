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
    return ProductService.getAllProducts({ activeOnly });
  }

  static async getProductById(id: string) {
    return ProductService.getProductById(id);
  }

  static async createProduct(productData: any) {
    return ProductService.createProduct(productData);
  }

  static async searchProducts(searchTerm: string) {
    return ProductService.searchProducts(searchTerm);
  }

  static async getProductsByCategory(category: string) {
    return ProductService.getProductsByCategory(category);
  }

  static async getProductsWithoutInventory() {
    return ProductService.getProductsWithoutInventory();
  }

  // Inventory methods
  static async getAllInventoryRecords() {
    return InventoryService.getAllInventory();
  }

  static async getInventoryByProduct(productId: string) {
    return InventoryService.getInventoryByProduct(productId);
  }

  static async getInventoryByLocation(locationId: string) {
    return InventoryService.getInventoryByLocation(locationId);
  }

  static async getInventorySummary() {
    return InventoryService.getInventorySummary();
  }

  static async getInventoryStats() {
    return InventoryService.getInventoryStats();
  }

  static async getLowStockProducts() {
    return InventoryService.getLowStockProducts();
  }

  static async getOutOfStockProducts() {
    return InventoryService.getOutOfStockProducts();
  }

  static async getExpiringBatches(days: number = 30) {
    return InventoryService.getExpiringBatches(days);
  }

  // Stock operations
  static async adjustStock(params: any) {
    return InventoryService.adjustStock(params);
  }

  static async transferStock(params: any) {
    return InventoryService.transferStock(params);
  }

  static async reserveStock(params: any) {
    return InventoryService.reserveStock(params);
  }

  static async consumeStock(params: any) {
    return InventoryService.consumeStock(params);
  }

  static async releaseReservation(productId: string, locationId: string, quantity: number, userId: string) {
    return InventoryService.releaseReservation(productId, locationId, quantity, userId);
  }
}