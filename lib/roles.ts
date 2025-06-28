export type UserRole = "customer" | "admin" | "proveedor" | "vendedor" | "gerente"

export const ROLES: Record<UserRole, { label: string; description: string; permissions: string[] }> = {
  customer: {
    label: "Cliente",
    description: "Usuario cliente con acceso básico",
    permissions: ["view_profile", "edit_profile", "view_products"]
  },
  admin: {
    label: "Administrador",
    description: "Acceso completo al sistema",
    permissions: ["*"]
  },
  proveedor: {
    label: "Proveedor",
    description: "Gestión de productos y inventario",
    permissions: ["view_profile", "edit_profile", "manage_products", "view_orders", "manage_inventory"]
  },
  vendedor: {
    label: "Vendedor",
    description: "Gestión de ventas y clientes",
    permissions: ["view_profile", "edit_profile", "view_products", "manage_sales", "view_customers", "create_orders"]
  },
  gerente: {
    label: "Gerente",
    description: "Supervisión y reportes",
    permissions: ["view_profile", "edit_profile", "view_products", "view_sales", "view_customers", "view_reports", "manage_team"]
  }
}

export const DEFAULT_ROLE: UserRole = "customer"

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLES[userRole]?.permissions || []
  return rolePermissions.includes("*") || rolePermissions.includes(permission)
}

export function canAccessRole(currentRole: UserRole, targetRole: UserRole): boolean {
  // Solo admin puede cambiar roles
  if (currentRole === "admin") return true
  
  // Los gerentes pueden gestionar vendedores y clientes
  if (currentRole === "gerente" && (targetRole === "vendedor" || targetRole === "customer")) {
    return true
  }
  
  return false
}

export function getRoleHierarchy(): UserRole[] {
  return ["admin", "gerente", "proveedor", "vendedor", "customer"]
}

export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = getRoleHierarchy()
  return hierarchy.indexOf(role1) < hierarchy.indexOf(role2)
}