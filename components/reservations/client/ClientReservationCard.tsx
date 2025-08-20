'use client';

import React from 'react';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Tooltip,
  Group,
  Text,
  Stack,
  Box,
  Divider
} from '@mantine/core';
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
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
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
    <Card 
      shadow="sm" 
      padding="0" 
      radius="lg"
      withBorder
      className="hover:shadow-lg transition-all duration-200"
    >
      {/* Header with gradient and status */}
      <Box className="relative p-4 bg-gradient-to-r from-purple-500 to-pink-500">
        <Group justify="space-between" align="flex-start" mb="sm">
          <Group gap="sm">
            <Avatar
              size="md"
              radius="xl"
              color="white"
              className="bg-white/20 border border-white/30"
            >
              {reservation.child.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text size="lg" fw={600} c="white">
                {reservation.child.name}
              </Text>
              <Text size="sm" c="white" opacity={0.8}>
                {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
              </Text>
            </div>
          </Group>
          
          <Badge
            color={getStatusColor(reservation.status)}
            variant="light"
            size="sm"
            radius="md"
            className="bg-white/20 backdrop-blur-sm"
          >
            {getStatusEmoji(reservation.status)} {getStatusText(reservation.status)}
          </Badge>
        </Group>

        {/* Package info */}
        {reservation.package && (
          <Text size="sm" c="white" opacity={0.9}>
            {reservation.package.name}
          </Text>
        )}
      </Box>

      {/* Content */}
      <Stack p="md" gap="sm">
        {/* Date and Time */}
        <Group gap="sm">
          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
          <div>
            <Text size="sm" fw={500}>
              {formatDate(reservation.eventDate)}
            </Text>
            <Text size="xs" c="dimmed">
              {reservation.eventTime}
            </Text>
          </div>
        </Group>

        {/* Package and Guests */}
        {reservation.package && (
          <Group gap="sm">
            <UserGroupIcon className="w-4 h-4 text-gray-400" />
            <Text size="sm" fw={500}>
              Hasta {reservation.package.maxGuests} invitados
            </Text>
          </Group>
        )}

        {/* Price */}
        <Group gap="sm">
          <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
          <Text size="lg" fw={600}>
            {formatPrice(reservation.pricing?.total || 0)}
          </Text>
        </Group>

        {/* Special comments preview */}
        {reservation.specialComments && (
          <>
            <Divider />
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                Comentarios
              </Text>
              <Text size="sm" lineClamp={2}>
                {reservation.specialComments}
              </Text>
            </div>
          </>
        )}
      </Stack>

      {/* Footer with action */}
      <Box p="md" pt={0}>
        <Button
          onClick={() => onView(reservation)}
          fullWidth
          variant="filled"
          color="dark"
          size="md"
          leftSection={<EyeIcon className="w-4 h-4" />}
        >
          Ver Detalles
        </Button>
      </Box>
    </Card>
  );
}