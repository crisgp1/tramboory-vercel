const { SupabaseInventoryService } = require('../lib/supabase/inventory');

const sampleProducts = [
  {
    product_id: 'PROD-001',
    name: 'Coca Cola 355ml',
    category: 'Bebidas',
    description: 'Refresco de cola en lata de 355ml',
    base_unit: 'lata',
    stock_unit: 'lata',
    stock_minimum: 50,
    stock_reorder_point: 100,
    is_active: true,
    is_perishable: false,
    requires_batch: true,
    created_by: 'system',
    updated_by: 'system'
  },
  {
    product_id: 'PROD-002', 
    name: 'Pan Blanco Bimbo',
    category: 'Panadería',
    description: 'Pan blanco rebanado de 680g',
    base_unit: 'pieza',
    stock_unit: 'pieza', 
    stock_minimum: 20,
    stock_reorder_point: 40,
    is_active: true,
    is_perishable: true,
    requires_batch: true,
    expiry_has_expiry: true,
    expiry_shelf_life_days: 7,
    expiry_warning_days: 2,
    created_by: 'system',
    updated_by: 'system'
  },
  {
    product_id: 'PROD-003',
    name: 'Cerveza Corona 355ml',
    category: 'Bebidas Alcohólicas',
    description: 'Cerveza Corona en botella de 355ml',
    base_unit: 'botella',
    stock_unit: 'botella',
    stock_minimum: 30,
    stock_reorder_point: 60,
    is_active: true,
    is_perishable: false,
    requires_batch: true,
    created_by: 'system',
    updated_by: 'system'
  },
  {
    product_id: 'PROD-004',
    name: 'Papas Fritas Sabritas',
    category: 'Snacks',
    description: 'Papas fritas naturales 170g',
    base_unit: 'bolsa',
    stock_unit: 'bolsa',
    stock_minimum: 25,
    stock_reorder_point: 50,
    is_active: true,
    is_perishable: false,
    requires_batch: true,
    created_by: 'system',
    updated_by: 'system'
  },
  {
    product_id: 'PROD-005',
    name: 'Leche Lala Entera 1L',
    category: 'Lácteos',
    description: 'Leche entera ultrapasteurizada 1 litro',
    base_unit: 'litro',
    stock_unit: 'litro',
    stock_minimum: 40,
    stock_reorder_point: 80,
    is_active: true,
    is_perishable: true,
    requires_batch: true,
    expiry_has_expiry: true,
    expiry_shelf_life_days: 14,
    expiry_warning_days: 3,
    created_by: 'system',
    updated_by: 'system'
  }
];

async function populateProducts() {
  try {
    console.log('🚀 Populating sample products in Supabase...');
    
    for (const product of sampleProducts) {
      try {
        const result = await SupabaseInventoryService.createProduct(product);
        console.log(`✅ Created product: ${result.name} (${result.category})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`⚠️  Product ${product.product_id} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating product ${product.product_id}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Sample products population completed!');
    
    // Test the categories API
    console.log('\n📦 Testing categories API...');
    const categories = await SupabaseInventoryService.getProductCategories();
    console.log(`Found ${categories.length} categories:`, categories);
    
  } catch (error) {
    console.error('❌ Error populating products:', error);
  }
}

if (require.main === module) {
  populateProducts().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populateProducts, sampleProducts };