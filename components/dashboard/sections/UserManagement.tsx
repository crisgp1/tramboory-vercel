"use client"

import { useState, useEffect } from 'react'
import { useRole } from '@/hooks/useRole'
import { UserRole, ROLES } from '@/lib/roles'
import {
  Button,
  Table,
  Title,
  Text,
  TextInput,
  Select,
  Modal,
  Stack,
  Group,
  Pagination,
  ActionIcon,
  Badge,
  Avatar,
  Paper,
  Menu,
  Chip,
  Grid,
  Loader,
  Center,
  Flex,
  Tabs,
  Textarea,
  NumberInput,
  Alert,
  Tooltip,
  Divider
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconX,
  IconUserPlus,
  IconChevronDown,
  IconMail,
  IconMailForward,
  IconUserX,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconBuildingStore,
  IconLink,
  IconUnlink,
  IconEye
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import {
  UnifiedSupplier,
  SupplierStatus,
  SupplierType
} from '@/lib/types/supplier.types'
import { formatSupplierDisplay } from '@/lib/utils/supplier.utils'
import { SupabaseInventoryClientService } from '@/lib/supabase/inventory-client'

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

interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
  updatedAt: string
  metadata?: {
    role: UserRole
    invitedBy: string
    invitedAt: string
    [key: string]: any
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [invitationsLoading, setInvitationsLoading] = useState(true)
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<UnifiedSupplier | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<SupplierStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState<string | null>('users')
  const { isAdmin, isGerente } = useRole()
  const [isOpen, { open: onOpen, close: onClose }] = useDisclosure()
  const [isDeleteOpen, { open: onDeleteOpen, close: onDeleteClose }] = useDisclosure()
  const [isCreateOpen, { open: onCreateOpen, close: onCreateClose }] = useDisclosure()
  const [isInviteOpen, { open: onInviteOpen, close: onInviteClose }] = useDisclosure()
  const [isRevokeOpen, { open: onRevokeOpen, close: onRevokeClose }] = useDisclosure()
  const [isCriticalRoleWarningOpen, { open: onCriticalRoleWarningOpen, close: onCriticalRoleWarningClose }] = useDisclosure()
  const [isSupplierViewOpen, { open: onSupplierViewOpen, close: onSupplierViewClose }] = useDisclosure()
  const [selectedCriticalRole, setSelectedCriticalRole] = useState<UserRole | null>(null)
  const [pendingInvitationData, setPendingInvitationData] = useState<FormData | null>(null)
  
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchUsers()
    if (activeTab === 'invitations') {
      fetchInvitations()
    } else if (activeTab === 'suppliers') {
      fetchSuppliers()
    }
  }, [page, search, roleFilter, statusFilter, supplierStatusFilter, activeTab])

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
      notifications.show({
        title: 'Error',
        message: 'Error al cargar la lista de usuarios',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    setInvitationsLoading(true)
    try {
      const response = await fetch('/api/admin/invitations')
      if (!response.ok) {
        throw new Error('Error al cargar invitaciones')
      }
      
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al cargar la lista de invitaciones',
        color: 'red'
      })
    } finally {
      setInvitationsLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    setSuppliersLoading(true)
    try {
      const filters: any = {}
      
      if (supplierStatusFilter !== 'all') {
        filters.status = [supplierStatusFilter]
      }
      
      if (search) {
        filters.search = search
      }

      const allSuppliers = await SupabaseInventoryClientService.getAllSuppliersUnified(filters)
      setSuppliers(allSuppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al cargar la lista de proveedores',
        color: 'red'
      })
    } finally {
      setSuppliersLoading(false)
    }
  }

  const handleViewSupplier = (supplier: UnifiedSupplier) => {
    setSelectedSupplier(supplier)
    onSupplierViewOpen()
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    onOpen()
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    onDeleteOpen()
  }

  const handleRevokeInvitation = (invitation: Invitation) => {
    setSelectedInvitation(invitation)
    onRevokeOpen()
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
      
      notifications.show({
        title: 'Éxito',
        message: `Usuario ${selectedUser.firstName} ${selectedUser.lastName} eliminado`,
        color: 'green'
      })
      fetchUsers()
      onDeleteClose()
    } catch (error) {
      console.error('Error deleting user:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar usuario',
        color: 'red'
      })
    }
  }

  const confirmRevokeInvitation = async () => {
    if (!selectedInvitation) return
    
    try {
      const response = await fetch(`/api/admin/invitations/${selectedInvitation.id}/revoke`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Error al revocar invitación')
      }
      
      notifications.show({
        title: 'Éxito',
        message: 'Invitación revocada correctamente',
        color: 'green'
      })
      
      fetchInvitations()
      onRevokeClose()
    } catch (error) {
      console.error('Error revoking invitation:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al revocar invitación',
        color: 'red'
      })
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
      
      notifications.show({
        title: 'Éxito', 
        message: `Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado`,
        color: 'green'
      })
      fetchUsers()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar usuario',
        color: 'red'
      })
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
      
      notifications.show({
        title: 'Éxito',
        message: `Usuario ${newUser.firstName} ${newUser.lastName} creado`,
        color: 'green'
      })
      fetchUsers()
      onCreateClose()
    } catch (error) {
      console.error('Error creating user:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al crear usuario',
        color: 'red'
      })
    }
  }

  const isCriticalRole = (role: UserRole) => {
    return ['admin', 'gerente', 'vendedor'].includes(role)
  }

  const handleInviteUser = async (formData: FormData) => {
    const selectedRole = formData.get('role') as UserRole
    
    console.log('Selected role:', selectedRole)
    console.log('Is critical role:', isCriticalRole(selectedRole))
    
    // Check if it's a critical role and show warning
    if (isCriticalRole(selectedRole)) {
      console.log('Opening critical role warning modal')
      setSelectedCriticalRole(selectedRole)
      setPendingInvitationData(formData)
      onCriticalRoleWarningOpen()
      return
    }
    
    console.log('Proceeding with regular invitation')
    // Proceed with regular invitation
    await sendInvitation(formData)
  }

  const sendInvitation = async (formData: FormData) => {
    const invitationData = {
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      redirectUrl: formData.get('redirectUrl') as string || undefined,
      expiresInDays: parseInt(formData.get('expiresInDays') as string) || 30,
      metadata: {
        department: formData.get('department') as string || '',
        notes: formData.get('notes') as string || ''
      }
    }
    
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar invitación')
      }
      
      notifications.show({
        title: 'Éxito',
        message: `Invitación enviada a ${invitationData.email}`,
        color: 'green'
      })
      
      fetchInvitations()
      onInviteClose()
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al enviar invitación',
        color: 'red'
      })
    }
  }

  const confirmCriticalRoleInvitation = async () => {
    if (pendingInvitationData) {
      await sendInvitation(pendingInvitationData)
      setPendingInvitationData(null)
      setSelectedCriticalRole(null)
      onCriticalRoleWarningClose()
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
      
      notifications.show({
        title: 'Éxito',
        message: `Rol actualizado a ${ROLES[newRole].label}`,
        color: 'green'
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar rol',
        color: 'red'
      })
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
      
      notifications.show({
        title: 'Éxito',
        message: `Usuario ${currentStatus ? 'desactivado' : 'activado'} correctamente`,
        color: 'green'
      })
      fetchUsers()
    } catch (error) {
      console.error('Error toggling status:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar estado del usuario',
        color: 'red'
      })
    }
  }

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const renderRoleChip = (role: UserRole) => {
    const roleConfig = {
      admin: { color: "red", label: "Admin" },
      gerente: { color: "blue", label: "Gerente" },
      vendedor: { color: "orange", label: "Vendedor" },
      proveedor: { color: "green", label: "Proveedor" },
      customer: { color: "gray", label: "Cliente" }
    }
    
    return (
      <Badge 
        color={roleConfig[role]?.color} 
        variant="light"
        size="sm"
      >
        {roleConfig[role]?.label}
      </Badge>
    )
  }

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClock size={12} />}>Pendiente</Badge>
      case 'accepted':
        return <Badge color="green" leftSection={<IconCheck size={12} />}>Aceptada</Badge>
      case 'revoked':
        return <Badge color="red" leftSection={<IconUserX size={12} />}>Revocada</Badge>
      default:
        return <Badge color="gray">Desconocido</Badge>
    }
  }

  return (
    <Stack gap="lg">
      {/* Header con acciones */}
      <Group justify="space-between">
        <Title order={2}>Gestión de Usuarios</Title>
        <Group>
          {isAdmin && activeTab === 'users' && (
            <Button 
              leftSection={<IconUserPlus size={16} />}
              onClick={onCreateOpen}
            >
              Crear Usuario
            </Button>
          )}
          {isAdmin && activeTab === 'invitations' && (
            <Button 
              leftSection={<IconMailForward size={16} />}
              onClick={onInviteOpen}
            >
              Enviar Invitación
            </Button>
          )}
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value)}>
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUserPlus size={16} />}>
            Usuarios ({users.length})
          </Tabs.Tab>
          <Tabs.Tab value="invitations" leftSection={<IconMail size={16} />}>
            Invitaciones ({invitations.length})
          </Tabs.Tab>
          <Tabs.Tab value="suppliers" leftSection={<IconBuildingStore size={16} />}>
            Proveedores ({suppliers.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          {/* Filtros y búsqueda para usuarios */}
          <Paper p="md" withBorder mt="md">
            <Stack gap="md">
              <TextInput
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1 }}
              />
              
              <Group>
                <Select
                  placeholder="Filtrar por rol"
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value as UserRole | 'all')}
                  data={[
                    { value: 'all', label: 'Todos los roles' },
                    { value: 'admin', label: ROLES["admin"].label },
                    { value: 'gerente', label: ROLES["gerente"].label },
                    { value: 'vendedor', label: ROLES["vendedor"].label },
                    { value: 'proveedor', label: ROLES["proveedor"].label },
                    { value: 'customer', label: ROLES["customer"].label }
                  ]}
                  style={{ minWidth: 150 }}
                />
                
                <Select
                  placeholder="Filtrar por estado"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
                  data={[
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Activos' },
                    { value: 'inactive', label: 'Inactivos' }
                  ]}
                  style={{ minWidth: 120 }}
                />
                
                <ActionIcon
                  variant="subtle"
                  onClick={clearFilters}
                  c="gray"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Stack>
          </Paper>

          {/* Tabla de usuarios */}
          <Paper withBorder mt="md">
            {loading ? (
              <Center p="xl">
                <Stack align="center" gap="sm">
                  <Loader size="lg" />
                  <Text c="dimmed">Cargando usuarios...</Text>
                </Stack>
              </Center>
            ) : users.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">No se encontraron usuarios</Text>
              </Center>
            ) : (
              <>
                <Table.ScrollContainer minWidth={800}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Usuario</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Rol</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Fecha Creación</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {users.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar 
                                src={user.imageUrl} 
                                size="sm"
                                radius="xl"
                              >
                                {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
                              </Avatar>
                              <Stack gap={0}>
                                <Text size="sm" fw={500}>{user.firstName} {user.lastName}</Text>
                                <Text size="xs" c="dimmed">ID: {user.id.substring(0, 8)}...</Text>
                              </Stack>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">{user.email}</Text>
                          </Table.Td>
                          <Table.Td>
                            {isAdmin ? (
                              <Menu shadow="md" width={200}>
                                <Menu.Target>
                                  <Button variant="subtle" size="compact-sm" p={0}>
                                    {renderRoleChip(user.role)}
                                  </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Label>Cambiar rol</Menu.Label>
                                  {Object.entries(ROLES).map(([role, data]) => (
                                    <Menu.Item 
                                      key={role}
                                      onClick={() => handleUpdateRole(user.id, role as UserRole)}
                                    >
                                      {data.label}
                                    </Menu.Item>
                                  ))}
                                </Menu.Dropdown>
                              </Menu>
                            ) : (
                              renderRoleChip(user.role)
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Badge 
                              color={user.isActive ? "green" : "red"} 
                              variant="light"
                              size="sm"
                              style={{ 
                                cursor: isAdmin ? 'pointer' : 'default' 
                              }}
                              onClick={() => isAdmin && handleToggleStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                c="blue"
                                onClick={() => handleEditUser(user)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              
                              {isAdmin && (
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  c="red"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                
                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination
                      total={totalPages}
                      value={page}
                      onChange={setPage}
                    />
                  </Group>
                )}
              </>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="invitations">
          {/* Tabla de invitaciones */}
          <Paper withBorder mt="md">
            {invitationsLoading ? (
              <Center p="xl">
                <Stack align="center" gap="sm">
                  <Loader size="lg" />
                  <Text c="dimmed">Cargando invitaciones...</Text>
                </Stack>
              </Center>
            ) : invitations.length === 0 ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <IconMail size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
                  <Text c="dimmed">No hay invitaciones pendientes</Text>
                  <Button leftSection={<IconMailForward size={16} />} onClick={onInviteOpen}>
                    Enviar Primera Invitación
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={800}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Rol</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Fecha Invitación</Table.Th>
                      <Table.Th>Invitado por</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invitations.map((invitation) => (
                      <Table.Tr key={invitation.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl">
                              <IconMail size={16} />
                            </Avatar>
                            <Text size="sm" fw={500}>{invitation.email}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {invitation.metadata?.role && renderRoleChip(invitation.metadata.role)}
                        </Table.Td>
                        <Table.Td>
                          {getInvitationStatusBadge(invitation.status)}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {invitation.metadata?.invitedBy?.substring(0, 8) || 'Sistema'}...
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {invitation.status === 'pending' && (
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                c="red"
                                onClick={() => handleRevokeInvitation(invitation)}
                              >
                                <IconUserX size={16} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="suppliers">
          {/* Información del sistema unificado */}
          <Alert color="blue" title="Sistema Unificado de Proveedores" mb="md">
            <Text size="sm">
              Los proveedores se gestionan de forma unificada. Al invitar usuarios con rol "proveedor",
              se crean automáticamente registros de proveedor vinculados.
            </Text>
          </Alert>

          {/* Filtros para proveedores */}
          <Paper p="md" withBorder mt="md">
            <Stack gap="md">
              <TextInput
                placeholder="Buscar por nombre, código, email o usuario..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1 }}
              />
              
              <Group>
                <Select
                  placeholder="Filtrar por estado"
                  value={supplierStatusFilter}
                  onChange={(value) => setSupplierStatusFilter(value as SupplierStatus | 'all')}
                  data={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: SupplierStatus.EXTERNAL, label: '📋 Solo Registros (Sin Portal)' },
                    { value: SupplierStatus.INVITED, label: '📧 Invitado (Pendiente)' },
                    { value: SupplierStatus.ACTIVE, label: '✅ Activo (Con Portal)' },
                    { value: SupplierStatus.INACTIVE, label: '⏸️ Inactivo' },
                    { value: SupplierStatus.SUSPENDED, label: '🚫 Suspendido' }
                  ]}
                  style={{ minWidth: 220 }}
                />

                <Select
                  placeholder="Filtrar por origen"
                  value={suppliers.length > 0 && suppliers.filter(s => s.user_id).length > 0 ? 'with_user' : 'all'}
                  onChange={(value) => {
                    // Esta es una vista filtrada, no cambiamos el estado
                    if (value === 'with_user') {
                      const filtered = suppliers.filter(s => s.user_id)
                      // Podríamos implementar un filtro local aquí
                    }
                  }}
                  data={[
                    { value: 'all', label: 'Todos los orígenes' },
                    { value: 'manual', label: '👤 Creado Manualmente' },
                    { value: 'auto', label: '🤖 Auto-creado' },
                    { value: 'with_user', label: '🔗 Con Usuario Vinculado' },
                    { value: 'without_user', label: '📝 Solo Registro' }
                  ]}
                  style={{ minWidth: 200 }}
                />
                
                <ActionIcon
                  variant="subtle"
                  onClick={() => {
                    setSearch('')
                    setSupplierStatusFilter('all')
                  }}
                  c="gray"
                  title="Limpiar filtros"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Stack>
          </Paper>

          {/* Estadísticas rápidas */}
          <Paper p="md" withBorder mt="md">
            <Grid>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="blue">{suppliers.length}</Text>
                  <Text size="xs" c="dimmed">Total</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="green">
                    {suppliers.filter(s => s.status === SupplierStatus.ACTIVE).length}
                  </Text>
                  <Text size="xs" c="dimmed">Activos</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="orange">
                    {suppliers.filter(s => s.status === SupplierStatus.INVITED).length}
                  </Text>
                  <Text size="xs" c="dimmed">Pendientes</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="gray">
                    {suppliers.filter(s => s.status === SupplierStatus.EXTERNAL).length}
                  </Text>
                  <Text size="xs" c="dimmed">Solo Registro</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="teal">
                    {suppliers.filter(s => s.user_id).length}
                  </Text>
                  <Text size="xs" c="dimmed">Con Portal</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={2}>
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} c="violet">
                    {suppliers.filter(s => s.user_id && s.code?.startsWith('SUP-AUTO')).length}
                  </Text>
                  <Text size="xs" c="dimmed">Auto-creados</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Tabla de proveedores mejorada */}
          <Paper withBorder mt="md">
            {suppliersLoading ? (
              <Center p="xl">
                <Stack align="center" gap="sm">
                  <Loader size="lg" />
                  <Text c="dimmed">Cargando proveedores...</Text>
                </Stack>
              </Center>
            ) : suppliers.length === 0 ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <IconBuildingStore size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
                  <Text c="dimmed">No se encontraron proveedores</Text>
                  <Text size="sm" c="dimmed">
                    Los proveedores se crean automáticamente al invitar usuarios con rol "proveedor"
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={1100}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Proveedor</Table.Th>
                      <Table.Th>Código / Origen</Table.Th>
                      <Table.Th>Estado del Sistema</Table.Th>
                      <Table.Th>Acceso al Portal</Table.Th>
                      <Table.Th>Usuario Vinculado</Table.Th>
                      <Table.Th>Calificación</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {suppliers.map((supplier) => {
                      const display = formatSupplierDisplay(supplier)
                      const isAutoCreated = supplier.code?.startsWith('SUP-AUTO')
                      const hasPortalAccess = !!supplier.user_id
                      
                      return (
                        <Table.Tr key={supplier.id}>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar size="sm" radius="xl" color={hasPortalAccess ? "blue" : "gray"}>
                                <IconBuildingStore size={16} />
                              </Avatar>
                              <Stack gap={0}>
                                <Group gap="xs">
                                  <Text size="sm" fw={500}>{display.displayName}</Text>
                                  {isAutoCreated && (
                                    <Tooltip label="Creado automáticamente por el sistema">
                                      <Badge size="xs" color="violet" variant="dot">
                                        Auto
                                      </Badge>
                                    </Tooltip>
                                  )}
                                </Group>
                                <Text size="xs" c="dimmed">{display.contactInfo}</Text>
                              </Stack>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm" fw={500}>{supplier.code}</Text>
                              <Text size="xs" c="dimmed">
                                {isAutoCreated ? '🤖 Auto-creado' : '👤 Creado manualmente'}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              <Badge
                                color={display.statusColor}
                                variant="light"
                                size="sm"
                              >
                                {display.statusLabel}
                              </Badge>
                              {supplier.status === SupplierStatus.INVITED && (
                                <Text size="xs" c="orange">
                                  Esperando activación
                                </Text>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              <Badge
                                color={hasPortalAccess ? "green" : "gray"}
                                variant={hasPortalAccess ? "light" : "outline"}
                                size="sm"
                              >
                                {hasPortalAccess ? "✅ Con Acceso" : "⏸️ Sin Acceso"}
                              </Badge>
                              <Badge
                                color="gray"
                                variant="outline"
                                size="xs"
                              >
                                {display.typeLabel}
                              </Badge>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            {supplier.user_id ? (
                              <Stack gap={0}>
                                <Group gap="xs">
                                  <IconLink size={14} color="green" />
                                  <Text size="xs" c="green" fw={500}>Vinculado</Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                  {supplier.user_email || supplier.user_name || supplier.user_id.substring(0, 8)}
                                </Text>
                              </Stack>
                            ) : (
                              <Group gap="xs">
                                <IconUnlink size={14} color="gray" />
                                <Text size="xs" c="dimmed">Sin usuario</Text>
                              </Group>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {supplier.overall_rating ? (
                              <Stack gap={0} align="center">
                                <Group gap="xs">
                                  <Text size="sm" fw={500} c="yellow">
                                    ⭐ {supplier.overall_rating.toFixed(1)}
                                  </Text>
                                </Group>
                                <Text size="xs" c="dimmed">de 5.0</Text>
                              </Stack>
                            ) : (
                              <Text size="xs" c="dimmed" ta="center">Sin evaluar</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Ver detalles completos">
                                <ActionIcon
                                  variant="subtle"
                                  size="sm"
                                  c="blue"
                                  onClick={() => handleViewSupplier(supplier)}
                                >
                                  <IconEye size={16} />
                                </ActionIcon>
                              </Tooltip>
                              
                              {supplier.status === SupplierStatus.INVITED && (
                                <Tooltip label="Reenviar invitación">
                                  <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    c="orange"
                                    onClick={() => {
                                      // Implementar reenvío de invitación
                                      notifications.show({
                                        title: 'Funcionalidad pendiente',
                                        message: 'Reenvío de invitación en desarrollo',
                                        color: 'blue'
                                      })
                                    }}
                                  >
                                    <IconMailForward size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Modal de edición de usuario */}
      <Modal 
        opened={isOpen} 
        onClose={onClose}
        title="Editar Usuario"
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          handleUpdateUser(formData)
        }}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Nombre"
                  name="firstName"
                  defaultValue={selectedUser?.firstName}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Apellido"
                  name="lastName"
                  defaultValue={selectedUser?.lastName}
                  required
                />
              </Grid.Col>
            </Grid>
            
            <TextInput
              label="Email"
              name="email"
              type="email"
              defaultValue={selectedUser?.email}
              required
            />
            
            <Select
              label="Rol"
              name="role"
              value={selectedUser?.role || 'customer'}
              data={[
                { value: 'admin', label: ROLES["admin"].label },
                { value: 'gerente', label: ROLES["gerente"].label },
                { value: 'vendedor', label: ROLES["vendedor"].label },
                { value: 'proveedor', label: ROLES["proveedor"].label },
                { value: 'customer', label: ROLES["customer"].label }
              ]}
              disabled={!isAdmin}
              required
            />
            
            <Select
              label="Estado"
              name="status"
              value={selectedUser?.isActive ? 'active' : 'inactive'}
              data={[
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' }
              ]}
              required
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de eliminación de usuario */}
      <Modal 
        opened={isDeleteOpen} 
        onClose={onDeleteClose}
        title="Confirmar Eliminación"
        size="md"
      >
        <Stack gap="md">
          <Text>
            ¿Está seguro que desea eliminar al usuario {selectedUser?.firstName} {selectedUser?.lastName}?
          </Text>
          <Text size="sm" c="dimmed">
            Esta acción no se puede deshacer.
          </Text>
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button color="red" onClick={confirmDeleteUser}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de creación de usuario */}
      <Modal 
        opened={isCreateOpen} 
        onClose={onCreateClose}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          handleCreateUser(formData)
        }}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Nombre"
                  name="firstName"
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Apellido"
                  name="lastName"
                  required
                />
              </Grid.Col>
            </Grid>
            
            <TextInput
              label="Email"
              name="email"
              type="email"
              required
            />
            
            <TextInput
              label="Contraseña"
              name="password"
              type="password"
              required
            />
            
            <Select
              label="Rol"
              name="role"
              defaultValue="customer"
              data={[
                { value: 'admin', label: ROLES["admin"].label },
                { value: 'gerente', label: ROLES["gerente"].label },
                { value: 'vendedor', label: ROLES["vendedor"].label },
                { value: 'proveedor', label: ROLES["proveedor"].label },
                { value: 'customer', label: ROLES["customer"].label }
              ]}
              required
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={onCreateClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Usuario
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de invitación */}
      <Modal 
        opened={isInviteOpen} 
        onClose={onInviteClose}
        title="Enviar Invitación"
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          handleInviteUser(formData)
        }}>
          <Stack gap="md">
            <TextInput
              label="Email del destinatario"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              required
              description="El usuario recibirá un email con el enlace de invitación"
            />
            
            <Select
              label="Rol asignado"
              name="role"
              defaultValue="customer"
              data={[
                { value: 'admin', label: ROLES["admin"].label },
                { value: 'gerente', label: ROLES["gerente"].label },
                { value: 'vendedor', label: ROLES["vendedor"].label },
                { value: 'proveedor', label: ROLES["proveedor"].label },
                { value: 'customer', label: ROLES["customer"].label }
              ]}
              required
              description="Rol que tendrá el usuario al aceptar la invitación"
            />
            
            <TextInput
              label="URL de redirección (opcional)"
              name="redirectUrl"
              placeholder="https://tuapp.com/bienvenida"
              description="URL donde será redirigido el usuario después de registrarse"
            />
            
            <NumberInput
              label="Días de expiración"
              name="expiresInDays"
              defaultValue={30}
              min={1}
              max={365}
              description="Días válidos para usar la invitación"
            />
            
            <TextInput
              label="Departamento (opcional)"
              name="department"
              placeholder="ej: Ventas, Marketing, IT"
              description="Información adicional sobre el departamento del usuario"
            />
            
            <Textarea
              label="Notas adicionales (opcional)"
              name="notes"
              placeholder="Información adicional sobre esta invitación..."
              minRows={3}
              description="Notas internas sobre esta invitación"
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={onInviteClose}>
                Cancelar
              </Button>
              <Button type="submit" leftSection={<IconMailForward size={16} />}>
                Enviar Invitación
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de confirmación para revocar invitación */}
      <Modal 
        opened={isRevokeOpen} 
        onClose={onRevokeClose}
        title="Revocar Invitación"
        size="md"
      >
        <Stack gap="md">
          <Text>
            ¿Está seguro que desea revocar la invitación enviada a {selectedInvitation?.email}?
          </Text>
          <Text size="sm" c="dimmed">
            El usuario ya no podrá usar el enlace de invitación para registrarse.
          </Text>
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onRevokeClose}>
              Cancelar
            </Button>
            <Button color="red" onClick={confirmRevokeInvitation}>
              Revocar Invitación
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de advertencia para roles críticos */}
      <Modal
        opened={isCriticalRoleWarningOpen}
        onClose={() => {
          onCriticalRoleWarningClose()
          setPendingInvitationData(null)
          setSelectedCriticalRole(null)
        }}
        title="⚠️ Advertencia de Rol Crítico"
        size="lg"
        centered
      >
        <Stack gap="md">
          <Group>
            <IconAlertCircle size={24} color="orange" />
            <Text fw={600} size="lg">
              Está asignando un rol con permisos elevados
            </Text>
          </Group>
          
          <Text>
            Ha seleccionado el rol <strong>{selectedCriticalRole && ROLES[selectedCriticalRole]?.label}</strong> para esta invitación.
            Este es un rol interno con permisos críticos en el sistema.
          </Text>
          
          <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-orange-0)' }}>
            <Text fw={500} mb="sm">Los roles críticos pueden:</Text>
            <Stack gap="xs">
              <Group gap="xs">
                <Text c="orange">•</Text>
                <Text size="sm">Acceder al panel de administración</Text>
              </Group>
              <Group gap="xs">
                <Text c="orange">•</Text>
                <Text size="sm">Gestionar usuarios y permisos</Text>
              </Group>
              <Group gap="xs">
                <Text c="orange">•</Text>
                <Text size="sm">Ver información sensible del sistema</Text>
              </Group>
              <Group gap="xs">
                <Text c="orange">•</Text>
                <Text size="sm">Realizar cambios críticos en configuración</Text>
              </Group>
              <Group gap="xs">
                <Text c="orange">•</Text>
                <Text size="sm">Acceder a reportes financieros y analíticos</Text>
              </Group>
            </Stack>
          </Paper>
          
          <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
            Asegúrese de que el usuario destinatario ({pendingInvitationData?.get('email') as string})
            debe tener acceso a estas funciones críticas antes de continuar.
          </Text>
          
          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={() => {
                onCriticalRoleWarningClose()
                setPendingInvitationData(null)
                setSelectedCriticalRole(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              color="orange"
              leftSection={<IconAlertCircle size={16} />}
              onClick={confirmCriticalRoleInvitation}
            >
              Confirmar y Enviar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de vista de proveedor */}
      <Modal
        opened={isSupplierViewOpen}
        onClose={onSupplierViewClose}
        title="Detalles del Proveedor"
        size="lg"
      >
        {selectedSupplier && (
          <Stack gap="md">
            {/* Header del proveedor */}
            <Group justify="space-between">
              <div>
                <Title order={4}>{formatSupplierDisplay(selectedSupplier).displayName}</Title>
                <Text c="dimmed" size="sm">Código: {selectedSupplier.code}</Text>
              </div>
              <Group gap="xs">
                <Badge
                  color={formatSupplierDisplay(selectedSupplier).statusColor}
                  variant="light"
                >
                  {formatSupplierDisplay(selectedSupplier).statusLabel}
                </Badge>
                <Badge color="gray" variant="outline">
                  {formatSupplierDisplay(selectedSupplier).typeLabel}
                </Badge>
              </Group>
            </Group>

            <Divider />

            {/* Información básica */}
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" fw={500} c="dimmed">Nombre del Negocio</Text>
                <Text size="sm">{selectedSupplier.business_name || 'No especificado'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500} c="dimmed">Email de Contacto</Text>
                <Text size="sm">{selectedSupplier.contact_email || 'No especificado'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500} c="dimmed">Teléfono</Text>
                <Text size="sm">{selectedSupplier.contact_phone || 'No especificado'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500} c="dimmed">Persona de Contacto</Text>
                <Text size="sm">{selectedSupplier.contact_person || 'No especificado'}</Text>
              </Grid.Col>
            </Grid>

            {/* Usuario vinculado */}
            {selectedSupplier.user_id && (
              <Alert color="blue" title="Usuario Vinculado">
                <Group gap="xs">
                  <IconLink size={16} />
                  <Text size="sm">
                    Este proveedor está vinculado al usuario: {selectedSupplier.user_email || selectedSupplier.user_name || selectedSupplier.user_id}
                  </Text>
                </Group>
              </Alert>
            )}

            {/* Calificaciones */}
            {selectedSupplier.overall_rating && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Calificaciones</Text>
                <Group gap="lg">
                  <div>
                    <Text size="xs" c="dimmed">General</Text>
                    <Text size="lg" fw={700}>{selectedSupplier.overall_rating.toFixed(1)}/5</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Calidad</Text>
                    <Text size="sm">{selectedSupplier.rating_quality}/5</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Confiabilidad</Text>
                    <Text size="sm">{selectedSupplier.rating_reliability}/5</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Precio</Text>
                    <Text size="sm">{selectedSupplier.rating_pricing}/5</Text>
                  </div>
                </Group>
              </Stack>
            )}

            {/* Términos comerciales */}
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Términos Comerciales</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Días de Crédito</Text>
                  <Text size="sm">{selectedSupplier.payment_credit_days} días</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Método de Pago</Text>
                  <Text size="sm" tt="capitalize">{selectedSupplier.payment_method}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Tiempo de Entrega</Text>
                  <Text size="sm">{selectedSupplier.delivery_lead_time_days} días</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Pedido Mínimo</Text>
                  <Text size="sm">
                    {selectedSupplier.delivery_minimum_order
                      ? `$${selectedSupplier.delivery_minimum_order}`
                      : 'Sin mínimo'}
                  </Text>
                </Grid.Col>
              </Grid>
            </Stack>

            {/* Fechas */}
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Información del Sistema</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Fecha de Creación</Text>
                  <Text size="sm">{new Date(selectedSupplier.created_at).toLocaleDateString()}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Última Actualización</Text>
                  <Text size="sm">{new Date(selectedSupplier.updated_at).toLocaleDateString()}</Text>
                </Grid.Col>
              </Grid>
            </Stack>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={onSupplierViewClose}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}