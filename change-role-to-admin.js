// Script para cambiar el rol del usuario actual a admin
// Ejecutar con: node change-role-to-admin.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function changeToAdmin() {
  try {
    console.log("🔄 Cambiando rol a admin...");
    
    // Obtener el ID del usuario actual
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ"; // Tu ID de usuario actual
    
    // Usar URL completa para el servidor local
    const baseUrl = "http://localhost:3000";
    const url = `${baseUrl}/api/temp-set-admin`;
    
    console.log("📡 Enviando petición a:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    console.log("📋 Respuesta del servidor:", response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Rol cambiado exitosamente:", result);
    } else {
      const error = await response.text();
      console.error("❌ Error cambiando rol:", error);
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error);
  }
}

// Ejecutar la función
changeToAdmin();