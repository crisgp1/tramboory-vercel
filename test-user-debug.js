// Script para verificar los metadatos del usuario directamente desde Clerk
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugUser() {
  try {
    console.log("🔍 Verificando metadatos del usuario directamente...");
    
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ";
    const baseUrl = "http://localhost:3000";
    const url = `${baseUrl}/api/debug-user?userId=${userId}`;
    
    console.log("📡 Enviando petición GET a:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log("📋 Respuesta del servidor:", response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Datos completos del usuario:");
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.error("❌ Error obteniendo datos:", error);
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error);
  }
}

// Ejecutar la función
debugUser();