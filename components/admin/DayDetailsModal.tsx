'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Badge,
  Skeleton
} from '@heroui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  availability: any;
}

interface ReservationDetail {
  _id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  child: {
    name: string;
    age: number;
  };
  eventTime: string;
  eventDuration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
  packageName: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  specialComments?: string;
  createdAt: string;
}

interface DayDetails {
  date: string;
  totalSlots: number;
  availableSlots: number;
  reservations: ReservationDetail[];
  totalRevenue: number;
  averageEventValue: number;
  isRestDay: boolean;
  restDayFee?: number;
  timeBlocks: Array<{
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
    slots: Array<{
      time: string;
      endTime?: string;
      available: boolean;
      remainingCapacity?: number;
      totalCapacity?: number;
      reservations: ReservationDetail[];
    }>;
  }>;
}

export default function DayDetailsModal({ isOpen, onClose, date, availability }: DayDetailsModalProps) {
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      fetchDayDetails();
    }
  }, [isOpen, date]);

  const fetchDayDetails = async () => {
    if (!date) {
      console.warn('fetchDayDetails called without date');
      return;
    }
    
    setLoading(true);
    setDayDetails(null); // Reset previous data
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Fetching day details for:', dateStr);
      
      const response = await fetch(`/api/admin/availability/day-details?date=${dateStr}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`);
      }
      
      if (data.success) {
        console.log('Day details received:', {
          date: data.data.date,
          totalReservations: data.data.reservations?.length || 0,
          totalSlots: data.data.totalSlots,
          availableSlots: data.data.availableSlots,
          timeBlocks: data.data.timeBlocks?.length || 0
        });
        
        // Validate data structure
        if (!data.data.reservations) {
          console.warn('Reservations array is missing in response');
          data.data.reservations = [];
        }
        
        setDayDetails(data.data);
      } else {
        console.error('API returned success=false:', data.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error fetching day details:', error);
      // Could show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPaymentColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: es });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "surface-overlay",
        base: "surface-modal",
        header: "border-b border-gray-200",
        body: "p-6",
        footer: "border-t border-gray-200"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Detalles del Día
              </h3>
              {date && (
                <p className="text-sm text-gray-600 capitalize">
                  {formatDate(date)}
                </p>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            </div>
          ) : dayDetails ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="surface-card">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Horarios Disponibles</p>
                        <p className="text-2xl font-bold text-foreground">
                          {dayDetails.availableSlots}/{dayDetails.totalSlots}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="surface-card">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Reservaciones</p>
                        <p className="text-2xl font-bold text-foreground">
                          {dayDetails.reservations.length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="surface-card">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Ingresos</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(dayDetails.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Rest Day Warning */}
              {dayDetails.isRestDay && (
                <Card className="border border-amber-200 bg-amber-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">
                          Día de Descanso
                        </p>
                        <p className="text-sm text-amber-700">
                          Se aplica un cargo adicional de {formatCurrency(dayDetails.restDayFee || 0)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Time Blocks */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Bloques de Horarios</h4>
                {dayDetails.timeBlocks.map((block, index) => (
                  <Card key={index} className="surface-card">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-foreground">{block.name}</h5>
                          <p className="text-sm text-gray-600">
                            {block.startTime} - {block.endTime} (Duración: {block.duration}h)
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={block.slots.some(s => s.available) ? 'success' : 'danger'}
                        >
                          {block.slots.filter(s => s.available).length} disponibles
                        </Chip>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {block.slots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className={`p-2 rounded-lg border text-center ${
                              slot.available
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <p className="text-sm font-medium text-foreground">
                              {slot.time}
                            </p>
                            <p className="text-xs text-gray-600">
                              {slot.available ? 'Disponible' : 'Ocupado'}
                            </p>
                            {slot.remainingCapacity !== undefined && (
                              <p className="text-xs text-gray-500">
                                {slot.remainingCapacity}/{slot.totalCapacity}
                              </p>
                            )}
                            {slot.reservations && slot.reservations.length > 0 && (
                              <p className="text-xs text-blue-600">
                                {slot.reservations.length} reserva{slot.reservations.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Reservations List */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Reservaciones del Día</h4>
                {dayDetails.reservations.length > 0 ? (
                  <div className="space-y-3">
                    {dayDetails.reservations.map((reservation) => (
                      <Card key={reservation._id} className="surface-card">
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-medium text-foreground">
                                  {reservation.customer.name}
                                </h5>
                                <Chip
                                  size="sm"
                                  color={getStatusColor(reservation.status)}
                                  variant="flat"
                                  startContent={getStatusIcon(reservation.status)}
                                >
                                  {reservation.status}
                                </Chip>
                                <Chip
                                  size="sm"
                                  color={getPaymentColor(reservation.paymentStatus)}
                                  variant="flat"
                                >
                                  {reservation.paymentStatus}
                                </Chip>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Festejado: <span className="font-medium text-foreground">{reservation.child.name}</span></p>
                                  <p className="text-gray-600">Edad: <span className="font-medium text-foreground">{reservation.child.age} años</span></p>
                                  <p className="text-gray-600">Teléfono: <span className="font-medium text-foreground">{reservation.customer.phone}</span></p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Hora: <span className="font-medium text-foreground">{reservation.eventTime}</span></p>
                                  <p className="text-gray-600">Duración: <span className="font-medium text-foreground">{reservation.eventDuration}h</span></p>
                                  <p className="text-gray-600">Paquete: <span className="font-medium text-foreground">{reservation.packageName}</span></p>
                                </div>
                              </div>
                              
                              {reservation.specialComments && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <strong>Comentarios:</strong> {reservation.specialComments}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <p className="text-lg font-semibold text-foreground">
                                {formatCurrency(reservation.totalAmount)}
                              </p>
                              <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                startContent={<EyeIcon className="w-4 h-4" />}
                              >
                                Ver detalles
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="surface-card">
                    <CardBody className="p-8 text-center">
                      <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay reservaciones para este día</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No se pudieron cargar los detalles del día</p>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <Button
            variant="light"
            onPress={onClose}
          >
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}