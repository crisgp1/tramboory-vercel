const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vliglqpzncrbqrrkzuhc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaWdscXB6bmNyYnFycmt6dWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk1NjY0NywiZXhwIjoyMDY4NTMyNjQ3fQ.MZYgFIVyrSv1U4G17PX2jTALVKKAdSuInwUuQEehvP8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestInventory() {
  console.log('🏗️ Creating test inventory data...\n');

  try {
    // First, get the existing products
    console.log('1️⃣ Getting existing products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku');

    if (productsError) throw productsError;
    console.log(`Found ${products.length} products:`, products.map(p => p.name).join(', '));

    if (products.length === 0) {
      console.log('❌ No products found. Cannot create inventory.');
      return;
    }

    // Create inventory records for each product
    console.log('\n2️⃣ Creating inventory records...');
    
    const inventoryData = [];
    products.forEach((product, index) => {
      inventoryData.push({
        product_id: product.id,
        location_id: 'almacen',
        location_name: 'Almacén Principal',
        total_available: 50 + (index * 25), // Different stock levels
        total_reserved: 5,
        total_quarantine: 0,
        total_unit: 'unit',
        last_updated_by: 'system'
      });

      // Add some to kitchen location too
      inventoryData.push({
        product_id: product.id,
        location_id: 'cocina',
        location_name: 'Cocina',
        total_available: 10 + (index * 5),
        total_reserved: 2,
        total_quarantine: 0,
        total_unit: 'unit',
        last_updated_by: 'system'
      });
    });

    const { data: inventoryResult, error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryData)
      .select();

    if (inventoryError) throw inventoryError;
    console.log(`✅ Created ${inventoryResult.length} inventory records`);

    // Create some inventory batches
    console.log('\n3️⃣ Creating inventory batches...');
    
    const batchData = [];
    inventoryResult.forEach((inv, index) => {
      batchData.push({
        inventory_id: inv.id,
        batch_id: `BATCH-${Date.now()}-${index}`,
        quantity: inv.total_available,
        unit: inv.total_unit,
        cost_per_unit: 25.50 + (index * 2.5),
        received_date: new Date().toISOString().split('T')[0],
        status: 'available'
      });
    });

    const { data: batchResult, error: batchError } = await supabase
      .from('inventory_batches')
      .insert(batchData)
      .select();

    if (batchError) throw batchError;
    console.log(`✅ Created ${batchResult.length} inventory batches`);

    console.log('\n✅ Test inventory data created successfully!');
    
    // Show summary
    console.log('\n📊 Summary:');
    const { data: summary, error: summaryError } = await supabase
      .from('inventory')
      .select(`
        id,
        location_id,
        total_available,
        products(name)
      `);

    if (summaryError) throw summaryError;
    
    summary.forEach(item => {
      console.log(`- ${item.products.name} at ${item.location_id}: ${item.total_available} units`);
    });

  } catch (error) {
    console.error('❌ Error creating test inventory:', error.message);
    console.error('Full error:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createTestInventory();
}

module.exports = { createTestInventory };