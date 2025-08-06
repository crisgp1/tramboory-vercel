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
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-8)'}}>
      {/* Professional Header */}
      <div className="surface-card">
        <div className="flex items-center justify-between" style={{padding: 'var(--space-6)'}}>
          <div>
            <h1 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-1)'
            }}>
              Reservas
            </h1>
            <p className="text-neutral-600" style={{
              fontSize: 'var(--text-sm)'
            }}>
              {reservations.length} reservas en total
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={handleCreateReservation}
          >
            <PlusIcon className="icon-base" />
            Nueva Reserva
          </button>
        </div>
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

      {/* Professional Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: 'var(--space-4)'}}>
        <div className="metric-card status-neutral">
          <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
            <div style={{
              width: 'var(--space-8)',
              height: 'var(--space-8)',
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarDaysIcon className="icon-base text-neutral-600" />
            </div>
            <div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontWeight: '500',
                marginBottom: 'var(--space-1)'
              }}>
                {reservations.length}
              </div>
              <div className="text-neutral-600" style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Total</div>
            </div>
          </div>
        </div>
        
        <div className="metric-card status-warning">
          <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
            <div style={{
              width: 'var(--space-8)',
              height: 'var(--space-8)',
              backgroundColor: '#fef3c7',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarDaysIcon className="icon-base text-orange-600" />
            </div>
            <div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontWeight: '500',
                marginBottom: 'var(--space-1)'
              }}>
                {reservations.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-neutral-600" style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Pendientes</div>
            </div>
          </div>
        </div>
        
        <div className="metric-card status-info">
          <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
            <div style={{
              width: 'var(--space-8)',
              height: 'var(--space-8)',
              backgroundColor: '#dbeafe',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarDaysIcon className="icon-base text-blue-600" />
            </div>
            <div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontWeight: '500',
                marginBottom: 'var(--space-1)'
              }}>
                {reservations.filter(r => r.status === 'confirmed').length}
              </div>
              <div className="text-neutral-600" style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Confirmadas</div>
            </div>
          </div>
        </div>
        
        <div className="metric-card status-success">
          <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
            <div style={{
              width: 'var(--space-8)',
              height: 'var(--space-8)',
              backgroundColor: '#dcfce7',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarDaysIcon className="icon-base text-green-600" />
            </div>
            <div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontWeight: '500',
                marginBottom: 'var(--space-1)'
              }}>
                {reservations.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-neutral-600" style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Completadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Main Content */}
      <div className="surface-card">
        <div style={{padding: 'var(--space-6)'}}>
          {loading ? (
            <div className="flex flex-col justify-center items-center" style={{
              padding: 'var(--space-16) 0'
            }}>
              <div className="loading-spinner" style={{marginBottom: 'var(--space-4)'}}></div>
              <p className="text-neutral-600" style={{fontSize: 'var(--text-sm)'}}>Cargando reservas...</p>
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