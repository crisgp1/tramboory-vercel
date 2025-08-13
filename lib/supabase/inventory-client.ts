import { supabase, Database } from './client';
import {
  UnifiedSupplier,
  SupplierStatus,
  SupplierType,
  SupplierFilters,
  SupplierStats
} from '@/lib/types/supplier.types';

// Helper function to get location name
function getLocationName(locationId: string): string {
  const locationMap: Record<string, string> = {
    'almacen': 'Almacén Principal',
    'cocina': 'Cocina',
    'salon': 'Salón',
    'bodega': 'Bodega',
    'recepcion': 'Recepción'
  };
  return locationMap[locationId] || locationId;
}

type Tables = Database['public']['Tables'];

export class SupabaseInventoryClientService {
  // ================================================================================================
  // SUPPLIERS - CLIENT SAFE METHODS (READ ONLY)
  // ================================================================================================

  static async getAllSuppliers(activeOnly: boolean = true) {
    let query = supabase.from('suppliers').select('*');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    query = query.order('name');
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getSupplierPerformance() {
    const { data, error } = await supabase
      .from('v_supplier_performance')
      .select('*')
      .order('rating_overall', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getUnlinkedSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or('user_id.is.null,user_id.eq.')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getLinkedSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .not('user_id', 'is', null)
      .neq('user_id', '')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getSupplierByUserId(userId: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  }

  static async getSupplierBySupplierCode(supplierCode: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', supplierCode)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  }

  /**
   * Obtiene todos los proveedores con filtros unificados (solo lectura, sin enriquecimiento de usuario)
   */
  static async getAllSuppliersUnified(filters?: SupplierFilters): Promise<UnifiedSupplier[]> {
    try {
      let query = supabase.from('suppliers').select('*');
      
      // Aplicar filtros
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.has_user !== undefined) {
        if (filters.has_user) {
          query = query.not('user_id', 'is', null);
        } else {
          query = query.or('user_id.is.null,user_id.eq.');
        }
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`);
      }

      if (filters?.rating_min) {
        query = query.gte('rating_quality', filters.rating_min);
      }

      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Enriquecer datos sin información de usuario (client-safe)
      const enrichedSuppliers = (data || []).map(supplier => this.enrichSupplierDataClient(supplier));

      return enrichedSuppliers;
    } catch (error) {
      console.error('Error getting unified suppliers:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de proveedores unificadas
   */
  static async getSupplierStats(): Promise<SupplierStats> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('status, type, user_id, rating_quality, rating_reliability, rating_pricing');

      if (error) throw error;

      const stats: SupplierStats = {
        total_suppliers: data?.length || 0,
        by_status: {
          [SupplierStatus.EXTERNAL]: 0,
          [SupplierStatus.INVITED]: 0,
          [SupplierStatus.ACTIVE]: 0,
          [SupplierStatus.INACTIVE]: 0,
          [SupplierStatus.SUSPENDED]: 0
        },
        by_type: {
          [SupplierType.EXTERNAL]: 0,
          [SupplierType.INTERNAL]: 0,
          [SupplierType.HYBRID]: 0
        },
        with_portal_access: 0,
        without_portal_access: 0,
        average_rating: 0,
        pending_invitations: 0
      };

      if (data && data.length > 0) {
        let totalRating = 0;
        let ratingCount = 0;

        for (const supplier of data) {
          // Contar por estado
          const status = (supplier.status as SupplierStatus) || SupplierStatus.EXTERNAL;
          if (stats.by_status[status] !== undefined) {
            stats.by_status[status]++;
          }

          // Contar por tipo
          const type = (supplier.type as SupplierType) || SupplierType.EXTERNAL;
          if (stats.by_type[type] !== undefined) {
            stats.by_type[type]++;
          }

          // Acceso al portal
          if (supplier.user_id) {
            stats.with_portal_access++;
          } else {
            stats.without_portal_access++;
          }

          // Invitaciones pendientes
          if (status === SupplierStatus.INVITED) {
            stats.pending_invitations++;
          }

          // Calificación promedio
          if (supplier.rating_quality && supplier.rating_reliability && supplier.rating_pricing) {
            const avgRating = (supplier.rating_quality + supplier.rating_reliability + supplier.rating_pricing) / 3;
            totalRating += avgRating;
            ratingCount++;
          }
        }

        if (ratingCount > 0) {
          stats.average_rating = Math.round((totalRating / ratingCount) * 10) / 10;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting supplier stats:', error);
      return {
        total_suppliers: 0,
        by_status: {
          [SupplierStatus.EXTERNAL]: 0,
          [SupplierStatus.INVITED]: 0,
          [SupplierStatus.ACTIVE]: 0,
          [SupplierStatus.INACTIVE]: 0,
          [SupplierStatus.SUSPENDED]: 0
        },
        by_type: {
          [SupplierType.EXTERNAL]: 0,
          [SupplierType.INTERNAL]: 0,
          [SupplierType.HYBRID]: 0
        },
        with_portal_access: 0,
        without_portal_access: 0,
        average_rating: 0,
        pending_invitations: 0
      };
    }
  }

  /**
   * Enriquece datos de proveedor (versión client-safe sin datos de usuario)
   */
  private static enrichSupplierDataClient(supplier: any): UnifiedSupplier {
    try {
      // Calcular calificación general
      if (supplier.rating_quality && supplier.rating_reliability && supplier.rating_pricing) {
        const weighted = (supplier.rating_quality * 0.4) + (supplier.rating_reliability * 0.35) + (supplier.rating_pricing * 0.25);
        supplier.overall_rating = Math.round(weighted * 10) / 10;
      }

      // Asegurar estados por defecto
      if (!supplier.status) {
        supplier.status = supplier.user_id ? SupplierStatus.ACTIVE : SupplierStatus.EXTERNAL;
      }
      
      if (!supplier.type) {
        supplier.type = supplier.user_id ? SupplierType.INTERNAL : SupplierType.EXTERNAL;
      }

      // Asegurar arrays por defecto
      if (!supplier.delivery_zones) {
        supplier.delivery_zones = [];
      }

      // Los datos de usuario no están disponibles en cliente
      supplier.user_email = undefined;
      supplier.user_name = undefined;
      
      return supplier as UnifiedSupplier;
    } catch (error) {
      console.error('Error enriching supplier data:', error);
      return supplier as UnifiedSupplier;
    }
  }

  /**
   * Obtiene proveedores que necesitan migración al nuevo sistema
   */
  static async getSuppliersNeedingMigration(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or('status.is.null,type.is.null')
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting suppliers needing migration:', error);
      return [];
    }
  }

  // ================================================================================================
  // PRODUCT CATEGORIES - CLIENT SAFE
  // ================================================================================================

  static async getProductCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .order('category');
    
    if (error) throw error;
    
    const categories = [...new Set(data?.map(p => p.category).filter(Boolean))].sort();
    return categories;
  }

  // ================================================================================================
  // PRODUCTS - CLIENT SAFE (READ ONLY)
  // ================================================================================================

  static async getAllProducts(activeOnly: boolean = true) {
    let query = supabase.from('products').select(`
      *,
      product_suppliers!inner(
        suppliers(name, rating_overall)
      )
    `);
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    query = query.order('name');
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_units(*),
        product_pricing_tiers(*),
        product_suppliers!inner(
          suppliers(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async searchProducts(searchTerm: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getProductsByCategory(category: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // INVENTORY - CLIENT SAFE (READ ONLY)
  // ================================================================================================

  static async getInventorySummary() {
    const { data, error } = await supabase
      .from('v_product_inventory_summary')
      .select('*')
      .order('product_name');
    
    if (error) throw error;
    return data;
  }

  static async getInventoryByProduct(productId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        inventory_batches(*),
        products(name, category, sku, is_perishable)
      `)
      .eq('product_id', productId);
    
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      product: {
        id: item.product_id,
        name: item.products.name,
        sku: item.products.sku,
        category: item.products.category
      },
      location_id: item.location_id,
      available_quantity: item.total_available,
      reserved_quantity: item.total_reserved,
      quarantine_quantity: item.total_quarantine,
      unit: item.total_unit,
      batches: item.inventory_batches?.map((batch: any) => ({
        batch_id: batch.batch_id,
        quantity: batch.quantity,
        unit: batch.unit,
        cost_per_unit: batch.cost_per_unit,
        expiry_date: batch.expiry_date,
        received_date: batch.received_date,
        status: batch.status
      }))
    })) || [];
  }

  static async getInventoryByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        inventory_batches(*),
        products(name, category, sku)
      `)
      .eq('location_id', locationId);
    
    if (error) throw error;
    return data;
  }

  static async getAllInventoryRecords() {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      product: {
        id: (item.products as any).id,
        name: (item.products as any).name,
        sku: (item.products as any).sku,
        category: (item.products as any).category
      },
      location_id: item.location_id,
      available_quantity: item.total_available,
      reserved_quantity: item.total_reserved,
      quarantine_quantity: item.total_quarantine,
      unit: item.total_unit,
      batches: item.inventory_batches?.map((batch: any) => ({
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
  }

  static async getProductsWithoutInventory() {
    const { data, error } = await supabase
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
      .not('id', 'in', `(
        SELECT DISTINCT product_id 
        FROM inventory 
        WHERE total_available > 0 OR total_reserved > 0 OR total_quarantine > 0
      )`);
    
    if (error) throw error;
    return data || [];
  }

  static async getLowStockProducts() {
    const { data, error } = await supabase
      .from('v_product_inventory_summary')
      .select('*')
      .eq('is_low_stock', true)
      .order('total_available');
    
    if (error) throw error;
    return data;
  }

  static async getOutOfStockProducts() {
    const { data, error } = await supabase
      .from('v_product_inventory_summary')
      .select('*')
      .eq('is_out_of_stock', true)
      .order('product_name');
    
    if (error) throw error;
    return data;
  }

  static async getExpiringBatches(days: number = 30) {
    const { data, error } = await supabase
      .from('v_expiring_batches')
      .select('*')
      .lte('days_until_expiry', days)
      .order('expiry_date');
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // PURCHASE ORDERS - CLIENT SAFE (READ ONLY)
  // ================================================================================================

  static async getAllPurchaseOrders() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items(*),
        suppliers(name, rating_overall)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getPurchaseOrderById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items(*),
        suppliers(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getPurchaseOrdersByStatus(status: Database['public']['Enums']['purchase_order_status']) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getPendingPurchaseOrders() {
    return this.getPurchaseOrdersByStatus('PENDING');
  }

  static async getOverduePurchaseOrders() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('status', 'ORDERED')
      .lt('expected_delivery_date', today)
      .order('expected_delivery_date');
    
    if (error) throw error;
    return data;
  }

  static async getPurchaseOrdersBySupplier(supplierId: string, statusFilter?: string) {
    let query = supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getSupplierOrderStats(supplierId: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('status, total, created_at')
      .eq('supplier_id', supplierId);

    if (error) throw error;

    const stats = {
      total_orders: data?.length || 0,
      pending_orders: data?.filter(o => o.status === 'PENDING').length || 0,
      approved_orders: data?.filter(o => o.status === 'APPROVED').length || 0,
      completed_orders: data?.filter(o => o.status === 'RECEIVED').length || 0,
      cancelled_orders: data?.filter(o => o.status === 'CANCELLED').length || 0,
      total_value: data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
      average_order_value: 0
    };

    if (stats.total_orders > 0) {
      stats.average_order_value = stats.total_value / stats.total_orders;
    }

    return stats;
  }

  // ================================================================================================
  // INVENTORY MOVEMENTS - CLIENT SAFE (READ ONLY)
  // ================================================================================================

  static async getMovementsByProduct(productId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getMovementsByLocation(location: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        products(name, sku)
      `)
      .or(`from_location.eq.${location},to_location.eq.${location}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // ALERTS - CLIENT SAFE (READ ONLY)
  // ================================================================================================

  static async getActiveAlerts() {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        products(name, sku, category)
      `)
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // UTILITY FUNCTIONS - CLIENT SAFE
  // ================================================================================================

  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        throw error;
      }
      
      return {
        success: true,
        message: 'Successfully connected to Supabase',
        data: { count: data.length }
      };
    } catch (error) {
      console.error('Test connection failed:', error);
      return {
        success: false,
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getInventoryStats() {
    try {
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: lowStockProducts } = await supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_low_stock', true);

      const { count: outOfStockProducts } = await supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_out_of_stock', true);

      const { data: inventoryValue } = await supabase
        .from('inventory_batches')
        .select('quantity, cost_per_unit')
        .eq('status', 'available');

      const totalValue = inventoryValue?.reduce((sum, batch) =>
        sum + (batch.quantity * batch.cost_per_unit), 0) || 0;

      return {
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        outOfStockProducts: outOfStockProducts || 0,
        totalValue: Math.round(totalValue * 100) / 100
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0
      };
    }
  }
}