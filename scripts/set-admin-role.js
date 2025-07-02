const { clerkClient } = require('@clerk/nextjs/server')

// Obtener el cliente de Clerk
const clerk = clerkClient()

async function setUserAsAdmin() {
  try {
    const userId = "user_2yvCESw1sdoMeeVPq22GoGajddZ"
    const email = "cristiangp2001@gmail.com"
    
    console.log(`🔄 Cambiando rol de usuario ${email} (${userId}) a admin...`)
    
    // Actualizar el rol directamente usando Clerk
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'admin'
      }
    })
    
    console.log("✅ Rol cambiado exitosamente a admin")
    console.log("🔄 El usuario ahora puede acceder al dashboard")
    
    // Verificar el cambio
    const user = await clerk.users.getUser(userId)
    console.log("📋 Rol actual:", user.publicMetadata?.role)
    
  } catch (error) {
    console.error("❌ Error cambiando rol:", error)
  }
}

setUserAsAdmin()