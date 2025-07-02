"use client"

import { useUser } from "@clerk/nextjs"
import { UserRole, DEFAULT_ROLE, hasPermission } from "@/lib/roles"
import { useEffect, useState } from "react"

export function useRole() {
  const { user, isLoaded } = useUser()
  const [roleLoaded, setRoleLoaded] = useState(false)
  const [freshRole, setFreshRole] = useState<UserRole | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Priorizar el rol del publicMetadata si existe, sino usar freshRole, sino DEFAULT_ROLE
  const currentRole = (user?.publicMetadata?.role as UserRole) || freshRole || DEFAULT_ROLE
  
  // Solo usar el rol si está completamente inicializado
  const role = isInitialized ? currentRole : DEFAULT_ROLE

  // Función para obtener rol fresco del servidor
  const fetchFreshRole = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/users/${user.id}/role`)
      if (response.ok) {
        const data = await response.json()
        setFreshRole(data.role)
        console.log("🔄 Fresh role fetched:", data.role)
      }
    } catch (error) {
      console.error("❌ Error fetching fresh role:", error)
    }
  }

  // Inicialización mejorada para evitar redirecciones no deseadas
  useEffect(() => {
    if (isLoaded && user) {
      const currentRole = user.publicMetadata?.role as UserRole
      
      // Si ya tenemos un rol válido en publicMetadata, usarlo inmediatamente
      if (currentRole && currentRole !== "customer") {
        setIsInitialized(true)
        setRoleLoaded(true)
        console.log("✅ Role initialized from publicMetadata:", currentRole)
        return
      }
      
      // Solo si el rol es customer o no existe, verificar con el servidor
      if (currentRole === "customer" || !currentRole) {
        console.log("🔄 Fetching fresh role for customer/undefined role")
        fetchFreshRole().then(() => {
          setIsInitialized(true)
          setRoleLoaded(true)
        })
      } else {
        setIsInitialized(true)
        setRoleLoaded(true)
      }
    } else if (isLoaded && !user) {
      setIsInitialized(true)
      setRoleLoaded(true)
    }
  }, [isLoaded, user])

  // Logging para debugging (reducido para evitar spam)
  useEffect(() => {
    if (isLoaded && user && isInitialized) {
      console.log("🔍 Role Debug Info:", {
        userId: user.id,
        finalRole: role,
        publicMetadataRole: user.publicMetadata?.role,
        freshRole,
        isInitialized,
        roleLoaded
      })
    }
  }, [isLoaded, user, role, isInitialized, roleLoaded])

  const checkPermission = (permission: string): boolean => {
    return hasPermission(role, permission)
  }

  const isRole = (targetRole: UserRole): boolean => {
    return role === targetRole
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(role)
  }

  // Función para forzar actualización del usuario
  const refreshUser = async () => {
    if (user) {
      try {
        await user.reload()
        await fetchFreshRole() // También obtener rol fresco
        setIsInitialized(true)
        console.log("✅ Usuario actualizado")
      } catch (error) {
        console.error("❌ Error actualizando usuario:", error)
      }
    }
  }

  return {
    role,
    isLoaded: isLoaded && roleLoaded && isInitialized,
    checkPermission,
    isRole,
    hasAnyRole,
    isAdmin: role === "admin",
    isGerente: role === "gerente",
    isProveedor: role === "proveedor",
    isVendedor: role === "vendedor",
    isCustomer: role === "customer",
    refreshUser,
    // Información adicional para debugging
    debug: {
      userLoaded: isLoaded,
      roleLoaded,
      isInitialized,
      hasUser: !!user,
      publicMetadata: user?.publicMetadata,
      freshRole,
      finalRole: role,
      currentRole
    }
  }
}