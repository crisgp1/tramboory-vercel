'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Card,
  Badge,
  Text,
  Stack,
  Group,
  ThemeIcon,
  Divider,
  FileInput,
  TextInput,
  Textarea,
  Menu,
  Title,
  Grid,
  Box,
  Paper,
  Alert
} from '@mantine/core';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CakeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CreditCardIcon,
  PhotoIcon,
  CheckCircleIcon,
  CalendarIcon,
  InformationCircleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Reservation } from '@/types/reservation';
import { exportToCalendar } from '@/lib/calendar-export';
import { notifications } from '@mantine/notifications';

interface ClientReservationModalProps {
  opened: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export default function ClientReservationModal({
  opened,
  onClose,
  reservation
}: ClientReservationModalProps) {
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  if (!reservation) return null;

  const getStatusConfig = (status: string, paymentStatus?: string) => {
    // If reservation is pending but has payment verification status, show that instead
    if (status === 'pending' && paymentStatus) {
      switch (paymentStatus) {
        case 'verifying':
          return { color: 'blue', label: 'Verificando pago' };
        case 'verified':
          return { color: 'green', label: 'Pago verificado' };
        case 'rejected':
          return { color: 'orange', label: 'Pago rechazado' };
        case 'uploaded':
          return { color: 'blue', label: 'Verificando pago' };
        case 'partial':
          return { color: 'orange', label: 'Anticipo Recibido' };
        case 'paid':
          return { color: 'green', label: 'Confirmada' };
      }
    }

    // Default status handling
    switch (status) {
      case 'confirmed':
        return { color: 'green', label: 'Confirmada' };
      case 'pending':
        return { color: 'yellow', label: 'Pendiente' };
      case 'cancelled':
        return { color: 'red', label: 'Cancelada' };
      case 'completed':
        return { color: 'blue', label: 'Completada' };
      default:
        return { color: 'gray', label: status };
    }
  };

  const getPaymentStatusConfig = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'uploaded':
      case 'verifying':
        return { 
          color: 'blue', 
          label: 'Verificando pago', 
          icon: '⏳',
          description: 'Tu comprobante está siendo revisado por nuestro equipo.'
        };
      case 'verified':
        return { 
          color: 'green', 
          label: 'Pago verificado', 
          icon: '✅',
          description: 'El pago ha sido confirmado exitosamente.'
        };
      case 'rejected':
        return { 
          color: 'red', 
          label: 'Pago rechazado', 
          icon: '❌',
          description: 'El comprobante no pudo ser verificado. Contacta soporte.'
        };
      case 'partial':
        return { 
          color: 'orange', 
          label: 'Anticipo recibido', 
          icon: '💰',
          description: 'Se ha recibido el anticipo. Sube el comprobante del pago restante para completar la reservación.'
        };
      default:
        return null;
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
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleCalendarExport = (provider: 'google' | 'outlook' | 'yahoo' | 'ical') => {
    try {
      exportToCalendar(reservation, provider);
      notifications.show({ 
        title: 'Éxito', 
        message: `Evento exportado a ${provider === 'ical' ? 'calendario' : provider}`, 
        color: 'green' 
      });
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      notifications.show({ 
        title: 'Error', 
        message: 'Error al exportar el evento', 
        color: 'red' 
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentScreenshot) {
      notifications.show({
        title: 'Error',
        message: 'Por favor selecciona una captura de pantalla del pago',
        color: 'red'
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('paymentProof', paymentScreenshot);
      formData.append('reference', paymentReference || '');
      formData.append('notes', paymentNotes || '');
      formData.append('reservationId', reservation._id);

      console.log('Uploading payment proof for reservation:', reservation._id);

      const response = await fetch('/api/reservations/payment-proof', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      let result;
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Respuesta del servidor inválida');
      }
      
      console.log('Response data:', result);

      if (response.ok && result.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Comprobante enviado. Procesando verificación...',
          color: 'green'
        });
        
        // Update reservation status locally to show verifying state
        if (reservation) {
          reservation.paymentStatus = 'verifying';
          reservation.paymentProof = {
            filename: paymentScreenshot.name,
            uploadedAt: new Date().toISOString(),
            reference: paymentReference,
            notes: paymentNotes
          };
        }
        
        // Reset form
        setPaymentScreenshot(null);
        setPaymentReference('');
        setPaymentNotes('');
        setShowPaymentSection(false);
      } else {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Payment upload error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al enviar el comprobante de pago',
        color: 'red'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const calendarOptions = [
    { key: 'google', label: 'Google Calendar', icon: '📅' },
    { key: 'outlook', label: 'Outlook', icon: '📧' },
    { key: 'yahoo', label: 'Yahoo Calendar', icon: '🟣' },
    { key: 'ical', label: 'Descargar iCal', icon: '📋' }
  ];

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title="Detalles de la Reservación"
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Header with status */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} mb="xs">Reservación #{reservation._id.slice(-6).toUpperCase()}</Title>
            <Text size="sm" c="dimmed">
              Creada el {new Date(reservation.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </div>
          <Badge color={getStatusConfig(reservation.status, reservation.paymentStatus).color} size="lg">
            {getStatusConfig(reservation.status, reservation.paymentStatus).label}
          </Badge>
        </Group>

        <Divider />

        {/* Event Details */}
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <SparklesIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              Fiesta de {reservation.child.name}
            </Group>
          </Title>

          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size="xs" variant="light" color="pink">
                  <CakeIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Cumpleañero</Text>
                  <Text size="sm" c="dimmed">
                    {reservation.child.name} ({reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'})
                  </Text>
                </div>
              </Group>
            </Grid.Col>

            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size="xs" variant="light" color="blue">
                  <CalendarDaysIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Fecha</Text>
                  <Text size="sm" c="dimmed">{formatDate(reservation.eventDate)}</Text>
                </div>
              </Group>
            </Grid.Col>

            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size="xs" variant="light" color="blue">
                  <ClockIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Hora</Text>
                  <Text size="sm" c="dimmed">{reservation.eventTime}</Text>
                </div>
              </Group>
            </Grid.Col>

            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size="xs" variant="light" color="purple">
                  <UserIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Invitados</Text>
                  <Text size="sm" c="dimmed">
                    {reservation.guestCount?.adults || 0} adultos, {reservation.guestCount?.kids || 0} niños
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Package Details */}
        {reservation.package && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="purple">
                  <SparklesIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Paquete Seleccionado
              </Group>
            </Title>
            <Text fw={500}>{reservation.package.name}</Text>
            <Text size="sm" c="dimmed">Hasta {reservation.package.maxGuests} invitados</Text>
          </Paper>
        )}

        {/* Food Options */}
        {reservation.foodOption && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="orange">
                  <CakeIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Opciones de Alimentos
              </Group>
            </Title>
            <Text fw={500} mb="xs">{reservation.foodOption.name}</Text>
            
            {/* Food Upgrades */}
            {reservation.foodOption.selectedExtras && reservation.foodOption.selectedExtras.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">Extras seleccionados:</Text>
                <Stack gap="xs">
                  {reservation.foodOption.selectedExtras.map((extra, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">• {extra.name}</Text>
                      <Text size="sm" c="dimmed">+{formatPrice(extra.price)}</Text>
                    </Group>
                  ))}
                </Stack>
              </div>
            )}

            {/* Beverage Selection */}
            {reservation.selectedDrink && (
              <div style={{ marginTop: '12px' }}>
                <Text size="sm" fw={500} mb="xs">Bebida seleccionada:</Text>
                <Text size="sm" c="dimmed">
                  {reservation.selectedDrink === 'agua-fresca' ? 'Agua Fresca (Horchata)' : 
                   reservation.selectedDrink === 'refresco-refill' ? 'Refresco Refill (Coca-Cola, Sprite, Fanta)' : 
                   reservation.selectedDrink}
                </Text>
              </div>
            )}
          </Paper>
        )}

        {/* Guest Count Details */}
        {reservation.guestCount && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <UserIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Detalles de Invitados
              </Group>
            </Title>
            
            <Grid>
              <Grid.Col span={6}>
                <Group gap="xs">
                  <ThemeIcon size="xs" variant="light" color="blue">
                    <UserIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>Adultos</Text>
                    <Text size="sm" c="dimmed">{reservation.guestCount.adults}</Text>
                  </div>
                </Group>
              </Grid.Col>

              <Grid.Col span={6}>
                <Group gap="xs">
                  <ThemeIcon size="xs" variant="light" color="pink">
                    <UserIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>Niños</Text>
                    <Text size="sm" c="dimmed">{reservation.guestCount.kids}</Text>
                  </div>
                </Group>
              </Grid.Col>
            </Grid>
            
            <Text size="xs" c="dimmed" mt="sm">
              Total: {(reservation.guestCount.adults + reservation.guestCount.kids)} invitados
            </Text>
          </Paper>
        )}

        {/* Theme Selection */}
        {reservation.eventTheme && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="pink">
                  <SparklesIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Temática del Evento
              </Group>
            </Title>
            <Text fw={500} mb="xs">{reservation.eventTheme.name}</Text>
            <Text size="sm" c="dimmed" mb="sm">Tema: {reservation.eventTheme.selectedTheme}</Text>
            
            {reservation.eventTheme.selectedPackage && (
              <div>
                <Text size="sm" fw={500} mb="xs">Paquete temático:</Text>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{reservation.eventTheme.selectedPackage.name}</Text>
                  <Text size="sm" c="dimmed">{formatPrice(reservation.eventTheme.selectedPackage.price)}</Text>
                </Group>
                <Text size="xs" c="dimmed">{reservation.eventTheme.selectedPackage.pieces} piezas</Text>
              </div>
            )}
          </Paper>
        )}

        {/* Extra Services */}
        {reservation.extraServices && reservation.extraServices.length > 0 && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="green">
                  <SparklesIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Servicios Extras
              </Group>
            </Title>
            <Stack gap="xs">
              {reservation.extraServices.map((service, index) => (
                <Group key={index} justify="space-between">
                  <div>
                    <Text size="sm">{service.name}</Text>
                    {service.quantity > 1 && (
                      <Text size="xs" c="dimmed">Cantidad: {service.quantity}</Text>
                    )}
                  </div>
                  <Text size="sm" fw={500}>{formatPrice(service.price * service.quantity)}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Customer Info */}
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <UserIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              Información de Contacto
            </Group>
          </Title>
          
          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs">
                <ThemeIcon size="xs" variant="light" color="blue">
                  <UserIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Nombre</Text>
                  <Text size="sm" c="dimmed">{reservation.customer.name}</Text>
                </div>
              </Group>
            </Grid.Col>

            <Grid.Col span={6}>
              <Group gap="xs">
                <ThemeIcon size="xs" variant="light" color="blue">
                  <EnvelopeIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Email</Text>
                  <Text size="sm" c="dimmed">{reservation.customer.email}</Text>
                </div>
              </Group>
            </Grid.Col>

            {reservation.customer.phone && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <ThemeIcon size="xs" variant="light" color="blue">
                    <PhoneIcon style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>Teléfono</Text>
                    <Text size="sm" c="dimmed">{reservation.customer.phone}</Text>
                  </div>
                </Group>
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        {/* Pricing */}
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="green">
                <CurrencyDollarIcon style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              Resumen de Precios
            </Group>
          </Title>
          
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Paquete base:</Text>
              <Text size="sm" fw={500}>{formatPrice(reservation.pricing?.packagePrice || 0)}</Text>
            </Group>
            
            {(reservation.pricing?.foodPrice || 0) > 0 && (
              <Group justify="space-between">
                <Text size="sm">Alimentos:</Text>
                <Text size="sm" fw={500}>{formatPrice(reservation.pricing.foodPrice)}</Text>
              </Group>
            )}
            
            {(reservation.pricing?.themePrice || 0) > 0 && (
              <Group justify="space-between">
                <Text size="sm">Temática:</Text>
                <Text size="sm" fw={500}>{formatPrice(reservation.pricing.themePrice)}</Text>
              </Group>
            )}
            
            {(reservation.pricing?.extrasPrice || 0) > 0 && (
              <Group justify="space-between">
                <Text size="sm">Extras:</Text>
                <Text size="sm" fw={500}>{formatPrice(reservation.pricing.extrasPrice)}</Text>
              </Group>
            )}

            <Divider />
            
            <Group justify="space-between">
              <Text fw={700}>Total:</Text>
              <Text size="lg" fw={700} c="green">
                {formatPrice(reservation.pricing?.total || 0)}
              </Text>
            </Group>
          </Stack>
        </Paper>

        {/* Special Comments */}
        {reservation.specialComments && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="orange">
                  <ChatBubbleLeftRightIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Comentarios Especiales
              </Group>
            </Title>
            <Text size="sm">{reservation.specialComments}</Text>
          </Paper>
        )}

        {/* Payment Section */}
        {reservation.status === 'pending' && (
          <Paper p="md" radius="md" withBorder>
            <Title order={4} mb="sm">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <CreditCardIcon style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                Información de Pago
              </Group>
            </Title>

            {/* Payment Status Display */}
            {(() => {
              const paymentStatusConfig = getPaymentStatusConfig(reservation.paymentStatus);
              
              if (paymentStatusConfig) {
                return (
                  <Alert 
                    icon={<span style={{ fontSize: '16px' }}>{paymentStatusConfig.icon}</span>} 
                    color={paymentStatusConfig.color} 
                    mb="md"
                    title={paymentStatusConfig.label}
                  >
                    {paymentStatusConfig.description}
                    
                    {reservation.paymentProof && (
                      <div style={{ marginTop: '8px' }}>
                        <Text size="xs" c="dimmed">
                          Subido: {new Date(reservation.paymentProof.uploadedAt).toLocaleString('es-ES')}
                        </Text>
                        {reservation.paymentProof.reference && (
                          <Text size="xs" c="dimmed">
                            Referencia: {reservation.paymentProof.reference}
                          </Text>
                        )}
                      </div>
                    )}
                  </Alert>
                );
              }
              
              return (
                <Alert icon={<InformationCircleIcon style={{ width: 16, height: 16 }} />} color="blue" mb="md">
                  Para confirmar tu reservación, realiza el pago y sube el comprobante.
                </Alert>
              );
            })()}

            {/* Upload Form - Show for payments that can be uploaded */}
            {(reservation.paymentStatus !== 'verifying' && reservation.paymentStatus !== 'verified' && reservation.paymentStatus !== 'paid') && (
              !showPaymentSection ? (
                <Button 
                  fullWidth 
                  onClick={() => setShowPaymentSection(true)}
                  leftSection={<CreditCardIcon style={{ width: 16, height: 16 }} />}
                  disabled={isUploading}
                >
                  {reservation.paymentStatus === 'rejected' 
                    ? 'Subir nuevo comprobante' 
                    : reservation.paymentStatus === 'partial'
                      ? 'Subir comprobante del pago restante'
                      : 'Subir comprobante de pago'}
                </Button>
              ) : (
                <Stack gap="md">
                  <TextInput
                    label="Referencia de pago (opcional)"
                    placeholder="Número de referencia o transacción"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                  
                  <FileInput
                    label={reservation.paymentStatus === 'partial' ? 'Comprobante del pago restante' : 'Comprobante de pago'}
                    placeholder="Seleccionar imagen"
                    value={paymentScreenshot}
                    onChange={setPaymentScreenshot}
                    accept="image/*"
                    leftSection={<PhotoIcon style={{ width: 16, height: 16 }} />}
                    required
                    description={reservation.paymentStatus === 'partial' ? 'Sube el comprobante del monto restante para completar tu reservación' : undefined}
                  />
                  
                  <Textarea
                    label="Notas adicionales (opcional)"
                    placeholder="Información adicional sobre el pago"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    minRows={3}
                  />
                  
                  <Group>
                    <Button 
                      onClick={handlePaymentSubmit}
                      loading={isUploading}
                      leftSection={<CheckCircleIcon style={{ width: 16, height: 16 }} />}
                    >
                      {reservation.paymentStatus === 'partial' ? 'Completar pago' : 'Enviar comprobante'}
                    </Button>
                    <Button 
                      variant="subtle" 
                      onClick={() => setShowPaymentSection(false)}
                    >
                      Cancelar
                    </Button>
                  </Group>
                </Stack>
              )
            )}
          </Paper>
        )}

        {/* Actions */}
        <Group justify="center">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                variant="light"
                leftSection={<CalendarIcon style={{ width: 16, height: 16 }} />}
              >
                Exportar a calendario
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {calendarOptions.map((option) => (
                <Menu.Item
                  key={option.key}
                  leftSection={option.icon}
                  onClick={() => handleCalendarExport(option.key as any)}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          
          <Button onClick={onClose}>Cerrar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}