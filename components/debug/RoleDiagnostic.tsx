"use client"

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRole } from '@/hooks/useRole'
import { Card, Badge, Button } from '@mantine/core'
import { UserRole, ROLES } from '@/lib/roles'
import { useAdvancedRole, RoleManager } from '@/lib/role-utils'

export default function RoleDiagnostic() {
  const { user, isLoaded } = useUser()
  const { role, isAdmin, isGerente, isProveedor, isVendedor, isCustomer, refreshUser, debug } = useRole()
  const { forceRoleUpdate, diagnoseCurrentUser, debugCurrentUser } = useAdvancedRole()

  if (!isLoaded) {
    return (
      <Card className="max-w-2xl mx-auto">
        <Card.Section className="p-6">
          <p>Cargando información del usuario...</p>
        </Card.Section>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <Card.Section className="p-6">
          <p className="text-red-600">No hay usuario autenticado</p>
        </Card.Section>
      </Card>
    )
  }

  const roleInfo = ROLES[role as UserRole]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Card.Section className="p-6">
          <h2 className="text-xl font-bold mb-4">🔍 Diagnóstico de Roles - Tramboory</h2>
          
          {/* Información del Usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Información del Usuario</h3>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Nombre:</strong> {user.fullName || 'No disponible'}</p>
                <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                <p><strong>Verificado:</strong> {user.primaryEmailAddress?.verification?.status === 'verified' ? '✅' : '❌'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Información de Rol</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Rol Actual:</strong> 
                  <Badge 
                    size="sm" 
                    className="ml-2"
                    color={role === "admin" ? "red" : role === "customer" ? "gray" : "blue"}
                  >
                    {role}
                  </Badge>
                </p>
                <p><strong>Etiqueta:</strong> {roleInfo?.label || 'No definida'}</p>
                <p><strong>Descripción:</strong> {roleInfo?.description || 'No disponible'}</p>
              </div>
            </div>
          </div>

          {/* Metadata de Clerk */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Metadata de Clerk</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm"><strong>Public Metadata:</strong></p>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify(user.publicMetadata, null, 2)}
              </pre>
              <p className="text-sm mt-4"><strong>Unsafe Metadata:</strong></p>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify(user.unsafeMetadata, null, 2)}
              </pre>
            </div>
          </div>

          {/* Verificaciones de Rol */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Verificaciones de Rol</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Badge color={isAdmin ? "green" : "gray"} variant="outline">
                Admin: {isAdmin ? "✅" : "❌"}
              </Badge>
              <Badge color={isGerente ? "green" : "gray"} variant="outline">
                Gerente: {isGerente ? "✅" : "❌"}
              </Badge>
              <Badge color={isProveedor ? "green" : "gray"} variant="outline">
                Proveedor: {isProveedor ? "✅" : "❌"}
              </Badge>
              <Badge color={isVendedor ? "green" : "gray"} variant="outline">
                Vendedor: {isVendedor ? "✅" : "❌"}
              </Badge>
              <Badge color={isCustomer ? "green" : "gray"} variant="outline">
                Customer: {isCustomer ? "✅" : "❌"}
              </Badge>
            </div>
          </div>

          {/* Permisos */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Permisos del Rol</h3>
            <div className="flex flex-wrap gap-2">
              {roleInfo?.permissions.map((permission, index) => (
                <Badge key={index} size="sm" variant="outline" color="blue">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          {/* Acceso a Rutas */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Acceso a Rutas</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>/dashboard</span>
                <Badge 
                  size="sm" 
                  color={role !== "customer" ? "green" : "red"}
                  variant="outline"
                >
                  {role !== "customer" ? "✅ Permitido" : "❌ Bloqueado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>/reservaciones</span>
                <Badge size="sm" color="green" variant="outline">
                  ✅ Permitido
                </Badge>
              </div>
            </div>
          </div>

          {/* Acceso a Secciones del Dashboard */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Acceso a Secciones del Dashboard</h3>
            <div className="space-y-2">
              {[
                { section: "Analytics", allowed: isAdmin || isGerente },
                { section: "Reservas", allowed: true },
                { section: "Finanzas", allowed: isAdmin || isGerente },
                { section: "Configuración", allowed: isAdmin },
                { section: "Inventario", allowed: isAdmin || isGerente || role === "proveedor" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{item.section}</span>
                  <Badge 
                    size="sm" 
                    color={item.allowed ? "green" : "red"}
                    variant="outline"
                  >
                    {item.allowed ? "✅ Permitido" : "❌ Bloqueado"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Problemas Detectados */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-red-600">🚨 Problemas Detectados</h3>
            <div className="space-y-2">
              {diagnoseCurrentUser(user).map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded ${
                    issue.startsWith('✅')
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <p className="text-sm">{issue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de Debug */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">🔧 Estado de Debug</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>User Loaded:</strong> {debug.userLoaded ? "✅" : "❌"}</p>
                  <p><strong>Role Loaded:</strong> {debug.roleLoaded ? "✅" : "❌"}</p>
                </div>
                <div>
                  <p><strong>Has User:</strong> {debug.hasUser ? "✅" : "❌"}</p>
                  <p><strong>Can Access Dashboard:</strong> {RoleManager.canAccessDashboard(role) ? "✅" : "❌"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones de Depuración */}
          <div>
            <h3 className="font-semibold mb-2">Acciones de Depuración</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onClick={() => window.location.reload()}
              >
                Recargar Página
              </Button>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onClick={() => refreshUser()}
              >
                Actualizar Usuario
              </Button>
              <Button
                size="sm"
                color="warning"
                variant="flat"
                onClick={() => debugCurrentUser(user)}
              >
                Debug Completo
              </Button>
              <Button
                size="sm"
                color="success"
                variant="flat"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    userId: user.id,
                    role: role,
                    publicMetadata: user.publicMetadata,
                    debug: debug,
                    timestamp: new Date().toISOString()
                  }, null, 2))
                }}
              >
                Copiar Info
              </Button>
              {role === "customer" && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onClick={async () => {
                    const success = await forceRoleUpdate(user.id, "admin")
                    if (success) {
                      alert("Rol actualizado a admin. La página se recargará.")
                    } else {
                      alert("Error actualizando rol. Verifica los permisos.")
                    }
                  }}
                >
                  Forzar Admin (Solo para testing)
                </Button>
              )}
            </div>
          </div>
        </Card.Section>
      </Card>
    </div>
  )
}