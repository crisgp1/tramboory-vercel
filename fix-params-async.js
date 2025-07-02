const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan ser arreglados
const filesToFix = [
  'app/api/admin/packages/[id]/route.ts',
  'app/api/inventory/purchase-orders/[id]/route.ts'
];

// Función para arreglar un archivo
function fixFile(filePath) {
  console.log(`Arreglando ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Buscar funciones que necesitan ser arregladas
    const functionPatterns = [
      /export async function (GET|PUT|POST|PATCH|DELETE)\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ (id|userId): string \} \}\s*\)/g,
      /export async function (GET|PUT|POST|PATCH|DELETE)\(\s*request: NextRequest,\s*\{ params \}: \{ params: \{ (id|userId): string; \} \}\s*\)/g
    ];

    functionPatterns.forEach(pattern => {
      content = content.replace(pattern, (match, method, paramName) => {
        modified = true;
        return `export async function ${method}(\n  request: NextRequest,\n  context: { params: Promise<{ ${paramName}: string }> }\n)`;
      });
    });

    // Buscar y arreglar referencias a params sin await
    const lines = content.split('\n');
    const fixedLines = [];
    let insideFunction = false;
    let functionHasParamsDeclaration = false;
    let currentFunction = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Detectar inicio de función
      if (line.includes('export async function') && line.includes('context: { params: Promise<{')) {
        insideFunction = true;
        functionHasParamsDeclaration = false;
        currentFunction = line.match(/export async function (\w+)/)?.[1];
      }
      
      // Detectar final de función
      if (insideFunction && line.trim() === '}' && lines[i-1] && !lines[i-1].trim().endsWith(',')) {
        insideFunction = false;
        functionHasParamsDeclaration = false;
        currentFunction = null;
      }
      
      // Si estamos dentro de una función y encontramos una referencia a params
      if (insideFunction && line.includes('params.') && !line.includes('await context.params') && !line.includes('const params = await context.params')) {
        // Si no hemos declarado params aún en esta función
        if (!functionHasParamsDeclaration) {
          // Buscar el lugar apropiado para insertar la declaración
          if (line.trim().startsWith('await dbConnect()') || 
              line.trim().startsWith('const') || 
              line.trim().startsWith('if') ||
              line.includes('params.')) {
            
            // Insertar la declaración de params antes de esta línea
            const indent = line.match(/^(\s*)/)[1];
            fixedLines.push(`${indent}const params = await context.params;`);
            functionHasParamsDeclaration = true;
            modified = true;
          }
        }
      }
      
      fixedLines.push(line);
    }

    if (modified) {
      fs.writeFileSync(filePath, fixedLines.join('\n'));
      console.log(`✅ ${filePath} arreglado`);
    } else {
      console.log(`ℹ️  ${filePath} no necesitaba cambios`);
    }
    
  } catch (error) {
    console.error(`❌ Error arreglando ${filePath}:`, error.message);
  }
}

// Arreglar todos los archivos
filesToFix.forEach(fixFile);

console.log('🎉 Proceso completado');