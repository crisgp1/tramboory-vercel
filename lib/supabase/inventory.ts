import { supabase, supabaseAdmin, Database } from './client';

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
type SupplierRow = Tables['suppliers']['Row'];
type ProductRow = Tables['products']['Row'];
type InventoryRow = Tables['inventory']['Row'];
type InventoryBatchRow = Tables['inventory_batches']['Row'];
type PurchaseOrderRow = Tables['purchase_orders']['Row'];

export class SupabaseInventoryService {
  // ================================================================================================
  // SUPPLIERS
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

  static async createSupplier(supplier: Tables['suppliers']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSupplier(id: string, updates: Tables['suppliers']['Update']) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteSupplier(id: string) {
    const { error } = await supabaseAdmin
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getSupplierPerformance() {
    const { data, error } = await supabase
      .from('v_supplier_performance')
      .select('*')
      .order('rating_overall', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // SUPPLIER LINKING (For Surtinet Portal)
  // ================================================================================================

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

  // ================================================================================================
  // PRODUCT CATEGORIES
  // ================================================================================================

  static async getProductCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .order('category');
    
    if (error) throw error;
    
    // Get unique categories and filter out empty ones
    const categories = [...new Set(data?.map(p => p.category).filter(Boolean))].sort();
    return categories;
  }

  // ================================================================================================
  // PRODUCTS
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

  static async createProduct(product: Tables['products']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProduct(id: string, updates: Tables['products']['Update']) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
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
  // INVENTORY
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
    
    // Transform to match expected structure
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
    
    // Transform the data to match StockManager interface
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

  static async addInventoryBatch(batch: Tables['inventory_batches']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .insert(batch)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateInventoryBatch(id: string, updates: Tables['inventory_batches']['Update']) {
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // PURCHASE ORDERS
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

  static async createPurchaseOrder(purchaseOrder: Tables['purchase_orders']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .insert(purchaseOrder)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePurchaseOrder(id: string, updates: Tables['purchase_orders']['Update']) {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createPurchaseOrderItems(items: any[]) {
    const { data, error } = await supabaseAdmin
      .from('purchase_order_items')
      .insert(items)
      .select();
    
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

  // ================================================================================================
  // STOCK OPERATIONS
  // ================================================================================================

  static async adjustStock(params: {
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
  }) {
    try {
      // Get existing inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', params.productId)
        .eq('location_id', params.locationId)
        .single();

      if (inventoryError && inventoryError.code !== 'PGRST116') {
        throw inventoryError;
      }

      // Create or update inventory record
      let updatedInventory;
      if (!inventory) {
        // Create new inventory record
        const { data: newInventory, error: createError } = await supabaseAdmin
          .from('inventory')
          .insert({
            product_id: params.productId,
            location_id: params.locationId,
            location_name: getLocationName(params.locationId),
            total_available: Math.max(0, params.quantity),
            total_reserved: 0,
            total_quarantine: 0,
            total_unit: params.unit,
            last_updated_by: params.userId
          })
          .select()
          .single();

        if (createError) throw createError;
        updatedInventory = newInventory;
      } else {
        // Update existing inventory
        const newTotal = Math.max(0, inventory.total_available + params.quantity);
        const { data: updateInventory, error: updateError } = await supabaseAdmin
          .from('inventory')
          .update({
            total_available: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id)
          .select()
          .single();

        if (updateError) throw updateError;
        updatedInventory = updateInventory;
      }

      // Create batch if this is an inbound movement with batch info
      if (params.quantity > 0 && (params.batchId || params.cost || params.expiryDate)) {
        await supabaseAdmin
          .from('inventory_batches')
          .insert({
            inventory_id: updatedInventory.id,
            batch_id: params.batchId || `BATCH-${Date.now()}`,
            quantity: params.quantity,
            unit: params.unit,
            cost_per_unit: params.cost || 0,
            expiry_date: params.expiryDate?.toISOString(),
            received_date: new Date().toISOString(),
            status: 'available'
          });
      }

      // Create movement record
      const movement = await this.createInventoryMovement({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: params.productId,
        movement_type: params.quantity > 0 ? 'ENTRADA' : 'SALIDA',
        from_location: params.quantity < 0 ? params.locationId : undefined,
        to_location: params.quantity > 0 ? params.locationId : undefined,
        quantity: Math.abs(params.quantity),
        unit: params.unit,
        reason: params.reason,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId, // TODO: Get actual user name
        batch_id: params.batchId
      });

      return {
        success: true,
        inventory: updatedInventory,
        movement
      };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async transferStock(params: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    unit: string;
    userId: string;
    batchId?: string;
    notes?: string;
  }) {
    try {
      // Check source inventory
      const { data: sourceInventory, error: sourceError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', params.productId)
        .eq('location_id', params.fromLocationId)
        .single();

      if (sourceError) throw new Error('Source inventory not found');
      if (sourceInventory.total_available < params.quantity) {
        throw new Error('Insufficient stock for transfer');
      }

      // Update source inventory
      await supabaseAdmin
        .from('inventory')
        .update({
          total_available: sourceInventory.total_available - params.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceInventory.id);

      // Get or create destination inventory
      const { data: destInventory, error: destError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', params.productId)
        .eq('location_id', params.toLocationId)
        .single();

      let updatedDestInventory;
      if (destError && destError.code === 'PGRST116') {
        // Create new destination inventory
        const { data: newDestInventory, error: createError } = await supabaseAdmin
          .from('inventory')
          .insert({
            product_id: params.productId,
            location_id: params.toLocationId,
            location_name: getLocationName(params.toLocationId),
            total_available: params.quantity,
            total_reserved: 0,
            total_quarantine: 0,
            total_unit: params.unit,
            last_updated_by: params.userId
          })
          .select()
          .single();

        if (createError) throw createError;
        updatedDestInventory = newDestInventory;
      } else {
        // Update existing destination inventory
        const { data: updateDestInventory, error: updateError } = await supabaseAdmin
          .from('inventory')
          .update({
            total_available: destInventory.total_available + params.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', destInventory.id)
          .select()
          .single();

        if (updateError) throw updateError;
        updatedDestInventory = updateDestInventory;
      }

      // Create movement records
      const outMovement = await this.createInventoryMovement({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-OUT`,
        product_id: params.productId,
        movement_type: 'TRANSFERENCIA',
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

      const inMovement = await this.createInventoryMovement({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-IN`,
        product_id: params.productId,
        movement_type: 'TRANSFERENCIA',
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
        movements: [outMovement, inMovement]
      };
    } catch (error) {
      console.error('Error transferring stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async reserveStock(params: {
    productId: string;
    locationId: string;
    quantity: number;
    unit: string;
    reservedFor: string;
    userId: string;
    expiresAt?: Date;
    notes?: string;
  }) {
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', params.productId)
        .eq('location_id', params.locationId)
        .single();

      if (inventoryError) throw new Error('Inventory not found');
      if (inventory.total_available < params.quantity) {
        throw new Error('Insufficient available stock for reservation');
      }

      // Update inventory
      const { data: updatedInventory, error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({
          total_available: inventory.total_available - params.quantity,
          total_reserved: inventory.total_reserved + params.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventory.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        inventory: updatedInventory
      };
    } catch (error) {
      console.error('Error reserving stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async consumeStock(params: {
    productId: string;
    locationId: string;
    quantity: number;
    unit: string;
    consumedFor: string;
    userId: string;
    batchId?: string;
    notes?: string;
  }) {
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', params.productId)
        .eq('location_id', params.locationId)
        .single();

      if (inventoryError) throw new Error('Inventory not found');
      if (inventory.total_available < params.quantity) {
        throw new Error('Insufficient available stock for consumption');
      }

      // Update inventory
      const { data: updatedInventory, error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({
          total_available: inventory.total_available - params.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventory.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create movement record
      const movement = await this.createInventoryMovement({
        movement_id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: params.productId,
        movement_type: 'SALIDA',
        from_location: params.locationId,
        quantity: params.quantity,
        unit: params.unit,
        reason: params.consumedFor,
        notes: params.notes,
        performed_by: params.userId,
        performed_by_name: params.userId,
        batch_id: params.batchId
      });

      return {
        success: true,
        inventory: updatedInventory,
        movement
      };
    } catch (error) {
      console.error('Error consuming stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async releaseReservation(
    productId: string,
    locationId: string,
    quantity: number,
    userId: string
  ) {
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .single();

      if (inventoryError) throw new Error('Inventory not found');
      if (inventory.total_reserved < quantity) {
        throw new Error('Cannot release more than reserved quantity');
      }

      // Update inventory
      const { data: updatedInventory, error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({
          total_available: inventory.total_available + quantity,
          total_reserved: inventory.total_reserved - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventory.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        inventory: updatedInventory
      };
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ================================================================================================
  // INVENTORY MOVEMENTS
  // ================================================================================================

  static async createInventoryMovement(movement: Tables['inventory_movements']['Insert']) {
    // Generate movement_id if not provided
    const movementData = {
      ...movement,
      movement_id: movement.movement_id || `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const { data, error } = await supabaseAdmin
      .from('inventory_movements')
      .insert(movementData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

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
  // ALERTS
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

  static async createAlert(alert: Tables['inventory_alerts']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('inventory_alerts')
      .insert(alert)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async dismissAlert(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('inventory_alerts')
      .update({
        status: 'dismissed',
        dismissed_by: userId,
        dismissed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async resolveAlert(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('inventory_alerts')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // MAINTENANCE FUNCTIONS
  // ================================================================================================

  static async markExpiredBatches() {
    const { data, error } = await supabaseAdmin
      .rpc('mark_expired_batches');
    
    if (error) throw error;
    return data;
  }

  static async createLowStockAlerts() {
    const { data, error } = await supabaseAdmin
      .rpc('create_low_stock_alerts');
    
    if (error) throw error;
    return data;
  }

  static async createExpiryAlerts() {
    const { data, error } = await supabaseAdmin
      .rpc('create_expiry_alerts');
    
    if (error) throw error;
    return data;
  }

  // ================================================================================================
  // UTILITY FUNCTIONS
  // ================================================================================================

  static async testConnection() {
    try {
      // Simple test query to check connection
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
      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get low stock products
      const { count: lowStockProducts } = await supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_low_stock', true);

      // Get out of stock products
      const { count: outOfStockProducts } = await supabase
        .from('v_product_inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_out_of_stock', true);

      // Get total inventory value (approximation)
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