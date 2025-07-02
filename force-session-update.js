// Script para forzar la actualización de las session claims
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function forceSessionUpdate() {
  try {
    console.log("🔄 Forzando actualización de session claims...");
    
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ";
    const baseUrl = "http://localhost:3000";
    const url = `${baseUrl}/api/force-session-update`;
    
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
      console.log("✅ Session claims actualizadas:");
      console.log(JSON.stringify(result, null, 2));
      console.log("\n🔑 IMPORTANTE: El usuario debe hacer login nuevamente para ver los cambios.");
    } else {
      const error = await response.text();
      console.error("❌ Error actualizando session claims:", error);
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error);
  }
}

// Ejecutar la función
forceSessionUpdate();