import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Create Supabase client with service role for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          supplier_id: string;
          code: string;
          name: string;
          description?: string;
          user_id?: string;
          contact_email?: string;
          contact_phone?: string;
          contact_address?: string;
          contact_person?: string;
          payment_credit_days: number;
          payment_method: 'cash' | 'credit' | 'transfer' | 'check';
          payment_currency: string;
          payment_discount_terms?: string;
          delivery_lead_time_days: number;
          delivery_minimum_order?: number;
          delivery_zones?: string[];
          rating_quality: number;
          rating_reliability: number;
          rating_pricing: number;
          rating_overall: number;
          is_active: boolean;
          is_preferred: boolean;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          code: string;
          name: string;
          description?: string;
          user_id?: string;
          contact_email?: string;
          contact_phone?: string;
          contact_address?: string;
          contact_person?: string;
          payment_credit_days?: number;
          payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
          payment_currency?: string;
          payment_discount_terms?: string;
          delivery_lead_time_days?: number;
          delivery_minimum_order?: number;
          delivery_zones?: string[];
          rating_quality?: number;
          rating_reliability?: number;
          rating_pricing?: number;
          rating_overall?: number;
          is_active?: boolean;
          is_preferred?: boolean;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          code?: string;
          name?: string;
          description?: string;
          user_id?: string;
          contact_email?: string;
          contact_phone?: string;
          contact_address?: string;
          contact_person?: string;
          payment_credit_days?: number;
          payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
          payment_currency?: string;
          payment_discount_terms?: string;
          delivery_lead_time_days?: number;
          delivery_minimum_order?: number;
          delivery_zones?: string[];
          rating_quality?: number;
          rating_reliability?: number;
          rating_pricing?: number;
          rating_overall?: number;
          is_active?: boolean;
          is_preferred?: boolean;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          description?: string;
          category: string;
          sku?: string;
          barcode?: string;
          base_unit: string;
          stock_minimum: number;
          stock_reorder_point: number;
          stock_unit: string;
          last_cost?: number;
          average_cost?: number;
          spec_weight?: number;
          spec_length?: number;
          spec_width?: number;
          spec_height?: number;
          spec_dimensions_unit?: string;
          spec_color?: string;
          spec_brand?: string;
          spec_model?: string;
          is_active: boolean;
          is_perishable: boolean;
          requires_batch: boolean;
          expiry_has_expiry?: boolean;
          expiry_shelf_life_days?: number;
          expiry_warning_days?: number;
          images?: string[];
          tags?: string[];
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          description?: string;
          category: string;
          sku?: string;
          barcode?: string;
          base_unit: string;
          stock_minimum?: number;
          stock_reorder_point?: number;
          stock_unit: string;
          last_cost?: number;
          average_cost?: number;
          spec_weight?: number;
          spec_length?: number;
          spec_width?: number;
          spec_height?: number;
          spec_dimensions_unit?: string;
          spec_color?: string;
          spec_brand?: string;
          spec_model?: string;
          is_active?: boolean;
          is_perishable?: boolean;
          requires_batch?: boolean;
          expiry_has_expiry?: boolean;
          expiry_shelf_life_days?: number;
          expiry_warning_days?: number;
          images?: string[];
          tags?: string[];
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          description?: string;
          category?: string;
          sku?: string;
          barcode?: string;
          base_unit?: string;
          stock_minimum?: number;
          stock_reorder_point?: number;
          stock_unit?: string;
          last_cost?: number;
          average_cost?: number;
          spec_weight?: number;
          spec_length?: number;
          spec_width?: number;
          spec_height?: number;
          spec_dimensions_unit?: string;
          spec_color?: string;
          spec_brand?: string;
          spec_model?: string;
          is_active?: boolean;
          is_perishable?: boolean;
          requires_batch?: boolean;
          expiry_has_expiry?: boolean;
          expiry_shelf_life_days?: number;
          expiry_warning_days?: number;
          images?: string[];
          tags?: string[];
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          location_id: string;
          location_name: string;
          total_available: number;
          total_reserved: number;
          total_quarantine: number;
          total_unit: string;
          last_movement_id?: string;
          last_updated: string;
          last_updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          location_id: string;
          location_name: string;
          total_available?: number;
          total_reserved?: number;
          total_quarantine?: number;
          total_unit: string;
          last_movement_id?: string;
          last_updated?: string;
          last_updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          location_id?: string;
          location_name?: string;
          total_available?: number;
          total_reserved?: number;
          total_quarantine?: number;
          total_unit?: string;
          last_movement_id?: string;
          last_updated?: string;
          last_updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_batches: {
        Row: {
          id: string;
          inventory_id: string;
          batch_id: string;
          quantity: number;
          unit: string;
          cost_per_unit: number;
          expiry_date?: string;
          received_date: string;
          supplier_batch_code?: string;
          status: 'available' | 'reserved' | 'quarantine' | 'expired';
        };
        Insert: {
          id?: string;
          inventory_id: string;
          batch_id: string;
          quantity: number;
          unit: string;
          cost_per_unit: number;
          expiry_date?: string;
          received_date?: string;
          supplier_batch_code?: string;
          status?: 'available' | 'reserved' | 'quarantine' | 'expired';
        };
        Update: {
          id?: string;
          inventory_id?: string;
          batch_id?: string;
          quantity?: number;
          unit?: string;
          cost_per_unit?: number;
          expiry_date?: string;
          received_date?: string;
          supplier_batch_code?: string;
          status?: 'available' | 'reserved' | 'quarantine' | 'expired';
        };
      };
      purchase_orders: {
        Row: {
          id: string;
          purchase_order_id: string;
          supplier_id?: string;
          supplier_name: string;
          status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
          subtotal: number;
          tax: number;
          tax_rate: number;
          total: number;
          currency: string;
          expected_delivery_date?: string;
          actual_delivery_date?: string;
          delivery_location: string;
          payment_method: 'cash' | 'credit' | 'transfer' | 'check';
          payment_credit_days: number;
          payment_due_date?: string;
          notes?: string;
          internal_notes?: string;
          attachments?: string[];
          metadata?: Record<string, any>;
          approved_by?: string;
          approved_at?: string;
          ordered_by?: string;
          ordered_at?: string;
          received_by?: string;
          received_at?: string;
          cancelled_by?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          supplier_id?: string;
          supplier_name: string;
          status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
          subtotal?: number;
          tax?: number;
          tax_rate?: number;
          total?: number;
          currency?: string;
          expected_delivery_date?: string;
          actual_delivery_date?: string;
          delivery_location: string;
          payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
          payment_credit_days?: number;
          payment_due_date?: string;
          notes?: string;
          internal_notes?: string;
          attachments?: string[];
          metadata?: Record<string, any>;
          approved_by?: string;
          approved_at?: string;
          ordered_by?: string;
          ordered_at?: string;
          received_by?: string;
          received_at?: string;
          cancelled_by?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          supplier_id?: string;
          supplier_name?: string;
          status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
          subtotal?: number;
          tax?: number;
          tax_rate?: number;
          total?: number;
          currency?: string;
          expected_delivery_date?: string;
          actual_delivery_date?: string;
          delivery_location?: string;
          payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
          payment_credit_days?: number;
          payment_due_date?: string;
          notes?: string;
          internal_notes?: string;
          attachments?: string[];
          metadata?: Record<string, any>;
          approved_by?: string;
          approved_at?: string;
          ordered_by?: string;
          ordered_at?: string;
          received_by?: string;
          received_at?: string;
          cancelled_by?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          movement_id: string;
          movement_type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'MERMA' | 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
          product_id?: string;
          from_location?: string;
          to_location?: string;
          quantity: number;
          unit: string;
          batch_id?: string;
          reason?: string;
          reference_type?: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer';
          reference_id?: string;
          cost_unit_cost?: number;
          cost_total_cost?: number;
          cost_currency?: string;
          performed_by: string;
          performed_by_name: string;
          notes?: string;
          metadata?: Record<string, any>;
          is_reversed: boolean;
          reversal_movement_id?: string;
          original_movement_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          movement_id: string;
          movement_type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'MERMA' | 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
          product_id?: string;
          from_location?: string;
          to_location?: string;
          quantity: number;
          unit: string;
          batch_id?: string;
          reason?: string;
          reference_type?: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer';
          reference_id?: string;
          cost_unit_cost?: number;
          cost_total_cost?: number;
          cost_currency?: string;
          performed_by: string;
          performed_by_name: string;
          notes?: string;
          metadata?: Record<string, any>;
          is_reversed?: boolean;
          reversal_movement_id?: string;
          original_movement_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          movement_id?: string;
          movement_type?: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'MERMA' | 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
          product_id?: string;
          from_location?: string;
          to_location?: string;
          quantity?: number;
          unit?: string;
          batch_id?: string;
          reason?: string;
          reference_type?: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer';
          reference_id?: string;
          cost_unit_cost?: number;
          cost_total_cost?: number;
          cost_currency?: string;
          performed_by?: string;
          performed_by_name?: string;
          notes?: string;
          metadata?: Record<string, any>;
          is_reversed?: boolean;
          reversal_movement_id?: string;
          original_movement_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_alerts: {
        Row: {
          id: string;
          alert_type: 'LOW_STOCK' | 'EXPIRY_WARNING' | 'REORDER_POINT' | 'EXPIRED_PRODUCT' | 'QUARANTINE_ALERT';
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message: string;
          product_id?: string;
          product_name?: string;
          current_stock?: number;
          min_stock?: number;
          expiry_date?: string;
          metadata?: Record<string, any>;
          status: 'active' | 'dismissed' | 'resolved';
          created_by: string;
          dismissed_by?: string;
          dismissed_at?: string;
          resolved_by?: string;
          resolved_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          alert_type: 'LOW_STOCK' | 'EXPIRY_WARNING' | 'REORDER_POINT' | 'EXPIRED_PRODUCT' | 'QUARANTINE_ALERT';
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message: string;
          product_id?: string;
          product_name?: string;
          current_stock?: number;
          min_stock?: number;
          expiry_date?: string;
          metadata?: Record<string, any>;
          status?: 'active' | 'dismissed' | 'resolved';
          created_by: string;
          dismissed_by?: string;
          dismissed_at?: string;
          resolved_by?: string;
          resolved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          alert_type?: 'LOW_STOCK' | 'EXPIRY_WARNING' | 'REORDER_POINT' | 'EXPIRED_PRODUCT' | 'QUARANTINE_ALERT';
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message?: string;
          product_id?: string;
          product_name?: string;
          current_stock?: number;
          min_stock?: number;
          expiry_date?: string;
          metadata?: Record<string, any>;
          status?: 'active' | 'dismissed' | 'resolved';
          created_by?: string;
          dismissed_by?: string;
          dismissed_at?: string;
          resolved_by?: string;
          resolved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_product_inventory_summary: {
        Row: {
          product_id: string;
          product_code: string;
          product_name: string;
          category: string;
          is_active: boolean;
          is_perishable: boolean;
          total_available: number;
          total_reserved: number;
          total_quarantine: number;
          total_stock: number;
          stock_minimum: number;
          stock_reorder_point: number;
          is_low_stock: boolean;
          is_out_of_stock: boolean;
        };
      };
      v_expiring_batches: {
        Row: {
          id: string;
          batch_id: string;
          quantity: number;
          unit: string;
          expiry_date: string;
          status: string;
          location_id: string;
          location_name: string;
          product_id: string;
          product_name: string;
          product_category: string;
          days_until_expiry: number;
        };
      };
      v_supplier_performance: {
        Row: {
          supplier_id: string;
          supplier_name: string;
          rating_overall: number;
          total_orders: number;
          completed_orders: number;
          cancelled_orders: number;
          total_value: number;
          average_order_value: number;
          overdue_orders: number;
        };
      };
    };
    Functions: {
      mark_expired_batches: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_low_stock_alerts: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_expiry_alerts: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      alert_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      alert_type: 'LOW_STOCK' | 'EXPIRY_WARNING' | 'REORDER_POINT' | 'EXPIRED_PRODUCT' | 'QUARANTINE_ALERT';
      purchase_order_status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
      product_status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
      stock_movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
      movement_type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'MERMA';
      stock_movement_reason: 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'EXPIRED' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
      supplier_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      payment_method: 'cash' | 'credit' | 'transfer' | 'check';
      unit_category: 'volume' | 'weight' | 'piece' | 'length';
      conversion_type: 'fixed_volume' | 'contains' | 'weight';
      pricing_tier_type: 'retail' | 'wholesale' | 'bulk';
      batch_status: 'available' | 'reserved' | 'quarantine' | 'expired';
      stock_transfer_status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
      movement_reference_type: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer';
      alert_status: 'active' | 'dismissed' | 'resolved';
    };
  };
};

export type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type InventoryRow = Database['public']['Tables']['inventory']['Row'];
export type InventoryBatchRow = Database['public']['Tables']['inventory_batches']['Row'];
export type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];

export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
export type InventoryBatchInsert = Database['public']['Tables']['inventory_batches']['Insert'];
export type PurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert'];

export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];
export type InventoryBatchUpdate = Database['public']['Tables']['inventory_batches']['Update'];
export type PurchaseOrderUpdate = Database['public']['Tables']['purchase_orders']['Update'];