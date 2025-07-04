import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Validates if the current user has supplier role and access to specific resources
 * 
 * @param request The NextRequest object
 * @param supplierId Optional supplier ID to validate specific access
 * @returns The supplier object if access is valid, null otherwise
 */
export async function validateSupplierAccess(
  request: NextRequest,
  supplierId?: string
): Promise<any | null> {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return null;
    }
    
    const db = connection.connection.db;

    // Check if user has supplier role
    const user = await db.collection("users").findOne({ 
      clerkId: userId,
      role: "proveedor" // Role must be "proveedor"
    });

    if (!user) {
      return null;
    }

    // Find supplier linked to this user
    const supplier = await db.collection("suppliers").findOne({ 
      userId: userId 
    });

    if (!supplier) {
      return null;
    }

    // If a specific supplierId was provided, validate it matches
    if (supplierId && supplier._id.toString() !== supplierId) {
      return null;
    }

    return supplier;
  } catch (error) {
    console.error('Error validating supplier access:', error);
    return null;
  }
}

/**
 * Gets the supplier associated with a user
 * 
 * @param userId The Clerk user ID
 * @returns The supplier object if found, null otherwise
 */
export async function getSupplierByUserId(userId: string): Promise<any | null> {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return null;
    }
    
    const db = connection.connection.db;
    
    const supplier = await db.collection("suppliers").findOne({
      userId: userId
    });
    
    return supplier;
  } catch (error) {
    console.error('Error fetching supplier by user ID:', error);
    return null;
  }
}