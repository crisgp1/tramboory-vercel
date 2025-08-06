"use client"

import React, { useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { 
  Avatar, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem
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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--surface-elevated)'}}>
        <div className="text-center">
          <div className="loading-spinner" style={{margin: '0 auto'}}></div>
          <p className="text-neutral-600" style={{
            marginTop: 'var(--space-4)',
            fontSize: 'var(--text-sm)'
          }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--surface-elevated)'}}>
        <div className="surface-card" style={{
          maxWidth: '28rem',
          width: '100%',
          margin: '0 var(--space-4)',
          padding: 'var(--space-8)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 'var(--space-12)',
            height: 'var(--space-12)',
            backgroundColor: '#fee2e2',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <UserIcon className="icon-lg text-red-600" />
          </div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '600',
            marginBottom: 'var(--space-2)'
          }}>Sesión requerida</h3>
          <p className="text-neutral-600">No tienes una sesión activa</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--surface-elevated)'}}>
      {/* Professional Header */}
      <header className="surface-elevated sticky top-0" style={{
        borderBottom: `0.0625rem solid var(--border-default)`,
        zIndex: '40'
      }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center" style={{height: 'var(--space-16)'}}>
            <div className="flex items-center" style={{gap: 'var(--space-4)'}}>
              <button
                className="btn-icon lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Bars3Icon className="icon-base" />
              </button>
              <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
                <div style={{
                  width: 'var(--space-8)',
                  height: 'var(--space-8)',
                  backgroundColor: 'var(--primary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 'var(--text-sm)'
                  }}>T</span>
                </div>
                <h1 className="hidden sm:block" style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600'
                }}>
                  Tramboory
                </h1>
              </div>
            </div>
            
            <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
              <button className="btn-icon">
                <BellIcon className="icon-base" />
              </button>
              
              {/* Professional User Menu */}
              <Dropdown>
                <DropdownTrigger>
                  <Avatar
                    src={user.imageUrl}
                    icon={!user.imageUrl ? <UserIcon className="icon-base" /> : undefined}
                    size="sm"
                    className="cursor-pointer focus-ring"
                    style={{
                      border: `0.125rem solid var(--border-default)`,
                      boxShadow: `0 0 0 0.125rem var(--surface-base)`
                    }}
                  />
                </DropdownTrigger>
                <DropdownMenu className="dropdown-menu">
                  <DropdownItem key="profile" className="dropdown-menu-item" style={{
                    height: 'var(--space-14)',
                    gap: 'var(--space-2)'
                  }}>
                    <p style={{fontWeight: '500'}}>{user.fullName}</p>
                    <p className="text-neutral-500" style={{fontSize: 'var(--text-sm)'}}>
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </DropdownItem>
                  <DropdownItem 
                    key="logout" 
                    className="dropdown-menu-item danger"
                    startContent={<ArrowRightOnRectangleIcon className="icon-base" />}
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
        {/* Professional Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 surface-base transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} style={{
          width: '16rem',
          borderRight: `0.0625rem solid var(--border-default)`
        }}>
          <div className="flex flex-col h-full">
            {/* Professional Sidebar Header */}
            <div className="flex items-center justify-between lg:hidden" style={{
              padding: 'var(--space-4)',
              borderBottom: `0.0625rem solid var(--border-default)`
            }}>
              <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: '600'
              }}>Navegación</h2>
              <button
                className="btn-icon btn-icon-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="icon-base" />
              </button>
            </div>

            {/* Professional Navigation */}
            <nav className="navigation-menu flex-1" style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)'
            }}>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const IconSolid = item.iconSolid
                const isActive = activeMenuItem === item.id
                
                return (
                  <button
                    key={item.id}
                    className={`navigation-menu-item ${isActive ? 'active' : ''}`}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      minHeight: '2.75rem',
                      fontWeight: '500'
                    }}
                    onClick={() => {
                      setActiveMenuItem(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    {isActive ? 
                      <IconSolid className="icon-base" /> : 
                      <Icon className="icon-base" />
                    }
                    <span className="text-left flex-1">{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Professional User Info */}
            <div style={{
              padding: 'var(--space-4)',
              borderTop: `0.0625rem solid var(--border-default)`
            }}>
              <div className="surface-elevated" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <Avatar
                  src={user.imageUrl}
                  icon={!user.imageUrl ? <UserIcon className="icon-base" /> : undefined}
                  size="sm"
                  style={{
                    border: `0.125rem solid var(--border-default)`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500'
                  }}>
                    {user.fullName}
                  </p>
                  <p className="text-neutral-600 truncate" style={{
                    fontSize: 'var(--text-xs)'
                  }}>
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 lg:hidden"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(0.25rem)'
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Professional Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}