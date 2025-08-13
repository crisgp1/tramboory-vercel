import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase admin environment variables');
}

// Create Supabase client with service role for server-side operations only
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Admin-level supplier operations (server-only)
 */
export class SupabaseAdminService {
  
  /**
   * Creates a new supplier (admin-only operation)
   */
  static async createSupplier(supplierData: any) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Updates a supplier (admin-only operation)
   */
  static async updateSupplier(supplierId: string, updateData: any) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updateData)
      .eq('id', supplierId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Deletes a supplier (admin-only operation)
   */
  static async deleteSupplier(supplierId: string) {
    const { error } = await supabaseAdmin
      .from('suppliers')
      .delete()
      .eq('id', supplierId);
    
    if (error) throw error;
    return { success: true };
  }

  /**
   * Gets supplier by ID (admin-only, bypasses RLS)
   */
  static async getSupplierById(supplierId: string) {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();
    
    if (error) throw error;
    return data;
  }
}