'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  SegmentedControl,
  TextInput,
  ActionIcon,
  Menu,
  Button,
  Paper,
  SimpleGrid,
  Center,
  Loader,
  Alert,
  Collapse,
  Checkbox,
  Badge,
  Divider,
  Pagination,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconFilter,
  IconSortDescending,
  IconPlus,
  IconCalendarEvent,
  IconAlertCircle,
  IconChevronDown
} from '@tabler/icons-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Reservation } from '@/types/reservation';
import ReservationCard from './ReservationCard';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import ReservationModal from '../details/ReservationModal';

// Tipos para filtros - Aplicando Miller's Law (máximo 7 opciones)
type BasicFilter = 'all' | 'upcoming' | 'past';
type StatusFilter = 'confirmed' | 'pending' | 'cancelled' | 'completed';
type SortOption = 'date-asc' | 'date-desc' | 'created-desc' | 'created-asc';

interface FilterState {
  basic: BasicFilter;
  statuses: StatusFilter[];
  search: string;
  sort: SortOption;
}

const ITEMS_PER_PAGE = 12; // Respetando Chunking principle

export default function ReservationDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedFiltersOpened, { toggle: toggleAdvancedFilters }] = useDisclosure(false);

  // Estado de filtros - Aplicando Progressive Disclosure (Hick's Law)
  const [filters, setFilters] = useState<FilterState>({
    basic: 'all',
    statuses: [],
    search: '',
    sort: 'date-asc'
  });

  // Opciones de filtros básicos (máximo 3 para Hick's Law)
  const basicFilterOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'upcoming', label: 'Próximas' },
    { value: 'past', label: 'Pasadas' }
  ];

  // Opciones de filtros avanzados (colapsables)
  const statusFilterOptions = [
    { value: 'confirmed', label: 'Confirmadas', color: 'green' },
    { value: 'pending', label: 'Pendientes', color: 'yellow' },
    { value: 'cancelled', label: 'Canceladas', color: 'red' },
    { value: 'completed', label: 'Completadas', color: 'blue' }
  ];

  const sortOptions = [
    { value: 'date-asc', label: 'Fecha más cercana' },
    { value: 'date-desc', label: 'Fecha más lejana' },
    { value: 'created-desc', label: 'Más recientes' },
    { value: 'created-asc', label: 'Más antiguas' }
  ];

  // Cargar reservaciones
  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/reservations?customerEmail=${user?.primaryEmailAddress?.emailAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.data || []);
      } else {
        setError('Error al cargar las reservaciones');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Error al cargar las reservaciones');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar reservaciones - Aplicando Chunking
  const getFilteredReservations = () => {
    let filtered = [...reservations];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtro básico
    switch (filters.basic) {
      case 'upcoming':
        filtered = filtered.filter(r => new Date(r.eventDate) >= today);
        break;
      case 'past':
        filtered = filtered.filter(r => new Date(r.eventDate) < today);
        break;
      // 'all' no filtra
    }

    // Filtros de estado
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(r => filters.statuses.includes(r.status as StatusFilter));
    }

    // Búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.child.name.toLowerCase().includes(searchLower) ||
        r.package?.name.toLowerCase().includes(searchLower) ||
        r.specialComments?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenamiento
    switch (filters.sort) {
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

  const filteredReservations = getFilteredReservations();
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Contadores para badges
  const getFilterCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      all: reservations.length,
      upcoming: reservations.filter(r => new Date(r.eventDate) >= today).length,
      past: reservations.filter(r => new Date(r.eventDate) < today).length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      completed: reservations.filter(r => r.status === 'completed').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} color="red">
          {error}
          <Button variant="light" size="xs" onClick={fetchReservations} ml="md">
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header - Aplicando Typography Hierarchy */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={1} size="h2">
              Tus Reservaciones
            </Title>
            <Text c="dimmed" size="sm">
              {counts.all} {counts.all === 1 ? 'reservación registrada' : 'reservaciones registradas'}
            </Text>
          </Stack>

          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={() => router.push('/reservaciones/nueva')}
            size="md"
            variant="gradient"
            gradient={{ from: 'pink.5', to: 'violet.5' }}
          >
            Nueva Reserva
          </Button>
        </Group>

        {/* Filters Section - Aplicando Progressive Disclosure */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
            {/* Filtros básicos - Siempre visibles (Hick's Law) */}
            <Group justify="space-between" align="center">
              <SegmentedControl
                value={filters.basic}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, basic: value as BasicFilter }));
                  setCurrentPage(1);
                }}
                data={basicFilterOptions.map(option => ({
                  ...option,
                  label: `${option.label} ${counts[option.value as keyof typeof counts] > 0 ? `(${counts[option.value as keyof typeof counts]})` : ''}`
                }))}
              />

              <Group gap="xs">
                {/* Búsqueda */}
                <TextInput
                  placeholder="Buscar reservaciones..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, search: e.target.value }));
                    setCurrentPage(1);
                  }}
                  leftSection={<IconSearch size="1rem" />}
                  style={{ minWidth: rem(200) }}
                />

                {/* Ordenamiento */}
                <Menu>
                  <Menu.Target>
                    <ActionIcon variant="light" size="lg">
                      <IconSortDescending size="1rem" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {sortOptions.map(option => (
                      <Menu.Item
                        key={option.value}
                        onClick={() => setFilters(prev => ({ ...prev, sort: option.value as SortOption }))}
                        bg={filters.sort === option.value ? 'gray.1' : undefined}
                      >
                        {option.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>

                {/* Toggle filtros avanzados */}
                <Button
                  variant="light"
                  size="sm"
                  onClick={toggleAdvancedFilters}
                  rightSection={
                    <IconChevronDown 
                      size="1rem" 
                      style={{ 
                        transform: advancedFiltersOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 150ms ease'
                      }}
                    />
                  }
                >
                  <IconFilter size="1rem" />
                </Button>
              </Group>
            </Group>

            {/* Filtros avanzados - Colapsables */}
            <Collapse in={advancedFiltersOpened}>
              <Divider />
              <Group mt="md">
                <Text size="sm" fw={500}>Filtrar por estado:</Text>
                <Checkbox.Group
                  value={filters.statuses}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, statuses: value as StatusFilter[] }));
                    setCurrentPage(1);
                  }}
                >
                  <Group gap="md">
                    {statusFilterOptions.map(option => (
                      <Checkbox
                        key={option.value}
                        value={option.value}
                        label={
                          <Group gap="xs">
                            <Text size="sm">{option.label}</Text>
                            <Badge size="sm" color={option.color} variant="light">
                              {counts[option.value as keyof typeof counts]}
                            </Badge>
                          </Group>
                        }
                      />
                    ))}
                  </Group>
                </Checkbox.Group>
              </Group>
            </Collapse>
          </Stack>
        </Paper>

        {/* Results */}
        {filteredReservations.length === 0 ? (
          <EmptyState
            title="No se encontraron reservaciones"
            description={
              filters.search || filters.statuses.length > 0 || filters.basic !== 'all'
                ? "Intenta cambiar los filtros para ver más resultados"
                : "Aún no tienes ninguna reservación. ¡Crea tu primera celebración!"
            }
            actionLabel={
              filters.search || filters.statuses.length > 0 || filters.basic !== 'all'
                ? undefined
                : "Nueva Reserva"
            }
            onAction={
              filters.search || filters.statuses.length > 0 || filters.basic !== 'all'
                ? undefined
                : () => router.push('/reservaciones/nueva')
            }
          />
        ) : (
          <Stack gap="lg">
            {/* Grid de reservaciones - Aplicando Law of Proximity */}
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing="md"
            >
              {paginatedReservations.map((reservation) => (
                <ReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onView={(res: Reservation) => {
                    // Funcionalidad temporal hasta que se resuelvan las importaciones
                    toast.success(`Viendo detalles de la reserva de ${res.child.name}`);
                  }}
                />
              ))}
            </SimpleGrid>

            {/* Paginación - Solo si es necesaria */}
            {totalPages > 1 && (
              <Group justify="center" mt="xl">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  siblings={1}
                  boundaries={1}
                />
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}