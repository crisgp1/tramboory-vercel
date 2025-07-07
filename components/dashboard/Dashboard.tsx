"use client"

import React, { useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { 
  Button, 
  Avatar, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Card,
  CardBody,
  Badge,
  Chip
} from "@heroui/react"
import { 
  ArrowRightOnRectangleIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Cog8ToothIcon,
  UsersIcon
} from "@heroicons/react/24/outline"
import {
  ChartBarIcon as ChartBarSolidIcon,
  CalendarDaysIcon as CalendarSolidIcon,
  CurrencyDollarIcon as CurrencySolidIcon,
  Cog6ToothIcon as CogSolidIcon,
  ArchiveBoxIcon as ArchiveSolidIcon,
  UsersIcon as UsersSolidIcon
} from "@heroicons/react/24/solid"
import { useRole } from "@/hooks/useRole"
import toast from "react-hot-toast"
import ReservationManager from "@/components/reservations/ReservationManager"
import ConfigurationManager from "@/components/admin/ConfigurationManager"
import FinanceManager from "@/components/finances/FinanceManager"
import InventoryManager from "@/components/inventory/InventoryManager"
import UserManagement from "@/components/dashboard/sections/UserManagement"
import AnalyticsManager from "@/components/analytics/AnalyticsManager"

type MenuItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  description: string
}

const menuItems: MenuItem[] = [
  { 
    id: "analytics", 
    label: "Analytics", 
    icon: ChartBarIcon, 
    iconSolid: ChartBarSolidIcon,
    description: "Métricas y reportes del negocio"
  },
  { 
    id: "reservas", 
    label: "Reservas", 
    icon: CalendarDaysIcon, 
    iconSolid: CalendarSolidIcon,
    description: "Gestión de reservas y eventos"
  },
  { 
    id: "finanzas", 
    label: "Finanzas", 
    icon: CurrencyDollarIcon, 
    iconSolid: CurrencySolidIcon,
    description: "Ingresos, gastos y facturación"
  },
  { 
    id: "configuracion", 
    label: "Configuración", 
    icon: Cog6ToothIcon, 
    iconSolid: CogSolidIcon,
    description: "Ajustes del sistema y paquetes"
  },
  { 
    id: "inventario", 
    label: "Inventario", 
    icon: ArchiveBoxIcon, 
    iconSolid: ArchiveSolidIcon,
    description: "Control de materiales y equipos"
  },
  { 
    id: "usuarios", 
    label: "Usuarios", 
    icon: UsersIcon, 
    iconSolid: UsersSolidIcon,
    description: "Gestión de usuarios y roles"
  }
]

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { role, isAdmin, isGerente } = useRole()
  const [activeMenuItem, setActiveMenuItem] = useState("analytics")
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      toast.success("Sesión cerrada exitosamente")
    } catch (error) {
      toast.error("Error al cerrar sesión")
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

    // Default content - redirect to analytics since that's the main dashboard view
    return <AnalyticsManager />
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 mx-auto"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-gray-600 mt-4 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4 border border-gray-200 shadow-lg">
          <CardBody className="p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sesión requerida</h3>
            <p className="text-gray-600">No tienes una sesión activa</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onPress={() => setSidebarOpen(!sidebarOpen)}
              >
                <Bars3Icon className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">T</span>
                </div>
                <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                  Tramboory
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <BellIcon className="w-5 h-5" />
              </Button>
              
              {/* User Menu */}
              <Dropdown>
                <DropdownTrigger>
                  <Avatar
                    src={user.imageUrl}
                    icon={!user.imageUrl ? <UserIcon className="w-4 h-4" /> : undefined}
                    size="sm"
                    className="cursor-pointer"
                  />
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-small text-default-500">{user.primaryEmailAddress?.emailAddress}</p>
                  </DropdownItem>
                  <DropdownItem 
                    key="logout" 
                    color="danger"
                    startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                    onPress={handleSignOut}
                  >
                    Cerrar Sesión
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
              <h2 className="text-lg font-semibold text-gray-900">Navegación</h2>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onPress={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const IconSolid = item.iconSolid
                const isActive = activeMenuItem === item.id
                
                return (
                  <Button
                    key={item.id}
                    variant="light"
                    className={`w-full justify-start h-11 font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-gray-900 text-white hover:bg-gray-800" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    startContent={
                      isActive ? 
                        <IconSolid className="w-5 h-5" /> : 
                        <Icon className="w-5 h-5" />
                    }
                    onPress={() => {
                      setActiveMenuItem(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <span className="text-left flex-1">{item.label}</span>
                  </Button>
                )
              })}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar
                  src={user.imageUrl}
                  icon={!user.imageUrl ? <UserIcon className="w-4 h-4" /> : undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}