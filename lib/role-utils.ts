"use client"

import { UserRole } from "./roles"

export class RoleManager {
  /**
   * Fuerza la actualización del rol de un usuario
   */
  static async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        console.log(`✅ Rol actualizado a ${newRole} para usuario ${userId}`)
        return true
      } else {
        const error = await response.json()
        console.error(`❌ Error actualizando rol:`, error)
        return false
      }
    } catch (error) {
      console.error(`❌ Error en la petición:`, error)
      return false
    }
  }

  /**
   * Obtiene el rol actual de un usuario
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const response = await fetch(`/api/users/${userId}/role`)
      
      if (response.ok) {
        const data = await response.json()
        return data.role
      } else {
        console.error(`❌ Error obteniendo rol del usuario ${userId}`)
        return null
      }
    } catch (error) {
      console.error(`❌ Error en la petición:`, error)
      return null
    }
  }

  /**
   * Fuerza la recarga de la sesión del usuario
   */
  static async forceSessionReload(): Promise<void> {
    try {
      // Forzar recarga de la página para actualizar la sesión
      window.location.reload()
    } catch (error) {
      console.error(`❌ Error recargando sesión:`, error)
    }
  }

  /**
   * Verifica si un usuario tiene acceso al dashboard
   */
  static canAccessDashboard(role: UserRole): boolean {
    return role !== "customer"
  }

  /**
   * Diagnóstica problemas comunes de roles
   */
  static diagnoseRoleIssues(user: any, expectedRole?: UserRole): string[] {
    const issues: string[] = []

    if (!user) {
      issues.push("❌ No hay usuario autenticado")
      return issues
    }

    if (!user.publicMetadata) {
      issues.push("❌ No se encontró publicMetadata en el usuario")
    }

    if (!user.publicMetadata?.role) {
      issues.push("❌ No se encontró rol en publicMetadata")
    }

    const currentRole = user.publicMetadata?.role
    if (expectedRole && currentRole !== expectedRole) {
      issues.push(`❌ Rol esperado: ${expectedRole}, rol actual: ${currentRole}`)
    }

    if (currentRole === "customer" && window.location.pathname.includes("/dashboard")) {
      issues.push("❌ Usuario customer intentando acceder al dashboard")
    }

    if (issues.length === 0) {
      issues.push("✅ No se detectaron problemas de roles")
    }

    return issues
  }

  /**
   * Herramienta de debugging para roles
   */
  static debugRole(user: any): void {
    console.group("🔍 Role Debug Information")
    console.log("Usuario:", user)
    console.log("ID:", user?.id)
    console.log("Public Metadata:", user?.publicMetadata)
    console.log("Rol detectado:", user?.publicMetadata?.role || "No definido")
    console.log("URL actual:", window.location.pathname)
    console.log("Puede acceder al dashboard:", this.canAccessDashboard(user?.publicMetadata?.role || "customer"))
    
    const issues = this.diagnoseRoleIssues(user)
    console.log("Problemas detectados:", issues)
    console.groupEnd()
  }
}

/**
 * Hook personalizado para gestión avanzada de roles
 */
export function useAdvancedRole() {
  const forceRoleUpdate = async (userId: string, newRole: UserRole) => {
    const success = await RoleManager.updateUserRole(userId, newRole)
    if (success) {
      // Esperar un poco y recargar la sesión
      setTimeout(() => {
        RoleManager.forceSessionReload()
      }, 1000)
    }
    return success
  }

  const diagnoseCurrentUser = (user: any) => {
    return RoleManager.diagnoseRoleIssues(user)
  }

  const debugCurrentUser = (user: any) => {
    RoleManager.debugRole(user)
  }

  return {
    forceRoleUpdate,
    diagnoseCurrentUser,
    debugCurrentUser,
    canAccessDashboard: RoleManager.canAccessDashboard
  }
}