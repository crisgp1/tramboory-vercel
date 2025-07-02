'use client';

import React from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  Badge,
  Tooltip
} from '@heroui/react';
import {
  EyeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';

interface ClientReservationCardProps {
  reservation: Reservation;
  onView: (reservation: Reservation) => void;
}

export default function ClientReservationCard({ reservation, onView }: ClientReservationCardProps) {
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

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      case 'completed':
        return '🏆';
      default:
        return '📅';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
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

  const getDaysUntilEvent = () => {
    const eventDate = new Date(reservation.eventDate);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilEvent();
  const isUpcoming = daysUntil > 0 && daysUntil <= 30;
  const isPast = daysUntil < 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white overflow-hidden">
      <CardBody className="p-0">
        {/* Header with gradient and status */}
        <div className="relative p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                name={reservation.child.name}
                className="bg-white/20 text-white border border-white/30"
                size="sm"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {reservation.child.name}
                </h3>
                <p className="text-white/80 text-sm">
                  {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                </p>
              </div>
            </div>
            
            <Chip
              color={getStatusColor(reservation.status)}
              variant="flat"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white"
            >
              {getStatusText(reservation.status)}
            </Chip>
          </div>

          {/* Package info */}
          {reservation.package && (
            <div className="text-sm text-white/90">
              {reservation.package.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(reservation.eventDate)}
                </p>
                <p className="text-xs text-gray-500">
                  {reservation.eventTime}
                </p>
              </div>
            </div>

            {/* Package and Guests */}
            {reservation.package && (
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Hasta {reservation.package.maxGuests} invitados
                  </p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(reservation.pricing?.total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Special comments preview */}
          {reservation.specialComments && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Comentarios</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {reservation.specialComments}
              </p>
            </div>
          )}
        </div>

        {/* Footer with action */}
        <div className="p-4 pt-0">
          <Button
            onPress={() => onView(reservation)}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200"
            size="md"
            startContent={<EyeIcon className="w-4 h-4" />}
          >
            Ver Detalles
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}