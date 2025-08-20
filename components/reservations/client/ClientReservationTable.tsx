'use client';

import React from 'react';
import {
  Table,
  Button,
  Card,
  Badge,
  Stack,
  Group,
  Text,
  ActionIcon,
  Box,
  Skeleton
} from '@mantine/core';
import {
  EyeIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';

interface ClientReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onView: (reservation: Reservation) => void;
}

export default function ClientReservationTable({
  reservations,
  loading,
  onView
}: ClientReservationTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  if (loading) {
    return (
      <Stack gap="md">
        {[...Array(3)].map((_, i) => (
          <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Skeleton height={16} width="33%" radius="sm" />
                <Skeleton height={12} width="50%" radius="sm" />
              </Stack>
              <Skeleton height={32} width={80} radius="sm" />
            </Group>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Vista móvil - Cards */}
      <Box className="block md:hidden">
        <Stack gap="md">
          {reservations.map((reservation) => (
            <Card 
              key={reservation._id} 
              shadow="lg" 
              padding="lg" 
              radius="md" 
              withBorder
              className="hover:shadow-xl transition-all duration-300"
            >
              <Group justify="space-between" align="flex-start" mb="md">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text size="lg" fw={600}>
                    Fiesta de {reservation.child.name}
                  </Text>
                  <Group gap="xs">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <Text size="sm" c="dimmed">
                      {formatDate(reservation.eventDate)}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <ClockIcon className="w-4 h-4" />
                    <Text size="sm" c="dimmed">
                      {reservation.eventTime}
                    </Text>
                  </Group>
                  <Text size="lg" fw={600} c="green">
                    {formatPrice(reservation.pricing?.total || 0)}
                  </Text>
                </Stack>
                <Badge
                  color={getStatusColor(reservation.status)}
                  variant="light"
                  size="sm"
                >
                  {getStatusText(reservation.status)}
                </Badge>
              </Group>
              <Button
                leftSection={<EyeIcon className="w-4 h-4" />}
                onClick={() => onView(reservation)}
                fullWidth
                variant="gradient"
                gradient={{ from: 'blue', to: 'purple' }}
                size="sm"
              >
                Ver Detalles
              </Button>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Vista desktop - Tabla */}
      <Box className="hidden md:block">
        <Card shadow="lg" radius="md" withBorder p={0}>
          <Table striped highlightOnHover>
            <Table.Thead className="bg-gradient-to-r from-blue-50 to-purple-50">
              <Table.Tr>
                <Table.Th>EVENTO</Table.Th>
                <Table.Th>FECHA Y HORA</Table.Th>
                <Table.Th>PAQUETE</Table.Th>
                <Table.Th>TOTAL</Table.Th>
                <Table.Th>ESTADO</Table.Th>
                <Table.Th>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reservations.map((reservation) => (
                <Table.Tr key={reservation._id}>
                  <Table.Td>
                    <Stack gap={4}>
                      <Text fw={600}>
                        Fiesta de {reservation.child.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Text fw={500}>
                        {formatDate(reservation.eventDate)}
                      </Text>
                      <Group gap={4}>
                        <ClockIcon className="w-3 h-3" />
                        <Text size="sm" c="dimmed">
                          {reservation.eventTime}
                        </Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>
                      {reservation.package?.name || 'Paquete personalizado'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="lg" fw={600} c="green">
                      {formatPrice(reservation.pricing?.total || 0)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getStatusColor(reservation.status)}
                      variant="light"
                      size="sm"
                    >
                      {getStatusText(reservation.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onView(reservation)}
                      size="sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Box>
    </Stack>
  );
}