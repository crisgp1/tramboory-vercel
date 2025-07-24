import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { PRODUCT_CATEGORIES } from '@/types/inventory';

// GET /api/inventory/categories - Get product categories
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get categories from Supabase (existing products)
    let dbCategories: string[] = [];
    
    try {
      dbCategories = await SupabaseInventoryService.getProductCategories();
    } catch (error) {
      console.warn('Could not fetch categories from Supabase:', error);
    }

    // Merge database categories with hardcoded categories
    const allCategories = new Set([
      ...PRODUCT_CATEGORIES, // Always include hardcoded categories
      ...dbCategories        // Add any additional categories from database
    ]);

    const categories = Array.from(allCategories).sort();

    return NextResponse.json({
      success: true,
      categories,
      source: dbCategories.length > 0 ? 'merged' : 'hardcoded',
      dbCount: dbCategories.length,
      totalCount: categories.length
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    
    // Return hardcoded categories as fallback
    return NextResponse.json({
      success: true,
      categories: PRODUCT_CATEGORIES,
      source: 'fallback'
    });
  }
}