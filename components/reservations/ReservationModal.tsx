'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Card,
  Divider,
  Badge,
  Tabs,
  Group,
  Stack,
  Text,
  Title
} from '@mantine/core';
import {
  IconCalendar,
  IconClock,
  IconUser,
  IconPhone,
  IconMail,
  IconCake,
  IconCurrencyDollar,
  IconCircleCheck,
  IconCircleX,
  IconMessage,
  IconMapPin,
  IconStar,
  IconSparkles,
  IconPlus,
  IconGift,
  IconCreditCard,
  IconFileText,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/types/reservation';

interface ReservationModalProps {
  opened: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onStatusChange?: (id: string, status: string) => void;
}

const statusColorMap = {
  pending: 'orange',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue'
} as const;

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

const statusIcons = {
  pending: IconClock,
  confirmed: IconCircleCheck,
  cancelled: IconCircleX,
  completed: IconStar
};

const paymentStatusColorMap = {
  pending: 'yellow',
  paid: 'green',
  partial: 'orange',
  verifying: 'blue',
  verified: 'green',
  rejected: 'red',
  overdue: 'red'
} as const;

const paymentStatusLabels = {
  pending: 'Pendiente',
  paid: 'Pagado Completo',
  partial: 'Anticipo',
  verifying: 'Verificando',
  verified: 'Verificado',
  rejected: 'Rechazado',
  overdue: 'Vencido'
};

export default function ReservationModal({
  opened,
  onClose,
  reservation,
  onStatusChange
}: ReservationModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
  const [isLoading, setIsLoading] = useState(false);

  if (!reservation) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      setIsLoading(true);
      await onStatusChange(reservation._id, newStatus);
      setIsLoading(false);
    }
  };

  const handlePaymentVerification = async (action: 'verify' | 'reject') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reservations/${reservation._id}/payment-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the page or update the reservation data
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Error al ${action === 'verify' ? 'verificar' : 'rechazar'} el pago`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPaymentProof = async () => {
    try {
      // Try to open in new tab first - if the endpoint redirects to blob URL, this will work
      const url = `/api/admin/reservations/${reservation._id}/payment-proof`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing payment proof:', error);
      alert('Error al intentar ver el comprobante de pago');
    }
  };

  const handlePaymentStatusChange = async (status: 'paid' | 'partial') => {
    const currentPaid = reservation.amountPaid || 0;
    const remaining = reservation.pricing.total - currentPaid;
    const isAdditionalPayment = reservation.paymentStatus === 'partial';
    
    const amountPrompt = status === 'paid' ? 
      `Confirmar pago completo de ${formatCurrency(reservation.pricing.total)}?` :
      isAdditionalPayment ? 
        `Ingrese el monto del pago adicional (pendiente: ${formatCurrency(remaining)}):` :
        'Ingrese el monto del anticipo:';
    
    let amount = reservation.pricing.total;
    
    if (status === 'partial') {
      const inputAmount = prompt(amountPrompt);
      if (!inputAmount) return;
      
      const inputValue = parseFloat(inputAmount.replace(/[^0-9.]/g, ''));
      if (isNaN(inputValue) || inputValue <= 0) {
        alert('Monto inválido');
        return;
      }
      
      // For additional payments, add to existing amount
      amount = isAdditionalPayment ? currentPaid + inputValue : inputValue;
      
      // Check if the total payment exceeds the total price
      if (amount > reservation.pricing.total) {
        alert(`El monto total (${formatCurrency(amount)}) no puede ser mayor al precio total (${formatCurrency(reservation.pricing.total)})`);
        return;
      }
      
      // If the new amount equals the total, mark as paid instead of partial
      if (amount >= reservation.pricing.total) {
        amount = reservation.pricing.total;
        status = 'paid';
      }
    } else {
      if (!confirm(amountPrompt)) return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reservations/${reservation._id}/payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentStatus: status,
          amountPaid: amount,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'other' // Default, can be enhanced later
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Error al marcar el pago como ${status === 'paid' ? 'completo' : 'anticipo'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = statusIcons[reservation.status];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={null}
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
                <StatusIcon size={20} color="var(--mantine-color-gray-6)" />
              </div>
              <Stack gap={0}>
                <Title order={3} size="lg">
                  Reserva #{reservation._id.slice(-6).toUpperCase()}
                </Title>
                <Group gap="sm" mt={4}>
                  <Badge
                    color={statusColorMap[reservation.status]}
                    variant="light"
                    size="sm"
                  >
                    {statusLabels[reservation.status]}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {formatDate(reservation.eventDate)}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Group>
        </div>

        {/* Navigation Tabs */}
        <div style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', backgroundColor: 'white' }}>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)} variant="outline">
            <Tabs.List style={{ borderBottom: 'none', padding: '0 1.5rem' }}>
              <Tabs.Tab value="details" leftSection={<IconUser size={16} />}>
                Detalles
              </Tabs.Tab>
              <Tabs.Tab value="billing" leftSection={<IconCurrencyDollar size={16} />}>
                Facturación
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {activeTab === 'details' && (
            <Stack gap="lg">
              {/* Quick Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
                <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                  <Group gap="md">
                    <IconUser size={20} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={500}>Cliente</Text>
                      <Text fw={500}>{reservation.customer.name}</Text>
                    </Stack>
                  </Group>
                </div>
                
                <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                  <Group gap="md">
                    <IconCake size={20} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={500}>Festejado/a</Text>
                      <Text fw={500}>{reservation.child.name}</Text>
                    </Stack>
                  </Group>
                </div>
                
                <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                  <Group gap="md">
                    <IconCurrencyDollar size={20} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={500}>Total</Text>
                      <Text fw={500}>{formatCurrency(reservation.pricing.total)}</Text>
                    </Stack>
                  </Group>
                </div>
                
                <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                  <Group gap="md">
                    <IconUser size={20} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={500}>Invitados</Text>
                      <Text fw={500}>
                        {reservation.guestCount.adults + reservation.guestCount.kids} total
                      </Text>
                      <Text size="xs" c="dimmed">
                        {reservation.guestCount.adults} adultos, {reservation.guestCount.kids} niños
                      </Text>
                    </Stack>
                  </Group>
                </div>
              </div>

              {/* Customer & Child Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--mantine-spacing-lg)' }}>
                <Card withBorder shadow="none">
                  <Text size="sm" fw={600} mb="md">Información del Cliente</Text>
                  <Stack gap="sm">
                    <Group gap="md">
                      <IconUser size={16} color="var(--mantine-color-gray-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Nombre</Text>
                        <Text size="sm">{reservation.customer.name}</Text>
                      </Stack>
                    </Group>
                    <Group gap="md">
                      <IconPhone size={16} color="var(--mantine-color-gray-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Teléfono</Text>
                        <Text size="sm">{reservation.customer.phone}</Text>
                      </Stack>
                    </Group>
                    <Group gap="md">
                      <IconMail size={16} color="var(--mantine-color-gray-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Email</Text>
                        <Text size="sm">{reservation.customer.email}</Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Card>

                <Card withBorder shadow="none">
                  <Text size="sm" fw={600} mb="md">Información del Festejado/a</Text>
                  <Stack gap="sm">
                    <Group gap="md">
                      <IconCake size={16} color="var(--mantine-color-gray-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Nombre</Text>
                        <Text size="sm">{reservation.child.name}</Text>
                      </Stack>
                    </Group>
                    <Group gap="md">
                      <IconStar size={16} color="var(--mantine-color-gray-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Edad</Text>
                        <Text size="sm">{reservation.child.age} años</Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Card>
              </div>

              {/* Event Details */}
              <Card withBorder shadow="none">
                <Text size="sm" fw={600} mb="md">Detalles del Evento</Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
                  <Group gap="md" align="flex-start">
                    <IconCalendar size={16} color="var(--mantine-color-gray-4)" />
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">Fecha</Text>
                      <Text size="sm">{formatDate(reservation.eventDate)}</Text>
                      {reservation.isRestDay && (
                        <Badge size="sm" color="orange" variant="light" mt={4}>
                          Día de descanso
                        </Badge>
                      )}
                    </Stack>
                  </Group>
                  <Group gap="md" align="flex-start">
                    <IconClock size={16} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Hora</Text>
                      <Text size="sm">{reservation.eventTime}</Text>
                      {reservation.eventDuration && (
                        <Text size="xs" c="dimmed">Duración: {reservation.eventDuration} horas</Text>
                      )}
                    </Stack>
                  </Group>
                  <Group gap="md" align="flex-start">
                    <IconMapPin size={16} color="var(--mantine-color-gray-4)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Paquete</Text>
                      <Text size="sm">{reservation.package.name}</Text>
                      <Text size="xs" c="dimmed">Hasta {reservation.package.maxGuests} invitados</Text>
                    </Stack>
                  </Group>
                </div>
              </Card>

              {/* Food Option Details */}
              {reservation.foodOption && (
                <Card withBorder shadow="none">
                  <Group gap="md" mb="md">
                    <div 
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--mantine-color-orange-1)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconCake size={16} color="var(--mantine-color-orange-6)" />
                    </div>
                    <Text size="sm" fw={600}>Opción de Alimento</Text>
                  </Group>
                  <Stack gap="md">
                    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                      <Group justify="space-between" align="flex-start" mb="xs">
                        <Stack gap={0}>
                          <Text fw={500}>{reservation.foodOption.name}</Text>
                          <Text size="xs" c="dimmed">Opción base</Text>
                        </Stack>
                        <Text size="sm" fw={500}>
                          {formatCurrency(reservation.foodOption.basePrice)}
                        </Text>
                      </Group>
                      
                      {reservation.foodOption.selectedExtras && reservation.foodOption.selectedExtras.length > 0 && (
                        <div style={{ marginTop: 'var(--mantine-spacing-sm)', paddingTop: 'var(--mantine-spacing-sm)', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                          <Text size="xs" c="dimmed" mb="xs">Extras seleccionados:</Text>
                          <Stack gap="xs">
                            {reservation.foodOption.selectedExtras.map((extra, index) => (
                              <Group key={index} justify="space-between">
                                <Text size="sm" c="dark">• {extra.name}</Text>
                                <Text size="sm" fw={500}>
                                  {formatCurrency(extra.price)}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </div>
                      )}
                    </div>
                  </Stack>
                </Card>
              )}

              {/* Event Theme Details */}
              {reservation.eventTheme && (
                <Card withBorder shadow="none">
                  <Group gap="md" mb="md">
                    <div 
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--mantine-color-violet-1)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconSparkles size={16} color="var(--mantine-color-violet-6)" />
                    </div>
                    <Text size="sm" fw={600}>Tema del Evento</Text>
                  </Group>
                  <Stack gap="md">
                    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
                        <Stack gap={0}>
                          <Text size="xs" c="dimmed" mb={4}>Configuración</Text>
                          <Text fw={500}>{reservation.eventTheme.name}</Text>
                        </Stack>
                        <Stack gap={0}>
                          <Text size="xs" c="dimmed" mb={4}>Tema seleccionado</Text>
                          <Badge
                            size="sm"
                            variant="light"
                            color="violet"
                          >
                            {reservation.eventTheme.selectedTheme}
                          </Badge>
                        </Stack>
                      </div>
                      
                      <div style={{ marginTop: 'var(--mantine-spacing-md)', paddingTop: 'var(--mantine-spacing-md)', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text size="xs" c="dimmed" mb="xs">Paquete de decoración:</Text>
                        <Group justify="space-between">
                          <Stack gap={0}>
                            <Text size="sm" fw={500}>
                              {reservation.eventTheme.selectedPackage.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {reservation.eventTheme.selectedPackage.pieces} piezas
                            </Text>
                          </Stack>
                          <Text size="sm" fw={500}>
                            {formatCurrency(reservation.eventTheme.selectedPackage.price)}
                          </Text>
                        </Group>
                      </div>
                    </div>
                  </Stack>
                </Card>
              )}

              {/* Extra Services Details */}
              {reservation.extraServices && reservation.extraServices.length > 0 && (
                <Card withBorder shadow="none">
                  <Group gap="md" mb="md">
                    <div 
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--mantine-color-blue-1)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconGift size={16} color="var(--mantine-color-blue-6)" />
                    </div>
                    <Text size="sm" fw={600}>Servicios Extras</Text>
                  </Group>
                  <Stack gap="sm">
                    {reservation.extraServices.map((service, index) => (
                      <div key={index} style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text fw={500}>{service.name}</Text>
                              {service.quantity > 1 && (
                                <Badge size="sm" variant="light" color="blue">
                                  x{service.quantity}
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">
                              {formatCurrency(service.price)} {service.quantity > 1 ? 'c/u' : ''}
                            </Text>
                          </div>
                          <Stack gap={0} align="flex-end">
                            <Text size="sm" fw={500}>
                              {formatCurrency(service.price * service.quantity)}
                            </Text>
                            {service.quantity > 1 && (
                              <Text size="xs" c="dimmed">
                                {service.quantity} × {formatCurrency(service.price)}
                              </Text>
                            )}
                          </Stack>
                        </Group>
                      </div>
                    ))}
                  </Stack>
                </Card>
              )}

              {/* Applied Coupon */}
              {reservation.appliedCoupon && (
                <Card withBorder shadow="none">
                  <Group gap="md" mb="md">
                    <div 
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--mantine-color-green-1)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconGift size={16} color="var(--mantine-color-green-6)" />
                    </div>
                    <Text size="sm" fw={600}>Cupón Aplicado</Text>
                  </Group>
                  <div style={{ backgroundColor: 'var(--mantine-color-green-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                    <Group justify="space-between" mb="sm">
                      <Stack gap={0}>
                        <Text fw={500}>{reservation.appliedCoupon.code}</Text>
                        <Text size="xs" c="dimmed">
                          {reservation.appliedCoupon.discountType === 'percentage' ? `${reservation.appliedCoupon.discountValue}% de descuento` :
                           reservation.appliedCoupon.discountType === 'fixed_amount' ? `Descuento fijo` :
                           'Servicio gratuito'}
                        </Text>
                      </Stack>
                      <Text size="sm" fw={600} c="green">
                        -{formatCurrency(reservation.appliedCoupon.discountAmount)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Aplicado a: {reservation.appliedCoupon.appliedTo}
                    </Text>
                  </div>
                </Card>
              )}

              {/* Special Comments */}
              {reservation.specialComments && (
                <Card withBorder shadow="none">
                  <Group gap="md" mb="sm">
                    <IconMessage size={16} color="var(--mantine-color-gray-4)" />
                    <Text size="sm" fw={600}>Comentarios Especiales</Text>
                  </Group>
                  <Text size="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', padding: 'var(--mantine-spacing-sm)', borderRadius: 'var(--mantine-radius-sm)' }}>
                    {reservation.specialComments}
                  </Text>
                </Card>
              )}
            </Stack>
          )}

          {activeTab === 'billing' && (
            <Stack gap="lg">
              {/* Billing Summary */}
              <Card withBorder shadow="none">
                <Group gap="md" mb="md">
                  <div 
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'var(--mantine-color-green-1)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconCurrencyDollar size={16} color="var(--mantine-color-green-6)" />
                  </div>
                  <Text size="sm" fw={600}>Resumen de Facturación</Text>
                </Group>
                <Stack gap="sm">
                  <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="sm" c="dimmed" fw={500}>Paquete base:</Text>
                    <Text size="sm" fw={600}>{formatCurrency(reservation.pricing.packagePrice)}</Text>
                  </Group>
                  {reservation.pricing.foodPrice > 0 && (
                    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text size="sm" c="dimmed" fw={500}>Alimentos:</Text>
                      <Text size="sm" fw={600}>{formatCurrency(reservation.pricing.foodPrice)}</Text>
                    </Group>
                  )}
                  {reservation.pricing.extrasPrice > 0 && (
                    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text size="sm" c="dimmed" fw={500}>Servicios extras:</Text>
                      <Text size="sm" fw={600}>{formatCurrency(reservation.pricing.extrasPrice)}</Text>
                    </Group>
                  )}
                  {reservation.pricing.themePrice > 0 && (
                    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text size="sm" c="dimmed" fw={500}>Tema del evento:</Text>
                      <Text size="sm" fw={600}>{formatCurrency(reservation.pricing.themePrice)}</Text>
                    </Group>
                  )}
                  {reservation.pricing.restDayFee > 0 && (
                    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text size="sm" c="orange" fw={500}>Cargo por día de descanso:</Text>
                      <Text size="sm" c="orange" fw={600}>{formatCurrency(reservation.pricing.restDayFee)}</Text>
                    </Group>
                  )}
                  <Divider my="md" />
                  <Group justify="space-between" py="xs">
                    <Text size="sm" c="dimmed" fw={500}>Subtotal:</Text>
                    <Text size="sm" fw={600}>{formatCurrency(reservation.pricing.subtotal)}</Text>
                  </Group>
                  {reservation.pricing.discountAmount > 0 && (
                    <Group justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                      <Text size="sm" c="green" fw={500}>Descuento aplicado:</Text>
                      <Text size="sm" c="green" fw={600}>-{formatCurrency(reservation.pricing.discountAmount)}</Text>
                    </Group>
                  )}
                  <Group justify="space-between" py="md" px="md" style={{ backgroundColor: 'var(--mantine-color-dark-8)', borderRadius: 'var(--mantine-radius-sm)', color: 'white' }}>
                    <Text size="lg" fw={700} c="white">Total:</Text>
                    <Text size="lg" fw={700} c="white">{formatCurrency(reservation.pricing.total)}</Text>
                  </Group>
                </Stack>
              </Card>

              {/* Payment Verification Section */}
              <Card withBorder shadow="none">
                <Group gap="md" mb="md">
                  <div 
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'var(--mantine-color-blue-1)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconCreditCard size={16} color="var(--mantine-color-blue-6)" />
                  </div>
                  <Text size="sm" fw={600}>Estado del Pago</Text>
                </Group>
                
                <Stack gap="md">
                  {/* Payment Status Badge */}
                  <Group gap="md">
                    <Badge
                      color={paymentStatusColorMap[reservation.paymentStatus || 'pending']}
                      variant="light"
                      size="lg"
                      leftSection={
                        reservation.paymentStatus === 'verified' ? <IconCheck size={14} /> :
                        reservation.paymentStatus === 'rejected' ? <IconX size={14} /> :
                        reservation.paymentStatus === 'verifying' ? <IconInfoCircle size={14} /> :
                        <IconCreditCard size={14} />
                      }
                    >
                      {paymentStatusLabels[reservation.paymentStatus || 'pending']}
                    </Badge>
                    {reservation.amountPaid && (
                      <Stack gap={4}>
                        <Text size="sm" c="dimmed">
                          <strong>Pagado:</strong> {formatCurrency(reservation.amountPaid)}
                        </Text>
                        {reservation.paymentStatus === 'partial' && (
                          <Text size="sm" c="orange">
                            <strong>Pendiente:</strong> {formatCurrency(reservation.pricing.total - reservation.amountPaid)}
                          </Text>
                        )}
                      </Stack>
                    )}
                  </Group>

                  {/* Payment Method and Date */}
                  {(reservation.paymentMethod || reservation.paymentDate) && (
                    <Group gap="md">
                      {reservation.paymentMethod && (
                        <Text size="sm" c="dimmed">
                          <strong>Método:</strong> {
                            reservation.paymentMethod === 'cash' ? 'Efectivo' :
                            reservation.paymentMethod === 'card' ? 'Tarjeta' :
                            reservation.paymentMethod === 'transfer' ? 'Transferencia' :
                            reservation.paymentMethod === 'other' ? 'Otro' :
                            reservation.paymentMethod
                          }
                        </Text>
                      )}
                      {reservation.paymentDate && (
                        <Text size="sm" c="dimmed">
                          <strong>Fecha:</strong> {formatDate(reservation.paymentDate)}
                        </Text>
                      )}
                    </Group>
                  )}

                  {/* Payment Notes */}
                  {reservation.paymentNotes && (
                    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                      <Text size="xs" c="dimmed" mb={4}>Notas del pago:</Text>
                      <Text size="sm">{reservation.paymentNotes}</Text>
                    </div>
                  )}

                  {/* Payment Proof Section */}
                  {reservation.paymentProof && (
                    <div style={{ backgroundColor: 'var(--mantine-color-blue-0)', border: '1px solid var(--mantine-color-blue-3)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                      <Group gap="md" mb="md">
                        <IconFileText size={20} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={600} c="blue">Comprobante de Pago</Text>
                      </Group>
                      
                      <Stack gap="sm">
                        <Group justify="space-between" align="center">
                          <Text size="sm" c="dimmed">Archivo:</Text>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>{reservation.paymentProof.filename}</Text>
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              leftSection={<IconFileText size={14} />}
                              onClick={handleViewPaymentProof}
                            >
                              Ver
                            </Button>
                          </Group>
                        </Group>
                        
                        {reservation.paymentProof.reference && (
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Referencia:</Text>
                            <Text size="sm" fw={500}>{reservation.paymentProof.reference}</Text>
                          </Group>
                        )}
                        
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Subido el:</Text>
                          <Text size="sm" fw={500}>{formatDate(reservation.paymentProof.uploadedAt)}</Text>
                        </Group>
                        
                        {reservation.paymentProof.notes && (
                          <div style={{ marginTop: 'var(--mantine-spacing-xs)', paddingTop: 'var(--mantine-spacing-xs)', borderTop: '1px solid var(--mantine-color-blue-3)' }}>
                            <Text size="xs" c="dimmed" mb={4}>Notas adicionales:</Text>
                            <Text size="sm">{reservation.paymentProof.notes}</Text>
                          </div>
                        )}

                        {/* Admin Verification Actions */}
                        {reservation.paymentStatus === 'verifying' && (
                          <div style={{ marginTop: 'var(--mantine-spacing-md)', paddingTop: 'var(--mantine-spacing-md)', borderTop: '1px solid var(--mantine-color-blue-3)' }}>
                            <Text size="sm" fw={600} mb="md" c="blue">Acciones de Verificación</Text>
                            <Group gap="sm">
                              <Button
                                color="green"
                                variant="light"
                                leftSection={<IconCheck size={16} />}
                                onClick={() => handlePaymentVerification('verify')}
                                loading={isLoading}
                                size="sm"
                              >
                                Verificar Pago
                              </Button>
                              <Button
                                color="red"
                                variant="light"
                                leftSection={<IconX size={16} />}
                                onClick={() => handlePaymentVerification('reject')}
                                loading={isLoading}
                                size="sm"
                              >
                                Rechazar Pago
                              </Button>
                            </Group>
                          </div>
                        )}

                        {/* Payment Status Actions - Always available for pending payments */}
                        {reservation.paymentStatus && ['pending', 'verifying', 'verified'].includes(reservation.paymentStatus) && reservation.paymentStatus !== 'paid' && (
                          <div style={{ marginTop: 'var(--mantine-spacing-md)', paddingTop: 'var(--mantine-spacing-md)', borderTop: '1px solid var(--mantine-color-blue-3)' }}>
                            <Text size="sm" fw={600} mb="md" c="blue">Marcar Estado del Pago</Text>
                            <Group gap="sm">
                              <Button
                                color="green"
                                variant="filled"
                                leftSection={<IconCurrencyDollar size={16} />}
                                onClick={() => handlePaymentStatusChange('paid')}
                                loading={isLoading}
                                size="sm"
                              >
                                Pago Completo
                              </Button>
                              <Button
                                color="orange"
                                variant="filled"
                                leftSection={<IconCurrencyDollar size={16} />}
                                onClick={() => handlePaymentStatusChange('partial')}
                                loading={isLoading}
                                size="sm"
                              >
                                {reservation.paymentStatus === 'partial' ? 'Pago Adicional' : 'Anticipo'}
                              </Button>
                            </Group>
                          </div>
                        )}
                      </Stack>
                    </div>
                  )}

                  {/* No Payment Proof Message */}
                  {!reservation.paymentProof && reservation.paymentStatus === 'pending' && (
                    <div style={{ backgroundColor: 'var(--mantine-color-yellow-0)', border: '1px solid var(--mantine-color-yellow-3)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-md)' }}>
                      <Group gap="md">
                        <IconInfoCircle size={20} color="var(--mantine-color-yellow-6)" />
                        <Text size="sm" c="yellow.7">
                          El cliente aún no ha subido el comprobante de pago.
                        </Text>
                      </Group>
                    </div>
                  )}
                </Stack>
              </Card>

              {/* Detailed Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--mantine-spacing-lg)' }}>
                {/* Package Details */}
                <Card withBorder shadow="none">
                  <Text size="sm" fw={600} mb="md">Detalles del Paquete</Text>
                  <Stack gap="sm">
                    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                      <Text fw={500}>{reservation.package.name}</Text>
                      <Text size="xs" c="dimmed" mt={4}>Hasta {reservation.package.maxGuests} invitados</Text>
                      <Text size="sm" fw={500} mt="xs">
                        {formatCurrency(reservation.pricing.packagePrice)}
                      </Text>
                    </div>
                  </Stack>
                </Card>

                {/* Additional Services */}
                {(reservation.foodOption || reservation.eventTheme || (reservation.extraServices && reservation.extraServices.length > 0)) && (
                  <Card withBorder shadow="none">
                    <Text size="sm" fw={600} mb="md">Servicios Adicionales</Text>
                    <Stack gap="sm">
                      {reservation.foodOption && (
                        <div style={{ backgroundColor: 'var(--mantine-color-orange-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                          <Group justify="space-between">
                            <Stack gap={0}>
                              <Text fw={500}>{reservation.foodOption.name}</Text>
                              <Text size="xs" c="dimmed">Opción de alimento</Text>
                            </Stack>
                            <Text size="sm" fw={500}>
                              {formatCurrency(reservation.pricing.foodPrice)}
                            </Text>
                          </Group>
                        </div>
                      )}
                      
                      {reservation.eventTheme && (
                        <div style={{ backgroundColor: 'var(--mantine-color-violet-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                          <Group justify="space-between">
                            <Stack gap={0}>
                              <Text fw={500}>{reservation.eventTheme.name}</Text>
                              <Text size="xs" c="dimmed">Tema: {reservation.eventTheme.selectedTheme}</Text>
                            </Stack>
                            <Text size="sm" fw={500}>
                              {formatCurrency(reservation.pricing.themePrice)}
                            </Text>
                          </Group>
                        </div>
                      )}
                      
                      {reservation.extraServices && reservation.extraServices.length > 0 && (
                        <div style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                          <Group justify="space-between" mb="xs">
                            <Text fw={500}>Servicios extras</Text>
                            <Text size="sm" fw={500}>
                              {formatCurrency(reservation.pricing.extrasPrice)}
                            </Text>
                          </Group>
                          <Stack gap="xs">
                            {reservation.extraServices.map((service, index) => (
                              <Text key={index} size="xs" c="dimmed">
                                • {service.name} {service.quantity > 1 && `(x${service.quantity})`}
                              </Text>
                            ))}
                          </Stack>
                        </div>
                      )}
                    </Stack>
                  </Card>
                )}
              </div>
            </Stack>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid var(--mantine-color-gray-2)', 
          backgroundColor: 'var(--mantine-color-gray-0)' 
        }}>
          <Group justify="space-between" w="100%">
            <Group gap="sm">
              {reservation.status === 'pending' && (
                <>
                  <Button
                    color="green"
                    variant="light"
                    leftSection={<IconCircleCheck size={16} />}
                    onClick={() => handleStatusChange('confirmed')}
                    loading={isLoading}
                    size="sm"
                  >
                    Confirmar
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconCircleX size={16} />}
                    onClick={() => handleStatusChange('cancelled')}
                    loading={isLoading}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {reservation.status === 'confirmed' && (
                <Button
                  color="blue"
                  variant="light"
                  leftSection={<IconCircleCheck size={16} />}
                  onClick={() => handleStatusChange('completed')}
                  loading={isLoading}
                  size="sm"
                >
                  Completar
                </Button>
              )}
            </Group>
            
            <Button 
              variant="light" 
              onClick={onClose}
              size="sm"
              c="dimmed"
            >
              Cerrar
            </Button>
          </Group>
        </div>
    </Modal>
  );
}