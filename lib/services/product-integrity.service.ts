import { SupabaseInventoryService } from '@/lib/supabase/inventory';

export interface ProductDependency {
  type: 'inventory' | 'movements' | 'purchase_orders' | 'reservations';
  count: number;
  description: string;
}

export interface ProductIntegrityCheck {
  canDelete: boolean;
  canDeactivate: boolean;
  dependencies: ProductDependency[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Service to check product integrity before deletion or deactivation
 * Follows industry best practices from SAP, Odoo, NetSuite, Oracle
 */
export class ProductIntegrityService {
  
  /**
   * Comprehensive check of product dependencies before deletion
   */
  static async checkProductDependencies(productId: string): Promise<ProductIntegrityCheck> {
    const dependencies: ProductDependency[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check 1: Inventory Records
      const inventory = await SupabaseInventoryService.getInventoryByProduct(productId);
      const hasStock = inventory.some(inv => 
        inv.available_quantity > 0 || 
        inv.reserved_quantity > 0 || 
        inv.quarantine_quantity > 0
      );

      if (inventory.length > 0) {
        dependencies.push({
          type: 'inventory',
          count: inventory.length,
          description: `Producto tiene ${inventory.length} registro(s) de inventario`
        });
        
        if (hasStock) {
          warnings.push('El producto tiene existencias actuales. Debe ajustar inventario a cero antes de eliminar.');
          recommendations.push('Realizar ajuste de inventario para poner existencias en cero');
        }
      }

      // Check 2: Inventory Movements  
      const movements = await SupabaseInventoryService.getMovementsByProduct(productId, 1);
      if (movements && movements.length > 0) {
        // Get actual count with a separate query since we only fetched 1 for checking
        const allMovements = await SupabaseInventoryService.getMovementsByProduct(productId, 1000);
        dependencies.push({
          type: 'movements',
          count: allMovements?.length || 0,
          description: `Producto tiene ${allMovements?.length || 0} movimiento(s) de inventario histórico`
        });
        
        warnings.push('El producto tiene historial de movimientos. Su eliminación afectaría la trazabilidad.');
        recommendations.push('Considerar desactivar (soft delete) en lugar de eliminar');
      }

      // Check 3: Purchase Orders (placeholder - would need actual implementation)
      // This would require checking purchase_order_items table
      // dependencies.push({
      //   type: 'purchase_orders',
      //   count: 0,
      //   description: 'Producto no tiene órdenes de compra pendientes'
      // });

      // Determine deletion/deactivation possibilities
      const hasAnyDependencies = dependencies.length > 0;
      const hasHistoricalData = dependencies.some(dep => 
        dep.type === 'movements' || 
        (dep.type === 'inventory' && dep.count > 0)
      );

      const canDelete = !hasAnyDependencies;
      const canDeactivate = true; // Always can deactivate

      // Add general recommendations based on industry best practices
      if (hasHistoricalData) {
        recommendations.push('RECOMENDACIÓN: Usar eliminación lógica (desactivar) como hacen SAP, Odoo y NetSuite');
        recommendations.push('Esto preservará la integridad referencial y el historial de transacciones');
      }

      if (hasStock) {
        recommendations.push('OBLIGATORIO: Ajustar inventario a cero antes de cualquier eliminación');
        recommendations.push('Verificar que no hay reservas activas o stock en cuarentena');
      }

      if (!hasAnyDependencies) {
        recommendations.push('El producto puede eliminarse físicamente sin afectar datos históricos');
      }

      return {
        canDelete,
        canDeactivate,
        dependencies,
        warnings,
        recommendations
      };

    } catch (error) {
      console.error('Error checking product dependencies:', error);
      return {
        canDelete: false,
        canDeactivate: true,
        dependencies: [],
        warnings: ['Error al verificar dependencias del producto'],
        recommendations: ['Contactar al administrador del sistema']
      };
    }
  }

  /**
   * Check if product can be safely deleted (no dependencies)
   */
  static async canProductBeDeleted(productId: string): Promise<boolean> {
    const check = await this.checkProductDependencies(productId);
    return check.canDelete;
  }

  /**
   * Get deletion prevention reasons
   */
  static async getDeletionBlockers(productId: string): Promise<string[]> {
    const check = await this.checkProductDependencies(productId);
    const blockers: string[] = [];

    check.dependencies.forEach(dep => {
      switch (dep.type) {
        case 'inventory':
          blockers.push(`Producto tiene registros de inventario activos (${dep.count})`);
          break;
        case 'movements':
          blockers.push(`Producto tiene historial de movimientos (${dep.count})`);
          break;
        case 'purchase_orders':
          blockers.push(`Producto tiene órdenes de compra asociadas (${dep.count})`);
          break;
        case 'reservations':
          blockers.push(`Producto tiene reservaciones activas (${dep.count})`);
          break;
      }
    });

    return blockers;
  }

  /**
   * Generate detailed report for product deletion analysis
   */
  static async generateDeletionReport(productId: string): Promise<string> {
    const check = await this.checkProductDependencies(productId);
    
    let report = `=== ANÁLISIS DE ELIMINACIÓN DE PRODUCTO ===\n`;
    report += `Producto ID: ${productId}\n`;
    report += `Puede eliminarse físicamente: ${check.canDelete ? 'SÍ' : 'NO'}\n`;
    report += `Puede desactivarse: ${check.canDeactivate ? 'SÍ' : 'NO'}\n\n`;

    if (check.dependencies.length > 0) {
      report += `DEPENDENCIAS ENCONTRADAS:\n`;
      check.dependencies.forEach((dep, index) => {
        report += `${index + 1}. ${dep.description}\n`;
      });
      report += `\n`;
    }

    if (check.warnings.length > 0) {
      report += `ADVERTENCIAS:\n`;
      check.warnings.forEach((warning, index) => {
        report += `⚠️  ${index + 1}. ${warning}\n`;
      });
      report += `\n`;
    }

    if (check.recommendations.length > 0) {
      report += `RECOMENDACIONES:\n`;
      check.recommendations.forEach((rec, index) => {
        report += `💡 ${index + 1}. ${rec}\n`;
      });
    }

    return report;
  }
}