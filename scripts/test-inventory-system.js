const { SupabaseInventoryService } = require('../lib/supabase/inventory');

async function testInventorySystem() {
  console.log('🧪 Testing Supabase Inventory System...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing connection...');
    const connectionTest = await SupabaseInventoryService.testConnection();
    console.log('Connection result:', connectionTest);
    console.log('');

    // Get inventory stats
    console.log('2️⃣ Getting inventory stats...');
    const stats = await SupabaseInventoryService.getInventoryStats();
    console.log('Stats:', stats);
    console.log('');

    // Get inventory summary
    console.log('3️⃣ Getting inventory summary...');
    const summary = await SupabaseInventoryService.getInventorySummary();
    console.log('Summary count:', summary.length);
    if (summary.length > 0) {
      console.log('First item:', summary[0]);
    }
    console.log('');

    // Get low stock products
    console.log('4️⃣ Getting low stock products...');
    const lowStockProducts = await SupabaseInventoryService.getLowStockProducts();
    console.log('Low stock count:', lowStockProducts.length);
    console.log('');

    // Get all products
    console.log('5️⃣ Getting all products...');
    const products = await SupabaseInventoryService.getAllProducts();
    console.log('Products count:', products.length);
    if (products.length > 0) {
      console.log('First product:', products[0]);
    }
    console.log('');

    // Get all suppliers
    console.log('6️⃣ Getting all suppliers...');
    const suppliers = await SupabaseInventoryService.getAllSuppliers();
    console.log('Suppliers count:', suppliers.length);
    if (suppliers.length > 0) {
      console.log('First supplier:', suppliers[0]);
    }
    console.log('');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testInventorySystem();
}

module.exports = { testInventorySystem };