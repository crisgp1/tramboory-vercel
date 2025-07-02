// Script de diagnóstico para verificar roles de usuario en Clerk
// Ejecutar en la consola del navegador cuando estés logueado

console.log("=== DIAGNÓSTICO DE ROLES TRAMBOORY ===");

// Verificar si Clerk está disponible
if (typeof window !== 'undefined' && window.__clerk_db_jwt) {
  console.log("✅ Clerk está cargado");
  
  // Obtener información del usuario desde el token JWT
  try {
    const token = window.__clerk_db_jwt;
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("📋 Información del token JWT:", {
      userId: payload.sub,
      sessionId: payload.sid,
      metadata: payload.metadata || "No metadata encontrada"
    });
  } catch (e) {
    console.log("❌ Error al decodificar JWT:", e);
  }
} else {
  console.log("❌ Clerk no está disponible o no hay sesión activa");
}

// Verificar localStorage de Clerk
const clerkKeys = Object.keys(localStorage).filter(key => key.includes('clerk'));
console.log("🔑 Claves de Clerk en localStorage:", clerkKeys);

clerkKeys.forEach(key => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      const parsed = JSON.parse(value);
      console.log(`📦 ${key}:`, parsed);
    }
  } catch (e) {
    console.log(`❌ Error al parsear ${key}:`, e);
  }
});

// Verificar si hay un hook useUser disponible
if (typeof React !== 'undefined') {
  console.log("⚛️ React está disponible");
} else {
  console.log("❌ React no está disponible en el contexto global");
}

// Verificar cookies relacionadas con Clerk
const cookies = document.cookie.split(';').filter(cookie => 
  cookie.includes('clerk') || cookie.includes('__session')
);
console.log("🍪 Cookies relacionadas con Clerk:", cookies);

// Verificar el estado actual de la página
console.log("📍 Información de la página actual:", {
  url: window.location.href,
  pathname: window.location.pathname,
  userAgent: navigator.userAgent
});

// Verificar si hay errores en la consola
console.log("🔍 Para verificar tu rol actual:");
console.log("1. Abre las herramientas de desarrollador (F12)");
console.log("2. Ve a la pestaña 'Application' o 'Aplicación'");
console.log("3. Busca en 'Local Storage' las entradas que contengan 'clerk'");
console.log("4. Busca en 'Cookies' las entradas relacionadas con la sesión");

console.log("=== FIN DEL DIAGNÓSTICO ===");