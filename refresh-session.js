// Script para forzar la actualización de la sesión con los nuevos metadatos
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function refreshSession() {
  try {
    console.log("🔄 Forzando actualización de sesión...");
    
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ";
    const baseUrl = "http://localhost:3000";
    
    // Crear un endpoint temporal para forzar la actualización de la sesión
    const url = `${baseUrl}/api/refresh-session`;
    
    console.log("📡 Enviando petición POST a:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    console.log("📋 Respuesta del servidor:", response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Sesión actualizada:", result);
    } else {
      const error = await response.text();
      console.error("❌ Error actualizando sesión:", error);
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error);
  }
}

// Ejecutar la función
refreshSession();