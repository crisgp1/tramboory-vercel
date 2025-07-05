'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Button,
  Avatar,
  Divider
} from '@heroui/react';
import {
  PlusIcon,
  EyeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import LogoutButton from '@/components/auth/LogoutButton';

export default function ClientSidebar() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="w-72 h-full bg-white border-r border-gray-100 flex flex-col">
      {/* User Profile Section */}
      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Avatar
            src={user?.imageUrl}
            name={user?.fullName || user?.firstName || 'Usuario'}
            size="md"
            className="ring-1 ring-gray-200"
          />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              {user?.firstName || 'Usuario'}
            </h2>
            <p className="text-sm text-gray-500">
              Mis reservaciones
            </p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="p-6 space-y-3">
        <Button
          onPress={() => router.push('/reservaciones/nueva')}
          className="w-full bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200"
          size="lg"
          startContent={<PlusIcon className="w-5 h-5" />}
        >
          Nueva Reserva
        </Button>
        
        <Button
          onPress={() => router.push('/reservaciones')}
          variant="bordered"
          className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          size="lg"
          startContent={<EyeIcon className="w-5 h-5" />}
        >
          Consultar Reservas
        </Button>
      </div>

      <Divider className="mx-6" />

      {/* Footer */}
      <div className="mt-auto p-6 space-y-4">
        <div className="space-y-2">
          <Button
            onPress={() => router.push('/')}
            variant="light"
            className="w-full text-gray-600 hover:text-gray-900 justify-start"
            size="sm"
            startContent={<HomeIcon className="w-4 h-4" />}
          >
            Inicio
          </Button>
          <LogoutButton 
            variant="light" 
            color="danger" 
            size="sm"
            className="w-full justify-start"
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Tramboory © 2025
        </p>
      </div>
    </div>
  );
}