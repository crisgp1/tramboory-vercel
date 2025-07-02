'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Button,
  Spinner
} from '@heroui/react';
import {
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useReservationStore } from '@/stores/reservationStore';
import ClientReservationCard from './ClientReservationCard';
import { Reservation } from '@/types/reservation';

interface ClientMainContentProps {
  onViewReservation: (reservation: Reservation) => void;
}

export default function ClientMainContent({ onViewReservation }: ClientMainContentProps) {
  const router = useRouter();
  const { loading, filteredReservations, filter } = useReservationStore();
  
  const reservations = filteredReservations();

  const getFilterTitle = () => {
    switch (filter) {
      case 'confirmed':
        return 'Celebraciones Confirmadas';
      case 'pending':
        return 'Celebraciones Pendientes';
      case 'completed':
        return 'Celebraciones Completadas';
      case 'cancelled':
        return 'Celebraciones Canceladas';
      default:
        return 'Todas tus Celebraciones';
    }
  };

  const getFilterEmoji = () => {
    switch (filter) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'completed':
        return '🏆';
      case 'cancelled':
        return '❌';
      default:
        return '🎉';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <Spinner size="lg" color="default" />
          <p className="text-gray-600 mt-4">
            Cargando reservaciones...
          </p>
        </div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <Card className="border border-gray-200 shadow-sm bg-white max-w-lg w-full">
          <CardBody className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📅</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No hay reservaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Aún no tienes reservaciones programadas.
              </p>
              <Button
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={() => router.push('/reservaciones/nueva')}
                className="bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200"
                size="md"
              >
                Nueva Reserva
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Mis Reservaciones
          </h1>
          <p className="text-gray-600">
            {reservations.length} {reservations.length === 1 ? 'reservación' : 'reservaciones'}
          </p>
        </div>

        {/* Reservations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {reservations.map((reservation) => (
            <ClientReservationCard
              key={reservation._id}
              reservation={reservation}
              onView={onViewReservation}
            />
          ))}
        </div>

        {/* Floating Action Button for mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button
            isIconOnly
            onPress={() => router.push('/reservaciones/nueva')}
            className="w-14 h-14 bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
            size="lg"
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}