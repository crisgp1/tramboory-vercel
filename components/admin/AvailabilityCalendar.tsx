'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Skeleton,
  Tooltip
} from '@heroui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayAvailability {
  date: string;
  available: boolean;
  totalSlots: number;
  availableSlots: number;
  isRestDay: boolean;
  restDayFee?: number;
  hasReservations: boolean;
}

interface MonthAvailability {
  [key: string]: DayAvailability;
}

interface Props {
  className?: string;
  onDateClick?: (date: Date, availability: DayAvailability) => void;
}

export default function AvailabilityCalendar({ className = '', onDateClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<MonthAvailability>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch availability for the current month
  const fetchMonthAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const response = await fetch(`/api/admin/availability/month?year=${year}&month=${month}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Availability data received:', data.data);
        // Log days with reservations for debugging
        Object.entries(data.data).forEach(([date, dayData]: [string, any]) => {
          if (dayData.hasReservations) {
            console.log(`Day ${date} has reservations:`, dayData);
          }
        });
        setAvailability(data.data);
      } else {
        console.error('Error fetching availability:', data.error);
      }
    } catch (error) {
      console.error('Error fetching month availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthAvailability(currentDate);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    
    if (dayAvailability && onDateClick) {
      onDateClick(date, dayAvailability);
    }
  };

  const getDayStyle = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

    let baseClasses = 'relative w-full h-12 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 hover:scale-105';
    
    if (!isCurrentMonth) {
      baseClasses += ' text-gray-300 bg-gray-50';
    } else if (isPastDate) {
      baseClasses += ' text-gray-400 bg-gray-100 cursor-not-allowed';
    } else if (isSelected) {
      baseClasses += ' bg-blue-500 text-white shadow-md';
    } else if (isToday(date)) {
      baseClasses += ' bg-blue-100 text-blue-800 border-2 border-blue-300';
    } else if (dayAvailability) {
      if (dayAvailability.isRestDay) {
        baseClasses += ' bg-amber-100 text-amber-800 border border-amber-300';
      } else if (!dayAvailability.available) {
        baseClasses += ' bg-red-100 text-red-800 border border-red-300';
      } else if (dayAvailability.hasReservations) {
        // Days with reservations get a distinctive blue tint
        baseClasses += ' bg-blue-100 text-blue-800 border border-blue-300';
      } else if (dayAvailability.availableSlots <= 2) {
        baseClasses += ' bg-yellow-100 text-yellow-800 border border-yellow-300';
      } else {
        baseClasses += ' bg-green-100 text-green-800 border border-green-300';
      }
    } else {
      baseClasses += ' bg-gray-100 text-gray-600 hover:bg-gray-200';
    }

    return baseClasses;
  };

  const getDayTooltip = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    
    if (!dayAvailability) return null;

    const formattedDate = format(date, 'EEEE, d MMMM yyyy', { locale: es });
    
    return (
      <div className="text-sm">
        <p className="font-medium mb-1">{formattedDate}</p>
        <div className="space-y-1">
          <p>Horarios disponibles: {dayAvailability.availableSlots}/{dayAvailability.totalSlots}</p>
          {dayAvailability.hasReservations && (
            <p className="text-blue-600">• Tiene reservaciones</p>
          )}
          {dayAvailability.isRestDay && (
            <p className="text-amber-600">• Día de descanso (${dayAvailability.restDayFee?.toLocaleString() || 0})</p>
          )}
          {!dayAvailability.available && (
            <p className="text-red-600">• Completamente ocupado</p>
          )}
        </div>
      </div>
    );
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Calculate statistics
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const stats = monthDays.reduce((acc, date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    
    if (dayAvailability && date >= new Date(new Date().setHours(0, 0, 0, 0))) {
      acc.totalDays++;
      if (dayAvailability.available) acc.availableDays++;
      if (dayAvailability.hasReservations) acc.daysWithReservations++;
      if (dayAvailability.isRestDay) acc.restDays++;
    }
    
    return acc;
  }, { totalDays: 0, availableDays: 0, daysWithReservations: 0, restDays: 0 });

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Disponibilidad del Mes
              </h3>
              <p className="text-sm text-gray-600">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={goToPreviousMonth}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="flat"
              onPress={goToToday}
              className="text-blue-600 hover:text-blue-700"
            >
              Hoy
            </Button>
            
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={goToNextMonth}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="pt-0">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.availableDays}</div>
            <div className="text-xs text-blue-600">Días disponibles</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.daysWithReservations}</div>
            <div className="text-xs text-green-600">Con reservas</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{stats.restDays}</div>
            <div className="text-xs text-amber-600">Días de descanso</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.totalDays}</div>
            <div className="text-xs text-gray-600">Total del mes</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const dayAvailability = availability[format(date, 'yyyy-MM-dd')];
                const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <Tooltip
                    key={date.toISOString()}
                    content={getDayTooltip(date)}
                    placement="top"
                    className="max-w-xs"
                    isDisabled={!dayAvailability || isPastDate}
                  >
                    <div
                      className={getDayStyle(date)}
                      onClick={() => !isPastDate && handleDateClick(date)}
                    >
                      <span className="relative z-10">
                        {format(date, 'd')}
                      </span>
                      
                      {/* Availability indicator */}
                      {dayAvailability && (
                        <div className="absolute -top-1 -right-1 z-20">
                          {dayAvailability.hasReservations && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <InformationCircleIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Leyenda</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
              <span className="text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-gray-600">Con reservas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-gray-600">Pocos espacios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
              <span className="text-gray-600">Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div>
              <span className="text-gray-600">Día de descanso</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}