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
    <Menu opened={isOpen} onChange={setIsOpen}>
      <Menu.Target>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={className}
        >
          <Button
            variant="light"
            color="blue"
            leftSection={
              <div className="flex items-center gap-2">
                <Avatar
                  src={user?.imageUrl}
                  name={user?.firstName || 'Admin'}
                  size="sm"
                  className="w-6 h-6"
                />
                <Badge
                  size="sm"
                  color={getRoleColor()}
                  variant="outline"
                  leftSection={<ShieldCheckIcon className="w-3 h-3" />}
                >
                  {getRoleDisplayName()}
                </Badge>
              </div>
            }
            rightSection={
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDownIcon className="w-4 h-4" />
              </motion.div>
            }
            className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white"
          >
            <span className="hidden sm:inline">Panel Admin</span>
          </Button>
        </motion.div>
      </Menu.Target>

      <Menu.Dropdown className="w-72">
        <Menu.Item
          onClick={() => handleNavigation('/dashboard/usuarios')}
        >
          Usuarios
        </Menu.Item>
        <Menu.Item
          onClick={() => handleNavigation('/dashboard/inventario')}
        >
          Inventario
        </Menu.Item>
        <Menu.Item
          onClick={() => handleNavigation('/dashboard/finanzas')}
        >
          Finanzas
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <Cog6ToothIcon className="w-4 h-4" />
            </div>
          }
          onClick={() => handleNavigation('/dashboard/configuracion')}
        >
          <span className="font-medium">Configuración</span>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}