'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminQuickNav from '@/components/navigation/AdminQuickNav';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Chip,
  Divider,
  Progress,
  RadioGroup,
  Radio,
  Avatar,
  Skeleton
} from '@heroui/react';
import {
  CheckIcon,
  CakeIcon,
  CalendarDaysIcon,
  SparklesIcon,
  HeartIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import "../calendar-styles-animated.css";

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

interface TimeSlot {
  time: string;
  available: boolean;
  remainingCapacity: number;
  totalCapacity: number;
}

interface AvailableSlots {
  date: string;
  isRestDay: boolean;
  restDayFee: number;
  businessHours: {
    start: string;
    end: string;
  };
  defaultEventDuration: number;
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

type Step = 'basic' | 'package' | 'food' | 'extras' | 'payment' | 'confirmation';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const slideIn = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export default function ClientNewReservationPageAnimated() {
  const { user } = useUser();
  const router = useRouter();
  
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
  const [availableSlots, setAvailableSlots] = useState<AvailableSlots | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const steps: { key: Step; title: string; description: string; icon: any }[] = [
    { key: 'basic', title: 'Información', description: 'Datos básicos', icon: CakeIcon },
    { key: 'package', title: 'Paquete', description: 'Elige tu plan', icon: SparklesIcon },
    { key: 'food', title: 'Personaliza', description: 'Comida y tema', icon: HeartIcon },
    { key: 'extras', title: 'Extras', description: 'Servicios adicionales', icon: PlusIcon },
    { key: 'payment', title: 'Pago', description: 'Método de pago', icon: CreditCardIcon },
    { key: 'confirmation', title: 'Listo', description: 'Confirmación', icon: CheckIcon }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  useEffect(() => {
    fetchPackages();
    fetchAdditionalOptions();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (formData.eventDate) {
      fetchTimeSlots(formData.eventDate);
    }
  }, [formData.eventDate]);

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

  const fetchTimeSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reservations/available-slots?date=${dateStr}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.data);
        
        // Reset time selection if previously selected time is not available
        if (formData.eventTime && !data.data.slots.find((slot: TimeSlot) => 
          slot.time === formData.eventTime && slot.available
        )) {
          setFormData(prev => ({ ...prev, eventTime: '' }));
          toast.error('El horario seleccionado ya no está disponible');
        }
      } else {
        toast.error('Error al cargar horarios disponibles');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Error al cargar horarios disponibles');
    } finally {
      setLoadingSlots(false);
    }
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
    
    // Add rest day fee if applicable
    if (availableSlots?.isRestDay) {
      total += availableSlots.restDayFee;
    }
    
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

${availableSlots?.isRestDay ? `CARGO POR DÍA DE DESCANSO: ${formatPrice(availableSlots.restDayFee)}` : ''}

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <motion.div 
            key="basic"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">¿Para quién es la fiesta?</h2>
              <p className="text-gray-600">Empecemos con los datos básicos del festejado</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del niño/a
                </label>
                <Input
                  placeholder="Ej: Sofía García"
                  value={formData.childName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, childName: value }))}
                  variant="flat"
                  size="lg"
                  classNames={{
                    input: "text-gray-900",
                    inputWrapper: "bg-gray-50 hover:bg-gray-100"
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad que cumplirá
                </label>
                <Select
                  placeholder="Selecciona la edad"
                  selectedKeys={formData.childAge ? [formData.childAge] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData(prev => ({ ...prev, childAge: selected }));
                  }}
                  variant="flat"
                  size="lg"
                  classNames={{
                    trigger: "bg-gray-50 hover:bg-gray-100",
                    value: "text-gray-900"
                  }}
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((age) => (
                    <SelectItem key={age.toString()} value={age.toString()}>
                      {age} {age === 1 ? 'año' : 'años'}
                    </SelectItem>
                  ))}
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
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
                    calendarClassName="custom-calendar-animated"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                    <span className="text-gray-600">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                    <span className="text-gray-600">Pocos espacios</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora del evento
                </label>
                {loadingSlots ? (
                  <Skeleton className="w-full h-12 rounded-xl" />
                ) : availableSlots ? (
                  <div className="space-y-2">
                    <Select
                      placeholder="Selecciona la hora"
                      selectedKeys={formData.eventTime ? [formData.eventTime] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, eventTime: selected }));
                      }}
                      variant="flat"
                      size="lg"
                      classNames={{
                        trigger: "bg-gray-50 hover:bg-gray-100",
                        value: "text-gray-900"
                      }}
                    >
                      {availableSlots.slots.map((slot) => (
                        <SelectItem 
                          key={slot.time} 
                          value={slot.time}
                          isDisabled={!slot.available}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{slot.time} hrs</span>
                            {!slot.available ? (
                              <Chip size="sm" color="danger" variant="flat">Lleno</Chip>
                            ) : slot.remainingCapacity <= 2 ? (
                              <Chip size="sm" color="warning" variant="flat">
                                {slot.remainingCapacity} lugares
                              </Chip>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                    {availableSlots.isRestDay && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-700">
                          Este día tiene un cargo adicional de {formatPrice(availableSlots.restDayFee)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : formData.eventDate ? (
                  <div className="text-sm text-gray-500">Selecciona una fecha primero</div>
                ) : null}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios especiales (opcional)
                </label>
                <Textarea
                  placeholder="Alergias, solicitudes especiales, temas preferidos..."
                  value={formData.specialComments}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, specialComments: value }))}
                  minRows={3}
                  variant="flat"
                  classNames={{
                    input: "text-gray-900",
                    inputWrapper: "bg-gray-50 hover:bg-gray-100"
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        );

      case 'package':
        return (
          <motion.div 
            key="package"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Elige tu paquete</h2>
              <p className="text-gray-600">Selecciona el paquete que mejor se adapte a tu celebración</p>
            </div>
            
            {loadingPackages ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.packageId === pkg._id
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pkg.number ? `Paquete ${pkg.number}` : pkg.name}
                          </h3>
                          <AnimatePresence>
                            {formData.packageId === pkg._id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
                              >
                                <CheckIcon className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                        <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          ${pkg.pricing?.weekday?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">MXN</div>
                      </div>
                    </div>
                    
                    {formData.eventDate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            Precio para tu fecha:
                          </span>
                          <span className="font-semibold text-green-600">
                            ${(formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 
                              ? pkg.pricing?.weekend 
                              : pkg.pricing?.weekday)?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 'food':
        return (
          <motion.div 
            key="food"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Personaliza tu evento</h2>
              <p className="text-gray-600">Agrega comida y decoración temática (opcional)</p>
            </div>
            
            {/* Food Options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de comida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foodOptions.map((option, index) => (
                  <motion.div
                    key={option._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, foodOptionId: prev.foodOptionId === option._id ? '' : option._id }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.foodOptionId === option._id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{option.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" className="bg-gray-100">
                            {option.category === 'main' ? 'Principal' : 
                             option.category === 'appetizer' ? 'Entrada' :
                             option.category === 'dessert' ? 'Postre' : 'Bebida'}
                          </Chip>
                          <span className="text-sm font-semibold text-green-600">
                            +${option.basePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <AnimatePresence>
                        {formData.foodOptionId === option._id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <CheckIconSolid className="w-5 h-5 text-pink-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Event Themes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temas de decoración</h3>
              <div className="space-y-4">
                {eventThemes.map((theme, index) => (
                  <motion.div 
                    key={theme._id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        eventThemeId: prev.eventThemeId === theme._id ? '' : theme._id,
                        selectedThemePackage: '' 
                      }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.eventThemeId === theme._id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{theme.name}</h4>
                          {theme.description && (
                            <p className="text-sm text-gray-600">{theme.description}</p>
                          )}
                        </div>
                        <AnimatePresence>
                          {formData.eventThemeId === theme._id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <CheckIconSolid className="w-5 h-5 text-pink-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                    
                    <AnimatePresence>
                      {formData.eventThemeId === theme._id && theme.packages.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-4 space-y-2 overflow-hidden"
                        >
                          <p className="text-sm font-medium text-gray-700">Selecciona un paquete:</p>
                          {theme.packages.map((pkg) => (
                            <motion.div
                              key={pkg.name}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData(prev => ({ ...prev, selectedThemePackage: pkg.name }))}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                formData.selectedThemePackage === pkg.name
                                  ? 'border-pink-500 bg-pink-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
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
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case 'extras':
        return (
          <motion.div 
            key="extras"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Servicios adicionales</h2>
              <p className="text-gray-600">Haz tu evento aún más especial</p>
            </div>
            
            <div className="space-y-6">
              {Object.entries(
                extraServices.reduce((acc, service) => {
                  if (!acc[service.category]) acc[service.category] = [];
                  acc[service.category].push(service);
                  return acc;
                }, {} as Record<string, ExtraService[]>)
              ).map(([category, services], categoryIndex) => (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service, index) => (
                      <motion.div
                        key={service._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                            : 'border-gray-200 hover:border-gray-300 bg-white'
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
                          <AnimatePresence>
                            {formData.selectedExtraServices.includes(service._id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <CheckIconSolid className="w-5 h-5 text-pink-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div 
            key="payment"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">¿Cómo prefieres pagar?</h2>
              <p className="text-gray-600">Selecciona tu método de pago preferido</p>
            </div>

            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'transfer' | 'cash' | 'card' }))}
            >
              <motion.div className="space-y-3">
                {[
                  { value: 'transfer', icon: BanknotesIcon, color: 'blue', title: 'Transferencia bancaria', desc: 'Recibirás los datos bancarios por correo' },
                  { value: 'cash', icon: BanknotesIcon, color: 'green', title: 'Efectivo', desc: 'Paga el día de tu evento' },
                  { value: 'card', icon: CreditCardIcon, color: 'purple', title: 'Tarjeta de crédito o débito', desc: 'Paga con tarjeta el día del evento' }
                ].map((method, index) => (
                  <motion.div
                    key={method.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Radio 
                      value={method.value}
                      classNames={{
                        base: "max-w-full m-0 p-4 rounded-xl border-2 data-[selected=true]:border-pink-500 data-[selected=true]:bg-pink-50",
                        label: "w-full"
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <method.icon className={`w-6 h-6 text-${method.color}-500`} />
                          <div>
                            <p className="font-medium text-gray-900">{method.title}</p>
                            <p className="text-sm text-gray-600">{method.desc}</p>
                          </div>
                        </div>
                      </div>
                    </Radio>
                  </motion.div>
                ))}
              </motion.div>
            </RadioGroup>
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div 
            key="confirmation"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Listo!</h2>
              <p className="text-gray-600">Tu reserva ha sido confirmada</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-purple-50">
                <CardBody className="p-6">
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
                    <Divider className="my-2" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-green-600">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Button
                color="primary"
                size="lg"
                startContent={<DocumentTextIcon className="w-5 h-5" />}
                onPress={generatePaymentSlip}
                className="w-full"
              >
                Descargar ficha de pago
              </Button>
              
              <Button
                variant="bordered"
                size="lg"
                onPress={() => router.push('/reservaciones')}
                className="w-full"
              >
                Ver mis reservas
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-gray-600"
            >
              <p>Te hemos enviado un correo con todos los detalles</p>
              <p className="mt-2">¿Necesitas ayuda? Llámanos al (55) 1234-5678</p>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-pink-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/reservaciones')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            {/* Progress Indicator */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="hidden md:flex items-center justify-between">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.key;
                  const isCompleted = currentStepIndex > index;
                  const Icon = step.icon;
                  
                  return (
                    <React.Fragment key={step.key}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            backgroundColor: isCompleted ? '#10b981' : isActive ? '#ec4899' : '#e5e7eb'
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive ? 'ring-4 ring-pink-200' : ''
                          }`}
                        >
                          {isCompleted ? (
                            <CheckIcon className="w-5 h-5 text-white" />
                          ) : (
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                          )}
                        </motion.div>
                        <span className={`text-xs mt-1 font-medium ${
                          isActive ? 'text-pink-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                      </motion.div>
                      {index < steps.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="flex-1 h-0.5 bg-gray-200 mx-2"
                          style={{ originX: 0 }}
                        >
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: currentStepIndex > index ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-green-500"
                            style={{ originX: 0 }}
                          />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              
              {/* Mobile Progress */}
              <div className="md:hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {steps[currentStepIndex].title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentStepIndex + 1} / {steps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AdminQuickNav variant="header" />
              <div className="hidden lg:block text-sm text-gray-600">
                <MapPinIcon className="w-5 h-5 inline mr-1" />
                Tramboory
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardBody className="p-6 lg:p-8">
                  <AnimatePresence mode="wait">
                    {renderStepContent()}
                  </AnimatePresence>
                </CardBody>
              </Card>

              {/* Navigation */}
              {currentStep !== 'confirmation' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-between mt-6"
                >
                  <Button
                    variant="bordered"
                    size="lg"
                    startContent={<ArrowLeftIcon className="w-5 h-5" />}
                    onPress={handlePrevious}
                    isDisabled={currentStepIndex === 0}
                    className="min-w-[120px]"
                  >
                    Atrás
                  </Button>

                  {currentStep === 'payment' ? (
                    <Button
                      color="primary"
                      size="lg"
                      onPress={handleSubmit}
                      isLoading={loading}
                      className="min-w-[160px] bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      {loading ? 'Confirmando...' : 'Confirmar reserva'}
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      size="lg"
                      endContent={<ArrowRightIcon className="w-5 h-5" />}
                      onPress={handleNext}
                      isDisabled={!validateCurrentStep()}
                      className="min-w-[120px] bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      Continuar
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24"
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingCartIcon className="w-5 h-5" />
                    Resumen de tu reserva
                  </h3>
                  
                  <AnimatePresence>
                    <div className="space-y-4">
                      {/* Basic Info */}
                      {formData.childName && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600">Festejado/a</p>
                          <p className="font-medium text-gray-900">
                            {formData.childName} {formData.childAge && `(${formData.childAge} años)`}
                          </p>
                        </motion.div>
                      )}
                      
                      {formData.eventDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600">Fecha y hora</p>
                          <p className="font-medium text-gray-900">
                            {formData.eventDate.toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric',
                              month: 'long'
                            })}
                            {formData.eventTime && ` a las ${formData.eventTime}`}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Package */}
                      {selectedPackage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600">Paquete</p>
                          <p className="font-medium text-gray-900">{selectedPackage.name}</p>
                          <p className="text-sm text-green-600">
                            {formatPrice(formData.eventDate ? 
                              (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 
                                selectedPackage.pricing.weekend : selectedPackage.pricing.weekday) : 0)}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Food */}
                      {selectedFood && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600">Comida</p>
                          <p className="font-medium text-gray-900">{selectedFood.name}</p>
                          <p className="text-sm text-green-600">+{formatPrice(selectedFood.basePrice)}</p>
                        </motion.div>
                      )}
                      
                      {/* Theme */}
                      {selectedTheme && formData.selectedThemePackage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600">Decoración</p>
                          <p className="font-medium text-gray-900">
                            {selectedTheme.name} - {formData.selectedThemePackage}
                          </p>
                          <p className="text-sm text-green-600">
                            +{formatPrice(selectedTheme.packages.find(pkg => pkg.name === formData.selectedThemePackage)?.price || 0)}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Extras */}
                      {selectedExtras.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <p className="text-sm text-gray-600 mb-2">Servicios extras</p>
                          <div className="space-y-1">
                            {selectedExtras.map((extra) => (
                              <div key={extra._id} className="flex justify-between text-sm">
                                <span className="text-gray-700">{extra.name}</span>
                                <span className="text-green-600">+{formatPrice(extra.price)}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Rest Day Fee */}
                      {availableSlots?.isRestDay && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-amber-50 p-3 rounded-lg"
                        >
                          <p className="text-sm text-amber-800">Cargo por día de descanso</p>
                          <p className="text-sm font-medium text-amber-900">
                            +{formatPrice(availableSlots.restDayFee)}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </AnimatePresence>
                  
                  {/* Total */}
                  {(selectedPackage || selectedFood || selectedExtras.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Divider className="my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <motion.span 
                          key={calculateTotal()}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                        >
                          {formatPrice(calculateTotal())}
                        </motion.span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">*Precio en pesos mexicanos (MXN)</p>
                    </motion.div>
                  )}
                </CardBody>
              </Card>

              {/* Help Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg mt-4 bg-gradient-to-br from-pink-50 to-purple-50">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-pink-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">¿Necesitas ayuda?</p>
                        <p className="text-sm text-gray-600">
                          Llámanos al <a href="tel:5512345678" className="text-pink-600 font-medium hover:text-pink-700">(55) 1234-5678</a>
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}