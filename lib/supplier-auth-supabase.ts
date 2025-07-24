import { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';

/**
 * Validates if the current user has supplier role and access to specific resources (Supabase version)
 * @param request The Next.js request object
 * @param supplierId Optional supplier ID to validate specific access
 * @returns The supplier object if access is valid, null otherwise
 */
export async function validateSupplierAccessSupabase(
  request: NextRequest, 
  supplierId?: string
): Promise<any | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No user ID found in request');
      return null;
    }

    // Get user information from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string) || "customer";

    // Check if user has supplier role
    if (userRole !== "proveedor") {
      console.log(`❌ User ${userId} does not have proveedor role. Current role: ${userRole}`);
      return null;
    }

    console.log(`✅ User ${userId} has proveedor role`);

    // Find supplier linked to this user in Supabase
    const supplier = await SupabaseInventoryService.getSupplierByUserId(userId);
    
    if (!supplier) {
      console.log(`❌ No supplier found linked to user ${userId} in Supabase`);
      return null;
    }

    console.log(`✅ Found supplier ${supplier.name} (${supplier.supplier_id}) linked to user ${userId}`);

    // If a specific supplierId was provided, validate it matches
    if (supplierId && supplier.supplier_id !== supplierId) {
      console.log(`❌ Supplier ID mismatch. Expected: ${supplierId}, Found: ${supplier.supplier_id}`);
      return null;
    }

    return supplier;

  } catch (error) {
    console.error('Error validating supplier access (Supabase):', error);
    return null;
  }
}

/**
 * Gets the supplier associated with a user from Supabase
 * @param userId Clerk user ID
 * @returns The supplier object if found, null otherwise
 */
export async function getSupplierByUserIdSupabase(userId: string): Promise<any | null> {
  try {
    const supplier = await SupabaseInventoryService.getSupplierByUserId(userId);
    return supplier;
  } catch (error) {
    console.error('Error fetching supplier by user ID (Supabase):', error);
    return null;
  }
}

/**
 * Validates supplier access with role fallback for admin/gerente users
 * This allows admin/gerente users to access supplier functions for testing/management
 */
export async function validateSupplierAccessWithFallback(
  request: NextRequest, 
  supplierId?: string
): Promise<any | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    // Get user information from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string) || "customer";

    // If user is admin or gerente, allow access to any supplier for testing
    if (userRole === "admin" || userRole === "gerente") {
      console.log(`✅ Admin/Gerente ${userId} accessing supplier portal`);
      
      // If specific supplierId provided, get that supplier
      if (supplierId) {
        const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplierId);
        return supplier;
      }
      
      // Otherwise get any active supplier for demo purposes
      const suppliers = await SupabaseInventoryService.getAllSuppliers(true);
      return suppliers.length > 0 ? suppliers[0] : null;
    }

    // For proveedor role, use normal validation
    return await validateSupplierAccessSupabase(request, supplierId);

  } catch (error) {
    console.error('Error validating supplier access with fallback:', error);
    return null;
  }
}