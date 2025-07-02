// Script para verificar los metadatos del usuario en Clerk
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkUserMetadata() {
  try {
    console.log("🔍 Verificando metadatos del usuario...");
    
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ";
    const baseUrl = "http://localhost:3000";
    const url = `${baseUrl}/api/users/${userId}/role`;
    
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
      console.log("✅ Metadatos del usuario:", result);
    } else {
      const error = await response.text();
      console.error("❌ Error obteniendo metadatos:", error);
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error);
  }
}

// Ejecutar la función
checkUserMetadata();