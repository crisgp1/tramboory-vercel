'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Avatar,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  SparklesIcon,
  CalendarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { Reservation } from '@/types/reservation';
import { exportToCalendar } from '@/lib/calendar-export';
import toast from 'react-hot-toast';

interface ClientReservationCardCleanProps {
  reservation: Reservation;
  onView: (reservation: Reservation) => void;
  viewMode?: 'grid' | 'list';
}

export default function ClientReservationCardClean({ 
  reservation, 
  onView, 
  viewMode = 'grid' 
}: ClientReservationCardCleanProps) {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          color: 'success' as const, 
          label: 'Confirmada', 
          bg: 'bg-green-50', 
          text: 'text-green-700',
          border: 'border-green-200'
        };
      case 'pending':
        return { 
          color: 'warning' as const, 
          label: 'Pendiente', 
          bg: 'bg-yellow-50', 
          text: 'text-yellow-700',
          border: 'border-yellow-200'
        };
      case 'cancelled':
        return { 
          color: 'danger' as const, 
          label: 'Cancelada', 
          bg: 'bg-red-50', 
          text: 'text-red-700',
          border: 'border-red-200'
        };
      case 'completed':
        return { 
          color: 'primary' as const, 
          label: 'Completada', 
          bg: 'bg-blue-50', 
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
      default:
        return { 
          color: 'default' as const, 
          label: status, 
          bg: 'bg-gray-50', 
          text: 'text-gray-700',
          border: 'border-gray-200'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
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
  const statusConfig = getStatusConfig(reservation.status);
  const dateInfo = formatDate(reservation.eventDate);
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);

  const handleCalendarExport = (provider: 'google' | 'outlook' | 'yahoo' | 'ical') => {
    try {
      exportToCalendar(reservation, provider);
      toast.success(`Evento exportado a ${provider === 'ical' ? 'calendario' : provider}`);
      setCalendarDropdownOpen(false);
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      toast.error('Error al exportar el evento');
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
        <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
          <CardBody className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Date Badge */}
              <div className="flex-shrink-0 p-6 bg-gray-50 sm:w-32 flex sm:flex-col items-center justify-center text-center border-r border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{dateInfo.day}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{dateInfo.month}</div>
                <div className="text-xs text-gray-400 mt-1">{dateInfo.weekday}</div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={reservation.child.name}
                          size="sm"
                          className="bg-pink-100 text-pink-700"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            Fiesta de {reservation.child.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                          </p>
                        </div>
                      </div>
                      <Chip 
                        size="sm" 
                        variant="flat"
                        className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
                      >
                        {statusConfig.label}
                      </Chip>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>{dateInfo.fullDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{reservation.eventTime}</span>
                      </div>
                      {reservation.package && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>Hasta {reservation.package.maxGuests} invitados</span>
                        </div>
                      )}
                    </div>
                    
                    {reservation.package && (
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-900">{reservation.package.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(reservation.pricing?.total || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dropdown isOpen={calendarDropdownOpen} onOpenChange={setCalendarDropdownOpen}>
                        <DropdownTrigger>
                          <Button
                            variant="bordered"
                            size="sm"
                            isIconOnly
                            className="border-gray-300 hover:border-gray-400"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          {calendarOptions.map((option) => (
                            <DropdownItem
                              key={option.key}
                              startContent={<span className="text-sm">{option.icon}</span>}
                              onPress={() => handleCalendarExport(option.key as any)}
                            >
                              {option.label}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                      
                      <Button
                        variant="bordered"
                        size="sm"
                        onPress={() => onView(reservation)}
                        className="border-gray-300 hover:border-gray-400"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-sm overflow-hidden group">
        <CardBody className="p-0">
          {/* Hero Image Area (Mock) */}
          <div className="relative h-48 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Chip 
                size="sm" 
                variant="solid"
                className="bg-white/90 text-gray-800 backdrop-blur-sm"
              >
                {statusConfig.label}
              </Chip>
            </div>
            
            {/* Date Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center min-w-[50px]">
              <div className="text-lg font-bold text-gray-900">{dateInfo.day}</div>
              <div className="text-xs font-medium text-gray-600 uppercase -mt-1">{dateInfo.month}</div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                  <SparklesIcon className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium opacity-90">Celebración</div>
              </div>
            </div>
            
            {/* Days Until Event */}
            {daysUntil > 0 && daysUntil <= 30 && (
              <div className="absolute bottom-3 left-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-xs font-medium text-gray-800">
                    {daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar
                  name={reservation.child.name}
                  size="sm"
                  className="bg-pink-100 text-pink-700 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    Fiesta de {reservation.child.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Package */}
            {reservation.package && (
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {reservation.package.name}
                </span>
              </div>
            )}
            
            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{dateInfo.fullDate}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4 flex-shrink-0" />
                <span>{reservation.eventTime}</span>
              </div>
              
              {reservation.package && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Hasta {reservation.package.maxGuests} invitados</span>
                </div>
              )}
            </div>
            
            <Divider />
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(reservation.pricing?.total || 0)}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      className="bg-gray-100 hover:bg-gray-200"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    {calendarOptions.map((option) => (
                      <DropdownItem
                        key={option.key}
                        startContent={<span className="text-sm">{option.icon}</span>}
                        onPress={() => handleCalendarExport(option.key as any)}
                      >
                        {option.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                
                <Button
                  size="sm"
                  onPress={() => onView(reservation)}
                  className="bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  startContent={<EyeIcon className="w-4 h-4" />}
                >
                  Ver
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}