"use client"

import { useUser } from "@clerk/nextjs"
import { UserRole, DEFAULT_ROLE, hasPermission } from "@/lib/roles"

export function useRole() {
  const { user, isLoaded } = useUser()

  const role = (user?.publicMetadata?.role as UserRole) || DEFAULT_ROLE

  const checkPermission = (permission: string): boolean => {
    return hasPermission(role, permission)
  }

  const isRole = (targetRole: UserRole): boolean => {
    return role === targetRole
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(role)
  }

  return {
    role,
    isLoaded,
    checkPermission,
    isRole,
    hasAnyRole,
    isAdmin: role === "admin",
    isGerente: role === "gerente",
    isProveedor: role === "proveedor",
    isVendedor: role === "vendedor",
    isCustomer: role === "customer"
  }
}