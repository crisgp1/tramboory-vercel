import { UserRole } from "./roles"

/**
 * Verifica si un rol es de administrador (versión servidor)
 */
export function isAdmin(role: UserRole | string): boolean {
  return role === "admin"
}

/**
 * Verifica si un rol es de gerente (versión servidor)
 */
export function isGerente(role: UserRole | string): boolean {
  return role === "gerente"
}

/**
 * Verifica si un rol es de proveedor (versión servidor)
 */
export function isProveedor(role: UserRole | string): boolean {
  return role === "proveedor"
}

/**
 * Verifica si un usuario tiene acceso al dashboard (versión servidor)
 */
export function canAccessDashboard(role: UserRole | string): boolean {
  return role !== "customer"
}

/**
 * Verifica si un usuario puede gestionar a otro usuario basado en sus roles
 */
export function canManageUser(managerRole: UserRole | string, targetRole: UserRole | string): boolean {
  // Admin puede gestionar a cualquier usuario
  if (isAdmin(managerRole)) {
    return true
  }
  
  // Gerente solo puede gestionar a vendedores y clientes
  if (isGerente(managerRole)) {
    return targetRole === "vendedor" || targetRole === "customer"
  }
  
  // Otros roles no pueden gestionar usuarios
  return false
}