"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRole } from "@/hooks/useRole"
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from "@heroui/react"
import { UserRole, ROLES } from "@/lib/roles"
import RoleManager from "./RoleManager"
import { CogIcon } from "@heroicons/react/24/outline"

interface User {
  id: string
  firstName: string
  lastName: string
  emailAddress: string
  role: UserRole
  createdAt: string
  lastSignInAt: string
}

export default function UserList() {
  const { user: currentUser } = useUser()
  const { isAdmin, isGerente } = useRole()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Solo admin y gerente pueden ver la lista de usuarios
  if (!isAdmin && !isGerente) {
    return null
  }

  useEffect(() => {
    // Simular datos de usuarios (en una app real, esto vendría de una API)
    const mockUsers: User[] = [
      {
        id: "user_1",
        firstName: "Juan",
        lastName: "Pérez",
        emailAddress: "juan@example.com",
        role: "customer",
        createdAt: "2024-01-15",
        lastSignInAt: "2024-01-20"
      },
      {
        id: "user_2",
        firstName: "María",
        lastName: "García",
        emailAddress: "maria@example.com",
        role: "vendedor",
        createdAt: "2024-01-10",
        lastSignInAt: "2024-01-19"
      },
      {
        id: "user_3",
        firstName: "Carlos",
        lastName: "López",
        emailAddress: "carlos@example.com",
        role: "proveedor",
        createdAt: "2024-01-05",
        lastSignInAt: "2024-01-18"
      }
    ]

    // Filtrar el usuario actual de la lista
    const filteredUsers = mockUsers.filter(user => user.id !== currentUser?.id)
    setUsers(filteredUsers)
    setIsLoading(false)
  }, [currentUser?.id])

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

  const handleManageRole = (user: User) => {
    setSelectedUser(user)
    onOpen()
  }

  const handleRoleUpdated = (newRole: UserRole) => {
    if (selectedUser) {
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: newRole }
          : user
      ))
      setSelectedUser({ ...selectedUser, role: newRole })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando usuarios...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <div className="surface-card">
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: `0.0625rem solid var(--border-default)`
        }}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '600'
          }}>Lista de Usuarios</h3>
        </div>
        <div style={{padding: 'var(--space-6)'}}>
          <div className="data-table">
            <div className="table-header">
              <div className="table-row" style={{display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr'}}>
                <div className="table-cell">USUARIO</div>
                <div className="table-cell">EMAIL</div>
                <div className="table-cell">ROL</div>
                <div className="table-cell">ÚLTIMO ACCESO</div>
                <div className="table-cell">ACCIONES</div>
              </div>
            </div>
            <div>
              {users.map((user) => (
                <div key={user.id} className="table-row" style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr'
                }}>
                  <div className="table-cell">
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <span style={{fontWeight: '500'}}>
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-neutral-400" style={{
                        fontSize: 'var(--text-xs)'
                      }}>
                        ID: {user.id}
                      </span>
                    </div>
                  </div>
                  <div className="table-cell">{user.emailAddress}</div>
                  <div className="table-cell">
                    <Chip 
                      color={getRoleColor(user.role)}
                      variant="flat"
                      size="sm"
                    >
                      {ROLES[user.role].label}
                    </Chip>
                  </div>
                  <div className="table-cell">
                    <span style={{fontSize: 'var(--text-sm)'}}>
                      {new Date(user.lastSignInAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="table-cell">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleManageRole(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      <CogIcon className="icon-sm" />
                      Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center text-neutral-500" style={{
              padding: 'var(--space-8) 0'
            }}>
              No hay usuarios para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Professional Modal for Role Management */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent className="surface-modal">
          <ModalHeader style={{
            padding: 'var(--space-6)',
            borderBottom: `0.0625rem solid var(--border-default)`,
            fontSize: 'var(--text-lg)',
            fontWeight: '600'
          }}>
            Gestionar Usuario: {selectedUser?.firstName} {selectedUser?.lastName}
          </ModalHeader>
          <ModalBody style={{padding: 'var(--space-6)'}}>
            {selectedUser && (
              <RoleManager
                targetUserId={selectedUser.id}
                targetUserName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                currentRole={selectedUser.role}
                onRoleUpdated={handleRoleUpdated}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}