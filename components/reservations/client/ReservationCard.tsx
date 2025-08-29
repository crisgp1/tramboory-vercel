'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Badge,
  Button,
  Avatar,
  Menu,
  Group,
  Text,
  Stack,
  ThemeIcon,
  ActionIcon,
  Box
} from '@mantine/core';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  SparklesIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';
import { exportToCalendar } from '@/lib/calendar-export';
import { notifications } from '@mantine/notifications';

interface ReservationCardProps {
  reservation: Reservation;
  onView: (reservation: Reservation) => void;
  viewMode?: 'grid' | 'list';
}

export default function ReservationCard({ 
  reservation, 
  onView, 
  viewMode = 'grid' 
}: ReservationCardProps) {
  
  const getStatusConfig = (status: string, paymentStatus?: string) => {
    // If reservation is pending but has payment verification status, show that instead
    if (status === 'pending' && paymentStatus) {
      switch (paymentStatus) {
        case 'verifying':
          return { color: 'blue', label: 'Verificando pago' };
        case 'verified':
          return { color: 'green', label: 'Pago verificado' };
        case 'rejected':
          return { color: 'orange', label: 'Pago rechazado' };
        case 'uploaded':
          return { color: 'blue', label: 'Verificando pago' };
        case 'partial':
          return { color: 'green', label: 'Confirmada' };
        case 'paid':
          return { color: 'green', label: 'Confirmada' };
      }
    }

    // Default status handling
    switch (status) {
      case 'confirmed':
        return { color: 'green', label: 'Confirmada' };
      case 'pending':
        return { color: 'yellow', label: 'Pendiente' };
      case 'cancelled':
        return { color: 'red', label: 'Cancelada' };
      case 'completed':
        return { color: 'blue', label: 'Completada' };
      default:
        return { color: 'gray', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('es-ES', { month: 'short' }),
      weekday: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getDaysUntilEvent = () => {
    const eventDate = new Date(reservation.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilEvent();
  const statusConfig = getStatusConfig(reservation.status, reservation.paymentStatus);
  const dateInfo = formatDate(reservation.eventDate);

  const handleCalendarExport = (provider: 'google' | 'outlook' | 'yahoo' | 'ical') => {
    try {
      exportToCalendar(reservation, provider);
      notifications.show({ 
        title: 'Éxito', 
        message: `Evento exportado a ${provider === 'ical' ? 'calendario' : provider}`, 
        color: 'green' 
      });
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      notifications.show({ 
        title: 'Error', 
        message: 'Error al exportar el evento', 
        color: 'red' 
      });
    }
  };

  const calendarOptions = [
    { key: 'google', label: 'Google Calendar', icon: '📅' },
    { key: 'outlook', label: 'Outlook', icon: '📧' },
    { key: 'yahoo', label: 'Yahoo Calendar', icon: '🟣' },
    { key: 'ical', label: 'Descargar iCal', icon: '📋' }
  ];

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group wrap="nowrap">
            <Box style={{ minWidth: 80 }}>
              <Stack align="center" gap="xs">
                <Text size="xl" fw={700}>{dateInfo.day}</Text>
                <Text size="xs" c="dimmed" tt="uppercase">{dateInfo.month}</Text>
                <Text size="xs" c="dimmed">{dateInfo.weekday}</Text>
              </Stack>
            </Box>

            <Box style={{ flex: 1 }}>
              <Group justify="space-between" mb="xs">
                <Group gap="sm">
                  <Avatar
                    name={reservation.child.name}
                    size="sm"
                    color="pink"
                    variant="light"
                  />
                  <div>
                    <Text fw={600}>Fiesta de {reservation.child.name}</Text>
                    <Text size="sm" c="dimmed">
                      {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                    </Text>
                  </div>
                </Group>
                <Badge color={statusConfig.color} variant="light">
                  {statusConfig.label}
                </Badge>
              </Group>

              <Group gap="md" mb="sm">
                <Group gap="xs">
                  <ThemeIcon size="xs" variant="light" color="blue">
                    <CalendarDaysIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <Text size="sm">{dateInfo.fullDate}</Text>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon size="xs" variant="light" color="blue">
                    <ClockIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <Text size="sm">{reservation.eventTime}</Text>
                </Group>

                {reservation.package && (
                  <Group gap="xs">
                    <ThemeIcon size="xs" variant="light" color="purple">
                      <UserGroupIcon style={{ width: '70%', height: '70%' }} />
                    </ThemeIcon>
                    <Text size="sm">Hasta {reservation.package.maxGuests} invitados</Text>
                  </Group>
                )}
              </Group>

              {reservation.package && (
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="xs" variant="light" color="purple">
                    <SparklesIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>{reservation.package.name}</Text>
                </Group>
              )}
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text size="xl" fw={700} mb="xs">
                {formatPrice(reservation.pricing?.total || 0)}
              </Text>
              <Text size="xs" c="dimmed" mb="md">Total</Text>
              
              <Group gap="xs" justify="flex-end">
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="light" size="sm">
                      <CalendarIcon style={{ width: '70%', height: '70%' }} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {calendarOptions.map((option) => (
                      <Menu.Item
                        key={option.key}
                        leftSection={option.icon}
                        onClick={() => handleCalendarExport(option.key as any)}
                      >
                        {option.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
                
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => onView(reservation)}
                  leftSection={<EyeIcon style={{ width: 16, height: 16 }} />}
                >
                  Ver detalles
                </Button>
              </Group>
            </Box>
          </Group>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card shadow="sm" p="md" radius="md" withBorder style={{ height: '100%' }}>
        <Stack gap="sm" style={{ height: '100%' }}>
          <Group justify="space-between" align="flex-start">
            <Badge color={statusConfig.color} variant="light">
              {statusConfig.label}
            </Badge>
            
            <Box style={{ textAlign: 'center' }}>
              <Text size="lg" fw={700}>{dateInfo.day}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">{dateInfo.month}</Text>
            </Box>
          </Group>

          <Box 
            p="xl" 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 'var(--mantine-radius-md)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <ThemeIcon size={48} variant="white" color="gray" mb="sm">
              <SparklesIcon style={{ width: '70%', height: '70%' }} />
            </ThemeIcon>
            <Text size="sm" fw={500}>Celebración</Text>
            
            {daysUntil > 0 && daysUntil <= 30 && (
              <Badge 
                variant="white" 
                color="gray" 
                size="sm" 
                style={{ marginTop: 8 }}
              >
                {daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
              </Badge>
            )}
          </Box>

          <Group gap="sm">
            <Avatar
              name={reservation.child.name}
              size="sm"
              color="pink"
              variant="light"
            />
            <div style={{ flex: 1 }}>
              <Text fw={600} size="sm">Fiesta de {reservation.child.name}</Text>
              <Text size="xs" c="dimmed">
                {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
              </Text>
            </div>
          </Group>

          {reservation.package && (
            <Group gap="xs">
              <ThemeIcon size="xs" variant="light" color="purple">
                <SparklesIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              <Text size="sm" fw={500} style={{ flex: 1 }}>
                {reservation.package.name}
              </Text>
            </Group>
          )}

          <Stack gap="xs">
            <Group gap="xs">
              <ThemeIcon size="xs" variant="light" color="blue">
                <CalendarDaysIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              <Text size="sm">{dateInfo.fullDate}</Text>
            </Group>
            
            <Group gap="xs">
              <ThemeIcon size="xs" variant="light" color="blue">
                <ClockIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              <Text size="sm">{reservation.eventTime}</Text>
            </Group>

            {reservation.package && (
              <Group gap="xs">
                <ThemeIcon size="xs" variant="light" color="purple">
                  <UserGroupIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <Text size="sm">Hasta {reservation.package.maxGuests} invitados</Text>
              </Group>
            )}
          </Stack>

          <Box style={{ marginTop: 'auto' }}>
            <Group justify="space-between" align="flex-end">
              <div>
                <Text size="lg" fw={700}>
                  {formatPrice(reservation.pricing?.total || 0)}
                </Text>
                <Text size="xs" c="dimmed">Total</Text>
              </div>
              
              <Group gap="xs">
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="light" size="sm">
                      <CalendarIcon style={{ width: '70%', height: '70%' }} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {calendarOptions.map((option) => (
                      <Menu.Item
                        key={option.key}
                        leftSection={option.icon}
                        onClick={() => handleCalendarExport(option.key as any)}
                      >
                        {option.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
                
                <Button
                  size="sm"
                  onClick={() => onView(reservation)}
                  leftSection={<EyeIcon style={{ width: 16, height: 16 }} />}
                >
                  Ver
                </Button>
              </Group>
            </Group>
          </Box>
        </Stack>
      </Card>
    </motion.div>
  );
}