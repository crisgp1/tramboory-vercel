'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Select,
  Textarea,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Checkbox,
  ScrollArea
} from '@mantine/core';
import {
  IconCheck,
  IconUser,
  IconCake,
  IconCalendar,
  IconCurrencyDollar
} from '@tabler/icons-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { notifications } from '@mantine/notifications';
import "react-datepicker/dist/react-datepicker.css";
import "./calendar-styles.css";

// Register Spanish locale
registerLocale('es', es);

interface NewReservationModalProps {
  opened: boolean;
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
  opened,
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
          notifications.show({ title: 'Error', message: 'Error al cargar los paquetes - contacta al administrador', color: 'red' });
          return;
        }
        
        const activePackages = data.data.filter((pkg: PackageOption) => pkg.isActive);
        setPackages(activePackages);
      } catch (error) {
        console.error('Error loading packages:', error);
        notifications.show({ title: 'Error', message: 'Error al cargar los paquetes', color: 'red' });
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
        notifications.show({ title: 'Error', message: 'Error al cargar las opciones adicionales', color: 'red' });
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

    if (opened) {
      fetchPackages();
      fetchAdditionalOptions();
      fetchAvailability();
    }
  }, [opened]);

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
          notifications.show({ title: 'Error', message: 'Este día no está disponible para reservas', color: 'red' });
        } else if (data.data.isRestDay && data.data.restDayInfo) {
          notifications.show({ 
            message: `Día de descanso: se aplicará un cargo adicional de ${formatCurrency(data.data.restDayInfo.fee)}`,
            color: 'yellow',
            icon: '⚠️'
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
      notifications.show({ title: 'Error', message: 'Por favor completa todos los campos requeridos', color: 'red' });
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
        notifications.show({ title: 'Success', message: '¡Reserva creada exitosamente!', color: 'green' });
        onSuccess();
        handleClose();
      } else {
        console.error('Error response:', data);
        notifications.show({ title: 'Error', message: data.error || data.message || 'Error al crear la reserva', color: 'red' });
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      notifications.show({ title: 'Error', message: 'Error al crear la reserva', color: 'red' });
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
      opened={opened}
      onClose={handleClose}
      size="xl"
      title={null}
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
      styles={{
        content: {
          maxHeight: '90vh'
        },
        body: {
          padding: 0,
          maxHeight: 'calc(90vh - 140px)',
          overflowY: 'auto'
        }
      }}
    >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Group justify="space-between" w="100%">
            <Group gap="md">
              <div 
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'var(--mantine-color-gray-1)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconCurrencyDollar size={20} color="var(--mantine-color-gray-6)" />
              </div>
              <Stack gap={0}>
                <Title order={3} size="lg">
                  Nueva reserva
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  Paso {step} de 4
                </Text>
              </Stack>
            </Group>
          </Group>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <Stack gap="lg">
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Group gap="xs">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div 
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: stepNumber === step
                          ? 'var(--mantine-color-blue-6)'
                          : stepNumber < step
                          ? 'var(--mantine-color-green-5)'
                          : 'var(--mantine-color-gray-3)',
                        color: stepNumber <= step ? 'white' : 'var(--mantine-color-gray-6)'
                      }}
                    >
                      {step > stepNumber ? (
                        <IconCheck size={16} />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {stepNumber < 4 && (
                      <div 
                        style={{
                          width: 32,
                          height: 2,
                          backgroundColor: stepNumber < step ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-gray-3)'
                        }} 
                      />
                    )}
                  </React.Fragment>
                ))}
              </Group>
            </div>

            {/* Step Content */}
            <Stack gap="md">
              {step === 1 && (
                <Stack gap="md">
                  <Text size="sm" fw={500}>Información del cliente</Text>
                  <TextInput
                    label="Nombre completo *"
                    placeholder="Ej: María González López"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    leftSection={<IconUser size={16} />}
                  />
                  <TextInput
                    label="Correo electrónico *"
                    placeholder="maria@ejemplo.com"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  />
                  <TextInput
                    label="Teléfono *"
                    placeholder="55 1234 5678"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </Stack>
              )}

              {step === 2 && (
                <Stack gap="md">
                  <Text size="sm" fw={500}>Información del festejado</Text>
                  <TextInput
                    label="Nombre del niño/a *"
                    placeholder="Ej: Sofía"
                    value={formData.childName}
                    onChange={(e) => setFormData(prev => ({ ...prev, childName: e.target.value }))}
                    leftSection={<IconCake size={16} />}
                  />
                  <Select
                    label="Edad del festejado/a *"
                    placeholder="Selecciona la edad"
                    value={formData.childAge || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, childAge: value || '' }))}
                    data={Array.from({ length: 15 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `${i + 1} ${i + 1 === 1 ? 'año' : 'años'}`
                    }))}
                  />
                </Stack>
              )}

              {step === 3 && (
                <Stack gap="md">
                  <Text size="sm" fw={500}>Detalles del evento</Text>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
                    <Stack gap="sm">
                      <Text size="sm" fw={500}>Fecha del evento *</Text>
                      <div style={{ position: 'relative' }}>
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
                          popperPlacement="bottom-start"
                        />
                      </div>
                      <Group gap="md" mt="xs">
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, backgroundColor: 'var(--mantine-color-green-5)', borderRadius: '50%' }} />
                          <Text size="xs" c="dimmed">Disponible</Text>
                        </Group>
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, backgroundColor: 'var(--mantine-color-yellow-5)', borderRadius: '50%' }} />
                          <Text size="xs" c="dimmed">Limitado</Text>
                        </Group>
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, backgroundColor: 'var(--mantine-color-red-5)', borderRadius: '50%' }} />
                          <Text size="xs" c="dimmed">No disponible</Text>
                        </Group>
                      </Group>
                    </Stack>
                    <Stack gap="sm">
                      <Text size="sm" fw={500}>Hora del evento *</Text>
                      {!formData.eventDate ? (
                        <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                          <Text size="sm" ta="center" c="dimmed">Primero selecciona una fecha</Text>
                        </Card>
                      ) : availableBlocks.length === 0 ? (
                        <Stack gap="sm">
                          <Card withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-yellow-0)', borderColor: 'var(--mantine-color-yellow-3)' }}>
                            <Text size="sm" ta="center" c="yellow">No hay bloques configurados. Usando horarios por defecto.</Text>
                          </Card>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--mantine-spacing-xs)' }}>
                            {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                              <Button
                                key={time}
                                size="sm"
                                variant={formData.eventTime === time ? "filled" : "light"}
                                color={formData.eventTime === time ? "blue" : "gray"}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, eventTime: time }));
                                }}
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        </Stack>
                      ) : (
                        <Stack gap="sm">
                          {availableBlocks.map((block) => (
                            <Card key={block.blockName} withBorder p="sm">
                              <Text size="sm" fw={500} mb="xs">{block.blockName}</Text>
                              <Text size="xs" c="dimmed" mb="sm">
                                {block.startTime} - {block.endTime} (Duración: {block.duration} horas{block.halfHourBreak ? ' + 30 min despedida' : ''})
                              </Text>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--mantine-spacing-xs)' }}>
                                {block.slots.map((slot) => (
                                  <Button
                                    key={slot.time}
                                    size="sm"
                                    disabled={!slot.available}
                                    variant={formData.eventTime === slot.time ? "filled" : "light"}
                                    color={formData.eventTime === slot.time ? "blue" : "gray"}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, eventTime: slot.time }));
                                      setSelectedBlock(block.blockName);
                                    }}
                                  >
                                    <Stack gap={0} align="center">
                                      <Text size="xs" fw={500}>{slot.time}</Text>
                                      {slot.available && (
                                        <Text size="xs" opacity={0.8}>
                                          {slot.remainingCapacity} disponible{slot.remainingCapacity !== 1 ? 's' : ''}
                                        </Text>
                                      )}
                                    </Stack>
                                  </Button>
                                ))}
                              </div>
                            </Card>
                          ))}
                          {restDayInfo && (
                            <Card withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-orange-0)', borderColor: 'var(--mantine-color-orange-3)' }}>
                              <Text size="xs" c="orange">
                                <Text component="span" fw={600}>Nota:</Text> Este es un día de descanso ({restDayInfo.name}). 
                                Se aplicará un cargo adicional de {formatCurrency(restDayInfo.fee)}.
                              </Text>
                            </Card>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </div>
                  <Select
                    label="Paquete de celebración *"
                    placeholder={loadingPackages ? "Cargando paquetes..." : "Selecciona un paquete"}
                    value={formData.packageId || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, packageId: value || '' }))}
                    disabled={loadingPackages}
                    data={packages.map((pkg) => ({
                      value: pkg._id,
                      label: `${pkg.number ? `${pkg.number} - ` : ''}${pkg.name} - Entre semana: $${pkg.pricing?.weekday?.toLocaleString() || '0'} | Fin de semana: $${pkg.pricing?.weekend?.toLocaleString() || '0'}`
                    }))}
                  />
                </Stack>
              )}

              {step === 4 && (
                <Stack gap="lg">
                  <Text size="sm" fw={500}>Opciones adicionales</Text>
                  
                  {/* Food Options */}
                  <Select
                    label="Opción de alimento *"
                    placeholder={loadingOptions ? "Cargando opciones..." : "Selecciona una opción de alimento"}
                    value={formData.foodOptionId || ''}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, foodOptionId: value || '', selectedFoodExtras: [] }));
                    }}
                    disabled={loadingOptions}
                    data={foodOptions.map((option) => ({
                      value: option._id,
                      label: `${option.name} - ${option.description} - $${option.basePrice.toLocaleString()}`
                    }))}
                  />

                  {/* Food Extras */}
                  {formData.foodOptionId && (
                    <Stack gap="sm">
                      <Text size="sm" fw={500}>Extras de alimento</Text>
                      <Stack gap="xs">
                        {foodOptions
                          .find(option => option._id === formData.foodOptionId)
                          ?.extras.map((extra, index) => (
                            <Card key={index} withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                              <Group justify="space-between">
                                <Group gap="sm">
                                  <Checkbox
                                    checked={formData.selectedFoodExtras.includes(`${extra.name}-${extra.price}`)}
                                    onChange={(e) => {
                                      const extraKey = `${extra.name}-${extra.price}`;
                                      if (e.currentTarget.checked) {
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
                                  />
                                  <Text size="sm" fw={500}>
                                    {extra.name} {extra.isRequired && <Text component="span" c="red">*</Text>}
                                  </Text>
                                </Group>
                                <Text size="sm" c="dimmed">+${extra.price.toLocaleString()}</Text>
                              </Group>
                            </Card>
                          ))}
                      </Stack>
                    </Stack>
                  )}

                  {/* Event Themes */}
                  <Select
                    label="Tema del evento"
                    placeholder={loadingOptions ? "Cargando temas..." : "Selecciona un tema (opcional)"}
                    value={formData.eventThemeId || ''}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, eventThemeId: value || '', selectedThemePackage: '' }));
                    }}
                    disabled={loadingOptions}
                    clearable
                    data={eventThemes.map((theme) => ({
                      value: theme._id,
                      label: theme.description ? `${theme.name} - ${theme.description}` : theme.name
                    }))}
                  />

                  {/* Theme Packages */}
                  {formData.eventThemeId && (
                    <Select
                      label="Paquete del tema"
                      placeholder="Selecciona un paquete del tema"
                      value={formData.selectedThemePackage || ''}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, selectedThemePackage: value || '' }));
                      }}
                      data={(eventThemes
                        .find(theme => theme._id === formData.eventThemeId)
                        ?.packages || []).map((pkg) => ({
                          value: `${pkg.name}-${pkg.price}`,
                          label: `${pkg.name} - ${pkg.pieces} piezas - $${pkg.price.toLocaleString()}`
                        }))}
                    />
                  )}

                  {/* Extra Services */}
                  <Stack gap="sm">
                    <Text size="sm" fw={500}>Servicios extra</Text>
                    <ScrollArea h={200}>
                      <Stack gap="xs">
                        {extraServices.map((service) => (
                          <Card key={service._id} withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                            <Group justify="space-between">
                              <Group gap="sm">
                                <Checkbox
                                  checked={formData.selectedExtraServices.includes(service._id)}
                                  onChange={(e) => {
                                    if (e.currentTarget.checked) {
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
                                />
                                <Stack gap={0}>
                                  <Text size="sm" fw={500}>{service.name}</Text>
                                  <Text size="xs" c="dimmed">{service.description}</Text>
                                </Stack>
                              </Group>
                              <Text size="sm" c="dimmed">+${service.price.toLocaleString()}</Text>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Stack>

                  {/* Special Comments */}
                  <Textarea
                    label="Comentarios especiales"
                    placeholder="Solicitudes especiales, alergias, decoración específica, etc. (opcional)"
                    value={formData.specialComments}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialComments: e.target.value }))}
                    minRows={2}
                  />
                </Stack>
              )}
            </Stack>
          </Stack>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid var(--mantine-color-gray-2)', 
          backgroundColor: 'var(--mantine-color-gray-0)' 
        }}>
          <Group justify="space-between" w="100%">
            <Group gap="sm">
              {step > 1 && (
                <Button
                  variant="light"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  size="sm"
                  c="dimmed"
                >
                  Anterior
                </Button>
              )}
            </Group>
            
            <Group gap="sm">
              <Button
                variant="light"
                onClick={handleClose}
                disabled={loading}
                size="sm"
                c="dimmed"
              >
                Cancelar
              </Button>
              
              {step < 4 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !validateStep1()) {
                      notifications.show({ title: 'Error', message: 'Completa todos los campos del cliente', color: 'red' });
                      return;
                    }
                    if (step === 2 && !validateStep2()) {
                      notifications.show({ title: 'Error', message: 'Completa la información del festejado/a', color: 'red' });
                      return;
                    }
                    if (step === 3 && !validateStep3()) {
                      notifications.show({ title: 'Error', message: 'Completa los detalles del evento', color: 'red' });
                      return;
                    }
                    setStep(step + 1);
                  }}
                  size="sm"
                  color="blue"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  size="sm"
                  color="blue"
                >
                  {loading ? 'Creando...' : 'Crear reserva'}
                </Button>
              )}
            </Group>
          </Group>
        </div>
    </Modal>
  );
}