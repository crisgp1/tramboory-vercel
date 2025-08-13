'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Button,
  Loader,
  Stack,
  Group,
  Text,
  Title,
  Grid,
  Card,
  ThemeIcon,
  Center
} from '@mantine/core';
import {
  IconPlus,
  IconCalendarEvent
} from '@tabler/icons-react';
// import { CalendarDate } from '@internationalized/date'; // Not needed anymore
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import ReservationTable from './ReservationTable';
import ReservationModal from './ReservationModal';
import NewReservationModal from './NewReservationModal';
import ReservationFilters from './ReservationFilters';
import { Reservation } from '@/types/reservation';

export default function ReservationManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const [isOpen, { open: onOpen, close: onClose }] = useDisclosure();
  const [isNewModalOpen, { open: onNewModalOpen, close: onNewModalClose }] = useDisclosure();

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reservations, searchTerm, filterStatus, startDate, endDate]);


  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reservations');
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.data);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Error al cargar las reservas',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar las reservas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reservations];

    // Filtro por texto de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.customer.name.toLowerCase().includes(searchLower) ||
        reservation.customer.email.toLowerCase().includes(searchLower) ||
        reservation.child.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === filterStatus);
    }

    // Filtro por rango de fechas
    if (startDate) {
      filtered = filtered.filter(reservation => {
        const eventDate = new Date(reservation.eventDate);
        return eventDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(reservation => {
        const eventDate = new Date(reservation.eventDate);
        return eventDate <= endDate;
      });
    }

    setFilteredReservations(filtered);
  };

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    onOpen();
  };

  const handleEdit = (reservation: Reservation) => {
    // TODO: Implementar edición de reserva
    notifications.show({
      title: 'Info',
      message: 'Función de edición en desarrollo',
      color: 'blue'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Reserva eliminada correctamente',
          color: 'green'
        });
        fetchReservations();
      } else {
        notifications.show({
          title: 'Error',
          message: 'Error al eliminar la reserva',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar la reserva',
        color: 'red'
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Estado actualizado correctamente',
          color: 'green'
        });
        fetchReservations();
        onClose();
      } else {
        notifications.show({
          title: 'Error',
          message: 'Error al actualizar el estado',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar el estado',
        color: 'red'
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleCreateReservation = () => {
    onNewModalOpen();
  };

  const handleNewReservationSuccess = () => {
    fetchReservations();
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={2}>Reservas</Title>
            <Text c="dimmed" size="sm">
              {reservations.length} reservas en total
            </Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateReservation}
          >
            Nueva Reserva
          </Button>
        </Group>
      </Paper>

      {/* Filtros */}
      <ReservationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        startDate={startDate}
        onStartDateChange={(date: Date | null) => setStartDate(date || undefined)}
        endDate={endDate}
        onEndDateChange={(date: Date | null) => setEndDate(date || undefined)}
        onClearFilters={handleClearFilters}
      />

      {/* Statistics */}
      <Grid>
        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Card withBorder p="md">
            <Group>
              <ThemeIcon size="lg" radius="md" color="gray">
                <IconCalendarEvent size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xl" fw={600}>
                  {reservations.length}
                </Text>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Total
                </Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Card withBorder p="md">
            <Group>
              <ThemeIcon size="lg" radius="md" color="orange">
                <IconCalendarEvent size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xl" fw={600}>
                  {reservations.filter(r => r.status === 'pending').length}
                </Text>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Pendientes
                </Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Card withBorder p="md">
            <Group>
              <ThemeIcon size="lg" radius="md" color="blue">
                <IconCalendarEvent size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xl" fw={600}>
                  {reservations.filter(r => r.status === 'confirmed').length}
                </Text>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Confirmadas
                </Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Card withBorder p="md">
            <Group>
              <ThemeIcon size="lg" radius="md" color="green">
                <IconCalendarEvent size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xl" fw={600}>
                  {reservations.filter(r => r.status === 'completed').length}
                </Text>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Completadas
                </Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Main Content */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl" style={{ minHeight: 200 }}>
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed">Cargando reservas...</Text>
            </Stack>
          </Center>
        ) : (
          <ReservationTable
            reservations={filteredReservations}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Paper>

      {/* Modal de detalles */}
      <ReservationModal
        opened={isOpen}
        onClose={onClose}
        reservation={selectedReservation}
        onStatusChange={handleStatusChange}
      />

      {/* Modal de nueva reserva */}
      <NewReservationModal
        opened={isNewModalOpen}
        onClose={onNewModalClose}
        onSuccess={handleNewReservationSuccess}
      />
    </Stack>
  );
}