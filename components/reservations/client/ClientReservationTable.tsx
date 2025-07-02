'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Card,
  CardBody
} from '@heroui/react';
import {
  EyeIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';

interface ClientReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onView: (reservation: Reservation) => void;
}

export default function ClientReservationTable({
  reservations,
  loading,
  onView
}: ClientReservationTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista móvil - Cards */}
      <div className="block md:hidden space-y-4">
        {reservations.map((reservation) => (
          <Card key={reservation._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    Fiesta de {reservation.child.name}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    {formatDate(reservation.eventDate)}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    {reservation.eventTime}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatPrice(reservation.pricing?.total || 0)}
                  </div>
                </div>
                <Chip
                  color={getStatusColor(reservation.status)}
                  variant="flat"
                  size="sm"
                  className="mb-2"
                >
                  {getStatusText(reservation.status)}
                </Chip>
              </div>
              <Button
                startContent={<EyeIcon className="w-4 h-4" />}
                onPress={() => onView(reservation)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                size="sm"
              >
                Ver Detalles
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden md:block">
        <Table
          aria-label="Tabla de reservaciones del cliente"
          classNames={{
            wrapper: "shadow-lg rounded-lg border-0",
            th: "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 font-semibold",
            td: "py-4"
          }}
        >
          <TableHeader>
            <TableColumn>EVENTO</TableColumn>
            <TableColumn>FECHA Y HORA</TableColumn>
            <TableColumn>PAQUETE</TableColumn>
            <TableColumn>TOTAL</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Fiesta de {reservation.child.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(reservation.eventDate)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {reservation.eventTime}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-gray-900">
                    {reservation.package?.name || 'Paquete personalizado'}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-green-600 text-lg">
                    {formatPrice(reservation.pricing?.total || 0)}
                  </p>
                </TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(reservation.status)}
                    variant="flat"
                    size="sm"
                  >
                    {getStatusText(reservation.status)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => onView(reservation)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    size="sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}