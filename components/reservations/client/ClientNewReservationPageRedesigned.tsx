'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Button,
  TextInput,
  Select,
  Textarea,
  Card,
  Badge,
  Divider,
  Progress,
  Radio,
  Modal,
  Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  CheckIcon,
  CakeIcon,
  CalendarDaysIcon,
  SparklesIcon,
  HeartIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShoppingCartIcon,
  XMarkIcon,
  PlusIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import "../calendar-styles-redesigned.css";

// Register Spanish locale
registerLocale('es', es);

interface FormData {
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
  paymentMethod: 'transfer' | 'cash' | 'card';
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

type Step = 'basic' | 'package' | 'food' | 'extras' | 'payment' | 'confirmation';

export default function ClientNewReservationPageRedesigned() {
  const { user } = useUser();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure();
  
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [formData, setFormData] = useState<FormData>({
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
    specialComments: '',
    paymentMethod: 'transfer'
  });
  
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const steps: { key: Step; title: string; description: string; icon: any }[] = [
    { key: 'basic', title: 'Información Básica', description: 'Datos del festejado', icon: CakeIcon },
    { key: 'package', title: 'Paquete', description: 'Selecciona tu paquete', icon: SparklesIcon },
    { key: 'food', title: 'Comida & Tema', description: 'Personaliza tu evento', icon: HeartIcon },
    { key: 'extras', title: 'Extras', description: 'Servicios adicionales', icon: PlusIcon },
    { key: 'payment', title: 'Pago', description: 'Método de pago', icon: CreditCardIcon },
    { key: 'confirmation', title: 'Confirmación', description: 'Reserva confirmada', icon: CheckIcon }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  useEffect(() => {
    fetchPackages();
    fetchAdditionalOptions();
    fetchAvailability();
  }, []);

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

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic':
        return !!(formData.childName.trim() && formData.childAge && formData.eventDate && formData.eventTime);
      case 'package':
        return !!formData.packageId;
      case 'food':
        return true; // Optional step
      case 'extras':
        return true; // Optional step
      case 'payment':
        return !!formData.paymentMethod;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error('Error: No se pudo obtener tu email');
      return;
    }

    setLoading(true);
    
    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate ? formData.eventDate.toISOString() : '',
        eventTime: formData.eventTime,
        customer: {
          name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
          email: user.primaryEmailAddress.emailAddress,
          phone: user.phoneNumbers?.[0]?.phoneNumber || ''
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
        selectedThemePackage: formData.selectedThemePackage || undefined,
        paymentMethod: formData.paymentMethod
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
        setReservationId(data.data._id);
        setCurrentStep('confirmation');
        toast.success('¡Reservación creada exitosamente!');
      } else {
        console.error('Error response:', data);
        toast.error(data.error || data.message || 'Error al crear la reservación');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reservación');
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

  // Get selected package details
  const selectedPackage = packages.find(pkg => pkg._id === formData.packageId);
  const selectedFood = foodOptions.find(food => food._id === formData.foodOptionId);
  const selectedTheme = eventThemes.find(theme => theme._id === formData.eventThemeId);
  const selectedExtras = extraServices.filter(service => formData.selectedExtraServices.includes(service._id));

  // Calculate total price
  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPackage && formData.eventDate) {
      const isWeekend = formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6;
      total += isWeekend ? selectedPackage.pricing.weekend : selectedPackage.pricing.weekday;
    }
    
    if (selectedFood) {
      total += selectedFood.basePrice;
    }
    
    if (selectedTheme && formData.selectedThemePackage) {
      const themePackage = selectedTheme.packages.find(pkg => pkg.name === formData.selectedThemePackage);
      if (themePackage) {
        total += themePackage.price;
      }
    }
    
    selectedExtras.forEach(extra => {
      total += extra.price;
    });
    
    return total;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const generatePaymentSlip = () => {
    const total = calculateTotal();
    const referenceNumber = `REF-${Date.now()}`;
    
    const paymentSlip = `
FICHA DE PAGO - TRAMBOORY
========================

Reservación ID: ${reservationId || 'PENDIENTE'}
Referencia: ${referenceNumber}
Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}

DATOS DEL EVENTO:
- Festejado/a: ${formData.childName}
- Edad: ${formData.childAge} años
- Fecha: ${formData.eventDate?.toLocaleDateString('es-ES')}
- Hora: ${formData.eventTime}

PAQUETE SELECCIONADO:
- ${selectedPackage?.name || 'N/A'}
- Precio: ${formatPrice(selectedPackage && formData.eventDate ? 
  (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 
    selectedPackage.pricing.weekend : selectedPackage.pricing.weekday) : 0)}

${selectedFood ? `COMIDA:
- ${selectedFood.name}
- Precio: ${formatPrice(selectedFood.basePrice)}
` : ''}

${selectedTheme && formData.selectedThemePackage ? `TEMA:
- ${selectedTheme.name} - ${formData.selectedThemePackage}
- Precio: ${formatPrice(selectedTheme.packages.find(pkg => pkg.name === formData.selectedThemePackage)?.price || 0)}
` : ''}

${selectedExtras.length > 0 ? `SERVICIOS EXTRAS:
${selectedExtras.map(extra => `- ${extra.name}: ${formatPrice(extra.price)}`).join('\n')}
` : ''}

TOTAL A PAGAR: ${formatPrice(total)}

MÉTODO DE PAGO: ${
  formData.paymentMethod === 'transfer' ? 'Transferencia Bancaria' :
  formData.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta de Crédito/Débito'
}

${formData.paymentMethod === 'transfer' ? `
DATOS BANCARIOS:
Banco: Banco Ejemplo
Cuenta: 1234567890
CLABE: 012345678901234567
Titular: Tramboory S.A. de C.V.

IMPORTANTE: Enviar comprobante de pago a:
pagos@tramboory.com
` : ''}

Para cualquier duda, contacta:
📞 Tel: (55) 1234-5678
📧 Email: info@tramboory.com
🌐 Web: www.tramboory.com

¡Gracias por confiar en nosotros para tu celebración especial!
    `;

    // Create and download the payment slip
    const blob = new Blob([paymentSlip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-pago-${referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Ficha de pago descargada exitosamente');
  };

  const removeExtraService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedExtraServices: prev.selectedExtraServices.filter(id => id !== serviceId)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Para quién es la fiesta?</h2>
              <p className="text-gray-600">Empecemos con los datos básicos del festejado</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del niño/a
                </label>
                <TextInput
                  placeholder="Ej: Sofía García"
                  value={formData.childName}
                  onChange={(event) => setFormData(prev => ({ ...prev, childName: event.target.value }))}
                  size="lg"
                  styles={{
                    input: {
                      backgroundColor: '#f9fafb',
                      '&:hover': { backgroundColor: '#f3f4f6' }
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad que cumplirá
                </label>
                <Select
                  placeholder="Selecciona la edad"
                  value={formData.childAge}
                  onChange={(value) => setFormData(prev => ({ ...prev, childAge: value || '' }))}
                  size="lg"
                  data={Array.from({ length: 15 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: `${i + 1} ${i + 1 === 1 ? 'año' : 'años'}`
                  }))}
                  styles={{
                    input: {
                      backgroundColor: '#f9fafb',
                      '&:hover': { backgroundColor: '#f3f4f6' }
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del evento
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.eventDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
                      locale="es"
                      dateFormat="dd 'de' MMMM, yyyy"
                      minDate={new Date()}
                      filterDate={(date) => !isDateDisabled(date)}
                      dayClassName={getDayClassName}
                      placeholderText="Selecciona una fecha"
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      calendarClassName="custom-calendar-redesigned"
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                      <span className="text-gray-600">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                      <span className="text-gray-600">Pocos espacios</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora del evento
                  </label>
                  <Select
                    placeholder="Selecciona la hora"
                    value={formData.eventTime}
                    onChange={(value) => setFormData(prev => ({ ...prev, eventTime: value || '' }))}
                    size="lg"
                    data={timeSlots.map((time) => ({
                      value: time,
                      label: `${time} hrs`
                    }))}
                    styles={{
                      input: {
                        backgroundColor: '#f9fafb',
                        '&:hover': { backgroundColor: '#f3f4f6' }
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios especiales (opcional)
                </label>
                <Textarea
                  placeholder="Alergias, solicitudes especiales, temas preferidos..."
                  value={formData.specialComments}
                  onChange={(event) => setFormData(prev => ({ ...prev, specialComments: event.target.value }))}
                  minRows={3}
                  styles={{
                    input: {
                      backgroundColor: '#f9fafb',
                      '&:hover': { backgroundColor: '#f3f4f6' }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'package':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige tu paquete</h2>
              <p className="text-gray-600">Selecciona el paquete que mejor se adapte a tu celebración</p>
            </div>
            
            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-pink-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg._id}
                    onClick={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.packageId === pkg._id
                        ? 'border-pink-500 bg-pink-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pkg.number ? `Paquete ${pkg.number}` : pkg.name}
                          </h3>
                          {formData.packageId === pkg._id && (
                            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{pkg.description || pkg.name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Hasta {pkg.maxGuests} invitados</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Desde</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${pkg.pricing?.weekday?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">MXN</div>
                      </div>
                    </div>
                    
                    {formData.eventDate && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            Precio para tu fecha ({formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 'fin de semana' : 'entre semana'}):
                          </span>
                          <span className="font-semibold text-green-600">
                            ${(formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 
                              ? pkg.pricing?.weekend 
                              : pkg.pricing?.weekday)?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'food':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personaliza tu evento</h2>
              <p className="text-gray-600">Agrega comida y decoración temática (opcional)</p>
            </div>
            
            {/* Food Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de comida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foodOptions.map((option) => (
                  <div
                    key={option._id}
                    onClick={() => setFormData(prev => ({ ...prev, foodOptionId: prev.foodOptionId === option._id ? '' : option._id }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.foodOptionId === option._id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{option.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge size="sm" variant="light" className="bg-gray-100">
                            {option.category === 'main' ? 'Principal' :
                             option.category === 'appetizer' ? 'Entrada' :
                             option.category === 'dessert' ? 'Postre' : 'Bebida'}
                          </Badge>
                          <span className="text-sm font-semibold text-green-600">
                            +${option.basePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {formData.foodOptionId === option._id && (
                        <CheckIconSolid className="w-5 h-5 text-pink-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Themes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temas de decoración</h3>
              <div className="grid grid-cols-1 gap-4">
                {eventThemes.map((theme) => (
                  <div key={theme._id} className="space-y-3">
                    <div
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        eventThemeId: prev.eventThemeId === theme._id ? '' : theme._id,
                        selectedThemePackage: '' 
                      }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.eventThemeId === theme._id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{theme.name}</h4>
                          {theme.description && (
                            <p className="text-sm text-gray-600">{theme.description}</p>
                          )}
                        </div>
                        {formData.eventThemeId === theme._id && (
                          <CheckIconSolid className="w-5 h-5 text-pink-500" />
                        )}
                      </div>
                    </div>
                    
                    {formData.eventThemeId === theme._id && theme.packages.length > 0 && (
                      <div className="ml-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selecciona un paquete:</p>
                        {theme.packages.map((pkg) => (
                          <div
                            key={pkg.name}
                            onClick={() => setFormData(prev => ({ ...prev, selectedThemePackage: pkg.name }))}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.selectedThemePackage === pkg.name
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{pkg.name}</p>
                                <p className="text-sm text-gray-600">{pkg.pieces} piezas</p>
                              </div>
                              <span className="font-semibold text-green-600">
                                +${pkg.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'extras':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Servicios adicionales</h2>
              <p className="text-gray-600">Haz tu evento aún más especial</p>
            </div>
            
            <div className="space-y-6">
              {Object.entries(
                extraServices.reduce((acc, service) => {
                  if (!acc[service.category]) acc[service.category] = [];
                  acc[service.category].push(service);
                  return acc;
                }, {} as Record<string, ExtraService[]>)
              ).map(([category, services]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <div
                        key={service._id}
                        onClick={() => {
                          const isSelected = formData.selectedExtraServices.includes(service._id);
                          if (isSelected) {
                            setFormData(prev => ({
                              ...prev,
                              selectedExtraServices: prev.selectedExtraServices.filter(id => id !== service._id)
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              selectedExtraServices: [...prev.selectedExtraServices, service._id]
                            }));
                          }
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.selectedExtraServices.includes(service._id)
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            <span className="text-sm font-semibold text-green-600">
                              +${service.price.toLocaleString()}
                            </span>
                          </div>
                          {formData.selectedExtraServices.includes(service._id) && (
                            <CheckIconSolid className="w-5 h-5 text-pink-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo prefieres pagar?</h2>
              <p className="text-gray-600">Selecciona tu método de pago preferido</p>
            </div>

            <Radio.Group
              value={formData.paymentMethod}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'transfer' | 'cash' | 'card' }))}
            >
              <div className="space-y-3">
                <div className="p-4 rounded-xl border-2 hover:border-pink-300" style={{
                  borderColor: formData.paymentMethod === 'transfer' ? '#ec4899' : '#d1d5db',
                  backgroundColor: formData.paymentMethod === 'transfer' ? '#fdf2f8' : 'white'
                }}>
                <Radio
                  value="transfer"
                  label={
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <BanknotesIcon className="w-6 h-6 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">Transferencia bancaria</p>
                          <p className="text-sm text-gray-600">Recibirás los datos bancarios por correo</p>
                        </div>
                      </div>
                    </div>
                  }
                />
                </div>
                
                <div className="p-4 rounded-xl border-2 hover:border-pink-300" style={{
                  borderColor: formData.paymentMethod === 'cash' ? '#ec4899' : '#d1d5db',
                  backgroundColor: formData.paymentMethod === 'cash' ? '#fdf2f8' : 'white'
                }}>
                <Radio
                  value="cash"
                  label={
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <BanknotesIcon className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">Efectivo</p>
                          <p className="text-sm text-gray-600">Paga el día de tu evento</p>
                        </div>
                      </div>
                    </div>
                  }
                />
                </div>
                
                <div className="p-4 rounded-xl border-2 hover:border-pink-300" style={{
                  borderColor: formData.paymentMethod === 'card' ? '#ec4899' : '#d1d5db',
                  backgroundColor: formData.paymentMethod === 'card' ? '#fdf2f8' : 'white'
                }}>
                <Radio
                  value="card"
                  label={
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="w-6 h-6 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900">Tarjeta de crédito o débito</p>
                          <p className="text-sm text-gray-600">Paga con tarjeta el día del evento</p>
                        </div>
                      </div>
                    </div>
                  }
                />
                </div>
              </div>
            </Radio.Group>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Listo!</h2>
              <p className="text-gray-600">Tu reserva ha sido confirmada</p>
            </div>

            <Card style={{ border: 'none', backgroundColor: '#f9fafb' }} padding="xl">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-1">Número de reserva</p>
                  <p className="text-2xl font-mono font-bold text-gray-900">{reservationId}</p>
                </div>
                
                <Divider className="my-4" />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Festejado/a</span>
                    <span className="font-medium">{formData.childName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha</span>
                    <span className="font-medium">{formData.eventDate?.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora</span>
                    <span className="font-medium">{formData.eventTime} hrs</span>
                  </div>
                </div>
            </Card>

            <div className="space-y-3">
              <Button
                color="blue"
                size="lg"
                leftSection={<DocumentTextIcon className="w-5 h-5" />}
                onClick={generatePaymentSlip}
                style={{ width: '100%' }}
              >
                Descargar ficha de pago
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/reservaciones')}
                style={{ width: '100%' }}
              >
                Ver mis reservas
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Te hemos enviado un correo con todos los detalles</p>
              <p className="mt-2">¿Necesitas ayuda? Llámanos al (55) 1234-5678</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/reservaciones')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-between">
                  {steps.map((step, index) => {
                    const isActive = currentStep === step.key;
                    const isCompleted = currentStepIndex > index;
                    
                    return (
                      <div
                        key={step.key}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          isCompleted
                            ? 'bg-pink-500 text-white'
                            : isActive
                            ? 'bg-pink-500 text-white ring-4 ring-pink-100'
                            : 'bg-white border-2 border-gray-300 text-gray-500'
                        }`}
                      >
                        {isCompleted ? <CheckIcon className="w-4 h-4" /> : index + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Paso {currentStepIndex + 1} de {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card style={{ border: 'none' }} padding="xl">
                {renderStepContent()}
            </Card>

            {/* Navigation */}
            {currentStep !== 'confirmation' && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  leftSection={<ArrowLeftIcon className="w-5 h-5" />}
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  style={{ minWidth: '8rem' }}
                >
                  Atrás
                </Button>

                {currentStep === 'payment' ? (
                  <Button
                    color="blue"
                    size="lg"
                    onClick={handleSubmit}
                    loading={loading}
                    style={{ minWidth: '10rem' }}
                  >
                    {loading ? 'Confirmando...' : 'Confirmar reserva'}
                  </Button>
                ) : (
                  <Button
                    color="blue"
                    size="lg"
                    rightSection={<ArrowRightIcon className="w-5 h-5" />}
                    onClick={handleNext}
                    disabled={!validateCurrentStep()}
                    style={{ minWidth: '8rem' }}
                  >
                    Continuar
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card style={{ border: 'none' }} padding="xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>
                  
                  <div className="space-y-4">
                    {/* Basic Info */}
                    {formData.childName && (
                      <div>
                        <p className="text-sm text-gray-600">Festejado/a</p>
                        <p className="font-medium text-gray-900">
                          {formData.childName} {formData.childAge && `(${formData.childAge} años)`}
                        </p>
                      </div>
                    )}
                    
                    {formData.eventDate && (
                      <div>
                        <p className="text-sm text-gray-600">Fecha y hora</p>
                        <p className="font-medium text-gray-900">
                          {formData.eventDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric',
                            month: 'long'
                          })}
                          {formData.eventTime && ` a las ${formData.eventTime}`}
                        </p>
                      </div>
                    )}
                    
                    {/* Package */}
                    {selectedPackage && (
                      <div>
                        <p className="text-sm text-gray-600">Paquete</p>
                        <p className="font-medium text-gray-900">{selectedPackage.name}</p>
                        <p className="text-sm text-green-600">
                          {formatPrice(formData.eventDate ? 
                            (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 
                              selectedPackage.pricing.weekend : selectedPackage.pricing.weekday) : 0)}
                        </p>
                      </div>
                    )}
                    
                    {/* Food */}
                    {selectedFood && (
                      <div>
                        <p className="text-sm text-gray-600">Comida</p>
                        <p className="font-medium text-gray-900">{selectedFood.name}</p>
                        <p className="text-sm text-green-600">+{formatPrice(selectedFood.basePrice)}</p>
                      </div>
                    )}
                    
                    {/* Theme */}
                    {selectedTheme && formData.selectedThemePackage && (
                      <div>
                        <p className="text-sm text-gray-600">Decoración</p>
                        <p className="font-medium text-gray-900">
                          {selectedTheme.name} - {formData.selectedThemePackage}
                        </p>
                        <p className="text-sm text-green-600">
                          +{formatPrice(selectedTheme.packages.find(pkg => pkg.name === formData.selectedThemePackage)?.price || 0)}
                        </p>
                      </div>
                    )}
                    
                    {/* Extras */}
                    {selectedExtras.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Servicios extras</p>
                        <div className="space-y-1">
                          {selectedExtras.map((extra) => (
                            <div key={extra._id} className="flex justify-between text-sm">
                              <span className="text-gray-700">{extra.name}</span>
                              <span className="text-green-600">+{formatPrice(extra.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Total */}
                  {(selectedPackage || selectedFood || selectedExtras.length > 0) && (
                    <>
                      <Divider className="my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(calculateTotal())}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">*Precio en pesos mexicanos (MXN)</p>
                    </>
                  )}
              </Card>

              {/* Help Card */}
              <Card style={{ border: 'none', marginTop: '1rem' }} padding="lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">¿Necesitas ayuda?</p>
                  <p className="text-sm text-gray-600">
                    Llámanos al <a href="tel:5512345678" className="text-pink-600 font-medium">(55) 1234-5678</a>
                  </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}