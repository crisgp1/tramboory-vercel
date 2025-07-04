const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tramboory';
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Esquemas simplificados
const ProductSchema = new mongoose.Schema({
  productId: String,
  name: String,
  category: String,
  sku: String,
  baseUnit: String,
  units: {
    base: {
      code: String,
      name: String,
      category: String
    },
    alternatives: []
  },
  stockLevels: {
    minimum: Number,
    reorderPoint: Number,
    unit: String
  },
  suppliers: [],
  isActive: { type: Boolean, default: true },
  isPerishable: { type: Boolean, default: false },
  requiresBatch: { type: Boolean, default: true },
  createdBy: String,
  updatedBy: String
}, { timestamps: true, collection: 'products' });

const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  locationId: String,
  locationName: String,
  batches: [{
    batchId: String,
    quantity: Number,
    unit: String,
    costPerUnit: Number,
    expiryDate: Date,
    receivedDate: { type: Date, default: Date.now },
    status: { type: String, default: 'available' }
  }],
  totals: {
    available: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    quarantine: { type: Number, default: 0 },
    unit: String
  },
  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: String
}, { timestamps: true, collection: 'inventory' });

const Product = mongoose.model('Product', ProductSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);

async function createTestData() {
  try {
    console.log('🧹 Limpiando datos existentes...');
    await Product.deleteMany({});
    await Inventory.deleteMany({});

    console.log('📦 Creando productos de prueba...');
    
    // Crear productos de prueba
    const products = [
      {
        productId: 'PROD-001',
        name: 'Coca Cola 600ml',
        category: 'Bebidas',
        sku: 'COCA-600',
        baseUnit: 'pz',
        units: {
          base: {
            code: 'pz',
            name: 'Pieza',
            category: 'piece'
          },
          alternatives: []
        },
        stockLevels: {
          minimum: 10,
          reorderPoint: 20,
          unit: 'pz'
        },
        suppliers: [],
        isActive: true,
        isPerishable: false,
        requiresBatch: true,
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        productId: 'PROD-002',
        name: 'Agua Natural 1L',
        category: 'Bebidas',
        sku: 'AGUA-1L',
        baseUnit: 'pz',
        units: {
          base: {
            code: 'pz',
            name: 'Pieza',
            category: 'piece'
          },
          alternatives: []
        },
        stockLevels: {
          minimum: 20,
          reorderPoint: 40,
          unit: 'pz'
        },
        suppliers: [],
        isActive: true,
        isPerishable: false,
        requiresBatch: true,
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        productId: 'PROD-003',
        name: 'Sandwich Jamón y Queso',
        category: 'Alimentos',
        sku: 'SAND-JQ',
        baseUnit: 'pz',
        units: {
          base: {
            code: 'pz',
            name: 'Pieza',
            category: 'piece'
          },
          alternatives: []
        },
        stockLevels: {
          minimum: 5,
          reorderPoint: 15,
          unit: 'pz'
        },
        suppliers: [],
        isActive: true,
        isPerishable: true,
        requiresBatch: true,
        createdBy: 'system',
        updatedBy: 'system'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Creados ${createdProducts.length} productos`);

    console.log('📊 Creando inventario de prueba...');
    
    // Crear inventario para cada producto
    const inventoryData = [];
    
    for (const product of createdProducts) {
      // Inventario en almacén
      inventoryData.push({
        productId: product._id,
        locationId: 'almacen',
        locationName: 'Almacén Principal',
        batches: [
          {
            batchId: `BATCH-${product.sku}-001`,
            quantity: 50,
            unit: product.baseUnit,
            costPerUnit: 10.50,
            receivedDate: new Date(),
            status: 'available'
          }
        ],
        totals: {
          available: 50,
          reserved: 0,
          quarantine: 0,
          unit: product.baseUnit
        },
        lastUpdated: new Date(),
        lastUpdatedBy: 'system'
      });

      // Inventario en cocina (solo para algunos productos)
      if (product.category === 'Alimentos' || product.category === 'Bebidas') {
        inventoryData.push({
          productId: product._id,
          locationId: 'cocina',
          locationName: 'Cocina',
          batches: [
            {
              batchId: `BATCH-${product.sku}-002`,
              quantity: 15,
              unit: product.baseUnit,
              costPerUnit: 10.50,
              receivedDate: new Date(),
              status: 'available'
            }
          ],
          totals: {
            available: 15,
            reserved: 0,
            quarantine: 0,
            unit: product.baseUnit
          },
          lastUpdated: new Date(),
          lastUpdatedBy: 'system'
        });
      }
    }

    const createdInventory = await Inventory.insertMany(inventoryData);
    console.log(`✅ Creados ${createdInventory.length} registros de inventario`);

    // Verificar datos creados
    console.log('\n📋 Verificando datos creados:');
    const productCount = await Product.countDocuments();
    const inventoryCount = await Inventory.countDocuments();
    
    console.log(`- Productos: ${productCount}`);
    console.log(`- Registros de inventario: ${inventoryCount}`);

    // Mostrar algunos datos de ejemplo
    console.log('\n📦 Productos creados:');
    const sampleProducts = await Product.find().limit(3);
    sampleProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.sku}) - ${p.category}`);
    });

    console.log('\n📊 Inventario creado:');
    const sampleInventory = await Inventory.find().populate('productId', 'name sku').limit(5);
    sampleInventory.forEach(inv => {
      console.log(`  - ${inv.productId.name} en ${inv.locationName}: ${inv.totals.available} ${inv.totals.unit}`);
    });

    console.log('\n✅ Datos de prueba creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

async function main() {
  await connectDB();
  await createTestData();
  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

main().catch(console.error);