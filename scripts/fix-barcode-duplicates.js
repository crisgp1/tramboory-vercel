const { MongoClient } = require('mongodb');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function fixBarcodeDuplicates() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const collection = db.collection('products');
    
    // Buscar productos con barcode vacío o solo espacios
    const productsWithEmptyBarcode = await collection.find({
      $or: [
        { barcode: "" },
        { barcode: /^\s*$/ },
        { barcode: null }
      ]
    }).toArray();
    
    console.log(`📊 Encontrados ${productsWithEmptyBarcode.length} productos con barcode vacío`);
    
    if (productsWithEmptyBarcode.length > 0) {
      // Actualizar productos para remover el campo barcode vacío
      const result = await collection.updateMany(
        {
          $or: [
            { barcode: "" },
            { barcode: /^\s*$/ },
            { barcode: null }
          ]
        },
        {
          $unset: { barcode: "" }
        }
      );
      
      console.log(`✅ Actualizados ${result.modifiedCount} productos - removido barcode vacío`);
    }
    
    // Verificar si hay duplicados reales (no vacíos)
    const duplicateBarcodes = await collection.aggregate([
      {
        $match: {
          barcode: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$barcode",
          count: { $sum: 1 },
          products: { $push: { _id: "$_id", name: "$name" } }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();
    
    if (duplicateBarcodes.length > 0) {
      console.log('⚠️ Encontrados códigos de barras duplicados (no vacíos):');
      duplicateBarcodes.forEach(dup => {
        console.log(`  - Barcode: ${dup._id} (${dup.count} productos)`);
        dup.products.forEach(prod => {
          console.log(`    * ${prod.name} (ID: ${prod._id})`);
        });
      });
      console.log('🔧 Estos duplicados necesitan ser resueltos manualmente');
    } else {
      console.log('✅ No se encontraron códigos de barras duplicados');
    }
    
    console.log('🎉 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
fixBarcodeDuplicates().catch(console.error);