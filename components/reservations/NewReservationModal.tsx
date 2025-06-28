'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  DateInput,
  Textarea
} from '@heroui/react';
import {
  CheckIcon
} from '@heroicons/react/24/outline';
import { CalendarDate } from '@internationalized/date';
import toast from 'react-hot-toast';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  childName: string;
  childAge: string;
  eventDate: CalendarDate | null;
  eventTime: string;
  packageId: string;
  specialComments: string;
}

const timeSlots = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

interface PackageOption {
  _id: string;
  name: string;
  number?: string;
  description?: string;
  maxGuests: number;
  pricing: {
    weekday: number;
    weekend: number;
    holiday: number;
  };
  isActive: boolean;
}


export default function NewReservationModal({
  isOpen,
  onClose,
  onSuccess
}: NewReservationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    childName: '',
    childAge: '',
    eventDate: null,
    eventTime: '',
    packageId: '',
    specialComments: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      childName: '',
      childAge: '',
      eventDate: null,
      eventTime: '',
      packageId: '',
      specialComments: ''
    });
    setStep(1);
  };

  // Cargar paquetes disponibles
  React.useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/admin/packages');
        const data = await response.json();
        if (data.success) {
          const activePackages = data.data.filter((pkg: PackageOption) => pkg.isActive);
          setPackages(activePackages);
        } else {
          toast.error('Error al cargar los paquetes');
        }
      } catch (error) {
        console.error('Error loading packages:', error);
        toast.error('Error al cargar los paquetes');
      } finally {
        setLoadingPackages(false);
      }
    };

    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const validateStep1 = () => {
    return formData.customerName.trim() && formData.customerEmail.trim() && formData.customerPhone.trim();
  };

  const validateStep2 = () => {
    return formData.childName.trim() && formData.childAge;
  };

  const validateStep3 = () => {
    return formData.eventDate && formData.eventTime && formData.packageId;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate ? new Date(
          formData.eventDate.year,
          formData.eventDate.month - 1,
          formData.eventDate.day
        ).toISOString() : '',
        eventTime: formData.eventTime,
        customer: {
          name: formData.customerName.trim(),
          email: formData.customerEmail.trim(),
          phone: formData.customerPhone.trim()
        },
        child: {
          name: formData.childName.trim(),
          age: parseInt(formData.childAge)
        },
        specialComments: formData.specialComments.trim() || undefined,
        foodOptionId: undefined,
        foodExtras: [],
        extraServices: [],
        eventThemeId: undefined,
        selectedThemePackage: undefined,
        selectedTheme: undefined
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('¡Reserva creada exitosamente!');
        onSuccess();
        handleClose();
      } else {
        console.error('Error response:', data);
        toast.error(data.error || data.message || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!loading}
      backdrop="opaque"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200",
        wrapper: "z-[1001] items-center justify-center p-4",
        header: "border-b border-gray-100",
        body: "p-6",
        footer: "border-t border-gray-100 bg-gray-50/50"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-medium text-gray-900">Nueva reserva</h3>
            <div className="text-sm text-gray-500">Paso {step} de 3</div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${step >= stepNumber
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {step > stepNumber ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`
                        w-12 h-0.5 mx-2
                        ${step > stepNumber ? 'bg-gray-900' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Información del cliente</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <Input
                      placeholder="Ej: María González López"
                      value={formData.customerName}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico *
                    </label>
                    <Input
                      placeholder="maria@ejemplo.com"
                      type="email"
                      value={formData.customerEmail}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerEmail: value }))}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <Input
                      placeholder="55 1234 5678"
                      value={formData.customerPhone}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Información del festejado</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del niño/a *
                    </label>
                    <Input
                      placeholder="Ej: Sofía"
                      value={formData.childName}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, childName: value }))}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad del festejado/a *
                    </label>
                    <Select
                      placeholder="Selecciona la edad"
                      selectedKeys={formData.childAge ? [formData.childAge] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, childAge: selected }));
                      }}
                      variant="flat"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900"
                      }}
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((age) => (
                        <SelectItem key={age.toString()}>
                          {age} {age === 1 ? 'año' : 'años'}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Detalles del evento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha del evento *
                      </label>
                      <DateInput
                        value={formData.eventDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
                        variant="flat"
                        minValue={new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())}
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora del evento *
                      </label>
                      <Select
                        placeholder="Selecciona la hora"
                        selectedKeys={formData.eventTime ? [formData.eventTime] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          setFormData(prev => ({ ...prev, eventTime: selected }));
                        }}
                        variant="flat"
                        classNames={{
                          trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                          value: "text-gray-900"
                        }}
                      >
                        {timeSlots.map((time) => (
                          <SelectItem key={time}>{time}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paquete de celebración *
                    </label>
                    <Select
                      placeholder={loadingPackages ? "Cargando paquetes..." : "Selecciona un paquete"}
                      selectedKeys={formData.packageId ? [formData.packageId] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, packageId: selected }));
                      }}
                      variant="flat"
                      isDisabled={loadingPackages}
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900"
                      }}
                    >
                      {packages.map((pkg) => (
                        <SelectItem key={pkg._id} textValue={`${pkg.number || ''} - ${pkg.name}`}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-gray-900">{pkg.number ? `${pkg.number} - ` : ''}{pkg.name}</span>
                            <span className="text-sm text-gray-600">
                              Entre semana: ${pkg.pricing?.weekday?.toLocaleString() || '0'} | Fin de semana: ${pkg.pricing?.weekend?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios especiales
                    </label>
                    <Textarea
                      placeholder="Solicitudes especiales, alergias, decoración específica, etc. (opcional)"
                      value={formData.specialComments}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, specialComments: value }))}
                      minRows={2}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="px-6 py-3">
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="light"
                  onPress={() => setStep(step - 1)}
                  isDisabled={loading}
                  size="sm"
                  className="text-gray-600"
                >
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="light"
                onPress={handleClose}
                isDisabled={loading}
                size="sm"
                className="text-gray-600"
              >
                Cancelar
              </Button>
              
              {step < 3 ? (
                <Button
                  onPress={() => {
                    if (step === 1 && !validateStep1()) {
                      toast.error('Completa todos los campos del cliente');
                      return;
                    }
                    if (step === 2 && !validateStep2()) {
                      toast.error('Completa la información del festejado/a');
                      return;
                    }
                    setStep(step + 1);
                  }}
                  size="sm"
                  className="bg-gray-900 text-white"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit}
                  isLoading={loading}
                  size="sm"
                  className="bg-gray-900 text-white"
                >
                  {loading ? 'Creando...' : 'Crear reserva'}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}