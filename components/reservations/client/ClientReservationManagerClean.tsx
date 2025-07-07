'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Skeleton,
  Divider
} from '@heroui/react';
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
import toast from 'react-hot-toast';
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        toast.error('Error al cargar tus reservas');
      }
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      toast.error('Error al cargar tus reservas');
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
    setIsModalOpen(false);
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
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-pink-500 text-2xl font-bold hover:text-pink-600 transition-colors"
              >
                Tramboory
              </button>
              <div className="hidden md:block w-px h-6 bg-gray-300" />
              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-gray-900">Tus reservaciones</h1>
                <p className="text-sm text-gray-600">
                  {reservations.length} {reservations.length === 1 ? 'reservación' : 'reservaciones'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AdminQuickNav variant="header" />
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={() => router.push('/reservaciones/nueva')}
                className="bg-pink-500 hover:bg-pink-600"
              >
                <span className="hidden sm:inline">Nueva reserva</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-6"
        >
          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por nombre, paquete..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              classNames={{
                input: "text-sm",
                inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-pink-500"
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="bordered" 
                startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                className="border-gray-300 hover:border-gray-400"
              >
                Ordenar
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
            >
              {sortOptions.map((option) => (
                <DropdownItem key={option.key}>{option.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </motion.div>

        {/* Filter Chips */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {filterOptions.map((filter) => {
            const count = filterCounts[filter.key as keyof typeof filterCounts];
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                color="primary"
                size="lg"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => router.push('/reservaciones/nueva')}
                className="bg-pink-500 hover:bg-pink-600"
              >
                Crear tu primera reserva
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
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
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
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          <Button
            isIconOnly
            color="primary"
            size="lg"
            onPress={() => router.push('/reservaciones/nueva')}
            className="w-14 h-14 bg-pink-500 hover:bg-pink-600 shadow-lg"
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      {/* Reservation Modal */}
      <ClientReservationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        reservation={selectedReservation}
      />
    </div>
  );
}