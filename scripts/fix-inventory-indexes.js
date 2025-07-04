const { MongoClient } = require('mongodb');

// Configuración de conexión - ajusta según tu configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tramboory';

async function fixInventoryIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const inventoryCollection = db.collection('inventory');
    
    // Obtener índices existentes
    const indexes = await inventoryCollection.indexes();
    console.log('Índices existentes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Buscar índices duplicados de batches.batchId
    const batchIdIndexes = indexes.filter(idx => 
      idx.key && idx.key['batches.batchId'] === 1
    );
    
    console.log('Índices de batches.batchId encontrados:', batchIdIndexes.length);
    
    // Eliminar índices duplicados (mantener solo uno)
    if (batchIdIndexes.length > 1) {
      for (let i = 1; i < batchIdIndexes.length; i++) {
        const indexName = batchIdIndexes[i].name;
        console.log(`Eliminando índice duplicado: ${indexName}`);
        try {
          await inventoryCollection.dropIndex(indexName);
          console.log(`✓ Índice ${indexName} eliminado`);
        } catch (error) {
          console.log(`⚠ Error eliminando índice ${indexName}:`, error.message);
        }
      }
    }
    
    // Verificar índices después de la limpieza
    const finalIndexes = await inventoryCollection.indexes();
    console.log('\nÍndices después de la limpieza:');
    finalIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log('\n✅ Limpieza de índices completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  fixInventoryIndexes().catch(console.error);
}

module.exports = { fixInventoryIndexes };