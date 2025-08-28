'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  SimpleGrid,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  Loader,
  Center
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { 
  CalendarDaysIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StepProps, TimeSlot, AvailableSlots } from '../types';
import { formatTo12Hour, calculateEndTime, formatTimeRangeWithFarewell } from '../utils/calculations';
import { calendarDateToUTC, toUTCDateString } from '@/lib/utils/dateUtils';
import 'dayjs/locale/es-mx';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function DateTimeStep({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack 
}: StepProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlots>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [minDate, setMinDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAvailability();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (formData.eventDate) {
      fetchTimeSlots();
    }
  }, [formData.eventDate]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/public/config');
      if (!response.ok) throw new Error('Error al obtener configuración');
      const data = await response.json();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minAdvanceDays = data.minAdvanceBookingDays || 7;
      const calculatedMinDate = new Date(today);
      calculatedMinDate.setDate(calculatedMinDate.getDate() + minAdvanceDays);
      setMinDate(calculatedMinDate);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/reservations/availability');
      if (!response.ok) throw new Error('Error al obtener disponibilidad');
      const data = await response.json();
      
      setAvailableSlots(data.availableSlots || {});
      setBlockedDates(data.blockedDates || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!formData.eventDate || !(formData.eventDate instanceof Date) || isNaN(formData.eventDate.getTime())) {
      console.log('❌ No valid date to fetch slots for:', formData.eventDate);
      return;
    }
    
    console.log('🔄 Fetching time slots for date:', formData.eventDate);
    setIsLoadingSlots(true);
    try {
      const dateStr = toUTCDateString(formData.eventDate);
      console.log('📅 Date string for API:', dateStr);
      
      const response = await fetch(
        `/api/reservations/available-slots?date=${dateStr}`
      );
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) throw new Error('Error al obtener horarios');
      const data = await response.json();
      
      console.log('📊 API Response data:', data);
      
      // Convert API response format to our expected format
      const slots: TimeSlot[] = (data.data?.slots || []).map((slot: any) => ({
        startTime: slot.time,
        endTime: calculateEndTime(slot.time, data.data?.defaultEventDuration || 3),
        duration: data.data?.defaultEventDuration || 3,
        maxCapacity: slot.totalCapacity,
        currentCapacity: slot.totalCapacity - slot.remainingCapacity,
        remainingCapacity: slot.remainingCapacity
      }));
      
      console.log('⚡ Mapped slots:', slots);
      
      setAvailableSlots(prev => ({
        ...prev,
        [dateStr]: {
          slots: slots,
          isUnavailable: false,
          hasBookings: slots.some(s => s.currentCapacity > 0)
        }
      }));
      
      console.log('✅ Updated availableSlots state');
    } catch (error) {
      console.error('❌ Error fetching time slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const getDayProps = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Ensure we have a valid Date object
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return {};
    }
    
    const dateStr = toUTCDateString(dateObj);
    const isBlocked = blockedDates.includes(dateStr);
    const dayData = availableSlots[dateStr];
    const isUnavailable = dayData?.isUnavailable;
    const hasBookings = dayData?.hasBookings;
    
    if (isBlocked || isUnavailable) {
      return {
        disabled: true,
        style: { 
          textDecoration: 'line-through',
          opacity: 0.5
        }
      };
    }
    
    if (hasBookings) {
      return {
        style: {
          backgroundColor: 'var(--mantine-color-orange-1)',
          border: '2px solid var(--mantine-color-orange-5)'
        }
      };
    }
    
    return {};
  };

  const getAvailableTimeSlotsForDate = (): TimeSlot[] => {
    if (!formData.eventDate || !(formData.eventDate instanceof Date) || isNaN(formData.eventDate.getTime())) {
      console.log('🚫 No valid eventDate for getting slots:', formData.eventDate);
      return [];
    }
    const dateStr = toUTCDateString(formData.eventDate);
    const slots = availableSlots[dateStr]?.slots || [];
    console.log(`🎯 Getting slots for ${dateStr}:`, slots);
    console.log('📋 All availableSlots:', availableSlots);
    return slots;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const timeSlots = getAvailableTimeSlotsForDate();
  const selectedDate = formData.eventDate;
  
  const getDayName = (date: Date | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };
  
  const dayName = getDayName(selectedDate);

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Group mb="md">
            <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
            <Text size="lg" fw={600}>Fecha y Hora</Text>
          </Group>
          
          <Text c="dimmed" size="sm" mb="xl">
            Selecciona cuándo será tu evento
          </Text>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <div>
              <Text size="sm" fw={500} mb="md">Fecha del evento</Text>
              <DatePicker
                value={formData.eventDate}
                onChange={(date) => {
                  console.log('📅 DatePicker onChange received:', date, typeof date);
                  
                  // Convert to Date object if it's a string
                  let parsedDate: Date | null = null;
                  
                  if (date) {
                    if (typeof date === 'string') {
                      // Parse string date (e.g., "2025-09-17")
                      parsedDate = new Date(date + 'T12:00:00.000');
                      console.log('🔄 Parsed string date:', parsedDate);
                    } else {
                      // Assume it's already a Date object, cast it
                      parsedDate = date as Date;
                      console.log('✅ Treating as Date object:', parsedDate);
                    }
                    
                    // Validate the parsed date
                    if (parsedDate && isNaN(parsedDate.getTime())) {
                      console.warn('⚠️ Invalid date parsed, setting to null');
                      parsedDate = null;
                    }
                  }
                  
                  console.log('💾 Saving to form data:', parsedDate);
                  
                  onUpdateFormData({ 
                    eventDate: parsedDate,
                    eventTime: '' 
                  });
                }}
                locale="es-mx"
                minDate={minDate}
                getDayProps={getDayProps}
                firstDayOfWeek={0}
              />
              
              {selectedDate && (
                <Badge mt="md" size="lg" variant="light">
                  {dayName}
                </Badge>
              )}
            </div>

            <div>
              <Text size="sm" fw={500} mb="md">Horario disponible</Text>
              
              {!selectedDate && (
                <Alert icon={<InformationCircleIcon className="h-5 w-5" />} color="blue">
                  Primero selecciona una fecha
                </Alert>
              )}
              
              {selectedDate && isLoadingSlots && (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              )}
              
              {selectedDate && !isLoadingSlots && timeSlots.length === 0 && (
                <Alert icon={<ExclamationTriangleIcon className="h-5 w-5" />} color="red">
                  No hay horarios disponibles para esta fecha
                </Alert>
              )}
              
              {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (
                <RadioGroup
                  value={formData.eventTime}
                  onChange={(value) => onUpdateFormData({ eventTime: value })}
                >
                  <Stack>
                    {timeSlots.map((slot) => (
                      <Radio
                        key={slot.startTime}
                        value={slot.startTime}
                        label={
                          <div>
                            <Text size="sm" fw={500}>
                              {formatTimeRangeWithFarewell(
                                slot.startTime,
                                slot.endTime,
                                slot.duration
                              )}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {slot.remainingCapacity > 0
                                ? `${slot.remainingCapacity} lugares disponibles`
                                : 'Capacidad completa'}
                            </Text>
                          </div>
                        }
                        disabled={slot.remainingCapacity <= 0}
                      />
                    ))}
                  </Stack>
                </RadioGroup>
              )}
            </div>
          </SimpleGrid>

          <Group justify="space-between" mt="xl">
            <Button
              variant="subtle"
              leftSection={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={onBack}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              rightSection={<ArrowRightIcon className="h-4 w-4" />}
              disabled={!formData.eventDate || !formData.eventTime}
            >
              Continuar
            </Button>
          </Group>
        </Card>
      </form>
    </motion.div>
  );
}