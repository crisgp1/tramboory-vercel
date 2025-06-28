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
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Lista de usuarios">
            <TableHeader>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>ÚLTIMO ACCESO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-tiny text-default-400">
                        ID: {user.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.emailAddress}</TableCell>
                  <TableCell>
                    <Chip 
                      color={getRoleColor(user.role)}
                      variant="flat"
                      size="sm"
                    >
                      {ROLES[user.role].label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-small">
                      {new Date(user.lastSignInAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => handleManageRole(user)}
                      startContent={<CogIcon className="w-4 h-4" />}
                    >
                      Gestionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8 text-default-500">
              No hay usuarios para mostrar
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal para gestionar roles */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            Gestionar Usuario: {selectedUser?.firstName} {selectedUser?.lastName}
          </ModalHeader>
          <ModalBody className="pb-6">
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