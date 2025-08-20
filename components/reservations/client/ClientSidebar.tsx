'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Button,
  Avatar,
  Divider,
  Stack,
  Group,
  Text,
  Box,
  Title
} from '@mantine/core';
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
    <Box
      className="bg-white"
      w={288}
      h="100%"
      style={{
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Professional User Profile Section */}
      <Box p="lg" className="border-b border-gray-200">
        <Group gap="sm" mb="lg">
          <Avatar
            src={user?.imageUrl}
            size="md"
            radius="xl"
            className="border-2 border-gray-200"
          >
            {user?.firstName?.charAt(0) || 'U'}
          </Avatar>
          <div className="flex-1">
            <Text size="sm" fw={600}>
              {user?.firstName || 'Usuario'}
            </Text>
            <Text size="xs" c="dimmed">
              Mis reservaciones
            </Text>
          </div>
        </Group>
      </Box>

      {/* Professional Main Actions */}
      <Stack p="lg" gap="sm">
        <Button
          leftSection={<PlusIcon className="w-4 h-4" />}
          onClick={() => router.push('/reservaciones/nueva')}
          fullWidth
          variant="filled"
          color="dark"
        >
          Nueva Reserva
        </Button>
        
        <Button
          leftSection={<EyeIcon className="w-4 h-4" />}
          onClick={() => router.push('/reservaciones')}
          fullWidth
          variant="light"
          color="dark"
        >
          Consultar Reservas
        </Button>
      </Stack>

      <Divider mx="lg" />

      {/* Professional Footer */}
      <Stack mt="auto" p="lg" gap="md">
        <Stack gap="xs">
          <Button
            leftSection={<HomeIcon className="w-4 h-4" />}
            onClick={() => router.push('/')}
            fullWidth
            variant="subtle"
            color="gray"
            justify="flex-start"
          >
            Inicio
          </Button>
          <LogoutButton
            variant="light"
            color="danger"
            size="sm"
            className="w-full justify-start"
          />
        </Stack>
        <Text size="xs" c="dimmed" ta="center">
          Tramboory © 2025
        </Text>
      </Stack>
    </Box>
  );
}