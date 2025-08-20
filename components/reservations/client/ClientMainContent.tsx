'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Loader,
  Center,
  Stack,
  Title,
  Text,
  Group,
  Box,
  SimpleGrid,
  ActionIcon,
  Affix
} from '@mantine/core';
import {
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import SimpleHeader from '@/components/auth/SimpleHeader';
import { useReservationStore } from '@/stores/reservationStore';
import ClientReservationCard from './ClientReservationCard';
import { Reservation } from '@/types/reservation';

interface ClientMainContentProps {
  onViewReservation: (reservation: Reservation) => void;
}

export default function ClientMainContent({ onViewReservation }: ClientMainContentProps) {
  const router = useRouter();
  const { loading, filteredReservations, filter } = useReservationStore();
  
  const reservations = filteredReservations();

  const getFilterTitle = () => {
    switch (filter) {
      case 'confirmed':
        return 'Celebraciones Confirmadas';
      case 'pending':
        return 'Celebraciones Pendientes';
      case 'completed':
        return 'Celebraciones Completadas';
      case 'cancelled':
        return 'Celebraciones Canceladas';
      default:
        return 'Todas tus Celebraciones';
    }
  };

  const getFilterEmoji = () => {
    switch (filter) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'completed':
        return '🏆';
      case 'cancelled':
        return '❌';
      default:
        return '🎉';
    }
  };

  if (loading) {
    return (
      <Center className="min-h-screen bg-gray-50">
        <Stack align="center">
          <Loader size="lg" color="gray" />
          <Text c="dimmed">
            Cargando reservaciones...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (reservations.length === 0) {
    return (
      <Center className="min-h-screen bg-gray-50 p-8">
        <Card shadow="sm" radius="lg" withBorder className="max-w-lg w-full" padding="xl">
          <Stack align="center" gap="lg">
            <Center className="w-20 h-20 bg-gray-100 rounded-full">
              <Text size="2rem">📅</Text>
            </Center>
            
            <Title order={3} ta="center">
              No hay reservaciones
            </Title>
            <Text c="dimmed" ta="center">
              Aún no tienes reservaciones programadas.
            </Text>
            <Button
              leftSection={<PlusIcon className="w-4 h-4" />}
              onClick={() => router.push('/reservaciones/nueva')}
              color="dark"
              size="md"
            >
              Nueva Reserva
            </Button>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box className="flex-1 bg-gray-50 min-h-screen">
      {/* Mobile Header - solo visible en pantallas pequeñas */}
      <Box className="lg:hidden">
        <SimpleHeader title="Mis Reservaciones" />
      </Box>
      
      <Box p={{ base: 'md', lg: 'xl' }}>
        {/* Header */}
        <Stack mb="xl">
          <Title order={2}>
            Mis Reservaciones
          </Title>
          <Text c="dimmed">
            {reservations.length} {reservations.length === 1 ? 'reservación' : 'reservaciones'}
          </Text>
        </Stack>

        {/* Reservations Grid */}
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 2, xl: 3 }}
          spacing={{ base: 'md', sm: 'lg' }}
        >
          {reservations.map((reservation) => (
            <ClientReservationCard
              key={reservation._id}
              reservation={reservation}
              onView={onViewReservation}
            />
          ))}
        </SimpleGrid>

        {/* Floating Action Button for mobile */}
        <Affix position={{ bottom: 24, right: 24 }} className="lg:hidden">
          <ActionIcon
            onClick={() => router.push('/reservaciones/nueva')}
            size="xl"
            radius="xl"
            color="dark"
            variant="filled"
            className="shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="w-6 h-6" />
          </ActionIcon>
        </Affix>
      </Box>
    </Box>
  );
}