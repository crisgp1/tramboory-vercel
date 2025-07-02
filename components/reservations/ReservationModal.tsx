'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Chip
} from '@heroui/react';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CakeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  StarIcon,
  SparklesIcon,
  PlusIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/types/reservation';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onStatusChange?: (id: string, status: string) => void;
}

const statusColorMap = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'primary'
} as const;

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

const statusIcons = {
  pending: ClockIcon,
  confirmed: CheckCircleIcon,
  cancelled: XCircleIcon,
  completed: StarIcon
};

export default function ReservationModal({
  isOpen,
  onClose,
  reservation,
  onStatusChange
}: ReservationModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
  const [isLoading, setIsLoading] = useState(false);

  if (!reservation) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      setIsLoading(true);
      await onStatusChange(reservation._id, newStatus);
      setIsLoading(false);
    }
  };

  const StatusIcon = statusIcons[reservation.status];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-0 overflow-y-auto max-h-[calc(90vh-140px)]",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        {/* Header */}
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <StatusIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reserva #{reservation._id.slice(-6).toUpperCase()}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Chip
                    color={statusColorMap[reservation.status]}
                    variant="flat"
                    size="sm"
                    className="text-xs"
                  >
                    {statusLabels[reservation.status]}
                  </Chip>
                  <span className="text-sm text-gray-500">
                    {formatDate(reservation.eventDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ModalHeader>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex px-6">
            {[
              { key: 'details', label: 'Detalles', icon: UserIcon },
              { key: 'billing', label: 'Facturación', icon: CurrencyDollarIcon }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <ModalBody className="p-6 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                      <p className="text-gray-900 font-medium">{reservation.customer.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CakeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Festejado/a</p>
                      <p className="text-gray-900 font-medium">{reservation.child.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                      <p className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.total)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Child Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Información del Cliente</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Nombre</p>
                          <p className="text-gray-900 text-sm">{reservation.customer.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Teléfono</p>
                          <p className="text-gray-900 text-sm">{reservation.customer.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-gray-900 text-sm">{reservation.customer.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Información del Festejado/a</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CakeIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Nombre</p>
                          <p className="text-gray-900 text-sm">{reservation.child.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Edad</p>
                          <p className="text-gray-900 text-sm">{reservation.child.age} años</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Event Details */}
              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Detalles del Evento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Fecha</p>
                        <p className="text-gray-900 text-sm">{formatDate(reservation.eventDate)}</p>
                        {reservation.isRestDay && (
                          <Chip size="sm" color="warning" variant="flat" className="mt-1">
                            Día de descanso
                          </Chip>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Hora</p>
                        <p className="text-gray-900 text-sm">{reservation.eventTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Paquete</p>
                        <p className="text-gray-900 text-sm">{reservation.package.name}</p>
                        <p className="text-xs text-gray-500">Hasta {reservation.package.maxGuests} invitados</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Food Option Details */}
              {reservation.foodOption && (
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CakeIcon className="w-4 h-4 text-orange-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Opción de Alimento</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{reservation.foodOption.name}</p>
                            <p className="text-xs text-gray-500">Opción base</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(reservation.foodOption.basePrice)}
                          </span>
                        </div>
                        
                        {reservation.foodOption.selectedExtras && reservation.foodOption.selectedExtras.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Extras seleccionados:</p>
                            <div className="space-y-1">
                              {reservation.foodOption.selectedExtras.map((extra, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">• {extra.name}</span>
                                  <span className="text-gray-900 font-medium">
                                    {formatCurrency(extra.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Event Theme Details */}
              {reservation.eventTheme && (
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Tema del Evento</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Configuración</p>
                            <p className="font-medium text-gray-900">{reservation.eventTheme.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tema seleccionado</p>
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-purple-50 text-purple-700"
                            >
                              {reservation.eventTheme.selectedTheme}
                            </Chip>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Paquete de decoración:</p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {reservation.eventTheme.selectedPackage.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {reservation.eventTheme.selectedPackage.pieces} piezas
                              </p>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(reservation.eventTheme.selectedPackage.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Extra Services Details */}
              {reservation.extraServices && reservation.extraServices.length > 0 && (
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GiftIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Servicios Extras</h4>
                    </div>
                    <div className="space-y-3">
                      {reservation.extraServices.map((service, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{service.name}</p>
                                {service.quantity > 1 && (
                                  <Chip size="sm" variant="flat" className="bg-blue-50 text-blue-700">
                                    x{service.quantity}
                                  </Chip>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(service.price)} {service.quantity > 1 ? 'c/u' : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(service.price * service.quantity)}
                              </p>
                              {service.quantity > 1 && (
                                <p className="text-xs text-gray-500">
                                  {service.quantity} × {formatCurrency(service.price)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Special Comments */}
              {reservation.specialComments && (
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" />
                      <h4 className="text-sm font-semibold text-gray-900">Comentarios Especiales</h4>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{reservation.specialComments}</p>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Summary */}
              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Resumen de Facturación</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Paquete base:</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(reservation.pricing.packagePrice)}</span>
                    </div>
                    {reservation.pricing.foodPrice > 0 && (
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Alimentos:</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(reservation.pricing.foodPrice)}</span>
                      </div>
                    )}
                    {reservation.pricing.extrasPrice > 0 && (
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Servicios extras:</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(reservation.pricing.extrasPrice)}</span>
                      </div>
                    )}
                    {reservation.pricing.themePrice > 0 && (
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Tema del evento:</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(reservation.pricing.themePrice)}</span>
                      </div>
                    )}
                    {reservation.pricing.restDayFee > 0 && (
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-orange-600 font-medium">Cargo por día de descanso:</span>
                        <span className="text-orange-600 font-semibold">{formatCurrency(reservation.pricing.restDayFee)}</span>
                      </div>
                    )}
                    <Divider className="my-4" />
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(reservation.pricing.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-4 text-lg font-bold bg-gray-900 text-white px-4 rounded-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(reservation.pricing.total)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Details */}
                <Card className="border border-gray-200 shadow-none">
                  <CardBody className="p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Detalles del Paquete</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{reservation.package.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Hasta {reservation.package.maxGuests} invitados</p>
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {formatCurrency(reservation.pricing.packagePrice)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Additional Services */}
                {(reservation.foodOption || reservation.eventTheme || (reservation.extraServices && reservation.extraServices.length > 0)) && (
                  <Card className="border border-gray-200 shadow-none">
                    <CardBody className="p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Servicios Adicionales</h4>
                      <div className="space-y-3">
                        {reservation.foodOption && (
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{reservation.foodOption.name}</p>
                                <p className="text-xs text-gray-500">Opción de alimento</p>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(reservation.pricing.foodPrice)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {reservation.eventTheme && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{reservation.eventTheme.name}</p>
                                <p className="text-xs text-gray-500">Tema: {reservation.eventTheme.selectedTheme}</p>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(reservation.pricing.themePrice)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {reservation.extraServices && reservation.extraServices.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-gray-900">Servicios extras</p>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(reservation.pricing.extrasPrice)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {reservation.extraServices.map((service, index) => (
                                <p key={index} className="text-xs text-gray-600">
                                  • {service.name} {service.quantity > 1 && `(x${service.quantity})`}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          )}
        </ModalBody>

        {/* Footer */}
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-between items-center w-full">
            <div className="flex gap-3">
              {reservation.status === 'pending' && (
                <>
                  <Button
                    color="success"
                    variant="flat"
                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                    onPress={() => handleStatusChange('confirmed')}
                    isLoading={isLoading}
                    size="sm"
                    className="bg-green-50 text-green-700 hover:bg-green-100 border-0"
                  >
                    Confirmar
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    startContent={<XCircleIcon className="w-4 h-4" />}
                    onPress={() => handleStatusChange('cancelled')}
                    isLoading={isLoading}
                    size="sm"
                    className="bg-red-50 text-red-700 hover:bg-red-100 border-0"
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {reservation.status === 'confirmed' && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  onPress={() => handleStatusChange('completed')}
                  isLoading={isLoading}
                  size="sm"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0"
                >
                  Completar
                </Button>
              )}
            </div>
            
            <Button 
              variant="light" 
              onPress={onClose}
              size="sm"
              className="text-gray-600 hover:bg-gray-100"
            >
              Cerrar
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}