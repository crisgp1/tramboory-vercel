import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb';
import Supplier from '../lib/models/inventory/Supplier';
import { clerkClient } from '@clerk/nextjs/server';

async function debugSupplierAssociation() {
  console.log("🔍 Starting Supplier Association Debug...\n");
  
  try {
    // Connect to database
    await dbConnect();
    console.log("✅ Connected to database\n");
    
    // Get all suppliers
    const suppliers = await Supplier.find({});
    console.log(`📦 Total suppliers in database: ${suppliers.length}`);
    
    // Show each supplier's userId association
    console.log("\n📋 Supplier Details:");
    suppliers.forEach((supplier, index) => {
      console.log(`\n${index + 1}. ${supplier.name}`);
      console.log(`   - Supplier ID: ${supplier.supplierId}`);
      console.log(`   - Code: ${supplier.code}`);
      console.log(`   - User ID: ${supplier.userId || 'NOT LINKED'}`);
      console.log(`   - Active: ${supplier.isActive}`);
    });
    
    // Get all users with provider role from Clerk
    console.log("\n\n👥 Fetching users with 'proveedor' role from Clerk...");
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ limit: 100 });
    const providerUsers = users.data.filter(user => 
      (user.publicMetadata?.role as string) === "proveedor"
    );
    
    console.log(`\n📋 Provider Users in Clerk: ${providerUsers.length}`);
    providerUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName || ''} ${user.lastName || ''} (${user.emailAddresses[0]?.emailAddress})`);
      console.log(`   - User ID: ${user.id}`);
      console.log(`   - Role: ${user.publicMetadata?.role}`);
      
      // Check if this user has a linked supplier
      const linkedSupplier = suppliers.find(s => s.userId === user.id);
      if (linkedSupplier) {
        console.log(`   - ✅ LINKED to supplier: ${linkedSupplier.name} (${linkedSupplier.supplierId})`);
      } else {
        console.log(`   - ❌ NO SUPPLIER LINKED`);
      }
    });
    
    // Show unlinked suppliers
    console.log("\n\n⚠️  Suppliers without user association:");
    const unlinkedSuppliers = suppliers.filter(s => !s.userId);
    if (unlinkedSuppliers.length === 0) {
      console.log("   None - all suppliers have userId");
    } else {
      unlinkedSuppliers.forEach(supplier => {
        console.log(`   - ${supplier.name} (${supplier.supplierId})`);
      });
    }
    
    // Summary
    console.log("\n\n📊 Summary:");
    console.log(`   - Total Suppliers: ${suppliers.length}`);
    console.log(`   - Suppliers with userId: ${suppliers.filter(s => s.userId).length}`);
    console.log(`   - Suppliers without userId: ${unlinkedSuppliers.length}`);
    console.log(`   - Provider users in Clerk: ${providerUsers.length}`);
    console.log(`   - Provider users with linked supplier: ${providerUsers.filter(u => suppliers.some(s => s.userId === u.id)).length}`);
    console.log(`   - Provider users without linked supplier: ${providerUsers.filter(u => !suppliers.some(s => s.userId === u.id)).length}`);
    
  } catch (error) {
    console.error("❌ Error during debug:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Debug complete");
  }
}

// Run the debug script
debugSupplierAssociation();