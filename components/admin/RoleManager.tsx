"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRole } from "@/hooks/useRole"
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Button,
  Chip,
  Divider
} from "@heroui/react"
import { UserRole, ROLES } from "@/lib/roles"
import toast from "react-hot-toast"

interface RoleManagerProps {
  targetUserId?: string
  targetUserName?: string
  currentRole?: UserRole
  onRoleUpdated?: (newRole: UserRole) => void
}

export default function RoleManager({
  targetUserId,
  targetUserName,
  currentRole,
  onRoleUpdated
}: RoleManagerProps) {
  const { user } = useUser()
  const { role: userRole, isAdmin, isGerente } = useRole()
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || "customer")
  const [isLoading, setIsLoading] = useState(false)

  // Solo admin y gerente pueden gestionar roles
  if (!isAdmin && !isGerente) {
    return null
  }

  const userId = targetUserId || user?.id
  const userName = targetUserName || user?.fullName || "Usuario"

  const handleRoleChange = async () => {
    if (!userId || selectedRole === currentRole) return

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Rol actualizado a ${ROLES[selectedRole].label}`)
        onRoleUpdated?.(selectedRole)
      } else {
        toast.error(result.error || "Error al actualizar el rol")
        setSelectedRole(currentRole || "customer")
      }
    } catch (error) {
      toast.error("Error al actualizar el rol")
      setSelectedRole(currentRole || "customer")
    } finally {
      setIsLoading(false)
    }
  }

  const availableRoles = Object.entries(ROLES).filter(([roleKey]) => {
    // Admin puede asignar cualquier rol
    if (isAdmin) return true
    
    // Gerente solo puede asignar vendedor y customer
    if (isGerente) {
      return ["vendedor", "customer"].includes(roleKey)
    }
    
    return false
  })

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "danger"
      case "gerente": return "warning"
      case "proveedor": return "secondary"
      case "vendedor": return "primary"
      case "customer": return "default"
      default: return "default"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Gestión de Roles</h3>
          <p className="text-small text-default-500">
            Usuario: {userName}
          </p>
        </div>
      </CardHeader>
      
      <CardBody className="gap-4">
        <div className="flex items-center gap-3">
          <span className="text-small font-medium">Rol actual:</span>
          <Chip 
            color={getRoleColor(currentRole || "customer")}
            variant="flat"
            size="sm"
          >
            {ROLES[currentRole || "customer"].label}
          </Chip>
        </div>

        <Divider />

        <div className="space-y-4">
          <Select
            label="Nuevo rol"
            placeholder="Selecciona un rol"
            selectedKeys={[selectedRole]}
            onSelectionChange={(keys) => {
              const role = Array.from(keys)[0] as UserRole
              setSelectedRole(role)
            }}
            variant="bordered"
          >
            {availableRoles.map(([roleKey, roleInfo]) => (
              <SelectItem key={roleKey}>
                <div className="flex flex-col">
                  <span className="font-medium">{roleInfo.label}</span>
                  <span className="text-tiny text-default-400">
                    {roleInfo.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>

          {selectedRole && selectedRole !== currentRole && (
            <div className="p-3 bg-default-50 rounded-lg">
              <h4 className="font-medium text-small mb-2">
                Permisos del rol {ROLES[selectedRole].label}:
              </h4>
              <div className="flex flex-wrap gap-1">
                {ROLES[selectedRole].permissions.map((permission) => (
                  <Chip key={permission} size="sm" variant="flat">
                    {permission === "*" ? "Todos los permisos" : permission}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Button
            color="primary"
            onPress={handleRoleChange}
            isLoading={isLoading}
            isDisabled={selectedRole === currentRole || !selectedRole}
            className="w-full"
          >
            {isLoading ? "Actualizando..." : "Actualizar Rol"}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}