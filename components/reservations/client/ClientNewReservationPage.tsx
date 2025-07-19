'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
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
  PrinterIcon
} from '@heroicons/react/24/outline';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";
import "../calendar-styles.css";

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

type Step = 'basic' | 'package' | 'food' | 'extras' | 'payment' | 'confirmation';

export default function ClientNewReservationPage() {
  const { user } = useUser();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
  const [availableBlocks, setAvailableBlocks] = useState<TimeBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [restDayInfo, setRestDayInfo] = useState<any>(null);

  const steps: { key: Step; title: string; icon: any }[] = [
    { key: 'basic', title: 'Información Básica', icon: CakeIcon },
    { key: 'package', title: 'Paquete', icon: SparklesIcon },
    { key: 'food', title: 'Comida & Tema', icon: HeartIcon },
    { key: 'extras', title: 'Extras', icon: PlusIcon },
    { key: 'payment', title: 'Método de Pago', icon: CreditCardIcon },
    { key: 'confirmation', title: 'Confirmación', icon: CheckIcon }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  useEffect(() => {
    fetchPackages();
    fetchAdditionalOptions();
    fetchAvailability();
  }, []);
  
  useEffect(() => {
    if (formData.eventDate) {
      fetchAvailableBlocks(formData.eventDate);
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
      
      // Improved logic: ensure most dates are available for testing
      if (date.getDay() === 0 || date.getDay() === 6) {
        // Weekends: 80% available, 15% limited, 5% unavailable
        const rand = Math.random();
        if (rand > 0.95) {
          mockAvailability[dateKey] = 'unavailable';
        } else if (rand > 0.8) {
          mockAvailability[dateKey] = 'limited';
        } else {
          mockAvailability[dateKey] = 'available';
        }
      } else {
        // Weekdays: 90% available, 8% limited, 2% unavailable
        const rand = Math.random();
        if (rand > 0.98) {
          mockAvailability[dateKey] = 'unavailable';
        } else if (rand > 0.9) {
          mockAvailability[dateKey] = 'limited';
        } else {
          mockAvailability[dateKey] = 'available';
        }
      }
    }
    
    setAvailability(mockAvailability);
  };
  
  const fetchAvailableBlocks = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/reservations/available-blocks?date=${dateStr}`);
      const data = await response.json();
      
      console.log('Client fetchAvailableBlocks debug:', {
        date: dateStr,
        dayOfWeek: date.getDay(),
        response: data
      });
      
      if (data.success) {
        const blocks = data.data.blocks || [];
        setAvailableBlocks(blocks);
        setRestDayInfo(data.data.restDayInfo);
        
        console.log('Blocks loaded:', {
          blocksCount: blocks.length,
          blocks: blocks.map((b: TimeBlock) => ({
            name: b.blockName,
            slotsCount: b.slots?.length || 0,
            slots: b.slots
          }))
        });
        
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

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic':
        const isValid = !!(formData.childName.trim() && formData.childAge && formData.eventDate && formData.eventTime);
        if (!isValid) {
          console.log('Validation failed:', {
            childName: formData.childName.trim(),
            childAge: formData.childAge,
            eventDate: formData.eventDate,
            eventTime: formData.eventTime,
            availableBlocks: availableBlocks.length
          });
        }
        return isValid;
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
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].key);
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
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CakeIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Información del Festejado/a</h2>
              <p className="text-gray-600">Cuéntanos sobre quien va a celebrar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nombre del niño/a *
                </label>
                <Input
                  placeholder="Ej: Sofía"
                  value={formData.childName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, childName: value }))}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-gray-900 text-lg",
                    inputWrapper: "border-2 border-pink-200 hover:border-pink-300 focus-within:border-pink-500 bg-white"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Edad del festejado/a *
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
                    trigger: "border-2 border-pink-200 hover:border-pink-300 focus-within:border-pink-500 bg-white",
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                    withPortal={true}
                    shouldCloseOnSelect={true}
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Hora del evento *
                </label>
                {!formData.eventDate ? (
                  <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                    <p className="text-gray-600">Primero selecciona una fecha</p>
                  </div>
                ) : availableBlocks.length === 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
                      <p className="text-yellow-800">No hay bloques configurados. Usando horarios por defecto.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                        <Button
                          key={time}
                          size="sm"
                          variant={formData.eventTime === time ? "solid" : "bordered"}
                          color={formData.eventTime === time ? "primary" : "default"}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, eventTime: time }));
                          }}
                          className={formData.eventTime === time ? 'bg-pink-500 text-white' : 'border-pink-300 hover:bg-pink-50'}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableBlocks.map((block) => (
                      <div key={block.blockName} className="border-2 border-pink-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{block.blockName}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Horario: {block.startTime} - {block.endTime} (Duración: {block.duration} horas{block.halfHourBreak ? ' + 30 min despedida' : ''})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                                    ? 'bg-pink-500 text-white' 
                                    : 'border-pink-300 hover:bg-pink-50'
                                  : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="text-center">
                                <p className="font-medium">{slot.time}</p>
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
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
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
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Comentarios especiales
              </label>
              <Textarea
                placeholder="Solicitudes especiales, alergias, decoración específica, etc. (opcional)"
                value={formData.specialComments}
                onValueChange={(value) => setFormData(prev => ({ ...prev, specialComments: value }))}
                minRows={3}
                variant="bordered"
                classNames={{
                  input: "text-gray-900",
                  inputWrapper: "border-2 border-pink-200 hover:border-pink-300 focus-within:border-pink-500 bg-white"
                }}
              />
            </div>
          </div>
        );

      case 'package':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige tu Paquete</h2>
              <p className="text-gray-600">Selecciona el paquete perfecto para tu celebración</p>
            </div>
            
            {loadingPackages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando paquetes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <Card
                    key={pkg._id}
                    isPressable
                    onPress={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                    className={`border-2 transition-all duration-300 hover:shadow-lg ${
                      formData.packageId === pkg._id
                        ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {pkg.number ? `${pkg.number} - ` : ''}{pkg.name}
                          </h3>
                          {pkg.description && (
                            <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                          )}
                          <p className="text-gray-600 text-sm">
                            Máximo {pkg.maxGuests} invitados
                          </p>
                        </div>
                        {formData.packageId === pkg._id && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Entre semana:</span>
                          <span className="font-semibold text-green-600">
                            ${pkg.pricing?.weekday?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Fin de semana:</span>
                          <span className="font-semibold text-green-600">
                            ${pkg.pricing?.weekend?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'food':
        return (
          <div className="space-y-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Comida y Tema</h2>
              <p className="text-gray-600">Personaliza la experiencia gastronómica y temática (opcional)</p>
            </div>
            
            {/* Food Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de Comida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foodOptions.map((option) => (
                  <Card
                    key={option._id}
                    isPressable
                    onPress={() => setFormData(prev => ({ ...prev, foodOptionId: option._id }))}
                    className={`border-2 transition-all duration-300 ${
                      formData.foodOptionId === option._id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          <p className="text-sm font-semibold text-green-600">
                            ${option.basePrice.toLocaleString()}
                          </p>
                        </div>
                        {formData.foodOptionId === option._id && (
                          <CheckIcon className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            {/* Event Themes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temas de Evento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventThemes.map((theme) => (
                  <Card
                    key={theme._id}
                    isPressable
                    onPress={() => setFormData(prev => ({ ...prev, eventThemeId: theme._id, selectedThemePackage: '' }))}
                    className={`border-2 transition-all duration-300 ${
                      formData.eventThemeId === theme._id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                          {theme.description && (
                            <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                          )}
                        </div>
                        {formData.eventThemeId === theme._id && (
                          <CheckIcon className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      
                      {formData.eventThemeId === theme._id && theme.packages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selecciona un paquete:</p>
                          <div className="space-y-2">
                            {theme.packages.map((pkg) => (
                              <div
                                key={pkg.name}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  formData.selectedThemePackage === pkg.name
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, selectedThemePackage: pkg.name }))}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">{pkg.name}</p>
                                    <p className="text-sm text-gray-600">{pkg.pieces} piezas</p>
                                  </div>
                                  <p className="font-semibold text-green-600">
                                    ${pkg.price.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'extras':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Servicios Extras</h2>
              <p className="text-gray-600">Agrega servicios adicionales para hacer tu evento aún más especial</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extraServices.map((service) => (
                <Card
                  key={service._id}
                  isPressable
                  onPress={() => {
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
                  className={`border-2 transition-all duration-300 ${
                    formData.selectedExtraServices.includes(service._id)
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="secondary" variant="flat">
                            {service.category}
                          </Chip>
                          <span className="text-sm font-semibold text-green-600">
                            ${service.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {formData.selectedExtraServices.includes(service._id) && (
                        <CheckIcon className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {formData.selectedExtraServices.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicios Seleccionados</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExtras.map((service) => (
                    <Chip
                      key={service._id}
                      onClose={() => removeExtraService(service._id)}
                      variant="flat"
                      color="primary"
                    >
                      {service.name} - ${service.price.toLocaleString()}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Método de Pago</h2>
              <p className="text-gray-600">Selecciona cómo prefieres realizar el pago</p>
            </div>

            {/* Resumen de la reserva */}
            <Card className="border-2 border-gray-200">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de tu Reserva</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Festejado/a:</span>
                    <span className="font-medium">{formData.childName} ({formData.childAge} años)</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fecha y hora:</span>
                    <span className="font-medium">
                      {formData.eventDate?.toLocaleDateString('es-ES')} a las {formData.eventTime}
                    </span>
                  </div>
                  
                  {selectedPackage && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paquete:</span>
                      <span className="font-medium">{selectedPackage.name}</span>
                    </div>
                  )}
                  
                  {selectedFood && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Comida:</span>
                      <span className="font-medium">{selectedFood.name}</span>
                    </div>
                  )}
                  
                  {selectedTheme && formData.selectedThemePackage && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tema:</span>
                      <span className="font-medium">{selectedTheme.name} - {formData.selectedThemePackage}</span>
                    </div>
                  )}
                  
                  {selectedExtras.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Extras:</span>
                      <div className="text-right">
                        {selectedExtras.map((extra, index) => (
                          <div key={extra._id} className="font-medium">
                            {extra.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Divider className="my-4" />
                
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(calculateTotal())}</span>
                </div>
              </CardBody>
            </Card>

            {/* Métodos de pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona tu método de pago</h3>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'transfer' | 'cash' | 'card' }))}
              >
                <Radio value="transfer" className="mb-3">
                  <div className="flex items-center gap-3">
                    <BanknotesIcon className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium">Transferencia Bancaria</p>
                      <p className="text-sm text-gray-600">Pago seguro mediante transferencia</p>
                    </div>
                  </div>
                </Radio>
                
                <Radio value="cash" className="mb-3">
                  <div className="flex items-center gap-3">
                    <BanknotesIcon className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium">Efectivo</p>
                      <p className="text-sm text-gray-600">Pago en efectivo el día del evento</p>
                    </div>
                  </div>
                </Radio>
                
                <Radio value="card">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="font-medium">Tarjeta de Crédito/Débito</p>
                      <p className="text-sm text-gray-600">Pago con tarjeta el día del evento</p>
                    </div>
                  </div>
                </Radio>
              </RadioGroup>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
              <p className="text-gray-600">Tu reserva ha sido creada exitosamente</p>
            </div>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardBody className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    ¡Felicidades! Tu evento está reservado
                  </h3>
                  <p className="text-green-700">
                    Hemos enviado los detalles de tu reserva a tu correo electrónico
                  </p>
                </div>

                {reservationId && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ID de Reserva:</span>
                      <span className="font-mono font-bold text-gray-900">{reservationId}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Festejado/a:</span>
                    <span className="font-medium text-gray-900">{formData.childName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Fecha:</span>
                    <span className="font-medium text-gray-900">
                      {formData.eventDate?.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Hora:</span>
                    <span className="font-medium text-gray-900">{formData.eventTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total:</span>
                    <span className="font-bold text-green-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                color="primary"
                variant="solid"
                size="lg"
                startContent={<DocumentTextIcon className="w-5 h-5" />}
                onPress={generatePaymentSlip}
                className="flex-1"
              >
                Descargar Ficha de Pago
              </Button>
              
              <Button
                color="secondary"
                variant="bordered"
                size="lg"
                startContent={<CalendarDaysIcon className="w-5 h-5" />}
                onPress={() => router.push('/reservaciones')}
                className="flex-1"
              >
                Ver Mis Reservas
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>¿Necesitas hacer cambios? Contáctanos:</p>
              <p className="font-medium">📞 (55) 1234-5678 | 📧 info@tramboory.com</p>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-pink-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Nueva Reservación
          </h1>
          <p className="text-gray-600">Crea la celebración perfecta paso a paso</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = currentStepIndex > index;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center max-w-20 ${
                      isActive ? 'text-purple-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardBody className="p-8">
              {renderStepContent()}
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && (
            <div className="flex justify-between mt-8">
              <Button
                variant="bordered"
                size="lg"
                startContent={<ArrowLeftIcon className="w-5 h-5" />}
                onPress={handlePrevious}
                isDisabled={currentStepIndex === 0}
                className="min-w-32"
              >
                Anterior
              </Button>

              {currentStep === 'payment' ? (
                <Button
                  color="success"
                  size="lg"
                  endContent={<CheckIcon className="w-5 h-5" />}
                  onPress={handleSubmit}
                  isLoading={loading}
                  className="min-w-32"
                >
                  {loading ? 'Creando...' : 'Confirmar Reserva'}
                </Button>
              ) : (
                <Button
                  color="primary"
                  size="lg"
                  endContent={<ArrowRightIcon className="w-5 h-5" />}
                  onPress={handleNext}
                  className="min-w-32"
                >
                  Siguiente
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
                