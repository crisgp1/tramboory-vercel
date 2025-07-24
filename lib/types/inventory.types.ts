import { Database } from '@/lib/supabase/client';

export type Tables = Database['public']['Tables'];

// Core database types
export type SupplierRow = Tables['suppliers']['Row'];
export type ProductRow = Tables['products']['Row'];
export type InventoryRow = Tables['inventory']['Row'];
export type InventoryBatchRow = Tables['inventory_batches']['Row'];
export type PurchaseOrderRow = Tables['purchase_orders']['Row'];
export type InventoryMovementRow = Tables['inventory_movements']['Row'];
export type InventoryAlertRow = Tables['inventory_alerts']['Row'];

// Insert types
export type SupplierInsert = Tables['suppliers']['Insert'];
export type ProductInsert = Tables['products']['Insert'];
export type InventoryInsert = Tables['inventory']['Insert'];
export type InventoryBatchInsert = Tables['inventory_batches']['Insert'];
export type InventoryMovementInsert = Tables['inventory_movements']['Insert'];
export type InventoryAlertInsert = Tables['inventory_alerts']['Insert'];

// Update types
export type SupplierUpdate = Tables['suppliers']['Update'];
export type ProductUpdate = Tables['products']['Update'];
export type InventoryUpdate = Tables['inventory']['Update'];
export type InventoryBatchUpdate = Tables['inventory_batches']['Update'];

// Business logic types
export interface StockAdjustmentParams {
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
}

export interface StockTransferParams {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unit: string;
  userId: string;
  batchId?: string;
  notes?: string;
}

export interface StockReservationParams {
  productId: string;
  locationId: string;
  quantity: number;
  unit: string;
  reservedFor: string;
  userId: string;
  expiresAt?: Date;
  notes?: string;
}

export interface StockConsumptionParams {
  productId: string;
  locationId: string;
  quantity: number;
  unit: string;
  consumedFor: string;
  userId: string;
  batchId?: string;
  notes?: string;
}

// Response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InventoryStatsResponse {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
}

// Frontend interface types (transformed data)
export interface StockItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  location_id: string;
  available_quantity: number;
  reserved_quantity: number;
  quarantine_quantity: number;
  unit: string;
  batches?: Array<{
    batch_id: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    expiry_date?: string;
    received_date: string;
    status: string;
  }>;
  last_movement?: {
    movement_type: string;
    created_at: string;
    quantity: number;
  };
}

export interface ProductWithoutInventory {
  id: string;
  name: string;
  sku: string;
  category: string;
  base_unit: string;
  is_active: boolean;
}