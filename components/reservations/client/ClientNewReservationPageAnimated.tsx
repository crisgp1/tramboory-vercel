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
  TextInput,
  Select,
  Textarea,
  Card,
  Badge,
  Divider,
  Progress,
  Radio,
  RadioGroup,
  Avatar,
  Skeleton,
  Space,
  Modal,
  Box,
  Group,
  Text,
  SimpleGrid,
  Center
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
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

// localStorage utilities for form persistence
const STORAGE_KEY = 'tramboory-reservation-form';

const saveFormDataToStorage = (formData: FormData) => {
  try {
    const dataToSave = {
      ...formData,
      eventDate: formData.eventDate ? formData.eventDate.toISOString() : null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    // Silently handle localStorage errors (e.g., quota exceeded, private browsing)
  }
};

const loadFormDataFromStorage = (): Partial<FormData> | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Convert eventDate string back to Date object
    if (parsed.eventDate) {
      parsed.eventDate = new Date(parsed.eventDate);
      // Validate the date
      if (isNaN(parsed.eventDate.getTime())) {
        parsed.eventDate = null;
      }
    }
    
    return parsed;
  } catch (error) {
    // Silently handle localStorage errors
    return null;
  }
};

const clearFormDataFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silently handle localStorage errors
  }
};

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

type Step = 'basic' | 'datetime' | 'package' | 'food' | 'extras' | 'payment' | 'confirmation';

const fadeInUp = {
  initial: { opacity: 0, y: 1.25 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -1.25 }
};

const slideIn = {
  initial: { opacity: 0, x: 1.25 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -1.25 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export default function ClientNewReservationPageAnimated() {
  const { user } = useUser();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure();
  
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  
  // Initialize formData with data from localStorage if available
  const [formData, setFormData] = useState<FormData>(() => {
    const savedData = loadFormDataFromStorage();
    return {
      childName: savedData?.childName || '',
      childAge: savedData?.childAge || '',
      eventDate: savedData?.eventDate || null,
      eventTime: savedData?.eventTime || '',
      packageId: savedData?.packageId || '',
      foodOptionId: savedData?.foodOptionId || '',
      selectedFoodExtras: savedData?.selectedFoodExtras || [],
      eventThemeId: savedData?.eventThemeId || '',
      selectedThemePackage: savedData?.selectedThemePackage || '',
      selectedExtraServices: savedData?.selectedExtraServices || [],
      specialComments: savedData?.specialComments || '',
      paymentMethod: savedData?.paymentMethod || 'transfer'
    };
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
    { key: 'basic', title: 'Detalles', description: 'Información básica', icon: CakeIcon },
    { key: 'datetime', title: 'Fecha', description: 'Cuándo celebrar', icon: CalendarDaysIcon },
    { key: 'package', title: 'Paquete', description: 'Elige tu experiencia', icon: StarIcon },
    { key: 'food', title: 'Extras', description: 'Personaliza tu evento', icon: HeartIcon },
    { key: 'extras', title: 'Servicios', description: 'Agrega más diversión', icon: PlusIcon },
    { key: 'payment', title: 'Pago', description: 'Confirma tu reserva', icon: CreditCardIcon },
    { key: 'confirmation', title: 'Listo', description: '¡Confirmado!', icon: CheckIcon }
  ];

  // Auto-save form data to localStorage whenever formData changes
  useEffect(() => {
    // Don't save if we're on confirmation step (form completed)
    if (currentStep !== 'confirmation') {
      saveFormDataToStorage(formData);
    }
  }, [formData, currentStep]);

  // Clear localStorage when form is successfully submitted
  useEffect(() => {
    if (currentStep === 'confirmation' && reservationId) {
      clearFormDataFromStorage();
    }
  }, [currentStep, reservationId]);

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

  const fetchTimeSlots = async (date: Date | string | null) => {
    if (!date) return;
    
    setLoadingSlots(true);
    try {
      // Convert to Date object safely - best practice from StackOverflow
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else {
        dateObj = new Date(date);
        // Validate the date is not Invalid Date
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date provided to fetchTimeSlots:', date);
          return;
        }
      }
      
      const dateStr = dateObj.toISOString().split('T')[0];
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
        return !!(formData.childName.trim() && formData.childAge);
      case 'datetime':
        return !!(formData.eventDate && formData.eventTime);
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
      const eventDate = getEventDate();
      const reservationData = {
        packageId: formData.packageId,
        eventDate: eventDate ? eventDate.toISOString() : '',
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

  // Helper function to ensure we have a Date object - following StackOverflow best practices
  const getEventDate = (): Date | null => {
    if (!formData.eventDate) return null;
    
    if (formData.eventDate instanceof Date) {
      return formData.eventDate;
    }
    
    const dateObj = new Date(formData.eventDate);
    // Validate the date is not Invalid Date
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date in formData.eventDate:', formData.eventDate);
      return null;
    }
    
    return dateObj;
  };

  // Get selected package details
  const selectedPackage = (packages || []).find(pkg => pkg._id === formData.packageId);
  const selectedFood = foodOptions.find(food => food._id === formData.foodOptionId);
  const selectedTheme = eventThemes.find(theme => theme._id === formData.eventThemeId);
  const selectedExtras = (extraServices || []).filter(service => (formData.selectedExtraServices || []).includes(service._id));

  // Calculate total price
  const calculateTotal = () => {
    let total = 0;
    
    const eventDate = getEventDate();
    if (selectedPackage && eventDate) {
      const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6;
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

  const downloadInvoice = async () => {
    try {
      const response = await fetch('/api/reservations/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId }),
      });

      if (!response.ok) {
        throw new Error('Error generating invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-reserva-${reservationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Factura descargada exitosamente');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Error al descargar la factura');
    }
  };

  const generatePaymentSlip = () => {
    const total = calculateTotal();
    const referenceNumber = `REF-${Date.now()}`;
    
    // Extract complex expressions
    const eventDate = getEventDate();
    const packagePrice = selectedPackage && eventDate ? 
      (eventDate.getDay() === 0 || eventDate.getDay() === 6 ? 
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
- Fecha: ${getEventDate()?.toLocaleDateString('es-ES') || 'N/A'}
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
            className="space-y-4 sm:space-y-6"
          >
            {/* Modern Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                ¿Para quién es la celebración?
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Comencemos con los detalles del festejado para crear una experiencia perfecta
              </p>
            </motion.div>
            
            {/* Modern Form Section */}
            <div className="space-y-6">
              {/* Child Details */}
              <motion.div
                initial={{ opacity: 0, y: 1.875 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
              >
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <CakeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
                    Nombre del festejado/a
                    <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    placeholder="Ej: Sofía"
                    value={formData.childName}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      // Regex to allow only letters, spaces, accents, and hyphens
                      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]*$/;
                      if (nameRegex.test(value)) {
                        setFormData(prev => ({ ...prev, childName: value }));
                      }
                    }}
                    variant="default"
                    size="lg"
                    radius="lg"
                    className="text-gray-900 text-sm sm:text-base"
                    styles={{
                      input: {
                        border: '1.5px solid rgb(229 231 235 / 0.7)',
                        backgroundColor: 'rgb(255 255 255 / 0.5)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '12px',
                        height: '48px',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        transition: 'all 300ms',
                        '&:hover': {
                          borderColor: 'rgb(251 113 133 / 0.5)',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        },
                        '&:focus': {
                          borderColor: 'rgb(244 63 94)',
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
                    Edad que cumple
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <TextInput
                      type="number"
                      placeholder="Ej: 5"
                      value={formData.childAge}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        // Ensure the value is within valid range (1-15)
                        const numValue = parseInt(value);
                        if (value === '' || (numValue >= 1 && numValue <= 15)) {
                          setFormData(prev => ({ ...prev, childAge: value }));
                        }
                      }}
                      min={1}
                      max={15}
                      variant="default"
                      size="lg"
                      radius="lg"
                      className="text-gray-900"
                      styles={{
                        input: {
                          border: '1.5px solid rgb(229 231 235 / 0.7)',
                          backgroundColor: 'rgb(255 255 255 / 0.5)',
                          backdropFilter: 'blur(16px)',
                          borderRadius: '12px',
                          height: '48px',
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                          transition: 'all 300ms',
                          '&:hover': {
                            borderColor: 'rgb(251 113 133 / 0.5)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          },
                          '&:focus': {
                            borderColor: 'rgb(244 63 94)',
                          }
                        }
                      }}
                      rightSection={
                        <div className="flex flex-col">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-rose-500 transition-colors p-0.5"
                            onClick={() => {
                              const currentAge = parseInt(formData.childAge) || 0;
                              if (currentAge < 15) {
                                setFormData(prev => ({ ...prev, childAge: (currentAge + 1).toString() }));
                              }
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-rose-500 transition-colors p-0.5"
                            onClick={() => {
                              const currentAge = parseInt(formData.childAge) || 0;
                              if (currentAge > 1) {
                                setFormData(prev => ({ ...prev, childAge: (currentAge - 1).toString() }));
                              }
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      }
                    />
                    {formData.childAge && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                        {parseInt(formData.childAge) === 1 ? 'año' : 'años'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Comments Section */}
              <motion.div
                initial={{ opacity: 0, y: 1.875 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <DocumentTextIcon className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
                  Algo especial que debamos saber?
                  <span className="text-xs font-normal text-gray-500">(opcional)</span>
                </label>
                <Textarea
                  placeholder="Alergias, solicitudes especiales, decoración preferida, cumpleaños temático..."
                  value={formData.specialComments}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setFormData(prev => ({ ...prev, specialComments: value }));
                  }}
                  minRows={3}
                  variant="default"
                  radius="lg"
                  className="text-gray-900"
                  styles={{
                    input: {
                      border: '1.5px solid rgb(229 231 235 / 0.7)',
                      backgroundColor: 'rgb(255 255 255 / 0.5)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                      transition: 'all 300ms',
                      '&:hover': {
                        borderColor: 'rgb(251 113 133 / 0.5)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      },
                      '&:focus': {
                        borderColor: 'rgb(244 63 94)',
                      }
                    }
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        );

      case 'datetime':
        return (
          <motion.div
            key="datetime"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ¿Cuándo quieres celebrar?
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Selecciona la fecha y hora perfecta para tu celebración especial
              </p>
            </motion.div>
            
            {/* Date Selection */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  Fecha del evento
                  <span className="text-blue-500">*</span>
                </label>
                
                <div className="w-full">
                  {loadingAvailability ? (
                    <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg border border-gray-100/70 p-4 min-h-80 flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-gray-500 text-sm">Cargando disponibilidad...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <DatePicker
                        value={formData.eventDate}
                        onChange={(dateString: string | null) => {
                          const date = dateString ? new Date(dateString) : null;
                          setFormData(prev => ({ ...prev, eventDate: date }));
                        }}
                        minDate={new Date()}
                        size="lg"
                        getDayProps={(date: any) => {
                          const dateString = date?.toISOString ? date.toISOString().split('T')[0] : String(date);
                          const status = availability[dateString];
                          
                          if (status === 'unavailable') {
                            return {
                              disabled: true,
                              style: {
                                backgroundColor: '#fecaca',
                                color: '#dc2626',
                                textDecoration: 'line-through',
                                opacity: 0.8,
                                fontWeight: '500',
                                cursor: 'not-allowed'
                              }
                            };
                          }
                          if (status === 'limited') {
                            return {
                              style: {
                                backgroundColor: '#fef08a',
                                color: '#92400e',
                                fontWeight: '600',
                                border: '1px solid #d97706'
                              }
                            };
                          }
                          if (status === 'available') {
                            return {
                              style: {
                                backgroundColor: '#d1fae5',
                                color: '#15803d',
                                fontWeight: '600',
                                border: '1px solid #22c55e'
                              }
                            };
                          }
                          return {};
                        }}
                        className="w-full"
                        style={{
                          width: '100%'
                        }}
                      />
                      
                      {/* Enhanced Responsive Availability Legend */}
                      <Box mt="sm" p="md" className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm">
                        <Group gap="xs" mb="sm">
                          <Center className="w-2 h-2 bg-blue-500 rounded-full" />
                          <Text size="sm" fw={700}>
                            Disponibilidad:
                          </Text>
                        </Group>
                        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xs">
                          <Group gap="xs" p="xs" className="rounded-lg bg-emerald-50/80 border border-emerald-200/50">
                            <Center className="w-4 h-4 bg-emerald-200 rounded-full border border-emerald-400 border-2">
                              <Center className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                            </Center>
                            <Text size="xs" fw={600} c="green.8" className="truncate">
                              Disponible
                            </Text>
                          </Group>
                          <Group gap="xs" p="xs" className="rounded-lg bg-yellow-50/80 border border-yellow-200/50">
                            <Center className="w-4 h-4 bg-yellow-200 rounded-full border border-yellow-400 border-2">
                              <Center className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                            </Center>
                            <Text size="xs" fw={600} c="yellow.8" className="truncate">
                              Limitado
                            </Text>
                          </Group>
                          <Group gap="xs" p="xs" className="rounded-lg bg-red-50/80 border border-red-200/50">
                            <Center className="w-4 h-4 bg-red-200 rounded-full border border-red-400 border-2">
                              <Center className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            </Center>
                            <Text size="xs" fw={600} c="red.8" className="truncate">
                              No disponible
                            </Text>
                          </Group>
                        </SimpleGrid>
                      </Box>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Time Selection */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <label className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                Hora del evento
                <span className="text-blue-500">*</span>
              </label>
              
              {!formData.eventDate ? (
                <div className="p-6 bg-gradient-to-br from-gray-50/90 to-gray-100/90 backdrop-blur-sm border-2 border-dashed border-gray-300/70 rounded-xl text-center">
                  <CalendarDaysIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium text-sm">Primero selecciona una fecha</p>
                  <p className="text-gray-500 text-xs mt-1">Los horarios disponibles aparecerán aquí</p>
                </div>
              ) : loadingSlots ? (
                <div className="text-center p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                  <p className="text-blue-700 font-medium text-sm">Cargando horarios disponibles...</p>
                </div>
              ) : availableSlots && availableSlots.slots && availableSlots.slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                      className={`p-2 sm:p-3 rounded-xl border-1.5 transition-all duration-200 min-h-12 sm:min-h-16 ${
                        formData.eventTime === slot.time
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm shadow-lg'
                          : slot.available
                            ? 'border-gray-200/70 hover:border-blue-300 bg-white/50 backdrop-blur-lg hover:bg-blue-50/50'
                            : 'border-gray-200/70 bg-gray-50/50 backdrop-blur-sm opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`text-sm sm:text-base font-bold ${
                          formData.eventTime === slot.time
                            ? 'text-blue-600'
                            : slot.available
                              ? 'text-gray-900'
                              : 'text-gray-400'
                        }`}>
                          {slot.time}
                        </p>
                        {slot.available ? (
                          <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
                            <span className="hidden sm:inline">Disponible</span>
                            <span className="sm:hidden">✓</span>
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium mt-0.5 block">
                            <span className="hidden sm:inline">No disponible</span>
                            <span className="sm:hidden">✗</span>
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-sm border-1.5 border-amber-200/70 rounded-xl text-center">
                  <ClockIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-amber-800 font-bold text-base mb-1">Esta fecha no tiene horarios disponibles</p>
                  <p className="text-amber-800 font-semibold text-sm">💡 Intenta seleccionar otra fecha</p>
                </div>
              )}
            </motion.div>
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
            className="space-y-4 sm:space-y-6"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Elige tu paquete perfecto
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Selecciona el paquete que mejor se adapte a tu celebración
              </p>
            </motion.div>

            {/* Package Selection */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {loadingPackages ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <motion.div
                      key={pkg._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                      className={`p-4 rounded-xl border-1.5 cursor-pointer transition-all duration-300 ${
                        formData.packageId === pkg._id
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50/90 to-indigo-50/90 backdrop-blur-lg shadow-lg'
                          : 'border-gray-200/70 hover:border-purple-300 bg-white/50 backdrop-blur-lg hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-gray-900 mb-1">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-xs text-gray-600 mb-2">{pkg.description}</p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <UserGroupIcon className="w-3 h-3 text-purple-500" />
                            <span className="text-xs text-gray-700">Hasta {pkg.maxGuests} invitados</span>
                          </div>
                        </div>
                        {formData.packageId === pkg._id && (
                          <CheckIconSolid className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Entre semana:</span>
                          <span className="text-sm font-bold text-gray-900">{formatPrice(pkg.pricing.weekday)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Fin de semana:</span>
                          <span className="text-sm font-bold text-gray-900">{formatPrice(pkg.pricing.weekend)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
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
            className="space-y-4 sm:space-y-6"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Personaliza tu menú
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Agrega opciones de comida para hacer tu evento aún más especial
              </p>
            </motion.div>

            {/* Food Options */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {loadingOptions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : foodOptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
                  {foodOptions.map((food) => (
                    <motion.div
                      key={food._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        foodOptionId: prev.foodOptionId === food._id ? '' : food._id
                      }))}
                      className={`p-4 rounded-xl border-1.5 cursor-pointer transition-all duration-300 ${
                        formData.foodOptionId === food._id
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-lg shadow-lg'
                          : 'border-gray-200/70 hover:border-emerald-300 bg-white/50 backdrop-blur-lg hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">{food.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{food.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge size="sm" variant="light" className="bg-emerald-100 text-emerald-700 text-xs">
                              {food.category}
                            </Badge>
                            <span className="text-sm font-bold text-gray-900">{formatPrice(food.basePrice)}</span>
                          </div>
                        </div>
                        {formData.foodOptionId === food._id && (
                          <CheckIconSolid className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50/50 backdrop-blur-sm rounded-xl">
                  <p className="text-gray-500 text-sm">No hay opciones de comida disponibles en este momento</p>
                </div>
              )}
            </motion.div>

            {/* Theme Selection */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                Temas decorativos
                <span className="text-xs font-normal text-gray-500">(opcional)</span>
              </h2>
              
              {eventThemes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
                  {eventThemes.map((theme) => (
                    <motion.div
                      key={theme._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        eventThemeId: prev.eventThemeId === theme._id ? '' : theme._id,
                        selectedThemePackage: ''
                      }))}
                      className={`p-4 rounded-xl border-1.5 cursor-pointer transition-all duration-300 ${
                        formData.eventThemeId === theme._id
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-lg shadow-lg'
                          : 'border-gray-200/70 hover:border-emerald-300 bg-white/50 backdrop-blur-lg hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">{theme.name}</h3>
                          {theme.description && (
                            <p className="text-xs text-gray-600 mb-2">{theme.description}</p>
                          )}
                        </div>
                        {formData.eventThemeId === theme._id && (
                          <CheckIconSolid className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {formData.eventThemeId === theme._id && theme.packages.length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200/50">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Selecciona un paquete:</p>
                          {theme.packages.map((pkg) => (
                            <motion.button
                              key={pkg.name}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  selectedThemePackage: prev.selectedThemePackage === pkg.name ? '' : pkg.name
                                }));
                              }}
                              className={`w-full p-2 rounded-lg border text-left transition-all duration-200 ${
                                formData.selectedThemePackage === pkg.name
                                  ? 'border-emerald-400 bg-emerald-50/80'
                                  : 'border-gray-200/70 hover:border-emerald-300 bg-white/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-medium text-gray-900">{pkg.name}</p>
                                  <p className="text-xs text-gray-600">{pkg.pieces} piezas</p>
                                </div>
                                <span className="text-xs font-bold text-gray-900">{formatPrice(pkg.price)}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50/50 backdrop-blur-sm rounded-xl">
                  <p className="text-gray-500 text-sm">No hay temas decorativos disponibles en este momento</p>
                </div>
              )}
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
            transition={{ duration: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Servicios adicionales
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Agrega servicios extra para hacer tu celebración inolvidable
              </p>
            </motion.div>

            {/* Extra Services */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {loadingOptions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : extraServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
                  {extraServices.map((service) => (
                    <motion.div
                      key={service._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const isSelected = formData.selectedExtraServices.includes(service._id);
                        setFormData(prev => ({
                          ...prev,
                          selectedExtraServices: isSelected
                            ? prev.selectedExtraServices.filter(id => id !== service._id)
                            : [...prev.selectedExtraServices, service._id]
                        }));
                      }}
                      className={`p-4 rounded-xl border-1.5 cursor-pointer transition-all duration-300 ${
                        formData.selectedExtraServices.includes(service._id)
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-lg shadow-lg'
                          : 'border-gray-200/70 hover:border-amber-300 bg-white/50 backdrop-blur-lg hover:bg-amber-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">{service.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge size="sm" variant="light" className="bg-amber-100 text-amber-700 text-xs">
                              {service.category}
                            </Badge>
                            <span className="text-sm font-bold text-gray-900">{formatPrice(service.price)}</span>
                          </div>
                        </div>
                        {formData.selectedExtraServices.includes(service._id) && (
                          <CheckIconSolid className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50/50 backdrop-blur-sm rounded-xl">
                  <p className="text-gray-500 text-sm">No hay servicios adicionales disponibles en este momento</p>
                </div>
              )}
            </motion.div>
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
            transition={{ duration: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Método de pago
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-3">
                Selecciona cómo prefieres realizar el pago de tu reservación
              </p>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <RadioGroup
                value={formData.paymentMethod}
                onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'transfer' | 'cash' | 'card' }))}
              >
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border-1.5 transition-all duration-300 ${
                      formData.paymentMethod === 'transfer'
                        ? 'border-green-500 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-lg shadow-lg'
                        : 'border-gray-200/70 hover:border-green-300 bg-white/50 backdrop-blur-lg'
                    }`}
                  >
                    <Radio
                      value="transfer"
                      label={
                        <div className="flex items-center gap-3 w-full">
                          <BanknotesIcon className="w-5 h-5 text-green-500" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">Transferencia Bancaria</p>
                            <p className="text-xs text-gray-600">Pago seguro mediante transferencia</p>
                          </div>
                        </div>
                      }
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border-1.5 transition-all duration-300 ${
                      formData.paymentMethod === 'cash'
                        ? 'border-green-500 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-lg shadow-lg'
                        : 'border-gray-200/70 hover:border-green-300 bg-white/50 backdrop-blur-lg'
                    }`}
                  >
                    <Radio
                      value="cash"
                      label={
                        <div className="flex items-center gap-3 w-full">
                          <BanknotesIcon className="w-5 h-5 text-green-500" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">Efectivo</p>
                            <p className="text-xs text-gray-600">Pago en efectivo el día del evento</p>
                          </div>
                        </div>
                      }
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border-1.5 transition-all duration-300 ${
                      formData.paymentMethod === 'card'
                        ? 'border-green-500 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-lg shadow-lg'
                        : 'border-gray-200/70 hover:border-green-300 bg-white/50 backdrop-blur-lg'
                    }`}
                  >
                    <Radio
                      value="card"
                      label={
                        <div className="flex items-center gap-3 w-full">
                          <CreditCardIcon className="w-5 h-5 text-green-500" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">Tarjeta de Crédito/Débito</p>
                            <p className="text-xs text-gray-600">Pago con tarjeta bancaria</p>
                          </div>
                        </div>
                      }
                    />
                  </motion.div>
                </div>
              </RadioGroup>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-lg rounded-xl border border-green-200/70"
            >
              <h3 className="font-bold text-base text-gray-900 mb-3">Resumen de tu reservación</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Festejado/a:</span>
                  <span className="font-semibold text-gray-900">{formData.childName} ({formData.childAge} años)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-semibold text-gray-900">
                    {getEventDate()?.toLocaleDateString('es-ES') || 'Fecha no seleccionada'} a las {formData.eventTime}
                  </span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paquete:</span>
                    <span className="font-semibold text-gray-900">{selectedPackage.name}</span>
                  </div>
                )}
                <Divider className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-black text-green-600">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </motion.div>
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
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl"
            >
              <CheckIconSolid className="w-10 h-10 text-white" />
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 1.25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                ¡Reservación Confirmada!
              </h1>
              <p className="text-base text-gray-600 max-w-lg mx-auto">
                Tu reservación ha sido creada exitosamente. Recibirás un email de confirmación en breve.
              </p>
            </motion.div>

            {/* Reservation Details */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-50/90 to-green-50/90 backdrop-blur-lg rounded-xl p-6 border border-emerald-200/70 max-w-md mx-auto"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-4">Detalles de tu reservación</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID de Reservación:</span>
                  <span className="text-sm font-semibold text-gray-900">{reservationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Festejado/a:</span>
                  <span className="text-sm font-semibold text-gray-900">{formData.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getEventDate()?.toLocaleDateString('es-ES') || 'Fecha no seleccionada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hora:</span>
                  <span className="text-sm font-semibold text-gray-900">{formData.eventTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-lg font-bold text-emerald-600">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
            >
              <Button
                size="lg"
                onClick={generatePaymentSlip}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                radius="xl"
                leftSection={<DocumentTextIcon className="w-4 h-4" />}
              >
                Descargar ficha de pago
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/reservaciones')}
                className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold"
                radius="xl"
              >
                Ver mis reservaciones
              </Button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <motion.div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-rose-300 border-t-rose-600 rounded-full mx-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 font-medium text-sm"
          >
            Preparando tu experiencia...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Modern Header */}
      <motion.div
        initial={{ y: -6.25 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/reservaciones')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-sm">Volver</span>
            </motion.button>
            
            {/* Progress Indicator */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="hidden md:flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  {steps.map((step, index) => {
                    const isActive = currentStep === step.key;
                    const isCompleted = currentStepIndex > index;
                    
                    return (
                      <React.Fragment key={step.key}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center space-x-1.5"
                        >
                          <motion.div
                            animate={{
                              scale: isActive ? 1.1 : 1,
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                  ? 'bg-rose-500 text-white ring-2 ring-rose-200'
                                  : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckIconSolid className="w-3 h-3" />
                            ) : (
                              <span className="text-xs font-semibold">{index + 1}</span>
                            )}
                          </motion.div>
                          <div className={`text-xs font-medium ${
                            isActive ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </div>
                        </motion.div>
                        {index < steps.length - 1 && (
                          <div className="w-6 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{
                                width: currentStepIndex > index ? "100%" : "0%"
                              }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Progress */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-lg">
                      {React.createElement(steps[currentStepIndex].icon, { className: "w-4 h-4" })}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {steps[currentStepIndex].title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {steps[currentStepIndex].description}
                      </div>
                    </div>
                  </div>
                  <Badge
                    size="sm"
                    variant="light"
                    className="bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200 text-xs"
                  >
                    {currentStepIndex + 1} de {steps.length}
                  </Badge>
                </div>
                <Progress
                  value={((currentStepIndex + 1) / steps.length) * 100}
                  size="sm"
                  className="shadow-sm"
                  styles={{
                    root: { backgroundColor: 'rgb(229 231 235)' },
                    section: { background: 'linear-gradient(to right, rgb(251 113 133), rgb(219 39 119))' }
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AdminQuickNav variant="header" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 1.875 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl overflow-visible rounded-xl">
                <div className="p-6 lg:p-8 overflow-visible">
                  <AnimatePresence mode="wait">
                    {renderStepContent()}
                  </AnimatePresence>
                </div>
              </Card>

              {/* Navigation */}
              {currentStep !== 'confirmation' && (
                <motion.div
                  initial={{ opacity: 0, y: 1.25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 sm:mt-6 gap-3 sm:gap-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="order-2 sm:order-1"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      leftSection={<ArrowLeftIcon className="w-4 h-4" />}
                      onClick={handlePrevious}
                      disabled={currentStepIndex === 0}
                      className="w-full sm:w-auto sm:min-w-32 border-1.5 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold"
                      radius="xl"
                    >
                      Anterior
                    </Button>
                  </motion.div>

                  {currentStep === 'payment' ? (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="order-1 sm:order-2"
                    >
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        loading={loading}
                        className="w-full sm:w-auto sm:min-w-40 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all font-semibold"
                        radius="xl"
                      >
                        {loading ? 'Confirmando...' : '✨ Confirmar reserva'}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="order-1 sm:order-2"
                    >
                      <Button
                        size="lg"
                        rightSection={<ArrowRightIcon className="w-4 h-4" />}
                        onClick={handleNext}
                        disabled={!validateCurrentStep()}
                        className="w-full sm:w-auto sm:min-w-32 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all font-semibold disabled:opacity-50"
                        radius="xl"
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
              initial={{ opacity: 0, x: 1.875 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="sticky top-20"
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden">
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-600 rounded-xl flex items-center justify-center">
                      <ShoppingCartIcon className="w-3 h-3 text-white" />
                    </div>
                    Resumen
                  </motion.h3>
                  
                  <div className="space-y-3">
                    {/* Basic Info */}
                    {formData.childName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-gradient-to-r from-rose-50/90 to-pink-50/90 backdrop-blur-sm rounded-xl border border-rose-100/70"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <CakeIcon className="w-3 h-3 text-rose-500" />
                          <p className="text-xs font-semibold text-rose-700">Festejado/a</p>
                        </div>
                        <p className="font-bold text-gray-900 text-base">
                          {formData.childName} {formData.childAge && `(${formData.childAge} años)`}
                        </p>
                      </motion.div>
                    )}
                    
                    {formData.eventDate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl border border-blue-100/70"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <CalendarDaysIcon className="w-3 h-3 text-blue-500" />
                          <p className="text-xs font-semibold text-blue-700">Fecha y hora</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                          {getEventDate()?.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          }) || 'Fecha no seleccionada'}
                          {formData.eventTime && (
                            <span className="text-blue-600"> a las {formData.eventTime}</span>
                          )}
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Total */}
                  {(selectedPackage || selectedFood || selectedExtras.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 p-4 bg-gradient-to-br from-emerald-50/90 to-green-50/90 backdrop-blur-sm rounded-xl border border-emerald-200/70"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-base font-bold text-gray-900">Total estimado</span>
                        <motion.span
                          key={calculateTotal()}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                        >
                          {formatPrice(calculateTotal())}
                        </motion.span>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">Pesos mexicanos (MXN)</p>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}