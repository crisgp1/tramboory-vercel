'use client';

import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Paper,
  Container,
  Group,
  Button,
  Progress,
  Text,
  Stack,
  Alert,
  rem
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCheck,
  IconUser,
  IconCalendar,
  IconPackage,
  IconSparkles,
  IconCreditCard,
  IconConfetti,
  IconArrowLeft,
  IconArrowRight,
  IconAlertCircle
} from '@tabler/icons-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { MantineProvider } from '@mantine/core';
import { trambooryTheme } from '@/lib/theme/tramboory-theme';
import toast from 'react-hot-toast';
import ClientLayout from '../layout/ClientLayout';

// Form Data Interface - Aplicando Miller's Law (7±2 campos por step)
export interface FormData {
  // Basic Info (3 campos)
  childName: string;
  childAge: string;
  specialComments: string;

  // DateTime (2 campos)
  eventDate: Date | null;
  eventTime: string;

  // Package (1 campo)
  packageId: string;

  // Addons (4 campos max)
  foodOptionId: string;
  eventThemeId: string;
  selectedThemePackage: string;
  selectedExtraServices: string[];

  // Payment (1 campo)
  paymentMethod: 'transfer' | 'cash' | 'card';
}

// Steps siguiendo Chunking principle
const steps = [
  { label: 'Información', description: 'Datos básicos', icon: IconUser },
  { label: 'Fecha y Hora', description: 'Cuándo celebrar', icon: IconCalendar },
  { label: 'Paquete', description: 'Selecciona tu experiencia', icon: IconPackage },
  { label: 'Extras', description: 'Personaliza tu evento', icon: IconSparkles },
  { label: 'Pago', description: 'Método de pago', icon: IconCreditCard },
  { label: 'Confirmación', description: '¡Listo!', icon: IconConfetti }
];

// Persistent storage
const STORAGE_KEY = 'tramboory-booking-form';

const saveFormData = (data: FormData) => {
  try {
    const serializable = {
      ...data,
      eventDate: data.eventDate ? data.eventDate.toISOString() : null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.warn('Could not save form data:', error);
  }
};

const loadFormData = (): Partial<FormData> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    
    const parsed = JSON.parse(saved);
    if (parsed.eventDate) {
      parsed.eventDate = new Date(parsed.eventDate);
    }
    return parsed;
  } catch (error) {
    return {};
  }
};

export default function BookingWizard() {
  const { user } = useUser();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Initialize form with localStorage
  const [formData, setFormData] = useState<FormData>(() => {
    const savedData = loadFormData();
    return {
      childName: savedData.childName || '',
      childAge: savedData.childAge || '',
      specialComments: savedData.specialComments || '',
      eventDate: savedData.eventDate || null,
      eventTime: savedData.eventTime || '',
      packageId: savedData.packageId || '',
      foodOptionId: savedData.foodOptionId || '',
      eventThemeId: savedData.eventThemeId || '',
      selectedThemePackage: savedData.selectedThemePackage || '',
      selectedExtraServices: savedData.selectedExtraServices || [],
      paymentMethod: savedData.paymentMethod || 'transfer'
    };
  });

  // Auto-save
  useEffect(() => {
    if (activeStep < steps.length - 1) {
      saveFormData(formData);
    }
  }, [formData, activeStep]);

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return !!(formData.childName.trim() && formData.childAge);
      case 1: return !!(formData.eventDate && formData.eventTime);
      case 2: return !!formData.packageId;
      case 3: return true; // Optional
      case 4: return !!formData.paymentMethod;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (activeStep === steps.length - 2) {
      handleSubmit();
    } else {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setError('Error: No se pudo obtener tu información de usuario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate?.toISOString(),
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
        extraServices: formData.selectedExtraServices,
        eventThemeId: formData.eventThemeId || undefined,
        selectedThemePackage: formData.selectedThemePackage || undefined,
        paymentMethod: formData.paymentMethod
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReservationId(data.data._id);
        setActiveStep(steps.length - 1);
        toast.success('¡Reservación creada exitosamente!');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setError(data.error || data.message || 'Error al crear la reservación');
      }
    } catch (error) {
      setError('Error al crear la reservación');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (!user) {
    return (
      <MantineProvider theme={trambooryTheme}>
        <ClientLayout>
          <Container size="sm" py="xl">
            <Alert icon={<IconAlertCircle size="1rem" />} color="blue">
              Por favor inicia sesión para crear una reservación.
            </Alert>
          </Container>
        </ClientLayout>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={trambooryTheme}>
      <ClientLayout>
        <Container size="lg" py="md">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between">
              <Stack gap={0}>
                <Text size="xl" fw={700}>Nueva Reservación</Text>
                <Text c="dimmed" size="sm">
                  Paso {activeStep + 1} de {steps.length}
                </Text>
              </Stack>
              
              <Button
                variant="light"
                leftSection={<IconArrowLeft size="1rem" />}
                onClick={() => router.push('/reservaciones')}
                size="sm"
              >
                Volver
              </Button>
            </Group>

            {/* Progress - Desktop Stepper, Mobile Progress Bar */}
            {!isMobile ? (
              <Paper p="md" withBorder>
                <Stepper active={activeStep} size="sm">
                  {steps.slice(0, -1).map((step, index) => (
                    <Stepper.Step
                      key={index}
                      label={step.label}
                      description={step.description}
                      icon={<step.icon size="1rem" />}
                      completedIcon={<IconCheck size="1rem" />}
                    />
                  ))}
                </Stepper>
              </Paper>
            ) : (
              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {steps[activeStep]?.label}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {activeStep + 1}/{steps.length}
                    </Text>
                  </Group>
                  <Progress
                    value={((activeStep + 1) / steps.length) * 100}
                    size="sm"
                  />
                </Stack>
              </Paper>
            )}

            {/* Error */}
            {error && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                color="red" 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Step Content */}
            <Paper p="lg" withBorder>
              {/* Simplified step content for now */}
              <Stack gap="lg">
                <Text size="lg" fw={600}>
                  {steps[activeStep]?.label}
                </Text>
                <Text c="dimmed">
                  {steps[activeStep]?.description}
                </Text>

                {/* Placeholder content - components will be created separately */}
                {activeStep === 0 && (
                  <div>
                    <p>Formulario de información básica (próximamente)</p>
                    <p>Campos: Nombre del niño, edad, comentarios especiales</p>
                  </div>
                )}

                {activeStep === 1 && (
                  <div>
                    <p>Selección de fecha y hora (próximamente)</p>
                    <p>Campos: Fecha del evento, hora preferida</p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div>
                    <p>Selección de paquete (próximamente)</p>
                    <p>Opciones de paquetes disponibles</p>
                  </div>
                )}

                {activeStep === 3 && (
                  <div>
                    <p>Extras y complementos (próximamente)</p>
                    <p>Comida, temas, servicios adicionales</p>
                  </div>
                )}

                {activeStep === 4 && (
                  <div>
                    <p>Método de pago (próximamente)</p>
                    <p>Opciones: Transferencia, efectivo, tarjeta</p>
                  </div>
                )}

                {activeStep === 5 && (
                  <div>
                    <p>¡Reservación confirmada! 🎉</p>
                    <p>ID: {reservationId}</p>
                  </div>
                )}
              </Stack>
            </Paper>

            {/* Navigation */}
            {activeStep < steps.length - 1 && (
              <Group justify="space-between">
                <Button
                  variant="light"
                  leftSection={<IconArrowLeft size="1rem" />}
                  onClick={handlePrevious}
                  disabled={activeStep === 0}
                >
                  Anterior
                </Button>

                <Button
                  rightSection={<IconArrowRight size="1rem" />}
                  onClick={handleNext}
                  loading={loading}
                  disabled={!validateStep(activeStep)}
                  variant="gradient"
                  gradient={{ from: 'pink.5', to: 'violet.5' }}
                >
                  {activeStep === steps.length - 2 ? 'Confirmar Reserva' : 'Continuar'}
                </Button>
              </Group>
            )}
          </Stack>
        </Container>
      </ClientLayout>
    </MantineProvider>
  );
}