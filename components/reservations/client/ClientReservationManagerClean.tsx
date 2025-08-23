'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  TextInput,
  Menu,
  MenuTarget,
  MenuDropdown,
  MenuItem,
  Badge,
  Skeleton,
  Divider,
  Input
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  MapPinIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { useReservationStore } from '@/stores/reservationStore';
import ClientReservationCardClean from './ClientReservationCardClean';
import ClientReservationModal from './ClientReservationModal';
import { Reservation } from '@/types/reservation';
import AdminQuickNav from '@/components/navigation/AdminQuickNav';

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

export default function ClientReservationManagerClean() {
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
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          
          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/')}
                className="text-pink-500 text-xl sm:text-2xl font-bold hover:text-pink-600 transition-colors"
              >
                Tramboory
              </button>
              <div className="hidden lg:block w-px h-6 bg-gray-300" />
              <div className="hidden lg:block">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tus reservaciones</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {reservations.length} {reservations.length === 1 ? 'reservación' : 'reservaciones'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <AdminQuickNav variant="header" />
              <Button
                leftSection={<PlusIcon className="w-4 h-4 animate-sparkle" />}
                onClick={() => router.push('/reservaciones/nueva')}
                className="bg-gradient-rainbow text-white font-bold shadow-2xl hover:shadow-3xl border-0 relative overflow-hidden"
                size="sm"
                styles={{
                  root: {
                    background: 'linear-gradient(45deg, #ec4899, #8b5cf6, #6366f1, #06b6d4)',
                    backgroundSize: '400% 400%',
                    boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4), 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(99, 102, 241, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }
                }}
              >
                <span className="hidden md:inline">✨ Nueva reserva ✨</span>
                <span className="md:hidden">✨ Nueva ✨</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          {/* Search */}
          <div className="flex-1 max-w-full md:max-w-md">
            <Input
              placeholder="Buscar por nombre, paquete..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              variant="default"
              size="md"
              className="text-sm border-gray-300 hover:border-gray-400 focus:border-pink-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg p-1 order-3 md:order-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <Menu>
            <MenuTarget>
              <Button
                variant="default"
                leftSection={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                className="border-gray-300 hover:border-gray-400 order-2 md:order-3"
                size="sm"
              >
                <span className="hidden sm:inline">Ordenar</span>
                <span className="sm:hidden">Orden</span>
              </Button>
            </MenuTarget>
            <MenuDropdown>
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuDropdown>
          </Menu>
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-6 sm:mb-8"
        >
          {filterOptions.map((filter) => {
            const count = filterCounts[filter.key as keyof typeof filterCounts];
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                <span className={`text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${
                  activeFilter === filter.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* No Results */}
        {filteredReservations.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || activeFilter !== 'all' ? 'No se encontraron reservaciones' : 'No tienes reservaciones'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || activeFilter !== 'all' 
                ? 'Intenta cambiar los filtros o buscar algo diferente.'
                : 'Cuando hagas tu primera reservación, aparecerá aquí.'
              }
            </p>
            {(!searchQuery && activeFilter === 'all') && (
              <Button
                size="xl"
                leftSection={<PlusIcon className="w-6 h-6 animate-sparkle" />}
                onClick={() => router.push('/reservaciones/nueva')}
                className="bg-gradient-rainbow text-white font-black shadow-2xl hover:shadow-3xl border-0 px-8 py-6 rounded-2xl relative overflow-hidden"
                styles={{
                  root: {
                    background: 'linear-gradient(45deg, #ec4899, #8b5cf6, #6366f1, #06b6d4, #10b981)',
                    backgroundSize: '500% 500%',
                    boxShadow: '0 12px 40px rgba(236, 72, 153, 0.5), 0 0 30px rgba(139, 92, 246, 0.4), 0 0 50px rgba(99, 102, 241, 0.3)',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '900',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                🎉✨ Crear tu primera reserva ✨🎉
              </Button>
            )}
          </motion.div>
        )}

        {/* Reservations Grid/List */}
        {filteredReservations.length > 0 && (
          <AnimatePresence>
            <motion.div
              layout
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                  : 'space-y-3 sm:space-y-4'
              }
            >
              {filteredReservations.map((reservation, index) => (
                <motion.div
                  key={reservation._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ClientReservationCardClean
                    reservation={reservation}
                    onView={handleViewReservation}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:hidden z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          <Button
            size="xl"
            onClick={() => router.push('/reservaciones/nueva')}
            className="bg-gradient-rainbow text-white shadow-2xl hover:shadow-3xl border-0 rounded-full relative overflow-hidden flex-shrink-0"
            styles={{
              root: {
                width: '64px',
                height: '64px',
                minWidth: '64px',
                minHeight: '64px',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(45deg, #ec4899, #8b5cf6, #6366f1, #06b6d4)',
                backgroundSize: '400% 400%',
                boxShadow: '0 12px 40px rgba(236, 72, 153, 0.6), 0 0 40px rgba(139, 92, 246, 0.5), 0 0 60px rgba(99, 102, 241, 0.4)',
                border: 'none',
                borderRadius: '50%'
              }
            }}
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      {/* Reservation Modal */}
      <ClientReservationModal
        opened={opened}
        onClose={handleCloseModal}
        reservation={selectedReservation}
      />
    </div>
  );
}