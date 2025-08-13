'use client';

import React, { useState } from 'react';
import {
  Table,
  ScrollArea,
  Button,
  Badge,
  Tooltip,
  Card,
  ActionIcon,
  Group,
  Stack,
  Text
} from '@mantine/core';
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconClock,
  IconUser,
  IconCurrencyDollar,
  IconCake,
  IconGrid3x3,
  IconTable
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/types/reservation';

interface ReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onView: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
}

const statusColorMap = {
  pending: 'orange',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue'
} as const;

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

export default function ReservationTable({
  reservations,
  loading,
  onView,
  onEdit,
  onDelete
}: ReservationTableProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  React.useEffect(() => {
    const checkViewMode = () => {
      if (window.innerWidth < 1024) {
        setViewMode('grid');
      }
    };
    
    checkViewMode();
    window.addEventListener('resize', checkViewMode);
    return () => window.removeEventListener('resize', checkViewMode);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Vista en grid minimalista
  const GridView = () => (
    <div className="w-full">
      {reservations.length === 0 ? (
        <Stack align="center" py="xl" gap="md">
          <IconCalendar size={48} color="gray" />
          <Text c="dimmed" size="sm">No hay reservas disponibles</Text>
        </Stack>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {reservations.map((reservation) => (
            <Card 
              key={reservation._id} 
              withBorder
              p="md"
              style={{ cursor: 'pointer' }}
              className="hover:shadow-sm transition-shadow"
            >
                {/* Header con estado */}
                <Group justify="space-between" mb="sm">
                  <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
                    <div 
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-dark-9)',
                        flexShrink: 0
                      }}
                    />
                    <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
                      {reservation.customer.name}
                    </Text>
                  </Group>
                  <Badge
                    color={statusColorMap[reservation.status]}
                    variant="light"
                    size="sm"
                  >
                    {statusLabels[reservation.status]}
                  </Badge>
                </Group>

                {/* Información principal */}
                <Stack gap="xs" mb="md">
                  <Text size="xs" c="dimmed">
                    {reservation.child.name} • {reservation.child.age} años
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {reservation.package.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(reservation.eventDate)} • {reservation.eventTime}
                  </Text>
                </Stack>

                {/* Total */}
                <Group justify="space-between" mb="sm">
                  <Text size="sm" fw={600}>
                    {formatCurrency(reservation.pricing.total)}
                  </Text>
                </Group>

                {/* Acciones */}
                <Group gap="xs">
                  <Tooltip label="Ver detalles">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="gray"
                      onClick={() => onView(reservation)}
                      style={{ flex: 1 }}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Editar">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="gray"
                      onClick={() => onEdit(reservation)}
                      style={{ flex: 1 }}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Eliminar">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="red"
                      onClick={() => onDelete(reservation._id)}
                      style={{ flex: 1 }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Vista de tabla minimalista
  const TableView = () => {
    if (reservations.length === 0) {
      return (
        <Stack align="center" py="xl" gap="md">
          <IconCalendar size={48} color="gray" />
          <Text c="dimmed" size="sm">No hay reservas disponibles</Text>
        </Stack>
      );
    }

    return (
      <ScrollArea>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Niño/a</Table.Th>
              <Table.Th>Paquete</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Hora</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {reservations.map((reservation) => (
              <Table.Tr key={reservation._id}>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {reservation.customer.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {reservation.customer.email}
                    </Text>
                  </Stack>
                </Table.Td>
                
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm">
                      {reservation.child.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {reservation.child.age} años
                    </Text>
                  </Stack>
                </Table.Td>
                
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm">
                      {reservation.package.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {reservation.package.maxGuests} invitados
                    </Text>
                  </Stack>
                </Table.Td>
                
                <Table.Td>
                  <Text size="sm">
                    {formatDate(reservation.eventDate)}
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Text size="sm">
                    {reservation.eventTime}
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {formatCurrency(reservation.pricing.total)}
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Badge
                    color={statusColorMap[reservation.status]}
                    variant="light"
                    size="sm"
                  >
                    {statusLabels[reservation.status]}
                  </Badge>
                </Table.Td>
                
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Ver">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="gray"
                        onClick={() => onView(reservation)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Editar">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="gray"
                        onClick={() => onEdit(reservation)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => onDelete(reservation._id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Stack gap="md">
      {/* Toggle de vista */}
      <Group justify="flex-end" className="hidden lg:flex">
        <Button.Group>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'filled' : 'light'}
            leftSection={<IconGrid3x3 size={16} />}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'filled' : 'light'}
            leftSection={<IconTable size={16} />}
            onClick={() => setViewMode('table')}
          >
            Tabla
          </Button>
        </Button.Group>
      </Group>

      {/* Vista actual */}
      {viewMode === 'grid' ? <GridView /> : <TableView />}
    </Stack>
  );
}