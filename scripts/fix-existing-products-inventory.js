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

// Esquemas
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

async function fixExistingProducts() {
  try {
    console.log('🔍 Buscando productos sin registros de inventario...');
    
    // Obtener todos los productos activos
    const products = await Product.find({ isActive: true });
    console.log(`📦 Encontrados ${products.length} productos activos`);

    const defaultLocations = [
      { id: 'almacen', name: 'Almacén Principal' },
      { id: 'cocina', name: 'Cocina' }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      console.log(`\n🔄 Procesando producto: ${product.name} (${product.sku})`);
      
      for (const location of defaultLocations) {
        // Verificar si ya existe inventario para este producto en esta ubicación
        const existingInventory = await Inventory.findOne({
          productId: product._id,
          locationId: location.id
        });

        if (existingInventory) {
          console.log(`  ⏭️  Ya existe inventario en ${location.name}`);
          skippedCount++;
        } else {
          // Crear registro de inventario
          const inventory = new Inventory({
            productId: product._id,
            locationId: location.id,
            locationName: location.name,
            batches: [],
            totals: {
              available: 0,
              reserved: 0,
              quarantine: 0,
              unit: product.baseUnit || product.units?.base?.code || 'pz'
            },
            lastUpdated: new Date(),
            lastUpdatedBy: 'system-fix'
          });

          await inventory.save();
          console.log(`  ✅ Creado inventario en ${location.name}`);
          createdCount++;
        }
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`- Registros de inventario creados: ${createdCount}`);
    console.log(`- Registros ya existentes: ${skippedCount}`);

    // Verificar el estado final
    console.log('\n🔍 Verificando estado final...');
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalInventory = await Inventory.countDocuments();
    const productsWithInventory = await Inventory.distinct('productId');

    console.log(`- Productos activos: ${totalProducts}`);
    console.log(`- Registros de inventario: ${totalInventory}`);
    console.log(`- Productos con inventario: ${productsWithInventory.length}`);

    if (productsWithInventory.length === totalProducts) {
      console.log('✅ Todos los productos tienen registros de inventario');
    } else {
      console.log('⚠️  Algunos productos aún no tienen registros de inventario');
    }

    // Mostrar algunos ejemplos
    console.log('\n📋 Ejemplos de inventario creado:');
    const sampleInventory = await Inventory.find()
      .populate('productId', 'name sku')
      .limit(5);
    
    sampleInventory.forEach(inv => {
      console.log(`  - ${inv.productId.name} (${inv.productId.sku}) en ${inv.locationName}: ${inv.totals.available} ${inv.totals.unit}`);
    });

  } catch (error) {
    console.error('❌ Error procesando productos:', error);
  }
}

async function main() {
  await connectDB();
  await fixExistingProducts();
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de MongoDB');
  console.log('✅ Proceso completado');
}

main().catch(console.error);