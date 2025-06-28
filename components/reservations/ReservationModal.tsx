'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Chip,
  Avatar,
  Progress
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
  HeartIcon,
  ShareIcon,
  PrinterIcon
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
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'billing'>('details');
  const [isLoading, setIsLoading] = useState(false);

  if (!reservation) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
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

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20
    }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          size="5xl"
          scrollBehavior="inside"
          backdrop="blur"
          classNames={{
            backdrop: "bg-black/60 backdrop-blur-md",
            base: "bg-transparent shadow-none",
            wrapper: "z-[1001] items-center justify-center p-4",
            body: "p-0",
            header: "p-0",
            footer: "p-0"
          }}
        >
          <ModalContent className="bg-transparent shadow-none max-h-[95vh]">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header with Hero Section */}
              <motion.div 
                variants={itemVariants}
                className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white"
              >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                      >
                        <StatusIcon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Reserva #{reservation._id.slice(-6).toUpperCase()}</h2>
                        <div className="flex items-center gap-3">
                          <Chip
                            color={statusColorMap[reservation.status]}
                            variant="flat"
                            size="lg"
                            className="bg-white/20 backdrop-blur-sm text-white font-medium"
                          >
                            {statusLabels[reservation.status]}
                          </Chip>
                          <span className="text-white/80 text-sm">
                            {formatDate(reservation.eventDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          isIconOnly
                          variant="flat"
                          className="bg-white/20 backdrop-blur-sm text-white border-0"
                          size="sm"
                        >
                          <HeartIcon className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          isIconOnly
                          variant="flat"
                          className="bg-white/20 backdrop-blur-sm text-white border-0"
                          size="sm"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          isIconOnly
                          variant="flat"
                          className="bg-white/20 backdrop-blur-sm text-white border-0"
                          size="sm"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Quick Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-white/80" />
                        <div>
                          <p className="text-white/80 text-xs uppercase tracking-wide">Cliente</p>
                          <p className="text-white font-semibold">{reservation.customer.name}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <CakeIcon className="w-5 h-5 text-white/80" />
                        <div>
                          <p className="text-white/80 text-xs uppercase tracking-wide">Festejado/a</p>
                          <p className="text-white font-semibold">{reservation.child.name}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <CurrencyDollarIcon className="w-5 h-5 text-white/80" />
                        <div>
                          <p className="text-white/80 text-xs uppercase tracking-wide">Total</p>
                          <p className="text-white font-semibold">{formatCurrency(reservation.pricing.total)}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Navigation Tabs */}
              <motion.div 
                variants={itemVariants}
                className="border-b border-gray-200 bg-white"
              >
                <div className="flex px-8">
                  {[
                    { key: 'details', label: 'Detalles', icon: UserIcon },
                    { key: 'timeline', label: 'Cronología', icon: ClockIcon },
                    { key: 'billing', label: 'Facturación', icon: CurrencyDollarIcon }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <motion.button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-200 ${
                          activeTab === tab.key
                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                      >
                        <TabIcon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Content Area */}
              <motion.div 
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="p-8 max-h-[60vh] overflow-y-auto"
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Customer & Child Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants}>
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardBody className="p-6">
                              <div className="flex items-center gap-4 mb-6">
                                <Avatar
                                  name={reservation.customer.name}
                                  className="w-12 h-12 bg-blue-500 text-white"
                                />
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">Información del Cliente</h3>
                                  <p className="text-sm text-gray-600">Datos de contacto</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <UserIcon className="w-5 h-5 text-blue-500" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre</p>
                                    <p className="text-gray-900 font-medium">{reservation.customer.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <PhoneIcon className="w-5 h-5 text-green-500" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                                    <p className="text-gray-900 font-medium">{reservation.customer.phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <EnvelopeIcon className="w-5 h-5 text-purple-500" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                    <p className="text-gray-900 font-medium">{reservation.customer.email}</p>
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50">
                            <CardBody className="p-6">
                              <div className="flex items-center gap-4 mb-6">
                                <Avatar
                                  name={reservation.child.name}
                                  className="w-12 h-12 bg-pink-500 text-white"
                                />
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">Festejado/a</h3>
                                  <p className="text-sm text-gray-600">Información del niño/a</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <CakeIcon className="w-5 h-5 text-pink-500" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre</p>
                                    <p className="text-gray-900 font-medium">{reservation.child.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <StarIcon className="w-5 h-5 text-yellow-500" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Edad</p>
                                    <p className="text-gray-900 font-medium">{reservation.child.age} años</p>
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Event Details */}
                      <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                          <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Detalles del Evento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="flex items-center gap-3">
                                <CalendarIcon className="w-5 h-5 text-green-500" />
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
                                  <p className="text-gray-900 font-medium">{formatDate(reservation.eventDate)}</p>
                                  {reservation.isRestDay && (
                                    <Chip size="sm" color="warning" variant="flat" className="mt-1">
                                      Día de descanso
                                    </Chip>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <ClockIcon className="w-5 h-5 text-blue-500" />
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Hora</p>
                                  <p className="text-gray-900 font-medium">{reservation.eventTime}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPinIcon className="w-5 h-5 text-purple-500" />
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paquete</p>
                                  <p className="text-gray-900 font-medium">{reservation.package.name}</p>
                                  <p className="text-xs text-gray-500">Hasta {reservation.package.maxGuests} invitados</p>
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>

                      {/* Special Comments */}
                      {reservation.specialComments && (
                        <motion.div variants={itemVariants}>
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                            <CardBody className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-bold text-gray-900">Comentarios Especiales</h3>
                              </div>
                              <p className="text-gray-700 bg-white/60 p-4 rounded-xl">{reservation.specialComments}</p>
                            </CardBody>
                          </Card>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'billing' && (
                    <motion.div
                      key="billing"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-lg">
                          <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Resumen de Facturación</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-600">Paquete base:</span>
                                <span className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.packagePrice)}</span>
                              </div>
                              {reservation.pricing.foodPrice > 0 && (
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                  <span className="text-gray-600">Alimentos:</span>
                                  <span className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.foodPrice)}</span>
                                </div>
                              )}
                              {reservation.pricing.extrasPrice > 0 && (
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                  <span className="text-gray-600">Servicios extras:</span>
                                  <span className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.extrasPrice)}</span>
                                </div>
                              )}
                              {reservation.pricing.themePrice > 0 && (
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                  <span className="text-gray-600">Tema del evento:</span>
                                  <span className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.themePrice)}</span>
                                </div>
                              )}
                              {reservation.pricing.restDayFee > 0 && (
                                <div className="flex justify-between py-3 border-b border-gray-100 text-orange-600">
                                  <span>Cargo por día de descanso:</span>
                                  <span className="font-medium">{formatCurrency(reservation.pricing.restDayFee)}</span>
                                </div>
                              )}
                              <Divider className="my-4" />
                              <div className="flex justify-between py-3">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="text-gray-900 font-medium">{formatCurrency(reservation.pricing.subtotal)}</span>
                              </div>
                              <div className="flex justify-between py-4 text-xl font-bold bg-gradient-to-r from-green-50 to-emerald-50 px-6 rounded-xl">
                                <span className="text-gray-900">Total:</span>
                                <span className="text-green-600">{formatCurrency(reservation.pricing.total)}</span>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Footer with Actions */}
              <motion.div 
                variants={itemVariants}
                className="border-t border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex gap-3">
                    {reservation.status === 'pending' && (
                      <>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            color="success"
                            variant="flat"
                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                            onPress={() => handleStatusChange('confirmed')}
                            isLoading={isLoading}
                            className="bg-green-100 text-green-700 hover:bg-green-200 border-0 font-medium"
                            size="lg"
                          >
                            Confirmar Reserva
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            color="danger"
                            variant="flat"
                            startContent={<XCircleIcon className="w-4 h-4" />}
                            onPress={() => handleStatusChange('cancelled')}
                            isLoading={isLoading}
                            className="bg-red-100 text-red-700 hover:bg-red-200 border-0 font-medium"
                            size="lg"
                          >
                            Cancelar
                          </Button>
                        </motion.div>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<CheckCircleIcon className="w-4 h-4" />}
                          onPress={() => handleStatusChange('completed')}
                          isLoading={isLoading}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 font-medium"
                          size="lg"
                        >
                          Marcar como Completada
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="light" 
                      onPress={onClose}
                      className="text-gray-600 hover:bg-gray-200 font-medium"
                      size="lg"
                    >
                      Cerrar
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </ModalContent>
        </Modal>
      )}
    </AnimatePresence>
  );
}