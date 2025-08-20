'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Button,
  Badge,
  Avatar
} from '@mantine/core';
import {
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useRole } from '@/hooks/useRole';
import { useUser } from '@clerk/nextjs';

interface AdminQuickNavProps {
  variant?: 'header' | 'standalone';
  className?: string;
}

export default function AdminQuickNav({ variant = 'header', className = '' }: AdminQuickNavProps) {
  const { user } = useUser();
  const { role, isAdmin, isGerente, isProveedor, isVendedor } = useRole();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show for regular customers
  if (!isAdmin && !isGerente && !isProveedor && !isVendedor) {
    return null;
  }

  const adminMenuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Panel de administración',
      icon: ChartBarIcon,
      href: '/dashboard',
      roles: ['admin', 'gerente', 'vendedor'],
      color: 'primary' as const
    },
    {
      key: 'reservations',
      label: 'Reservaciones',
      description: 'Gestionar reservas',
      icon: CalendarDaysIcon,
      href: '/dashboard/reservaciones',
      roles: ['admin', 'gerente', 'vendedor'],
      color: 'secondary' as const
    },
    {
      key: 'suppliers',
      label: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: BuildingStorefrontIcon,
      href: '/dashboard/proveedores',
      roles: ['admin', 'gerente'],
      color: 'success' as const
    },
    {
      key: 'inventory',
      label: 'Inventario',
      description: 'Control de productos',
      icon: CubeIcon,
      href: '/dashboard/inventario',
      roles: ['admin', 'gerente', 'vendedor'],
      color: 'warning' as const
    },
    {
      key: 'users',
      label: 'Usuarios',
      description: 'Administrar usuarios',
      icon: UserGroupIcon,
      href: '/dashboard/usuarios',
      roles: ['admin', 'gerente'],
      color: 'danger' as const
    },
    {
      key: 'finance',
      label: 'Finanzas',
      description: 'Reportes financieros',
      icon: BanknotesIcon,
      href: '/dashboard/finanzas',
      roles: ['admin', 'gerente'],
      color: 'secondary' as const
    },
    {
      key: 'reports',
      label: 'Reportes',
      description: 'Análisis y reportes',
      icon: DocumentTextIcon,
      href: '/dashboard/reportes',
      roles: ['admin', 'gerente'],
      color: 'primary' as const
    }
  ];

  // Filter items based on user role
  const availableItems = adminMenuItems.filter(item => 
    item.roles.includes(role)
  );

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'proveedor': return 'Proveedor';
      case 'vendedor': return 'Vendedor';
      default: return 'Usuario';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin': return 'danger';
      case 'gerente': return 'primary';
      case 'proveedor': return 'success';
      case 'vendedor': return 'warning';
      default: return 'default';
    }
  };

  if (variant === 'standalone') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="light"
                color={item.color}
                leftSection={<Icon className="w-4 h-4" />}
                onClick={() => handleNavigation(item.href)}
                className="text-sm"
              >
                {item.label}
              </Button>
            </motion.div>
          );
        })}
        {availableItems.length > 4 && (
          <Menu opened={isOpen} onChange={setIsOpen}>
            <Menu.Target>
              <Button variant="light" color="gray">
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {availableItems.slice(4).map((item) => {
                const Icon = item.icon;
                return (
                  <Menu.Item
                    key={item.key}
                    leftSection={<Icon className="w-4 h-4" />}
                    onClick={() => handleNavigation(item.href)}
                  >
                    {item.label}
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Menu opened={isOpen} onChange={setIsOpen}>
        <Menu.Target>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex"
          >
            <Button
              variant="light"
              color="blue"
              size="sm"
              rightSection={
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.div>
              }
              className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0"
              styles={{
                root: {
                  minWidth: 'auto',
                  padding: '4px 6px',
                  height: '28px',
                  fontSize: '11px'
                },
                inner: {
                  gap: '3px'
                }
              }}
            >
              {/* Text responsive: icon on mobile, short text on tablet, full text on desktop */}
              <span className="inline sm:hidden">👤</span>
              <span className="hidden sm:inline lg:hidden text-xs">Vistas</span>
              <span className="hidden lg:inline text-xs">Panel</span>
            </Button>
          </motion.div>
        </Menu.Target>

        <Menu.Dropdown className="w-48 sm:w-64 lg:w-72 shadow-lg border border-gray-200">
          <Menu.Item
            onClick={() => handleNavigation('/dashboard')}
            leftSection={<ChartBarIcon className="w-4 h-4" />}
            className="hover:bg-gray-50"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-gray-900">Admin</span>
              <span className="text-xs text-gray-500 hidden lg:inline">Panel de administración</span>
            </div>
          </Menu.Item>
          <Menu.Item
            onClick={() => handleNavigation('/proveedor')}
            leftSection={<BuildingStorefrontIcon className="w-4 h-4" />}
            className="hover:bg-gray-50"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-gray-900">Proveedor</span>
              <span className="text-xs text-gray-500 hidden lg:inline">Vista de proveedor</span>
            </div>
          </Menu.Item>
          <Menu.Item
            onClick={() => handleNavigation('/reservaciones')}
            leftSection={<CalendarDaysIcon className="w-4 h-4" />}
            className="hover:bg-gray-50"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-gray-900">Cliente</span>
              <span className="text-xs text-gray-500 hidden lg:inline">Vista de cliente</span>
            </div>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}