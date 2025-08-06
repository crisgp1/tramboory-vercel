"use client"

import { useState, useEffect } from 'react'
import { useRole } from '@/hooks/useRole'
import { UserRole, ROLES } from '@/lib/roles'
import { 
  Button, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Pagination,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Select,
  SelectItem,
  Avatar
} from '@heroui/react'
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  imageUrl?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const { isAdmin, isGerente } = useRole()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter, statusFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: search,
        role: roleFilter !== 'all' ? roleFilter : '',
        status: statusFilter !== 'all' ? statusFilter : ''
      })
      
      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar la lista de usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    onOpen()
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    onDeleteOpen()
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar usuario')
      }
      
      toast.success(`Usuario ${selectedUser.firstName} ${selectedUser.lastName} eliminado`)
      fetchUsers()
      onDeleteClose()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const handleUpdateUser = async (formData: FormData) => {
    if (!selectedUser) return
    
    const updatedUser = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      isActive: formData.get('status') === 'active'
    }
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar usuario')
      }
      
      toast.success(`Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado`)
      fetchUsers()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error al actualizar usuario')
    }
  }

  const handleCreateUser = async (formData: FormData) => {
    const newUser = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      password: formData.get('password') as string
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      
      if (!response.ok) {
        throw new Error('Error al crear usuario')
      }
      
      toast.success(`Usuario ${newUser.firstName} ${newUser.lastName} creado`)
      fetchUsers()
      onCreateClose()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Error al crear usuario')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar rol')
      }
      
      toast.success(`Rol actualizado a ${ROLES[newRole].label}`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Error al actualizar rol')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }
      
      toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} correctamente`)
      fetchUsers()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Error al actualizar estado del usuario')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const renderRoleChip = (role: UserRole) => {
    const roleConfig = {
      admin: { color: "danger", label: "Admin" },
      gerente: { color: "primary", label: "Gerente" },
      vendedor: { color: "warning", label: "Vendedor" },
      proveedor: { color: "success", label: "Proveedor" },
      customer: { color: "default", label: "Cliente" }
    }
    
    return (
      <Chip 
        color={roleConfig[role]?.color as any} 
        variant="flat" 
        size="sm"
      >
        {roleConfig[role]?.label}
      </Chip>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          Gestión de Usuarios
        </h2>
        {isAdmin && (
          <Button 
            color="primary" 
            startContent={<UserPlusIcon className="w-4 h-4" />}
            onPress={onCreateOpen}
          >
            Crear Usuario
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          className="w-full sm:w-64"
        />
        
        <div className="flex gap-2 items-center">
          <Select
            placeholder="Filtrar por rol"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="w-36 min-w-36"
          >
            <SelectItem key="all">Todos los roles</SelectItem>
            <SelectItem key="admin">{ROLES["admin"].label}</SelectItem>
            <SelectItem key="gerente">{ROLES["gerente"].label}</SelectItem>
            <SelectItem key="vendedor">{ROLES["vendedor"].label}</SelectItem>
            <SelectItem key="proveedor">{ROLES["proveedor"].label}</SelectItem>
            <SelectItem key="customer">{ROLES["customer"].label}</SelectItem>
          </Select>
          
          <Select
            placeholder="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-36 min-w-36"
          >
            <SelectItem key="all">Todos</SelectItem>
            <SelectItem key="active">Activos</SelectItem>
            <SelectItem key="inactive">Inactivos</SelectItem>
          </Select>
          
          <Button
            isIconOnly
            variant="light"
            onPress={clearFilters}
            className="text-gray-500"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table 
          aria-label="Tabla de usuarios"
          bottomContent={
            <div className="flex justify-center w-full py-2">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>USUARIO</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>ROL</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>FECHA CREACIÓN</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={loading}
            loadingContent={<div className="p-4 text-center">Cargando usuarios...</div>}
            emptyContent={<div className="p-4 text-center">No se encontraron usuarios</div>}
            items={users}
          >
            {(user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={user.imageUrl} 
                      name={`${user.firstName} ${user.lastName}`} 
                      size="sm" 
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button 
                          variant="light" 
                          className="min-w-0 p-0"
                        >
                          {renderRoleChip(user.role)}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Cambiar rol">
                        {Object.entries(ROLES).map(([role, data]) => (
                          <DropdownItem 
                            key={role}
                            onClick={() => handleUpdateRole(user.id, role as UserRole)}
                            className="text-sm"
                          >
                            {data.label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  ) : (
                    renderRoleChip(user.role)
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    color={user.isActive ? "success" : "danger"} 
                    variant="flat" 
                    size="sm"
                    onClick={() => isAdmin && handleToggleStatus(user.id, user.isActive)}
                    className={isAdmin ? "cursor-pointer" : ""}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="text-blue-600"
                      onPress={() => handleEditUser(user)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    
                    {isAdmin && (
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-red-600"
                        onPress={() => handleDeleteUser(user)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edición */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        classNames={{
          backdrop: "surface-overlay",
          base: "bg-white border border-gray-200",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
      <ModalContent>
        <form action={handleUpdateUser}>
          <ModalHeader>Editar Usuario</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <Input
                    name="firstName"
                    defaultValue={selectedUser?.firstName}
                    isRequired
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <Input
                    name="lastName"
                    defaultValue={selectedUser?.lastName}
                    isRequired
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  isRequired
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <Select
                  name="role"
                  defaultSelectedKeys={[selectedUser?.role || 'customer']}
                  isRequired
                  isDisabled={!isAdmin}
                  classNames={{
                    trigger: "bg-gray-50 border-0 hover:bg-gray-100 text-foreground",
                    value: "text-foreground",
                    listboxWrapper: "bg-white",
                    popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                  }}
                >
                  <SelectItem key="admin">{ROLES["admin"].label}</SelectItem>
                  <SelectItem key="gerente">{ROLES["gerente"].label}</SelectItem>
                  <SelectItem key="vendedor">{ROLES["vendedor"].label}</SelectItem>
                  <SelectItem key="proveedor">{ROLES["proveedor"].label}</SelectItem>
                  <SelectItem key="customer">{ROLES["customer"].label}</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Select
                  name="status"
                  defaultSelectedKeys={[selectedUser?.isActive ? 'active' : 'inactive']}
                  isRequired
                  classNames={{
                    trigger: "bg-gray-50 border-0 hover:bg-gray-100 text-foreground",
                    value: "text-foreground",
                    listboxWrapper: "bg-white",
                    popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                  }}
                >
                  <SelectItem key="active">Activo</SelectItem>
                  <SelectItem key="inactive">Inactivo</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                Guardar Cambios
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de eliminación */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={onDeleteClose}
        classNames={{
          backdrop: "surface-overlay",
          base: "bg-white border border-gray-200",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
      <ModalContent>
        <ModalHeader>Confirmar Eliminación</ModalHeader>
        <ModalBody>
          <p>¿Está seguro que desea eliminar al usuario {selectedUser?.firstName} {selectedUser?.lastName}?</p>
          <p className="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>
        </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              Cancelar
            </Button>
            <Button color="danger" onPress={confirmDeleteUser}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de creación */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={onCreateClose}
        classNames={{
          backdrop: "surface-overlay",
          base: "bg-white border border-gray-200",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
      <ModalContent>
        <form action={handleCreateUser}>
          <ModalHeader>Crear Nuevo Usuario</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <Input
                    name="firstName"
                    isRequired
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <Input
                    name="lastName"
                    isRequired
                    classNames={{
                      input: "text-foreground",
                      inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  isRequired
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <Input
                  name="password"
                  type="password"
                  isRequired
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <Select
                  name="role"
                  defaultSelectedKeys={['customer']}
                  isRequired
                  classNames={{
                    trigger: "bg-gray-50 border-0 hover:bg-gray-100 text-foreground",
                    value: "text-foreground",
                    listboxWrapper: "bg-white",
                    popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                  }}
                >
                  <SelectItem key="admin">{ROLES["admin"].label}</SelectItem>
                  <SelectItem key="gerente">{ROLES["gerente"].label}</SelectItem>
                  <SelectItem key="vendedor">{ROLES["vendedor"].label}</SelectItem>
                  <SelectItem key="proveedor">{ROLES["proveedor"].label}</SelectItem>
                  <SelectItem key="customer">{ROLES["customer"].label}</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onCreateClose}>
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                Crear Usuario
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}