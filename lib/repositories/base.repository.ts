import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { ServiceResponse } from '@/lib/types/inventory.types';

/**
 * Base repository class with common database operations
 */
export abstract class BaseRepository {
  protected static supabase = supabaseAdmin; // Use admin client for server-side operations
  protected static supabaseAdmin = supabaseAdmin;

  /**
   * Handle database errors and return standardized response
   */
  protected static handleError<T>(error: any, operation: string): ServiceResponse<T> {
    console.error(`${operation} error:`, error);
    
    // Handle specific Supabase errors
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'Record already exists with this unique identifier'
      };
    }
    
    if (error?.code === '23503') {
      return {
        success: false,
        error: 'Referenced record does not exist'
      };
    }
    
    if (error?.code === 'PGRST116') {
      return {
        success: false,
        error: 'Record not found'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }

  /**
   * Generate unique ID with prefix
   */
  protected static generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Apply pagination to query
   */
  protected static applyPagination<T>(
    query: any,
    page?: number,
    limit?: number
  ) {
    if (page && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      return query.range(from, to);
    }
    return query;
  }

  /**
   * Apply search filters to query
   */
  protected static applySearch(
    query: any,
    searchTerm?: string,
    searchFields: string[] = ['name']
  ) {
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      const orConditions = searchFields.map(field => `${field}.ilike.${searchPattern}`).join(',');
      return query.or(orConditions);
    }
    return query;
  }

  /**
   * Apply filters to query
   */
  protected static applyFilters(query: any, filters: Record<string, any>) {
    let filteredQuery = query;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value === 'all') return; // Skip 'all' filter values
        filteredQuery = filteredQuery.eq(key, value);
      }
    });
    
    return filteredQuery;
  }
}