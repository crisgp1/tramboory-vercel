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
  Chip,
  Divider,
  Input,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CakeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  HeartIcon,
  PlusIcon,
  CreditCardIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';
import { exportToCalendar } from '@/lib/calendar-export';
import toast from 'react-hot-toast';

interface ClientReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export default function ClientReservationModal({
  isOpen,
  onClose,
  reservation
}: ClientReservationModalProps) {
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  if (!reservation) return null;

  // Generate unique payment reference
  const generatePaymentReference = () => {
    const date = new Date(reservation.eventDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const childInitials = reservation.child.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRM${dateStr}${childInitials}${randomNum}`;
  };

  const uniqueReference = generatePaymentReference();

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      setPaymentScreenshot(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentScreenshot) {
      alert('Por favor selecciona una captura de pantalla del pago');
      return;
    }

    setIsUploading(true);
    try {
      // Here you would implement the actual upload logic
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setPaymentScreenshot(null);
      setPaymentReference('');
      setPaymentNotes('');
      setShowPaymentSection(false);
      
      alert('¡Comprobante de pago enviado exitosamente!');
    } catch (error) {
      alert('Error al enviar el comprobante. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

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
        header: "border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50 flex-shrink-0",
        body: "p-0 overflow-y-auto max-h-[calc(90vh-140px)]",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎂</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Fiesta de {reservation.child.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Una celebración mágica e inolvidable ✨
                </p>
              </div>
            </div>
            <Chip
              color={getStatusColor(reservation.status)}
              variant="flat"
              size="lg"
              className="font-semibold"
            >
              {getStatusText(reservation.status)}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="p-6">
            {/* Grid principal con información organizada */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* Columna 1: Información del festejado y evento */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Festejado - Card compacta */}
                <Card className="border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {reservation.child.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CakeIcon className="w-4 h-4 text-pink-600" />
                          <span className="text-xs font-medium text-pink-600 uppercase tracking-wide">Festejado/a</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{reservation.child.name}</h4>
                        <p className="text-sm text-gray-600">
                          {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Información del evento - Grid interno */}
                <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Cuándo será</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CalendarDaysIcon className="w-4 h-4 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Fecha</p>
                          <p className="font-semibold text-gray-900 text-sm">{formatDate(reservation.eventDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ClockIcon className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Hora</p>
                          <p className="font-semibold text-gray-900 text-sm">{reservation.eventTime}</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Comentarios especiales si existen */}
                {reservation.specialComments && (
                  <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm hover:shadow-md transition-shadow">
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Detalles especiales</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{reservation.specialComments}</p>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Columna 2: Resumen de precios */}
              <div className="space-y-4">
                <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CurrencyDollarIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Resumen</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Paquete */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {reservation.package?.name || 'Paquete'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Hasta {reservation.package?.maxGuests || 'N/A'} invitados
                          </p>
                        </div>
                        <p className="font-bold text-emerald-600 text-sm">
                          {formatPrice(reservation.pricing?.packagePrice || 0)}
                        </p>
                      </div>

                      {/* Comida */}
                      {reservation.foodOption && (
                        <>
                          <Divider className="my-2" />
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-1">
                              <HeartIcon className="w-3 h-3 text-red-500 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{reservation.foodOption.name}</p>
                                <p className="text-xs text-gray-500">Comida</p>
                              </div>
                            </div>
                            <p className="font-bold text-emerald-600 text-sm">
                              {formatPrice(reservation.pricing?.foodPrice || 0)}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Tema */}
                      {reservation.eventTheme && (
                        <>
                          <Divider className="my-2" />
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-1">
                              <SparklesIcon className="w-3 h-3 text-purple-500 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{reservation.eventTheme.name}</p>
                                <p className="text-xs text-gray-500">
                                  {reservation.eventTheme.selectedPackage?.name || 'Tema'}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-emerald-600 text-sm">
                              {formatPrice(reservation.pricing?.themePrice || 0)}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Servicios extra */}
                      {reservation.extraServices && reservation.extraServices.length > 0 && (
                        <>
                          <Divider className="my-2" />
                          {reservation.extraServices.map((service, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center gap-2 flex-1">
                                <PlusIcon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                <p className="text-sm text-gray-700">{service.name}</p>
                              </div>
                              <p className="font-medium text-emerald-600 text-sm">
                                {service.quantity > 1 && `${service.quantity}x `}
                                {formatPrice(service.price)}
                              </p>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Total */}
                      <Divider className="my-3" />
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 border border-yellow-200">
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                            {formatPrice(reservation.pricing?.total || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Sección de servicios detallados - Grid expandido */}
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tu paquete incluye</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Paquete principal */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-sm mb-1">
                          {reservation.package?.name || 'Paquete personalizado'}
                        </h5>
                        <p className="text-xs text-gray-600 mb-2">
                          Perfecto para hasta {reservation.package?.maxGuests || 'N/A'} invitados
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatPrice(reservation.pricing?.packagePrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comida */}
                  {reservation.foodOption && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <HeartIcon className="w-4 h-4 text-red-700" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">{reservation.foodOption.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">Deliciosa comida para todos</p>
                          <p className="text-sm font-bold text-red-600">
                            {formatPrice(reservation.pricing?.foodPrice || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tema */}
                  {reservation.eventTheme && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <SparklesIcon className="w-4 h-4 text-purple-700" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">{reservation.eventTheme.name}</h5>
                          {reservation.eventTheme.selectedPackage && (
                            <p className="text-xs text-gray-600 mb-2">
                              {reservation.eventTheme.selectedPackage.name} - {reservation.eventTheme.selectedPackage.pieces} piezas
                            </p>
                          )}
                          <p className="text-sm font-bold text-purple-600">
                            {formatPrice(reservation.pricing?.themePrice || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Sección de información de pago */}
            <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-shadow mt-6">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Información de pago</span>
                  </div>
                  {!showPaymentSection && reservation.status === 'pending' && (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => setShowPaymentSection(true)}
                      startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                    >
                      Enviar comprobante
                    </Button>
                  )}
                </div>

                {/* Información bancaria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-gray-900 text-sm mb-3">Datos para transferencia</h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Banco:</span>
                        <span className="font-medium text-gray-900">BBVA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cuenta:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">1234567890</span>
                          <button
                            onClick={() => navigator.clipboard.writeText('1234567890')}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Copiar"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">CLABE:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">012345678901234567</span>
                          <button
                            onClick={() => navigator.clipboard.writeText('012345678901234567')}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Copiar"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Titular:</span>
                        <span className="font-medium text-gray-900">Tramboory Eventos</span>
                      </div>
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Referencia:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                              {uniqueReference}
                            </span>
                            <button
                              onClick={() => navigator.clipboard.writeText(uniqueReference)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Copiar referencia"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ⚠️ Incluye esta referencia en tu transferencia
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-gray-900 text-sm mb-3">Monto a pagar</h5>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-2">
                        {formatPrice(reservation.pricing?.total || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">Total de tu reservación</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {formatPrice(reservation.pricing?.total || 0)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText((reservation.pricing?.total || 0).toString())}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Copiar monto"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-700 text-center font-medium">
                        💡 Concepto sugerido:
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-xs text-yellow-800 font-medium">
                          "Fiesta {reservation.child.name} - {uniqueReference}"
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`Fiesta ${reservation.child.name} - ${uniqueReference}`)}
                          className="text-yellow-600 hover:text-yellow-800 text-xs"
                          title="Copiar concepto"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de envío de comprobante */}
                {showPaymentSection && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                      <PhotoIcon className="w-4 h-4 text-blue-600" />
                      Enviar comprobante de pago
                    </h5>
                    
                    <div className="space-y-4">
                      {/* Upload de imagen */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Captura de pantalla del pago *
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="payment-screenshot"
                          />
                          <label
                            htmlFor="payment-screenshot"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <PhotoIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {paymentScreenshot ? paymentScreenshot.name : 'Seleccionar imagen'}
                            </span>
                          </label>
                          {paymentScreenshot && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos: JPG, PNG, GIF. Máximo 5MB
                        </p>
                      </div>

                      {/* Referencia de pago */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referencia de pago (opcional)
                        </label>
                        <Input
                          placeholder="Ej: 123456789"
                          value={paymentReference}
                          onValueChange={setPaymentReference}
                          size="sm"
                          variant="bordered"
                          classNames={{
                            input: "text-sm",
                            inputWrapper: "border-gray-300"
                          }}
                        />
                      </div>

                      {/* Notas adicionales */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas adicionales (opcional)
                        </label>
                        <Textarea
                          placeholder="Cualquier información adicional sobre el pago..."
                          value={paymentNotes}
                          onValueChange={setPaymentNotes}
                          size="sm"
                          variant="bordered"
                          minRows={2}
                          maxRows={4}
                          classNames={{
                            input: "text-sm",
                            inputWrapper: "border-gray-300"
                          }}
                        />
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          color="primary"
                          onPress={handlePaymentSubmit}
                          isLoading={isUploading}
                          isDisabled={!paymentScreenshot}
                          startContent={!isUploading && <DocumentArrowUpIcon className="w-4 h-4" />}
                          size="sm"
                        >
                          {isUploading ? 'Enviando...' : 'Enviar comprobante'}
                        </Button>
                        <Button
                          variant="light"
                          onPress={() => {
                            setShowPaymentSection(false);
                            setPaymentScreenshot(null);
                            setPaymentReference('');
                            setPaymentNotes('');
                          }}
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado del pago */}
                {reservation.status === 'confirmed' && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        ¡Pago confirmado! Tu reservación está asegurada.
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="bordered"
                  startContent={<CalendarIcon className="w-4 h-4" />}
                  className="border-gray-300 hover:border-gray-400"
                >
                  Agregar al calendario
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="google"
                  startContent={<span className="text-sm">📅</span>}
                  onPress={() => {
                    exportToCalendar(reservation!, 'google');
                    toast.success('Evento exportado a Google Calendar');
                  }}
                >
                  Google Calendar
                </DropdownItem>
                <DropdownItem
                  key="outlook"
                  startContent={<span className="text-sm">📧</span>}
                  onPress={() => {
                    exportToCalendar(reservation!, 'outlook');
                    toast.success('Evento exportado a Outlook');
                  }}
                >
                  Outlook
                </DropdownItem>
                <DropdownItem
                  key="yahoo"
                  startContent={<span className="text-sm">🟣</span>}
                  onPress={() => {
                    exportToCalendar(reservation!, 'yahoo');
                    toast.success('Evento exportado a Yahoo Calendar');
                  }}
                >
                  Yahoo Calendar
                </DropdownItem>
                <DropdownItem
                  key="ical"
                  startContent={<span className="text-sm">📋</span>}
                  onPress={() => {
                    exportToCalendar(reservation!, 'ical');
                    toast.success('Archivo iCal descargado');
                  }}
                >
                  Descargar iCal
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            
            <Button
              onPress={onClose}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
              size="lg"
            >
              ¡Perfecto! 🎉
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}