'use client';

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip
} from '@heroui/react';
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
      <NextUINavbar className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <NavbarBrand>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Tramboory
            </span>
          </div>
        </NavbarBrand>
      </NextUINavbar>
    );
  }

  if (!user) {
    return (
      <NextUINavbar className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <NavbarBrand>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Tramboory
            </span>
          </div>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              onPress={() => router.push('/')}
              variant="light"
              className="text-gray-600 hover:text-gray-800"
            >
              Iniciar Sesión
            </Button>
          </NavbarItem>
        </NavbarContent>
      </NextUINavbar>
    );
  }

  return (
    <NextUINavbar className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <NavbarBrand>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tramboory
          </span>
        </div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {/* Solo mostrar Dashboard para roles no-customer */}
        {role !== "customer" && (
          <NavbarItem>
            <Button
              variant="light"
              onPress={() => router.push('/dashboard')}
              startContent={<HomeIcon className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-800"
            >
              Dashboard
            </Button>
          </NavbarItem>
        )}
        <NavbarItem>
          <Button
            variant="light"
            onPress={() => router.push('/reservaciones')}
            startContent={<CalendarDaysIcon className="w-4 h-4" />}
            className="text-gray-600 hover:text-gray-800"
          >
            {role === "customer" ? "Mis Celebraciones" : "Reservas"}
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                ¡Hola, {user.firstName}!
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <Chip 
                  size="sm" 
                  variant="flat"
                  color={role === "admin" ? "danger" : role === "customer" ? "default" : "primary"}
                >
                  {role === "customer" ? "Cliente" : 
                   role === "admin" ? "Admin" : 
                   role === "gerente" ? "Gerente" : 
                   role === "proveedor" ? "Proveedor" : "Vendedor"}
                </Chip>
              </div>
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
        </NavbarItem>
        
        {/* Mobile menu */}
        <NavbarItem className="sm:hidden">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="light"
                className="p-0 min-w-0"
                endContent={<ChevronDownIcon className="w-4 h-4" />}
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
            </DropdownTrigger>
            <DropdownMenu aria-label="Menu de navegación">
              {[
                ...(role !== "customer" ? [{
                  key: "dashboard",
                  icon: HomeIcon,
                  label: "Dashboard",
                  onPress: () => router.push('/dashboard')
                }] : []),
                {
                  key: "reservations",
                  icon: CalendarDaysIcon,
                  label: role === "customer" ? "Mis Celebraciones" : "Reservas",
                  onPress: () => router.push('/reservaciones')
                }
              ].map(item => (
                <DropdownItem
                  key={item.key}
                  startContent={<item.icon className="w-4 h-4" />}
                  onPress={item.onPress}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
}