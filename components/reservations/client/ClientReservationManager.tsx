'use client';

import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDisclosure } from '@heroui/react';
import toast from 'react-hot-toast';
import { useReservationStore } from '@/stores/reservationStore';
import ClientSidebar from './ClientSidebar';
import ClientMainContent from './ClientMainContent';
import ClientReservationModal from './ClientReservationModal';
import { Reservation } from '@/types/reservation';

export default function ClientReservationManager() {
  const { user } = useUser();
  const {
    setReservations,
    setLoading,
    selectedReservation,
    setSelectedReservation
  } = useReservationStore();
  
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedReservation(null);
    onClose();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <ClientSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ClientMainContent onViewReservation={handleView} />
      </div>

      {/* Modal de detalles */}
      <ClientReservationModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        reservation={selectedReservation}
      />
    </div>
  );
}