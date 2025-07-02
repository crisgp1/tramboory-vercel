// Script para limpiar los endpoints temporales creados para debugging
const fs = require('fs');
const path = require('path');

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Eliminado: ${filePath}`);
    } else {
      console.log(`⚠️  No existe: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error eliminando ${filePath}:`, error.message);
  }
}

function cleanupTempEndpoints() {
  console.log("🧹 Limpiando endpoints temporales...");
  
  const tempEndpoints = [
    'app/api/temp-set-admin/route.ts',
    'app/api/debug-user/route.ts',
    'app/api/refresh-session/route.ts'
  ];
  
  const tempScripts = [
    'change-role-to-admin.js',
    'debug-user-metadata.js',
    'test-user-debug.js',
    'refresh-session.js',
    'cleanup-temp-endpoints.js'
  ];
  
  console.log("\n📁 Eliminando endpoints temporales:");
  tempEndpoints.forEach(deleteFile);
  
  console.log("\n📄 Eliminando scripts temporales:");
  tempScripts.forEach(deleteFile);
  
  console.log("\n✅ Limpieza completada!");
  console.log("🔒 Los endpoints temporales han sido eliminados por seguridad.");
  console.log("👤 El usuario debe hacer login nuevamente para ver los cambios de rol.");
}

// Ejecutar la limpieza
cleanupTempEndpoints();