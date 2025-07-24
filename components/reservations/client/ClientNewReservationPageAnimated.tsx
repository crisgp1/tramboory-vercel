'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AdminQuickNav from '@/components/navigation/AdminQuickNav';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Divider,
  Progress,
  RadioGroup,
  Radio,
  Avatar,
  Skeleton,
  DatePicker,
  Spacer
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
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import CustomCalendar from '../CustomCalendar';
import "../modern-calendar.css";

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
  endTime: string;
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
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlots | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [celebrationAnimation, setCelebrationAnimation] = useState<any>(null);

  const steps: { key: Step; title: string; description: string; icon: any }[] = [
    { key: 'basic', title: 'Detalles', description: 'Información básica', icon: UserGroupIcon },
    { key: 'package', title: 'Paquete', description: 'Elige tu experiencia', icon: StarIcon },
    { key: 'food', title: 'Extras', description: 'Personaliza tu evento', icon: HeartIcon },
    { key: 'extras', title: 'Servicios', description: 'Agrega más diversión', icon: PlusIcon },
    { key: 'payment', title: 'Pago', description: 'Confirma tu reserva', icon: CreditCardIcon },
    { key: 'confirmation', title: 'Listo', description: '¡Confirmado!', icon: CheckIcon }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  useEffect(() => {
    fetchPackages();
    fetchAdditionalOptions();
    fetchAvailability();
    loadCelebrationAnimation();
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
    setLoadingAvailability(true);
    try {
      const response = await fetch('/api/reservations/availability');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailability(data.data);
          setLoadingAvailability(false);
          return;
        }
      }
      
      // If API fails, show error
      console.error('Failed to fetch availability data');
      toast.error('Error al cargar disponibilidad');
      setLoadingAvailability(false);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Error al cargar disponibilidad');
      setLoadingAvailability(false);
    }
  };

  const loadCelebrationAnimation = async () => {
    try {
      // DotLottieReact is loaded via import, no need to load external scripts
      setCelebrationAnimation(true);
    } catch (error) {
      console.error('Error loading celebration animation:', error);
    }
  };

  const fetchTimeSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reservations/available-blocks?date=${dateStr}`);
      const data = await response.json();
      
      if (data.success) {
        // Transform the blocks data to match the expected format
        const transformedData = {
          date: data.data.date,
          isRestDay: data.data.isRestDay,
          restDayFee: data.data.restDayFee || 0,
          businessHours: data.data.businessHours,
          defaultEventDuration: data.data.defaultEventDuration,
          slots: data.data.blocks?.flatMap((block: any) => block.slots) || []
        };
        
        console.log('Available slots debug:', {
          originalData: data.data,
          transformedData,
          blocksCount: data.data.blocks?.length || 0,
          slotsCount: transformedData.slots.length
        });
        
        setAvailableSlots(transformedData);
        
        // Check if date is fully booked
        const dateAvailability = availability[dateStr];
        if (dateAvailability === 'unavailable') {
          setFormData(prev => ({ ...prev, eventTime: '' }));
          toast.error('Esta fecha ya tiene la capacidad máxima de eventos');
          return;
        }
        
        // Reset time selection if previously selected time is not available
        if (formData.eventTime && !transformedData.slots.find((slot: TimeSlot) => 
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

  // Get selected package details
  const selectedPackage = (packages || []).find(pkg => pkg._id === formData.packageId);
  const selectedFood = foodOptions.find(food => food._id === formData.foodOptionId);
  const selectedTheme = eventThemes.find(theme => theme._id === formData.eventThemeId);
  const selectedExtras = (extraServices || []).filter(service => (formData.selectedExtraServices || []).includes(service._id));

  // Calculate total price
  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPackage && formData.eventDate) {
      const isWeekend = formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6;
      total += isWeekend ? selectedPackage.pricing?.weekend || 0 : selectedPackage.pricing?.weekday || 0;
    }
    
    if (selectedFood) {
      total += selectedFood.basePrice;
    }
    
    if (selectedTheme && formData.selectedThemePackage) {
      const themePackage = (selectedTheme?.packages || []).find(pkg => pkg.name === formData.selectedThemePackage);
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
    
    // Extract complex expressions
    const packagePrice = selectedPackage && formData.eventDate ? 
      (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 
        selectedPackage.pricing?.weekend || 0 : selectedPackage.pricing?.weekday || 0) : 0;
    
    const paymentMethodText = formData.paymentMethod === 'transfer' ? 'Transferencia Bancaria' :
      formData.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta de Crédito/Débito';
    
    let paymentSlip = `FICHA DE PAGO - TRAMBOORY
========================

Reservación ID: ${reservationId || 'PENDIENTE'}
Referencia: ${referenceNumber}
Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}

DATOS DEL EVENTO:
- Festejado/a: ${formData.childName}
- Edad: ${formData.childAge} años
- Fecha: ${formData.eventDate ? formData.eventDate.toLocaleDateString('es-ES') : 'N/A'}
- Hora: ${formData.eventTime}

PAQUETE SELECCIONADO:
- ${selectedPackage?.name || 'N/A'}
- Precio: ${formatPrice(packagePrice)}`;

    if (selectedFood) {
      paymentSlip += `

COMIDA:
- ${selectedFood.name}
- Precio: ${formatPrice(selectedFood.basePrice)}`;
    }

    if (selectedTheme && formData.selectedThemePackage) {
      const themePrice = (selectedTheme?.packages || []).find(pkg => pkg.name === formData.selectedThemePackage)?.price || 0;
      paymentSlip += `

TEMA:
- ${selectedTheme.name} - ${formData.selectedThemePackage}
- Precio: ${formatPrice(themePrice)}`;
    }

    if (selectedExtras.length > 0) {
      paymentSlip += `

SERVICIOS EXTRAS:
${selectedExtras.map(extra => `- ${extra.name}: ${formatPrice(extra.price)}`).join('\n')}`;
    }

    if (availableSlots?.isRestDay) {
      paymentSlip += `

CARGO POR DÍA DE DESCANSO: ${formatPrice(availableSlots.restDayFee)}`;
    }

    paymentSlip += `

TOTAL A PAGAR: ${formatPrice(total)}

MÉTODO DE PAGO: ${paymentMethodText}`;

    if (formData.paymentMethod === 'transfer') {
      paymentSlip += `

DATOS BANCARIOS:
Banco: Banco Ejemplo
Cuenta: 1234567890
CLABE: 012345678901234567
Titular: Tramboory S.A. de C.V.

IMPORTANTE: Enviar comprobante de pago a:
pagos@tramboory.com`;
    }

    paymentSlip += `

Para cualquier duda, contacta:
📞 Tel: (55) 1234-5678
📧 Email: info@tramboory.com
🌐 Web: www.tramboory.com

¡Gracias por confiar en nosotros para tu celebración especial!`;

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
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                ¿Para quién es la celebración?
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Comencemos con los detalles del festejado para crear una experiencia perfecta
              </p>
            </motion.div>
            
            {/* Form Section */}
            <div className="space-y-8">
              {/* Child Details */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <CakeIcon className="w-5 h-5 text-rose-500" />
                    Nombre del festejado/a
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Ej: Sofía"
                    value={formData.childName}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, childName: value }))}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      input: "text-gray-900 text-lg placeholder:text-gray-400",
                      inputWrapper: "border-2 border-gray-200 hover:border-rose-300 focus-within:border-rose-500 bg-white/50 backdrop-blur-sm h-14 rounded-2xl"
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-rose-500" />
                    Edad que cumple
                    <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    placeholder="Selecciona la edad"
                    selectedKeys={formData.childAge ? [formData.childAge] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData(prev => ({ ...prev, childAge: selected }));
                    }}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      trigger: "border-2 border-gray-200 hover:border-rose-300 focus-within:border-rose-500 bg-white/50 backdrop-blur-sm h-14 rounded-2xl",
                      value: "text-gray-900 text-lg"
                    }}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((age) => (
                      <SelectItem key={age.toString()}>
                        {age} {age === 1 ? 'año' : 'años'}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </motion.div>

              {/* Date Selection - Airbnb Style */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 text-rose-500" />
                    ¿Cuándo quieres celebrar?
                    <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Custom Modern Calendar */}
                  <div className="w-full">
                    {loadingAvailability ? (
                      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 min-h-[400px] flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                          <p className="text-gray-500">Cargando disponibilidad...</p>
                        </div>
                      </div>
                    ) : (
                      <CustomCalendar
                        selectedDate={formData.eventDate}
                        onDateSelect={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
                        availability={availability}
                        minDate={new Date()}
                      />
                    )}
                  </div>
                  
                  {/* Availability Notice */}
                  {!loadingAvailability && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-blue-900 mb-1">Nota sobre disponibilidad</p>
                          <p className="text-blue-700">
                            La capacidad de eventos por día varía según la configuración. Los días marcados en rojo ya tienen su capacidad completa. 
                            Los días de descanso tienen un cargo adicional.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Time Selection */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-rose-500" />
                  Hora perfecta
                  <span className="text-rose-500">*</span>
                </label>
                
                {!formData.eventDate ? (
                  <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl text-center">
                    <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Primero selecciona una fecha</p>
                    <p className="text-gray-500 text-sm">Los horarios disponibles aparecerán aquí</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-2xl" />
                    ))}
                  </div>
                ) : availableSlots && availableSlots.slots && availableSlots.slots.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableSlots.slots.map((slot) => (
                        <motion.button
                          key={slot.time}
                          whileHover={{ scale: slot.available ? 1.02 : 1 }}
                          whileTap={{ scale: slot.available ? 0.98 : 1 }}
                          onClick={() => {
                            if (slot.available) {
                              setFormData(prev => ({ ...prev, eventTime: slot.time }));
                            }
                          }}
                          disabled={!slot.available}
                          className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                            formData.eventTime === slot.time
                              ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg'
                              : slot.available
                                ? 'border-gray-200 hover:border-rose-300 bg-white hover:bg-rose-50'
                                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-center">
                            <p className={`text-lg font-bold ${
                              formData.eventTime === slot.time
                                ? 'text-rose-600'
                                : slot.available
                                  ? 'text-gray-900'
                                  : 'text-gray-400'
                            }`}>
                              {slot.time}
                            </p>
                            {slot.available ? (
                              <span className="text-xs text-emerald-600 font-medium mt-1">
                                Disponible
                              </span>
                            ) : (
                              <span className="text-xs text-red-500 font-medium mt-1">No disponible</span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    {availableSlots.isRestDay && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800">
                              Día especial
                            </p>
                            <p className="text-xs text-amber-700">
                              Cargo adicional de {formatPrice(availableSlots.restDayFee)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl text-center">
                    <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-yellow-800 font-medium">No hay horarios disponibles</p>
                    <p className="text-yellow-700 text-sm">Intenta con otra fecha</p>
                  </div>
                )}
              </motion.div>

              {/* Comments Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-rose-500" />
                  Algo especial que debamos saber?
                  <span className="text-sm font-normal text-gray-500">(opcional)</span>
                </label>
                <Textarea
                  placeholder="Alergias, solicitudes especiales, decoración preferida, cumpleaños temático..."
                  value={formData.specialComments}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, specialComments: value }))}
                  minRows={4}
                  variant="bordered"
                  classNames={{
                    input: "text-gray-900 placeholder:text-gray-400",
                    inputWrapper: "border-2 border-gray-200 hover:border-rose-300 focus-within:border-rose-500 bg-white/50 backdrop-blur-sm rounded-2xl"
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
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Elige tu experiencia perfecta
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Cada paquete está diseñado para crear momentos mágicos e inolvidables
              </p>
            </motion.div>
            
            {loadingPackages ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      isPressable
                      shadow="lg"
                      className={`transition-all duration-300 cursor-pointer overflow-hidden ${
                        formData.packageId === pkg._id
                          ? 'ring-4 ring-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 shadow-2xl'
                          : 'hover:shadow-2xl bg-white border border-gray-100'
                      }`}
                      onPress={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                      radius="lg"
                    >
                      {/* Package Header */}
                      <CardHeader className="pb-4 relative">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                              formData.packageId === pkg._id 
                                ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg' 
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                            }`}>
                              <StarIcon className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {pkg.number ? `Paquete ${pkg.number}` : pkg.name}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {pkg.description || 'Experiencia completa de celebración'}
                              </p>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {formData.packageId === pkg._id && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                className="absolute -top-2 -right-2"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                  <CheckIconSolid className="w-5 h-5 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardHeader>
                      
                      <CardBody className="pt-0 pb-6">
                        <div className="space-y-4">
                          {/* Guest Capacity */}
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                              <UserGroupIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-900">Capacidad</p>
                              <p className="text-xs text-blue-700">Hasta {pkg.maxGuests} invitados</p>
                            </div>
                          </div>
                          
                          {/* Pricing */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Entre semana</span>
                              <span className="text-lg font-bold text-gray-900">
                                ${pkg.pricing?.weekday?.toLocaleString() || '0'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Fin de semana</span>
                              <span className="text-lg font-bold text-purple-600">
                                ${pkg.pricing?.weekend?.toLocaleString() || '0'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Date-specific pricing */}
                          {formData.eventDate && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <CalendarDaysIcon className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-emerald-700">
                                    Precio para tu fecha
                                  </span>
                                </div>
                                <span className="text-xl font-bold text-emerald-600">
                                  ${(formData.eventDate && (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6)
                                    ? pkg.pricing?.weekend 
                                    : pkg.pricing?.weekday)?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
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
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                ¡Hagámoslo especial!
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Agrega sabores deliciosos y temas mágicos para crear recuerdos inolvidables
              </p>
            </motion.div>
            
            {/* Food Options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de comida</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service, index) => (
                      <motion.div
                        key={service._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const isSelected = (formData.selectedExtraServices || []).includes(service._id);
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
                          (formData.selectedExtraServices || []).includes(service._id)
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

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'transfer', icon: BanknotesIcon, color: 'blue', title: 'Transferencia bancaria', desc: 'Datos por correo' },
                { value: 'cash', icon: BanknotesIcon, color: 'green', title: 'Efectivo', desc: 'Paga el día del evento' },
                { value: 'card', icon: CreditCardIcon, color: 'purple', title: 'Tarjeta', desc: 'Paga el día del evento' }
              ].map((method, index) => (
                <motion.button
                  key={method.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value as 'transfer' | 'cash' | 'card' }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center space-y-2 ${
                    formData.paymentMethod === method.value
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {React.createElement(method.icon, { 
                    className: `w-5 h-5 ${method.color === 'blue' ? 'text-blue-600' : method.color === 'green' ? 'text-green-600' : 'text-purple-600'}` 
                  })}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{method.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        );

      case 'confirmation':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {celebrationAnimation && (
                    <DotLottieReact
                      src="https://lottie.host/bb5b54e5-d1d0-41af-a958-7203748ff3c1/wMVyMTX4XV.lottie"
                      loop
                      autoplay
                      style={{ width: '200px', height: '200px' }}
                    />
                  )}
                  <motion.div
                    className={`w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl ${
                      celebrationAnimation ? 'absolute' : 'mx-auto mb-4'
                    }`}
                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 1],
                      opacity: [0, 1, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeInOut"
                    }}
                    style={{ 
                      zIndex: 10
                    }}
                  >
                    <CheckIcon className="w-10 h-10 text-white drop-shadow" />
                  </motion.div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Listo!</h2>
              <p className="text-gray-600">Tu reserva ha sido confirmada</p>
            </div>

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
                    <span className="font-medium">{formData.eventDate ? formData.eventDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : ''}</span>
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

            <div className="space-y-3">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <motion.div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-rose-300 border-t-rose-600 rounded-full mx-auto"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 font-medium"
          >
            Preparando tu experiencia...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/reservaciones')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Volver</span>
            </motion.button>
            
            {/* Progress Indicator */}
            <div className="flex-1 max-w-5xl mx-6">
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
                        className="flex flex-col items-center px-1 relative z-10"
                      >
                        <motion.div
                          animate={{
                            scale: isActive ? 1.15 : 1,
                          }}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-200' 
                              : isActive 
                                ? 'bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-xl shadow-rose-200 ring-4 ring-rose-100' 
                                : 'bg-white text-gray-400 border-2 border-gray-200 shadow-sm'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckIconSolid className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </motion.div>
                        <div className="mt-3 text-center max-w-24">
                          <div className={`text-sm font-semibold ${
                            isActive ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </div>
                          <div className={`text-xs mt-1 ${
                            isActive ? 'text-rose-500' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </div>
                        </div>
                      </motion.div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 px-4 relative -top-5">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ 
                                width: currentStepIndex > index ? "100%" : "0%"
                              }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              
              {/* Mobile Progress */}
              <div className="md:hidden space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      'bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-lg shadow-rose-200'
                    }`}>
                      {React.createElement(steps[currentStepIndex].icon, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">
                        {steps[currentStepIndex].title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {steps[currentStepIndex].description}
                      </div>
                    </div>
                  </div>
                  <Chip 
                    size="lg" 
                    variant="flat" 
                    className="bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200"
                  >
                    {currentStepIndex + 1} de {steps.length}
                  </Chip>
                </div>
                <Progress 
                  value={((currentStepIndex + 1) / steps.length) * 100}
                  size="md"
                  classNames={{
                    track: "bg-gray-200",
                    indicator: "bg-gradient-to-r from-rose-400 to-pink-600"
                  }}
                  className="shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AdminQuickNav variant="header" />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-medium">Tramboory</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl overflow-visible rounded-3xl">
                <CardBody className="p-8 lg:p-12 overflow-visible">
                  <AnimatePresence mode="wait">
                    {renderStepContent()}
                  </AnimatePresence>
                </CardBody>
              </Card>

              {/* Navigation */}
              {currentStep !== 'confirmation' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-between items-center mt-8"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="bordered"
                      size="lg"
                      startContent={<ArrowLeftIcon className="w-5 h-5" />}
                      onPress={handlePrevious}
                      isDisabled={currentStepIndex === 0}
                      className="min-w-[140px] border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold"
                      radius="full"
                    >
                      Anterior
                    </Button>
                  </motion.div>

                  {currentStep === 'payment' ? (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        onPress={handleSubmit}
                        isLoading={loading}
                        className="min-w-[180px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all font-semibold"
                        radius="full"
                      >
                        {loading ? 'Confirmando...' : '✨ Confirmar reserva'}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        endContent={<ArrowRightIcon className="w-5 h-5" />}
                        onPress={handleNext}
                        isDisabled={!validateCurrentStep()}
                        className="min-w-[140px] bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all font-semibold disabled:opacity-50"
                        radius="full"
                      >
                        Continuar
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="sticky top-28"
            >
              <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardBody className="p-8">
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl flex items-center justify-center">
                      <ShoppingCartIcon className="w-4 h-4 text-white" />
                    </div>
                    Resumen
                  </motion.h3>
                  
                  <AnimatePresence>
                    <div className="space-y-5">
                      {/* Basic Info */}
                      {formData.childName && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CakeIcon className="w-4 h-4 text-rose-500" />
                            <p className="text-sm font-semibold text-rose-700">Festejado/a</p>
                          </div>
                          <p className="font-bold text-gray-900 text-lg">
                            {formData.childName} {formData.childAge && `(${formData.childAge} años)`}
                          </p>
                        </motion.div>
                      )}
                      
                      {formData.eventDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                            <p className="text-sm font-semibold text-blue-700">Fecha y hora</p>
                          </div>
                          <p className="font-bold text-gray-900">
                            {formData.eventDate.toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric',
                              month: 'long'
                            })}
                            {formData.eventTime && (
                              <span className="text-blue-600"> a las {formData.eventTime}</span>
                            )}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Package */}
                      {selectedPackage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <StarIcon className="w-4 h-4 text-purple-500" />
                            <p className="text-sm font-semibold text-purple-700">Paquete seleccionado</p>
                          </div>
                          <p className="font-bold text-gray-900 text-lg mb-1">{selectedPackage?.name || 'Paquete no seleccionado'}</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatPrice(formData.eventDate ? 
                              (formData.eventDate.getDay() === 0 || formData.eventDate.getDay() === 6 ? 
                                selectedPackage.pricing?.weekend || 0 : selectedPackage.pricing?.weekday || 0) : 0)}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Food */}
                      {selectedFood && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <HeartIcon className="w-4 h-4 text-orange-500" />
                            <p className="text-sm font-semibold text-orange-700">Comida</p>
                          </div>
                          <p className="font-bold text-gray-900 text-lg mb-1">{selectedFood.name}</p>
                          <p className="text-sm font-semibold text-emerald-600">+{formatPrice(selectedFood.basePrice)}</p>
                        </motion.div>
                      )}
                      
                      {/* Theme */}
                      {selectedTheme && formData.selectedThemePackage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-4 h-4 text-indigo-500" />
                            <p className="text-sm font-semibold text-indigo-700">Decoración</p>
                          </div>
                          <p className="font-bold text-gray-900 text-lg mb-1">
                            {selectedTheme.name} - {formData.selectedThemePackage}
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            +{formatPrice((selectedTheme?.packages || []).find(pkg => pkg.name === formData.selectedThemePackage)?.price || 0)}
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Extras */}
                      {selectedExtras.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <PlusIcon className="w-4 h-4 text-teal-500" />
                            <p className="text-sm font-semibold text-teal-700">Servicios extras</p>
                          </div>
                          <div className="space-y-2">
                            {selectedExtras.map((extra) => (
                              <div key={extra._id} className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">{extra.name}</span>
                                <span className="text-emerald-600 font-semibold">+{formatPrice(extra.price)}</span>
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
                          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                            <p className="text-sm font-semibold text-amber-800">Día especial</p>
                          </div>
                          <p className="text-gray-700 font-medium mb-1">Cargo por día de descanso</p>
                          <p className="text-emerald-600 font-semibold">
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
                      className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl border border-emerald-200"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold text-gray-900">Total estimado</span>
                        <motion.span 
                          key={calculateTotal()}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                        >
                          {formatPrice(calculateTotal())}
                        </motion.span>
                      </div>
                      <p className="text-sm text-emerald-600 font-medium">Pesos mexicanos (MXN)</p>
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
                <Card className="border-0 shadow-xl mt-6 bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden">
                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <InformationCircleIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 mb-2">¿Necesitas ayuda?</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Nuestro equipo está listo para ayudarte
                        </p>
                        <motion.a 
                          href="tel:5512345678" 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white rounded-full text-rose-600 font-semibold text-sm border border-rose-200 hover:bg-rose-50 transition-colors"
                        >
                          📞 (55) 1234-5678
                        </motion.a>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button for Mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 lg:hidden z-50"
      >
        {currentStep !== 'confirmation' && formData.childName && formData.eventDate && formData.eventTime && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            disabled={!validateCurrentStep()}
            className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center disabled:opacity-50"
          >
            <ArrowRightIcon className="w-6 h-6" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}