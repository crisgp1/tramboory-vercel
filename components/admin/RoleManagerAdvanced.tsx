"use client"

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRole } from '@/hooks/useRole'
import { useAdvancedRole } from '@/lib/role-utils'
import { UserRole, ROLES } from '@/lib/roles'
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Input,
  Chip
} from '@heroui/react'
import { UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function RoleManagerAdvanced() {
  const { user } = useUser()
  const { role, isAdmin } = useRole()
  const { forceRoleUpdate } = useAdvancedRole()
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer")
  const [targetUserId, setTargetUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Solo admin puede usar este componente
  if (!isAdmin) {
    return (
      <Card>
        <CardBody className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">Solo los administradores pueden gestionar roles</p>
        </CardBody>
      </Card>
    )
  }

  const handleRoleUpdate = async () => {
    if (!targetUserId.trim()) {
      alert("Por favor ingresa un ID de usuario válido")
      return
    }

    setIsLoading(true)
    try {
      const success = await forceRoleUpdate(targetUserId, selectedRole)
      if (success) {
        alert(`Rol actualizado exitosamente a ${selectedRole}`)
        setTargetUserId("")
      } else {
        alert("Error actualizando el rol. Verifica el ID del usuario y los permisos.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error inesperado actualizando el rol")
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Hacer Admin",
      description: "Convertir usuario en administrador",
      role: "admin" as UserRole,
      color: "danger" as const
    },
    {
      title: "Hacer Gerente",
      description: "Convertir usuario en gerente",
      role: "gerente" as UserRole,
      color: "primary" as const
    },
    {
      title: "Hacer Customer",
      description: "Convertir usuario en cliente",
      role: "customer" as UserRole,
      color: "default" as const
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Gestión Avanzada de Roles</h2>
              <p className="text-sm text-gray-600">Herramientas para administradores</p>
            </div>
          </div>

          {/* Información del Admin Actual */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Tu Información</h3>
            <div className="flex items-center gap-3">
              <Chip color="danger" variant="flat">Admin</Chip>
              <span className="text-sm">{user?.fullName}</span>
              <span className="text-xs text-gray-600">{user?.id}</span>
            </div>
          </div>

          {/* Formulario de Actualización de Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                label="ID del Usuario"
                placeholder="user_xxxxxxxxxxxxxxxxx"
                value={targetUserId}
                onValueChange={setTargetUserId}
                startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                description="Ingresa el ID del usuario de Clerk"
              />
            </div>
            <div>
              <Select
                label="Nuevo Rol"
                selectedKeys={[selectedRole]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as UserRole
                  setSelectedRole(selected)
                }}
              >
                {Object.entries(ROLES).map(([roleKey, roleInfo]) => (
                  <SelectItem key={roleKey}>
                    {roleInfo.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              color="primary"
              onPress={handleRoleUpdate}
              isLoading={isLoading}
              isDisabled={!targetUserId.trim()}
            >
              Actualizar Rol
            </Button>
            <Button
              variant="flat"
              onPress={() => {
                setTargetUserId("")
                setSelectedRole("customer")
              }}
            >
              Limpiar
            </Button>
          </div>

          {/* Acciones Rápidas */}
          <div>
            <h3 className="font-semibold mb-3">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  color={action.color}
                  variant="flat"
                  className="h-auto p-4"
                  onPress={() => {
                    setSelectedRole(action.role)
                    if (targetUserId.trim()) {
                      handleRoleUpdate()
                    }
                  }}
                  isDisabled={!targetUserId.trim()}
                >
                  <div className="text-center">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Información de Roles */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-3">Información de Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ROLES).map(([roleKey, roleInfo]) => (
                <div key={roleKey} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip size="sm" variant="flat">
                      {roleInfo.label}
                    </Chip>
                  </div>
                  <p className="text-xs text-gray-600">{roleInfo.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">Permisos:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roleInfo.permissions.slice(0, 3).map((permission, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                      {roleInfo.permissions.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{roleInfo.permissions.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}