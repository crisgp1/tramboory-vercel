'use client';

import React, { useEffect, useState } from 'react';
import { useUser, SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Menu,
  Group,
  Card,
  Badge,
  Skeleton,
  Stack,
  Grid,
  Center,
  ActionIcon,
  Flex,
  Paper,
  ThemeIcon,
  SimpleGrid,
  Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import ReservationCard from './ReservationCard';
import ClientReservationModal from './ClientReservationModal';
import { Reservation } from '@/types/reservation';

const filterOptions = [
  { key: 'all', label: 'Todas', count: 0 },
  { key: 'upcoming', label: 'Próximas', count: 0 },
  { key: 'past', label: 'Pasadas', count: 0 },
  { key: 'confirmed', label: 'Confirmadas', count: 0 },
  { key: 'pending', label: 'Pendientes', count: 0 },
  { key: 'cancelled', label: 'Canceladas', count: 0 }
];

const sortOptions = [
  { key: 'date-asc', label: 'Fecha más cercana' },
  { key: 'date-desc', label: 'Fecha más lejana' },
  { key: 'created-desc', label: 'Más recientes' },
  { key: 'created-asc', label: 'Más antiguas' }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function ReservationManager() {
  const { user } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (user) {
      fetchUserReservations();
    }
  }, [user]);

  const fetchUserReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reservations?customerEmail=${user?.primaryEmailAddress?.emailAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.data);
      } else {
        notifications.show({ title: 'Error', message: 'Error al cargar tus reservas', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar tus reservas', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReservations = () => {
    let filtered = reservations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(reservation =>
        reservation.child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.package?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.specialComments?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status/date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeFilter) {
      case 'upcoming':
        filtered = filtered.filter(r => new Date(r.eventDate) >= today);
        break;
      case 'past':
        filtered = filtered.filter(r => new Date(r.eventDate) < today);
        break;
      case 'confirmed':
        filtered = filtered.filter(r => r.status === 'confirmed');
        break;
      case 'pending':
        filtered = filtered.filter(r => r.status === 'pending');
        break;
      case 'cancelled':
        filtered = filtered.filter(r => r.status === 'cancelled');
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      case 'created-desc':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'created-asc':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    return filtered;
  };

  const getFilterCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      all: reservations.length,
      upcoming: reservations.filter(r => new Date(r.eventDate) >= today).length,
      past: reservations.filter(r => new Date(r.eventDate) < today).length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
  };

  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    open();
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
    close();
  };

  const filteredReservations = getFilteredReservations();
  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header Skeleton */}
          <Group justify="space-between" mb="xl">
            <Stack gap="xs">
              <Skeleton height={32} width={300} />
              <Skeleton height={20} width={200} />
            </Stack>
            <Skeleton height={40} width={150} />
          </Group>

          {/* Filters Skeleton */}
          <Group mb="xl">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} height={32} width={80} />
            ))}
          </Group>
          
          {/* Cards Skeleton */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Skeleton height={20} width="60%" />
                  <Skeleton height={16} width="80%" />
                  <Skeleton height={16} width="40%" />
                  <Skeleton height={32} width="100%" />
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <Paper shadow="xs" p="md" radius="md" mb="xl" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="md" align="center" mb="xs">
                <ThemeIcon size="lg" variant="light" color="blue">
                  <CalendarDaysIcon className="h-6 w-6" />
                </ThemeIcon>
                <div>
                  <Title order={2} size="h1">Mis Reservaciones</Title>
                  <Text c="dimmed" size="sm">
                    {reservations.length} {reservations.length === 1 ? 'reservación' : 'reservaciones'} en total
                  </Text>
                </div>
              </Group>
              
              {user && (
                <Group gap="xs" mt="sm">
                  <UserCircleIcon className="h-4 w-4 text-gray-500" />
                  <Text size="sm" c="dimmed">
                    {user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress}
                  </Text>
                </Group>
              )}
            </div>

            <Group gap="sm">
              <ClerkSignOutButton redirectUrl="/">
                <Button variant="subtle" color="gray">
                  Cerrar sesión
                </Button>
              </ClerkSignOutButton>
              <Button
                leftSection={<PlusIcon className="h-4 w-4" />}
                onClick={() => router.push('/reservaciones/nueva')}
                gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                variant="gradient"
              >
                Nueva reserva
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Search and Controls */}
        <Card shadow="sm" p="md" radius="md" mb="xl" withBorder>
          <Stack gap="md">
            <Group grow>
              <TextInput
                placeholder="Buscar por nombre del niño, paquete..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
              
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button 
                    variant="default" 
                    leftSection={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
                  >
                    Ordenar
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {sortOptions.map((option) => (
                    <Menu.Item
                      key={option.key}
                      onClick={() => setSortBy(option.key)}
                    >
                      {option.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              <Group gap={0} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
                <ActionIcon
                  variant={viewMode === 'grid' ? 'filled' : 'default'}
                  onClick={() => setViewMode('grid')}
                  style={{ borderRadius: 0 }}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </ActionIcon>
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'default'}
                  onClick={() => setViewMode('list')}
                  style={{ borderRadius: 0 }}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </ActionIcon>
              </Group>
            </Group>

            {/* Filter Pills */}
            <Group gap="sm">
              {filterOptions.map((filter) => {
                const count = filterCounts[filter.key as keyof typeof filterCounts];
                const isActive = activeFilter === filter.key;
                
                return (
                  <Button
                    key={filter.key}
                    size="xs"
                    variant={isActive ? 'filled' : 'default'}
                    onClick={() => setActiveFilter(filter.key)}
                    rightSection={
                      <Badge size="xs" variant={isActive ? 'white' : 'light'} color={isActive ? 'blue' : 'gray'}>
                        {count}
                      </Badge>
                    }
                  >
                    {filter.label}
                  </Button>
                );
              })}
            </Group>
          </Stack>
        </Card>

        {/* No Results */}
        {filteredReservations.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <ThemeIcon size={80} variant="light" color="gray">
                    <CalendarDaysIcon className="h-10 w-10" />
                  </ThemeIcon>
                  <div style={{ textAlign: 'center' }}>
                    <Title order={3} mb="xs">
                      {searchQuery || activeFilter !== 'all' ? 'No se encontraron reservaciones' : 'No tienes reservaciones'}
                    </Title>
                    <Text c="dimmed" mb="xl">
                      {searchQuery || activeFilter !== 'all' 
                        ? 'Intenta cambiar los filtros o buscar algo diferente.'
                        : 'Cuando hagas tu primera reservación, aparecerá aquí.'
                      }
                    </Text>
                  </div>
                  {(!searchQuery && activeFilter === 'all') && (
                    <Button
                      size="lg"
                      leftSection={<PlusIcon className="h-5 w-5" />}
                      onClick={() => router.push('/reservaciones/nueva')}
                      gradient={{ from: 'blue', to: 'purple', deg: 45 }}
                      variant="gradient"
                    >
                      Crear tu primera reserva
                    </Button>
                  )}
                </Stack>
              </Center>
            </Paper>
          </motion.div>
        )}

        {/* Reservations Grid/List */}
        {filteredReservations.length > 0 && (
          <AnimatePresence>
            <motion.div layout>
              {viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                  {filteredReservations.map((reservation, index) => (
                    <motion.div
                      key={reservation._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ReservationCard
                        reservation={reservation}
                        onView={handleViewReservation}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </SimpleGrid>
              ) : (
                <Stack gap="md">
                  {filteredReservations.map((reservation, index) => (
                    <motion.div
                      key={reservation._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ReservationCard
                        reservation={reservation}
                        onView={handleViewReservation}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </Stack>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Reservation Modal */}
      <ClientReservationModal
        opened={opened}
        onClose={handleCloseModal}
        reservation={selectedReservation}
      />
    </Container>
  );
}