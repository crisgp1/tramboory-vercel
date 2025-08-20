'use client';

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import {
  Button,
  Menu,
  Badge,
  Group,
  Text,
  Flex
} from '@mantine/core';
import {
  HomeIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const { role, isAdmin, isGerente } = useRole();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tramboory
          </span>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-2">
        <Group justify="space-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Tramboory
            </span>
          </div>
          <Button
            onClick={() => router.push('/')}
            variant="light"
            className="text-gray-600 hover:text-gray-800"
          >
            Iniciar Sesión
          </Button>
        </Group>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-2">
      <Group justify="space-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tramboory
          </span>
        </div>

        <Group className="hidden sm:flex" gap="md">
          {/* Solo mostrar Dashboard para roles no-customer */}
          {role !== "customer" && (
            <Button
              variant="light"
              onClick={() => router.push('/dashboard')}
              leftSection={<HomeIcon className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-800"
            >
              Dashboard
            </Button>
          )}
          <Button
            variant="light"
            onClick={() => router.push('/reservaciones')}
            leftSection={<CalendarDaysIcon className="w-4 h-4" />}
            className="text-gray-600 hover:text-gray-800"
          >
            {role === "customer" ? "Mis Celebraciones" : "Reservas"}
          </Button>
        </Group>

        <Group>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <Text size="sm" fw={500} c="gray.9">
                ¡Hola, {user.firstName}!
              </Text>
              <Group gap="xs">
                <Text size="xs" c="gray.6">
                  {user.primaryEmailAddress?.emailAddress}
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  c={role === "admin" ? "red" : role === "customer" ? "gray" : "blue"}
                >
                  {role === "customer" ? "Cliente" :
                   role === "admin" ? "Admin" :
                   role === "gerente" ? "Gerente" :
                   role === "proveedor" ? "Proveedor" : "Vendedor"}
                </Badge>
              </Group>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl border border-gray-200",
                  userButtonPopoverActionButton: "hover:bg-gray-50"
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
          
          {/* Mobile menu */}
          <div className="sm:hidden">
            <Menu>
            <Menu.Target>
              <Button
                variant="light"
                className="p-0 min-w-0"
                rightSection={<ChevronDownIcon className="w-4 h-4" />}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {[
                ...(role !== "customer" ? [{
                  key: "dashboard",
                  icon: HomeIcon,
                  label: "Dashboard",
                  onClick: () => router.push('/dashboard')
                }] : []),
                {
                  key: "reservations",
                  icon: CalendarDaysIcon,
                  label: role === "customer" ? "Mis Celebraciones" : "Reservas",
                  onClick: () => router.push('/reservaciones')
                }
              ].map(item => (
                <Menu.Item
                  key={item.key}
                  leftSection={<item.icon className="w-4 h-4" />}
                  onClick={item.onClick}
                >
                  {item.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
            </Menu>
          </div>
        </Group>
      </Group>
    </nav>
  );
}