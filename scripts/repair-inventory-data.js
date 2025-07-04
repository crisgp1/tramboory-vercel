const { MongoClient } = require('mongodb');

// Configuración de conexión - ajusta según tu configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tramboory';

async function repairInventoryData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const inventoryCollection = db.collection('inventory');
    const movementsCollection = db.collection('inventorymovements');
    
    console.log('🔍 Verificando datos de inventario...');
    
    // Obtener todos los registros de inventario
    const inventories = await inventoryCollection.find({}).toArray();
    console.log(`📦 Encontrados ${inventories.length} registros de inventario`);
    
    let repairedCount = 0;
    
    for (const inventory of inventories) {
      let needsRepair = false;
      let newTotals = {
        available: 0,
        reserved: 0,
        quarantine: 0,
        unit: inventory.totals.unit
      };
      
      // Recalcular totales basado en lotes
      if (inventory.batches && inventory.batches.length > 0) {
        inventory.batches.forEach(batch => {
          if (batch.quantity > 0) {
            switch (batch.status) {
              case 'available':
                newTotals.available += batch.quantity;
                break;
              case 'reserved':
                newTotals.reserved += batch.quantity;
                break;
              case 'quarantine':
                newTotals.quarantine += batch.quantity;
                break;
            }
          }
        });
      }
      
      // Verificar si los totales necesitan corrección
      if (
        inventory.totals.available !== newTotals.available ||
        inventory.totals.reserved !== newTotals.reserved ||
        inventory.totals.quarantine !== newTotals.quarantine
      ) {
        needsRepair = true;
        console.log(`🔧 Reparando inventario ${inventory._id}:`);
        console.log(`  - Producto: ${inventory.productId}`);
        console.log(`  - Ubicación: ${inventory.locationId}`);
        console.log(`  - Disponible: ${inventory.totals.available} → ${newTotals.available}`);
        console.log(`  - Reservado: ${inventory.totals.reserved} → ${newTotals.reserved}`);
        console.log(`  - Cuarentena: ${inventory.totals.quarantine} → ${newTotals.quarantine}`);
      }
      
      // Limpiar lotes con cantidad 0 o negativa
      const validBatches = inventory.batches.filter(batch => batch.quantity > 0);
      if (validBatches.length !== inventory.batches.length) {
        needsRepair = true;
        console.log(`🧹 Limpiando ${inventory.batches.length - validBatches.length} lotes vacíos`);
      }
      
      // Aplicar reparaciones
      if (needsRepair) {
        await inventoryCollection.updateOne(
          { _id: inventory._id },
          {
            $set: {
              totals: newTotals,
              batches: validBatches,
              lastUpdated: new Date()
            }
          }
        );
        repairedCount++;
      }
    }
    
    console.log(`\n✅ Reparación completada:`);
    console.log(`   - ${repairedCount} registros reparados`);
    console.log(`   - ${inventories.length - repairedCount} registros ya estaban correctos`);
    
    // Verificar movimientos huérfanos
    console.log('\n🔍 Verificando movimientos de inventario...');
    const movements = await movementsCollection.find({}).toArray();
    console.log(`📋 Encontrados ${movements.length} movimientos`);
    
    // Estadísticas de movimientos
    const movementStats = {};
    movements.forEach(movement => {
      const type = movement.type || 'UNKNOWN';
      movementStats[type] = (movementStats[type] || 0) + 1;
    });
    
    console.log('📊 Estadísticas de movimientos:');
    Object.entries(movementStats).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  repairInventoryData().catch(console.error);
}

module.exports = { repairInventoryData };