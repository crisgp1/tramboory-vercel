"use client"

import React, { useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  AppShell,
  Text,
  Title,
  Avatar,
  Menu,
  ActionIcon,
  Group,
  Stack,
  Paper,
  Burger,
  Loader,
  Center,
  Alert,
  UnstyledButton,
  Flex
} from "@mantine/core"
import {
  IconLogout,
  IconUser,
  IconMenu2,
  IconX,
  IconChartBar,
  IconCalendar,
  IconCurrencyDollar,
  IconSettings,
  IconBox,
  IconBell,
  IconUsers,
  IconSparkles
} from "@tabler/icons-react"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useRole } from "@/hooks/useRole"
import ReservationManager from "@/components/reservations/ReservationManager"
import ConfigurationManager from "@/components/admin/ConfigurationManager"
import FinanceManager from "@/components/finances/FinanceManager"
import InventoryManager from "@/components/inventory/InventoryManager"
import UserManagement from "@/components/dashboard/sections/UserManagement"
import AnalyticsManager from "@/components/analytics/AnalyticsManager"
import CouponManager from "@/components/admin/CouponManager"
import AdminQuickNav from "@/components/navigation/AdminQuickNav"

type MenuItem = {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number | string }>
  description: string
}

const menuItems: MenuItem[] = [
  { 
    id: "analytics", 
    label: "Analytics", 
    icon: IconChartBar,
    description: "Métricas y reportes del negocio"
  },
  { 
    id: "reservas", 
    label: "Reservas", 
    icon: IconCalendar,
    description: "Gestión de reservas y eventos"
  },
  { 
    id: "finanzas", 
    label: "Finanzas", 
    icon: IconCurrencyDollar,
    description: "Ingresos, gastos y facturación"
  },
  { 
    id: "configuracion", 
    label: "Configuración", 
    icon: IconSettings,
    description: "Ajustes del sistema y paquetes"
  },
  { 
    id: "inventario", 
    label: "Inventario", 
    icon: IconBox,
    description: "Control de materiales y equipos"
  },
  { 
    id: "usuarios", 
    label: "Usuarios", 
    icon: IconUsers,
    description: "Gestión de usuarios y roles"
  },
  { 
    id: "cupones", 
    label: "Cupones", 
    icon: IconSparkles,
    description: "Gestión de promociones y descuentos"
  }
]

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { role, isAdmin, isGerente } = useRole()
  const [activeMenuItem, setActiveMenuItem] = useState("analytics")
  const [opened, { toggle }] = useDisclosure()

  // Filtrar elementos del menú según el rol
  const filteredMenuItems = menuItems.filter(item => {
    switch (item.id) {
      case "configuracion":
        // Solo admin puede acceder a configuración
        return isAdmin
      case "inventario":
        // Admin, gerente y proveedor pueden acceder a inventario
        return isAdmin || isGerente || role === "proveedor"
      case "finanzas":
        // Admin y gerente pueden acceder a finanzas
        return isAdmin || isGerente
      case "analytics":
        // Admin y gerente pueden ver analytics
        return isAdmin || isGerente
      case "usuarios":
        // Solo admin y gerente pueden gestionar usuarios
        return isAdmin || isGerente
      case "cupones":
        // Solo admin y gerente pueden gestionar cupones
        return isAdmin || isGerente
      case "reservas":
        // Todos los roles pueden ver reservas
        return true
      default:
        return true
    }
  })

  // Si no hay elementos disponibles, redirigir el primer elemento permitido
  React.useEffect(() => {
    if (filteredMenuItems.length > 0 && !filteredMenuItems.find(item => item.id === activeMenuItem)) {
      setActiveMenuItem(filteredMenuItems[0].id)
    }
  }, [filteredMenuItems, activeMenuItem])

  const handleSignOut = async () => {
    try {
      await signOut()
      notifications.show({
        title: "Éxito",
        message: "Sesión cerrada exitosamente",
        color: "green"
      })
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Error al cerrar sesión",
        color: "red"
      })
    }
  }

  const renderContent = () => {
    const activeItem = menuItems.find(item => item.id === activeMenuItem)

    // Si es la sección de analytics, mostrar el componente específico
    if (activeMenuItem === 'analytics') {
      return <AnalyticsManager />
    }

    // Si es la sección de reservas, mostrar el componente específico
    if (activeMenuItem === 'reservas') {
      return <ReservationManager />
    }

    // Si es la sección de finanzas, mostrar el componente específico
    if (activeMenuItem === 'finanzas') {
      return <FinanceManager />
    }

    // Si es la sección de configuración, mostrar el componente específico
    if (activeMenuItem === 'configuracion') {
      return <ConfigurationManager />
    }

    // Si es la sección de inventario, mostrar el componente específico
    if (activeMenuItem === 'inventario') {
      return <InventoryManager />
    }
    
    // Si es la sección de usuarios, mostrar el componente específico
    if (activeMenuItem === 'usuarios') {
      return <UserManagement />
    }

    // Si es la sección de cupones, mostrar el componente específico
    if (activeMenuItem === 'cupones') {
      return <CouponManager />
    }

    // Default content - redirect to analytics since that's the main dashboard view
    return <AnalyticsManager />
  }

  if (!isLoaded) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Cargando...</Text>
        </Stack>
      </Center>
    )
  }

  if (!user) {
    return (
      <Center h="100vh">
        <Paper p="xl" radius="md" withBorder shadow="sm" style={{maxWidth: 400, width: '100%'}}>
          <Stack align="center" gap="lg">
            <Paper p="md" radius="xl" bg="red.1" c="red.6">
              <IconUser size={48} />
            </Paper>
            <Stack align="center" gap="xs">
              <Title order={3}>Sesión requerida</Title>
              <Text c="dimmed" ta="center">No tienes una sesión activa</Text>
            </Stack>
          </Stack>
        </Paper>
      </Center>
    )
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 256,
        breakpoint: 'lg',
        collapsed: { mobile: !opened, desktop: false }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="lg" />
            <Group gap="sm">
              <Paper
                p="xs"
                radius="md"
                bg="blue.6"
                c="white"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text fw={600} size="sm">T</Text>
              </Paper>
              <Title order={4} hiddenFrom="xs">Tramboory</Title>
            </Group>
          </Group>
          
          <Group>
            <AdminQuickNav variant="header" />
            
            <ActionIcon variant="subtle" size="lg">
              <IconBell size={20} />
            </ActionIcon>
            
            <Menu shadow="md" width={250}>
              <Menu.Target>
                <Avatar
                  src={user.imageUrl}
                  size="sm"
                  style={{ cursor: 'pointer' }}
                  radius="xl"
                >
                  {!user.imageUrl && <IconUser size={16} />}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item>
                  <Stack gap="xs">
                    <Text fw={500}>{user.fullName}</Text>
                    <Text size="sm" c="dimmed">
                      {user.primaryEmailAddress?.emailAddress}
                    </Text>
                  </Stack>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={handleSignOut}
                  c="red"
                >
                  Cerrar Sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenuItem === item.id
            
            return (
              <UnstyledButton
                key={item.id}
                onClick={() => {
                  setActiveMenuItem(item.id)
                  if (opened) toggle() // Close mobile menu when item is selected
                }}
                p="sm"
                style={{
                  borderRadius: 8,
                  backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : 'transparent',
                  color: isActive ? 'var(--mantine-color-blue-filled)' : 'inherit',
                  border: isActive ? '1px solid var(--mantine-color-blue-light-color)' : '1px solid transparent'
                }}
              >
                <Group gap="sm">
                  <Icon size={20} />
                  <Text size="sm" fw={isActive ? 500 : 400}>
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            )
          })}
        </Stack>
        
        <Paper 
          mt="auto" 
          p="sm" 
          radius="md" 
          withBorder 
          bg="gray.0"
        >
          <Group>
            <Avatar src={user.imageUrl} size="sm" radius="xl">
              {!user.imageUrl && <IconUser size={16} />}
            </Avatar>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {user.fullName}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {role}
              </Text>
            </Stack>
          </Group>
        </Paper>
      </AppShell.Navbar>

      <AppShell.Main>
        {renderContent()}
      </AppShell.Main>
    </AppShell>
  )
}