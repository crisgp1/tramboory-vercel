'use client';

import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Avatar,
  Divider,
  Button,
  Paper,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  NumberFormatter,
  CopyButton,
  Alert,
  FileButton,
  TextInput,
  Textarea,
  Tabs,
  ScrollArea,
  rem,
  useMantineTheme
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconClock,
  IconUser,
  IconUsers,
  IconCurrencyDollar,
  IconMapPin,
  IconSparkles,
  IconHeart,
  IconPlus,
  IconDownload,
  IconCalendarPlus,
  IconCopy,
  IconCheck,
  IconPhoto,
  IconUpload,
  IconAlertCircle,
  IconInfoCircle,
  IconCreditCard,
  IconX,
  IconCake
} from '@tabler/icons-react';
import { Reservation } from '@/types/reservation';
import toast from 'react-hot-toast';
import { getStatusColor } from '@/lib/theme/tramboory-theme';

interface ReservationModalProps {
  opened: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export default function ReservationModal({ 
  opened, 
  onClose, 
  reservation 
}: ReservationModalProps) {
  const theme = useMantineTheme();
  const clipboard = useClipboard();
  const [activeTab, setActiveTab] = useState<string>('details');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploadingPayment, setUploadingPayment] = useState(false);

  if (!reservation) return null;

  // Helper functions
  const getStatusText = (status: string) => {
    const statusMap = {
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return (
      <NumberFormatter
        value={price}
        prefix="$"
        suffix=" MXN"
        thousandSeparator=","
        decimalScale={0}
      />
    );
  };

  const generatePaymentReference = () => {
    const date = new Date(reservation.eventDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const childInitials = reservation.child.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRM${dateStr}${childInitials}${randomNum}`;
  };

  const paymentRef = generatePaymentReference();

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch('/api/reservations/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservation._id }),
      });

      if (!response.ok) {
        throw new Error('Error generating invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-reserva-${reservation._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Factura descargada exitosamente');
    } catch (error) {
      toast.error('Error al descargar la factura');
    }
  };

  const handlePaymentUpload = async () => {
    if (!paymentScreenshot) {
      toast.error('Por favor selecciona una imagen del comprobante');
      return;
    }

    setUploadingPayment(true);
    try {
      // Simulate upload - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Comprobante de pago enviado exitosamente');
      setPaymentScreenshot(null);
      setPaymentReference('');
      setPaymentNotes('');
      setActiveTab('details');
    } catch (error) {
      toast.error('Error al enviar el comprobante');
    } finally {
      setUploadingPayment(false);
    }
  };

  const exportToCalendar = (type: 'google' | 'outlook' | 'ical') => {
    const title = `Fiesta de ${reservation.child.name}`;
    const startDate = new Date(`${reservation.eventDate}T${reservation.eventTime}`);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours
    
    const formatForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const details = `Celebración de ${reservation.child.name} (${reservation.child.age} años)
Paquete: ${reservation.package?.name}
${reservation.specialComments ? `Comentarios: ${reservation.specialComments}` : ''}`;

    switch (type) {
      case 'google':
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${encodeURIComponent(details)}`;
        window.open(googleUrl, '_blank');
        break;
      case 'outlook':
        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(details)}`;
        window.open(outlookUrl, '_blank');
        break;
      case 'ical':
        const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tramboory//ES
BEGIN:VEVENT
UID:${reservation._id}@tramboory.com
DTSTAMP:${formatForCalendar(new Date())}
DTSTART:${formatForCalendar(startDate)}
DTEND:${formatForCalendar(endDate)}
SUMMARY:${title}
DESCRIPTION:${details}
END:VEVENT
END:VCALENDAR`;
        
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evento-${reservation.child.name}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        break;
    }
    
    toast.success(`Evento exportado a ${type === 'google' ? 'Google Calendar' : type === 'outlook' ? 'Outlook' : 'calendario'}`);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      overlayProps={{ opacity: 0.4, blur: 3 }}
      withCloseButton={false}
      radius="md"
      padding={0}
    >
      <div>
        {/* Header */}
        <Paper
          p="lg"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.pink[5]}, ${theme.colors.violet[5]})`,
            color: 'white',
            position: 'relative'
          }}
        >
          <ActionIcon
            variant="subtle"
            color="white"
            size="lg"
            onClick={onClose}
            style={{ position: 'absolute', top: rem(12), right: rem(12) }}
          >
            <IconX size="1.2rem" />
          </ActionIcon>

          <Group gap="lg" align="flex-start">
            <Avatar
              size="xl"
              radius="xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '3px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <IconCake size="2rem" />
            </Avatar>
            
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start">
                <Stack gap={rem(4)}>
                  <Text size="xl" fw={700}>
                    Fiesta de {reservation.child.name}
                  </Text>
                  <Text size="md" opacity={0.9}>
                    {reservation.child.age} {reservation.child.age === 1 ? 'año' : 'años'} • {formatDate(reservation.eventDate)}
                  </Text>
                </Stack>
                
                <Badge
                  size="lg"
                  variant="white"
                  color={getStatusColor(reservation.status)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: theme.colors[getStatusColor(reservation.status) as keyof typeof theme.colors][6]
                  }}
                >
                  {getStatusText(reservation.status)}
                </Badge>
              </Group>
              
              {reservation.package && (
                <Group gap="xs">
                  <IconSparkles size="1rem" />
                  <Text size="sm" fw={500} opacity={0.9}>
                    {reservation.package.name}
                  </Text>
                </Group>
              )}
            </Stack>
          </Group>
        </Paper>

        {/* Content with Tabs - Aplicando Law of Common Region */}
        <div style={{ maxHeight: 'calc(90vh - 200px)', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')}>
            <Tabs.List p="md" style={{ borderBottom: `1px solid ${theme.colors.gray[2]}` }}>
              <Tabs.Tab value="details" leftSection={<IconInfoCircle size="1rem" />}>
                Detalles
              </Tabs.Tab>
              <Tabs.Tab value="payment" leftSection={<IconCreditCard size="1rem" />}>
                Pago
              </Tabs.Tab>
            </Tabs.List>

            <ScrollArea style={{ height: 'calc(90vh - 300px)' }}>
              <Tabs.Panel value="details" p="lg">
                <Stack gap="lg">
                  {/* Event Details - Aplicando Chunking */}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* Date & Time */}
                    <Paper p="md" withBorder radius="md">
                      <Group gap="sm" mb="xs">
                        <IconCalendarEvent size="1.2rem" color={theme.colors.blue[6]} />
                        <Text fw={600} c="dark">Fecha y Hora</Text>
                      </Group>
                      <Stack gap="xs">
                        <Text size="sm">{formatDate(reservation.eventDate)}</Text>
                        <Group gap="xs">
                          <IconClock size="1rem" color={theme.colors.gray[6]} />
                          <Text size="sm" c="dimmed">{reservation.eventTime}</Text>
                        </Group>
                      </Stack>
                    </Paper>

                    {/* Guests */}
                    <Paper p="md" withBorder radius="md">
                      <Group gap="sm" mb="xs">
                        <IconUsers size="1.2rem" color={theme.colors.green[6]} />
                        <Text fw={600} c="dark">Capacidad</Text>
                      </Group>
                      <Text size="sm">
                        Hasta {reservation.package?.maxGuests || 'N/A'} invitados
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  {/* Services Grid - Aplicando Law of Proximity */}
                  <Stack gap="md">
                    <Text size="lg" fw={600}>Servicios Incluidos</Text>
                    
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {/* Package */}
                      <Paper p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.pink[0] }}>
                        <Group gap="sm" mb="xs">
                          <IconSparkles size="1.2rem" color={theme.colors.pink[6]} />
                          <Text fw={600} size="sm">Paquete</Text>
                        </Group>
                        <Text size="sm" fw={500}>{reservation.package?.name}</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          {formatPrice(reservation.pricing?.packagePrice || 0)}
                        </Text>
                      </Paper>

                      {/* Food */}
                      {reservation.foodOption && (
                        <Paper p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.orange[0] }}>
                          <Group gap="sm" mb="xs">
                            <IconHeart size="1.2rem" color={theme.colors.orange[6]} />
                            <Text fw={600} size="sm">Comida</Text>
                          </Group>
                          <Text size="sm" fw={500}>{reservation.foodOption.name}</Text>
                          <Text size="xs" c="dimmed" mt="xs">
                            {formatPrice(reservation.pricing?.foodPrice || 0)}
                          </Text>
                        </Paper>
                      )}

                      {/* Theme */}
                      {reservation.eventTheme && (
                        <Paper p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.violet[0] }}>
                          <Group gap="sm" mb="xs">
                            <IconSparkles size="1.2rem" color={theme.colors.violet[6]} />
                            <Text fw={600} size="sm">Tema</Text>
                          </Group>
                          <Text size="sm" fw={500}>{reservation.eventTheme.name}</Text>
                          <Text size="xs" c="dimmed" mt="xs">
                            {formatPrice(reservation.pricing?.themePrice || 0)}
                          </Text>
                        </Paper>
                      )}

                      {/* Extra Services */}
                      {reservation.extraServices?.map((service, index) => (
                        <Paper key={index} p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.teal[0] }}>
                          <Group gap="sm" mb="xs">
                            <IconPlus size="1.2rem" color={theme.colors.teal[6]} />
                            <Text fw={600} size="sm">Extra</Text>
                          </Group>
                          <Text size="sm" fw={500}>{service.name}</Text>
                          <Text size="xs" c="dimmed" mt="xs">
                            {formatPrice(service.price)}
                          </Text>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  </Stack>

                  {/* Special Comments */}
                  {reservation.specialComments && (
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.gray[0] }}>
                      <Group gap="sm" mb="xs">
                        <IconInfoCircle size="1.2rem" color={theme.colors.gray[6]} />
                        <Text fw={600}>Comentarios Especiales</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {reservation.specialComments}
                      </Text>
                    </Paper>
                  )}

                  {/* Total */}
                  <Paper p="lg" withBorder radius="md" style={{ backgroundColor: theme.colors.green[0] }}>
                    <Group justify="space-between" align="center">
                      <Text size="xl" fw={700}>Total</Text>
                      <Text size="2xl" fw={900} c="green.8">
                        {formatPrice(reservation.pricing?.total || 0)}
                      </Text>
                    </Group>
                  </Paper>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="payment" p="lg">
                <Stack gap="lg">
                  {/* Payment Status */}
                  {reservation.status === 'confirmed' ? (
                    <Alert icon={<IconCheck size="1rem" />} color="green">
                      ¡Pago confirmado! Tu reservación está asegurada.
                    </Alert>
                  ) : (
                    <Alert icon={<IconAlertCircle size="1rem" />} color="yellow">
                      Pago pendiente. Envía tu comprobante para confirmar la reservación.
                    </Alert>
                  )}

                  {/* Payment Info Grid */}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* Bank Details */}
                    <Paper p="md" withBorder radius="md">
                      <Text fw={600} mb="md">Datos Bancarios</Text>
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Banco:</Text>
                          <Text size="sm" fw={500}>BBVA</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Cuenta:</Text>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>1234567890</Text>
                            <CopyButton value="1234567890">
                              {({ copied, copy }) => (
                                <ActionIcon size="sm" variant="light" onClick={copy}>
                                  {copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />}
                                </ActionIcon>
                              )}
                            </CopyButton>
                          </Group>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">CLABE:</Text>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>012345678901234567</Text>
                            <CopyButton value="012345678901234567">
                              {({ copied, copy }) => (
                                <ActionIcon size="sm" variant="light" onClick={copy}>
                                  {copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />}
                                </ActionIcon>
                              )}
                            </CopyButton>
                          </Group>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Referencia:</Text>
                          <Group gap="xs">
                            <Badge variant="light" color="blue">{paymentRef}</Badge>
                            <CopyButton value={paymentRef}>
                              {({ copied, copy }) => (
                                <ActionIcon size="sm" variant="light" onClick={copy}>
                                  {copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />}
                                </ActionIcon>
                              )}
                            </CopyButton>
                          </Group>
                        </Group>
                      </Stack>
                    </Paper>

                    {/* Payment Amount */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: theme.colors.green[0] }}>
                      <Text fw={600} mb="md">Monto a Pagar</Text>
                      <Stack align="center" gap="xs">
                        <Text size="2xl" fw={900} c="green.8">
                          {formatPrice(reservation.pricing?.total || 0)}
                        </Text>
                        <CopyButton value={(reservation.pricing?.total || 0).toString()}>
                          {({ copied, copy }) => (
                            <Button variant="light" size="xs" onClick={copy} leftSection={
                              copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />
                            }>
                              {copied ? 'Copiado' : 'Copiar monto'}
                            </Button>
                          )}
                        </CopyButton>
                      </Stack>
                    </Paper>
                  </SimpleGrid>

                  {/* Upload Payment Proof */}
                  {reservation.status === 'pending' && (
                    <Paper p="md" withBorder radius="md">
                      <Text fw={600} mb="md">Enviar Comprobante de Pago</Text>
                      <Stack gap="md">
                        <FileButton onChange={setPaymentScreenshot} accept="image/*">
                          {(props) => (
                            <Button
                              {...props}
                              variant="light"
                              leftSection={<IconPhoto size="1rem" />}
                            >
                              {paymentScreenshot ? paymentScreenshot.name : 'Seleccionar imagen'}
                            </Button>
                          )}
                        </FileButton>

                        <TextInput
                          label="Referencia de pago (opcional)"
                          placeholder="Ej: 123456789"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                        />

                        <Textarea
                          label="Notas adicionales (opcional)"
                          placeholder="Información adicional sobre el pago..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          rows={3}
                        />

                        <Button
                          leftSection={<IconUpload size="1rem" />}
                          onClick={handlePaymentUpload}
                          disabled={!paymentScreenshot}
                          loading={uploadingPayment}
                        >
                          Enviar Comprobante
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <Paper p="md" style={{ borderTop: `1px solid ${theme.colors.gray[2]}` }}>
          <Group justify="space-between">
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconDownload size="1rem" />}
                onClick={handleDownloadInvoice}
              >
                Factura
              </Button>
              
              <Button
                variant="light"
                size="sm"
                leftSection={<IconCalendarPlus size="1rem" />}
                onClick={() => exportToCalendar('google')}
              >
                Calendario
              </Button>
            </Group>

            <Button
              onClick={onClose}
              variant="gradient"
              gradient={{ from: 'pink.5', to: 'violet.5' }}
            >
              Cerrar
            </Button>
          </Group>
        </Paper>
      </div>
    </Modal>
  );
}