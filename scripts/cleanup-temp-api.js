// Script para limpiar la API temporal después de cambiar el rol

const fs = require('fs')
const path = require('path')

const tempDir = path.join(process.cwd(), 'app', 'api', 'temp-admin')

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true })
  console.log("✅ API temporal eliminada")
} else {
  console.log("ℹ️ No se encontró API temporal para eliminar")
}