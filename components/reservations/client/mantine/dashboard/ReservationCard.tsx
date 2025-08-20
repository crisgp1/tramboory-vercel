'use client';

import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Avatar,
  ActionIcon,
  Tooltip,
  Divider,
  Button,
  Paper,
  rem,
  useMantineTheme
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconClock,
  IconUsers,
  IconCurrencyDollar,
  IconEye,
  IconMapPin,
  IconSparkles
} from '@tabler/icons-react';
import { Reservation } from '@/types/reservation';

interface ReservationCardProps {
  reservation: Reservation;
  onView: (reservation: Reservation) => void;
}

export default function ReservationCard({ reservation, onView }: ReservationCardProps) {
  const theme = useMantineTheme();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
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
      padding={0}
      radius="md"
      withBorder
      style={{
        overflow: 'hidden',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }}
      onClick={() => onView(reservation)}
      __vars={{
        '--card-hover-transform': 'translateY(-2px)',
        '--card-hover-shadow': theme.shadows.md
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'var(--card-hover-transform)',
            boxShadow: 'var(--card-hover-shadow)'
          }
        }
      }}
    >
      {/* Header con gradiente y status */}
      <Paper 
        p="md" 
        style={{
          background: `linear-gradient(135deg, ${theme.colors.pink[5]}, ${theme.colors.violet[5]})`,
          color: 'white'
        }}
      >
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group gap="sm">
            <Avatar
              size="md"
              radius="xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {reservation.child.name.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={0}>
              <Text size="lg" fw={600}>
                {reservation.child.name}
              </Text>
              <Text size="sm" opacity={0.9}>
                {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
              </Text>
            </Stack>
          </Group>
          
          <Badge
            color={getStatusColor(reservation.status)}
            variant="white"
            size="sm"
            radius="md"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: theme.colors[getStatusColor(reservation.status)][6]
            }}
          >
            {getStatusText(reservation.status)}
          </Badge>
        </Group>

        {/* Package info */}
        {reservation.package && (
          <Group gap="xs">
            <IconSparkles size="1rem" style={{ opacity: 0.9 }} />
            <Text size="sm" opacity={0.9} fw={500}>
              {reservation.package.name}
            </Text>
          </Group>
        )}
      </Paper>

      {/* Content */}
      <Stack p="md" gap="sm">
        {/* Fecha y hora */}
        <Group gap="xs">
          <IconCalendarEvent size="1rem" color={theme.colors.gray[6]} />
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {formatDate(reservation.eventDate)}
            </Text>
            <Group gap="xs">
              <IconClock size="0.8rem" color={theme.colors.gray[5]} />
              <Text size="xs" c="dimmed">
                {reservation.eventTime}
              </Text>
            </Group>
          </Stack>
        </Group>

        {/* Capacidad */}
        {reservation.package && (
          <Group gap="xs">
            <IconUsers size="1rem" color={theme.colors.gray[6]} />
            <Text size="sm">
              Hasta {reservation.package.maxGuests} invitados
            </Text>
          </Group>
        )}

        {/* Precio */}
        <Group gap="xs">
          <IconCurrencyDollar size="1rem" color={theme.colors.gray[6]} />
          <Text size="lg" fw={600} c="dark">
            {formatPrice(reservation.pricing?.total || 0)}
          </Text>
        </Group>

        {/* Badge de proximidad */}
        {isUpcoming && (
          <Badge 
            size="sm" 
            variant="light" 
            color="orange"
            leftSection={<IconClock size="0.8rem" />}
          >
            En {daysUntil} {daysUntil === 1 ? 'día' : 'días'}
          </Badge>
        )}

        {isPast && (
          <Badge 
            size="sm" 
            variant="light" 
            color="gray"
          >
            Hace {Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? 'día' : 'días'}
          </Badge>
        )}

        {/* Comentarios preview */}
        {reservation.specialComments && (
          <>
            <Divider />
            <Text size="xs" c="dimmed" lineClamp={2}>
              {reservation.specialComments}
            </Text>
          </>
        )}
      </Stack>

      {/* Footer con botón de acción */}
      <Paper p="sm" style={{ borderTop: `1px solid ${theme.colors.gray[2]}` }}>
        <Button
          variant="light"
          size="sm"
          leftSection={<IconEye size="1rem" />}
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onView(reservation);
          }}
        >
          Ver Detalles
        </Button>
      </Paper>
    </Card>
  );
}