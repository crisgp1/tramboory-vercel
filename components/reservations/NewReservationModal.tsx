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
  Textarea
} from '@heroui/react';
import {
  CheckIcon
} from '@heroicons/react/24/outline';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import "./calendar-styles.css";

// Register Spanish locale
registerLocale('es', es);

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
  eventDate: Date | null;
  eventTime: string;
  packageId: string;
  foodOptionId: string;
  selectedFoodExtras: string[];
  eventThemeId: string;
  selectedThemePackage: string;
  selectedExtraServices: string[];
  specialComments: string;
}

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  remainingCapacity: number;
  totalCapacity: number;
}

interface TimeBlock {
  blockName: string;
  startTime: string;
  endTime: string;
  duration: number;
  halfHourBreak: boolean;
  slots: TimeSlot[];
}

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

interface FoodOption {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  extras: {
    name: string;
    price: number;
    isRequired: boolean;
  }[];
  isActive: boolean;
}

interface EventTheme {
  _id: string;
  name: string;
  description?: string;
  packages: {
    name: string;
    pieces: number;
    price: number;
  }[];
  themes: string[];
  isActive: boolean;
}

interface ExtraService {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
}

interface AvailabilityData {
  [key: string]: 'available' | 'limited' | 'unavailable';
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
    foodOptionId: '',
    selectedFoodExtras: [],
    eventThemeId: '',
    selectedThemePackage: '',
    selectedExtraServices: [],
    specialComments: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [availableBlocks, setAvailableBlocks] = useState<TimeBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [restDayInfo, setRestDayInfo] = useState<any>(null);

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
      foodOptionId: '',
      selectedFoodExtras: [],
      eventThemeId: '',
      selectedThemePackage: '',
      selectedExtraServices: [],
      specialComments: ''
    });
    setStep(1);
  };

  // Cargar paquetes disponibles
  React.useEffect(() => {
    const fetchPackages = async () => {
      try {
        // First try the PackageConfig endpoint (which should be the correct one)
        let response = await fetch('/api/admin/packages');
        let data = await response.json();
        
        // If that fails, the packages might be stored in a different collection
        // Let's check if we need to create a proper endpoint
        if (!data.success) {
          console.warn('PackageConfig endpoint not found, packages might need to be migrated');
          toast.error('Error al cargar los paquetes - contacta al administrador');
          return;
        }
        
        const activePackages = data.data.filter((pkg: PackageOption) => pkg.isActive);
        setPackages(activePackages);
      } catch (error) {
        console.error('Error loading packages:', error);
        toast.error('Error al cargar los paquetes');
      } finally {
        setLoadingPackages(false);
      }
    };

    const fetchAdditionalOptions = async () => {
      try {
        setLoadingOptions(true);
        
        // Fetch food options
        const foodResponse = await fetch('/api/admin/food-options');
        const foodData = await foodResponse.json();
        if (foodData.success) {
          setFoodOptions(foodData.data.filter((option: FoodOption) => option.isActive));
        }

        // Fetch event themes
        const themeResponse = await fetch('/api/admin/event-themes');
        const themeData = await themeResponse.json();
        if (themeData.success) {
          setEventThemes(themeData.data.filter((theme: EventTheme) => theme.isActive));
        }

        // Fetch extra services
        const extraResponse = await fetch('/api/admin/extra-services');
        const extraData = await extraResponse.json();
        if (extraData.success) {
          setExtraServices(extraData.data.filter((service: ExtraService) => service.isActive));
        }
      } catch (error) {
        console.error('Error loading additional options:', error);
        toast.error('Error al cargar las opciones adicionales');
      } finally {
        setLoadingOptions(false);
      }
    };

    const fetchAvailability = async () => {
      // Mock availability data - in real app, this would come from API
      const mockAvailability: AvailabilityData = {};
      const today = new Date();
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        
        // Mock logic: weekends are limited, some random dates unavailable
        if (date.getDay() === 0 || date.getDay() === 6) {
          mockAvailability[dateKey] = Math.random() > 0.3 ? 'limited' : 'unavailable';
        } else {
          mockAvailability[dateKey] = Math.random() > 0.1 ? 'available' : 'unavailable';
        }
      }
      
      setAvailability(mockAvailability);
    };

    if (isOpen) {
      fetchPackages();
      fetchAdditionalOptions();
      fetchAvailability();
    }
  }, [isOpen]);

  const fetchAvailableBlocks = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reservations/available-blocks?date=${dateStr}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableBlocks(data.data.blocks || []);
        setRestDayInfo(data.data.restDayInfo);
        
        // Clear time selection if date changes
        setFormData(prev => ({ ...prev, eventTime: '' }));
        setSelectedBlock('');
        
        // If it's a rest day that can't be released, show warning
        if (data.data.isRestDay && data.data.restDayInfo && !data.data.restDayInfo.canBeReleased) {
          toast.error('Este día no está disponible para reservas');
        } else if (data.data.isRestDay && data.data.restDayInfo) {
          toast(`Día de descanso: se aplicará un cargo adicional de ${formatCurrency(data.data.restDayInfo.fee)}`, {
            icon: '⚠️',
            duration: 4000
          });
        }
      } else {
        // If there's an error, set empty blocks so fallback will work
        console.error('API error:', data.error);
        setAvailableBlocks([]);
        setRestDayInfo(null);
      }
    } catch (error) {
      console.error('Error fetching available blocks:', error);
      // If there's an error, set empty blocks so fallback will work
      setAvailableBlocks([]);
      setRestDayInfo(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Effect para cargar bloques cuando cambia la fecha
  React.useEffect(() => {
    if (formData.eventDate) {
      fetchAvailableBlocks(formData.eventDate);
    }
  }, [formData.eventDate]);

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

  const validateStep4 = () => {
    // Food option is required, theme and extras are optional
    return formData.foodOptionId;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate ? formData.eventDate.toISOString() : '',
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
        foodOptionId: formData.foodOptionId || undefined,
        foodExtras: formData.selectedFoodExtras,
        extraServices: formData.selectedExtraServices,
        eventThemeId: formData.eventThemeId || undefined,
        selectedThemePackage: formData.selectedThemePackage || undefined
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

  // Custom day class names for availability
  const getDayClassName = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayAvailability = availability[dateKey];
    
    const baseClasses = "react-datepicker__day";
    
    switch (dayAvailability) {
      case 'unavailable':
        return `${baseClasses} react-datepicker__day--unavailable`;
      case 'limited':
        return `${baseClasses} react-datepicker__day--limited`;
      case 'available':
        return `${baseClasses} react-datepicker__day--available`;
      default:
        return baseClasses;
    }
  };

  // Filter out past dates and unavailable dates
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    
    const dateKey = date.toISOString().split('T')[0];
    return availability[dateKey] === 'unavailable';
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
            <div className="text-sm text-gray-500">Paso {step} de 4</div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((stepNumber) => (
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
                    {stepNumber < 4 && (
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
                      aria-label="Nombre completo del cliente"
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
                      aria-label="Correo electrónico del cliente"
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
                      aria-label="Teléfono del cliente"
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
                      aria-label="Nombre del niño o niña festejado"
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
                      aria-label="Edad del festejado"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
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
                      <div className="relative">
                        <DatePicker
                          selected={formData.eventDate}
                          onChange={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
                          locale="es"
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          filterDate={(date) => !isDateDisabled(date)}
                          dayClassName={getDayClassName}
                          placeholderText="Selecciona una fecha"
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-gray-900 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:outline-none"
                          calendarClassName="custom-calendar"
                          aria-label="Fecha del evento"
                          popperPlacement="bottom-start"
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Limitado</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>No disponible</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora del evento *
                      </label>
                      {!formData.eventDate ? (
                        <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Primero selecciona una fecha</p>
                        </div>
                      ) : availableBlocks.length === 0 ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg text-center">
                            <p className="text-sm text-yellow-800">No hay bloques configurados. Usando horarios por defecto.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                              <Button
                                key={time}
                                size="sm"
                                variant={formData.eventTime === time ? "solid" : "bordered"}
                                color={formData.eventTime === time ? "primary" : "default"}
                                onPress={() => {
                                  setFormData(prev => ({ ...prev, eventTime: time }));
                                }}
                                className={formData.eventTime === time ? 'bg-gray-900 text-white' : 'border-gray-300 hover:bg-gray-50'}
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableBlocks.map((block) => (
                            <div key={block.blockName} className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-medium text-gray-900 mb-1">{block.blockName}</h5>
                              <p className="text-xs text-gray-600 mb-2">
                                {block.startTime} - {block.endTime} (Duración: {block.duration} horas{block.halfHourBreak ? ' + 30 min despedida' : ''})
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {block.slots.map((slot) => (
                                  <Button
                                    key={slot.time}
                                    size="sm"
                                    isDisabled={!slot.available}
                                    variant={formData.eventTime === slot.time ? "solid" : "bordered"}
                                    color={formData.eventTime === slot.time ? "primary" : "default"}
                                    onPress={() => {
                                      setFormData(prev => ({ ...prev, eventTime: slot.time }));
                                      setSelectedBlock(block.blockName);
                                    }}
                                    className={`${
                                      slot.available 
                                        ? formData.eventTime === slot.time 
                                          ? 'bg-gray-900 text-white' 
                                          : 'border-gray-300 hover:bg-gray-50'
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="text-center">
                                      <p className="text-xs font-medium">{slot.time}</p>
                                      {slot.available && (
                                        <p className="text-xs opacity-80">
                                          {slot.remainingCapacity} disponible{slot.remainingCapacity !== 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {restDayInfo && (
                            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-xs text-orange-800">
                                <strong>Nota:</strong> Este es un día de descanso ({restDayInfo.name}). 
                                Se aplicará un cargo adicional de {formatCurrency(restDayInfo.fee)}.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
                      aria-label="Paquete de celebración"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
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
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h4 className="text-sm font-medium text-gray-900">Opciones adicionales</h4>
                  
                  {/* Food Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opción de alimento *
                    </label>
                    <Select
                      placeholder={loadingOptions ? "Cargando opciones..." : "Selecciona una opción de alimento"}
                      selectedKeys={formData.foodOptionId ? [formData.foodOptionId] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, foodOptionId: selected, selectedFoodExtras: [] }));
                      }}
                      variant="flat"
                      isDisabled={loadingOptions}
                      aria-label="Opción de alimento"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {foodOptions.map((option) => (
                        <SelectItem key={option._id} textValue={option.name}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-gray-900">{option.name}</span>
                            <span className="text-sm text-gray-600">{option.description}</span>
                            <span className="text-sm text-gray-800 font-medium">${option.basePrice.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Food Extras */}
                  {formData.foodOptionId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extras de alimento
                      </label>
                      <div className="space-y-2">
                        {foodOptions
                          .find(option => option._id === formData.foodOptionId)
                          ?.extras.map((extra, index) => (
                            <label key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={formData.selectedFoodExtras.includes(`${extra.name}-${extra.price}`)}
                                onChange={(e) => {
                                  const extraKey = `${extra.name}-${extra.price}`;
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedFoodExtras: [...prev.selectedFoodExtras, extraKey]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedFoodExtras: prev.selectedFoodExtras.filter(item => item !== extraKey)
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900">
                                    {extra.name} {extra.isRequired && <span className="text-red-500">*</span>}
                                  </span>
                                  <span className="text-sm text-gray-600">+${extra.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Event Themes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema del evento
                    </label>
                    <Select
                      placeholder={loadingOptions ? "Cargando temas..." : "Selecciona un tema (opcional)"}
                      selectedKeys={formData.eventThemeId ? [formData.eventThemeId] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, eventThemeId: selected, selectedThemePackage: '' }));
                      }}
                      variant="flat"
                      isDisabled={loadingOptions}
                      aria-label="Tema del evento"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {eventThemes.map((theme) => (
                        <SelectItem key={theme._id} textValue={theme.name}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-gray-900">{theme.name}</span>
                            {theme.description && (
                              <span className="text-sm text-gray-600">{theme.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Theme Packages */}
                  {formData.eventThemeId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paquete del tema
                      </label>
                      <Select
                        placeholder="Selecciona un paquete del tema"
                        selectedKeys={formData.selectedThemePackage ? [formData.selectedThemePackage] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          setFormData(prev => ({ ...prev, selectedThemePackage: selected }));
                        }}
                        variant="flat"
                        aria-label="Paquete del tema"
                        classNames={{
                          trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                          value: "text-gray-900",
                          listboxWrapper: "bg-white",
                          popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                        }}
                      >
                        {(eventThemes
                          .find(theme => theme._id === formData.eventThemeId)
                          ?.packages || []).map((pkg, index) => (
                            <SelectItem key={`${pkg.name}-${pkg.price}`} textValue={pkg.name}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-gray-900">{pkg.name}</span>
                                <span className="text-sm text-gray-600">{pkg.pieces} piezas - ${pkg.price.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </Select>
                    </div>
                  )}

                  {/* Extra Services */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servicios extra
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {extraServices.map((service) => (
                        <label key={service._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={formData.selectedExtraServices.includes(service._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedExtraServices: [...prev.selectedExtraServices, service._id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedExtraServices: prev.selectedExtraServices.filter(id => id !== service._id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                                <p className="text-xs text-gray-600">{service.description}</p>
                              </div>
                              <span className="text-sm text-gray-600">+${service.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Comments */}
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
                      aria-label="Comentarios especiales"
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
              
              {step < 4 ? (
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
                    if (step === 3 && !validateStep3()) {
                      toast.error('Completa los detalles del evento');
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