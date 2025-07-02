'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  useDisclosure,
  Spinner
} from '@heroui/react';
import {
  PlusIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { CalendarDate } from '@internationalized/date';
import toast from 'react-hot-toast';
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
  const [startDate, setStartDate] = useState<CalendarDate | undefined>();
  const [endDate, setEndDate] = useState<CalendarDate | undefined>();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNewModalOpen, onOpen: onNewModalOpen, onClose: onNewModalClose } = useDisclosure();

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
        toast.error('Error al cargar las reservas');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar las reservas');
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
        const filterDate = new Date(startDate.year, startDate.month - 1, startDate.day);
        return eventDate >= filterDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(reservation => {
        const eventDate = new Date(reservation.eventDate);
        const filterDate = new Date(endDate.year, endDate.month - 1, endDate.day);
        return eventDate <= filterDate;
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
    toast.success('Función de edición en desarrollo');
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
        toast.success('Reserva eliminada correctamente');
        fetchReservations();
      } else {
        toast.error('Error al eliminar la reserva');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al eliminar la reserva');
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
        toast.success('Estado actualizado correctamente');
        fetchReservations();
        onClose();
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
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
    <div className="space-y-8">
      {/* Header minimalista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Reservas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {reservations.length} reservas en total
          </p>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreateReservation}
          className="bg-gray-900 text-white hover:bg-gray-800 text-sm"
          size="md"
        >
          Nueva Reserva
        </Button>
      </div>

      {/* Filtros */}
      <ReservationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        startDate={startDate}
        onStartDateChange={(date) => setStartDate(date || undefined)}
        endDate={endDate}
        onEndDateChange={(date) => setEndDate(date || undefined)}
        onClearFilters={handleClearFilters}
      />

      {/* Estadísticas minimalistas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-4">
            <div className="text-lg font-medium text-gray-900">
              {reservations.length}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-4">
            <div className="text-lg font-medium text-gray-900">
              {reservations.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Pendientes</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-4">
            <div className="text-lg font-medium text-gray-900">
              {reservations.filter(r => r.status === 'confirmed').length}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Confirmadas</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-4">
            <div className="text-lg font-medium text-gray-900">
              {reservations.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Completadas</div>
          </CardBody>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600 text-sm">Cargando reservas...</p>
            </div>
          ) : (
            <ReservationTable
              reservations={filteredReservations}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <ReservationModal
        isOpen={isOpen}
        onClose={onClose}
        reservation={selectedReservation}
        onStatusChange={handleStatusChange}
      />

      {/* Modal de nueva reserva */}
      <NewReservationModal
        isOpen={isNewModalOpen}
        onClose={onNewModalClose}
        onSuccess={handleNewReservationSuccess}
      />
    </div>
  );
}