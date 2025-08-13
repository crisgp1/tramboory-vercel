'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Select,
  Textarea,
  Card,
  Badge,
  Autocomplete,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon
} from '@mantine/core';
import {
  IconX,
  IconCurrencyDollar,
  IconCalendar,
  IconTag,
  IconFileText,
  IconTrendingUp,
  IconTrendingDown,
  IconUser,
  IconBuilding
} from '@tabler/icons-react';
import {
  FINANCE_TYPES,
  FINANCE_CATEGORIES,
  FINANCE_STATUSES,
  PAYMENT_METHODS,
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  CreateFinanceData,
  FinanceCategory,
  FinanceStatus,
  PaymentMethod
} from '@/types/finance';

interface NewFinanceModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFinanceData) => Promise<void>;
  availableTags: string[];
  reservations?: Array<{
    _id: string;
    customer: {
      name: string;
    };
    child: {
      name: string;
    };
    eventDate: string;
    pricing: {
      total: number;
    };
    status: string;
  }>;
}

export default function NewFinanceModal({
  opened,
  onClose,
  onSubmit,
  availableTags = [],
  reservations = []
}: NewFinanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<CreateFinanceData>({
    type: 'income',
    category: 'other',
    description: '',
    amount: 0,
    date: new Date(),
    status: 'pending',
    paymentMethod: 'cash',
    tags: [],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (opened) {
      // Reset form when modal opens
      setFormData({
        type: 'income',
        category: 'other',
        description: '',
        amount: 0,
        date: new Date(),
        status: 'pending',
        paymentMethod: 'cash',
        tags: [],
        notes: ''
      });
      setErrors({});
      setStep(1);
      setTagInput('');
    }
  }, [opened]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.description.trim()) {
        newErrors.description = 'La descripción es requerida';
      }
      if (formData.amount <= 0) {
        newErrors.amount = 'El monto debe ser mayor a 0';
      }
      if (!formData.type) {
        newErrors.type = 'El tipo es requerido';
      }
      if (!formData.category) {
        newErrors.category = 'La categoría es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error creating finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && formData.tags && !formData.tags.includes(tag)) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    } else if (tag && !formData.tags) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        tags: [tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev: CreateFinanceData) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag: string) => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd(tagInput.trim());
    }
  };

  const handleReservationSelect = (reservationId: string) => {
    const reservation = reservations.find(r => r._id === reservationId);
    if (reservation) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        reservationId,
        description: `Pago de reserva - ${reservation.customer.name} (${reservation.child.name})`,
        amount: reservation.pricing.total,
        category: 'reservation' as const
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderStep1 = () => (
    <Stack gap="lg">
      {/* Vinculación con reserva - Sección destacada */}
      {reservations && reservations.length > 0 && (
        <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderColor: 'var(--mantine-color-blue-3)' }}>
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
              <IconUser size={16} color="var(--mantine-color-blue-6)" />
            </div>
            <Stack gap={0}>
              <Text fw={500} c="blue">¿Relacionar con una reserva?</Text>
              <Text size="sm" c="blue">Selecciona una reserva existente para vincular esta transacción</Text>
            </Stack>
          </Group>
          <Group gap="sm">
            <Select
              placeholder="Seleccionar reserva existente..."
              value={formData.reservationId || ''}
              onChange={(value) => {
                if (value) {
                  handleReservationSelect(value);
                }
              }}
              data={reservations.map((reservation) => ({
                value: reservation._id,
                label: `${reservation.customer.name} - ${reservation.child.name} - ${formatCurrency(reservation.pricing.total)} - ${new Date(reservation.eventDate).toLocaleDateString()}`
              }))}
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: 'var(--mantine-color-blue-3)'
                }
              }}
            />
            
            {formData.reservationId && (
              <Button
                size="sm"
                variant="light"
                c="blue"
                onClick={() => {
                  setFormData((prev: CreateFinanceData) => ({
                    ...prev,
                    reservationId: undefined,
                    category: 'other',
                    description: '',
                    amount: 0
                  }));
                }}
              >
                Limpiar
              </Button>
            )}
          </Group>
        </Card>
      )}

      {/* Tipo de transacción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-sm)' }}>
        {FINANCE_TYPES.map((type) => (
          <Card
            key={type}
            withBorder
            p="md"
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              borderColor: formData.type === type
                ? type === 'income' ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)'
                : 'var(--mantine-color-gray-3)',
              backgroundColor: formData.type === type
                ? type === 'income' ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)'
                : 'transparent'
            }}
            onClick={() => setFormData((prev: CreateFinanceData) => ({ ...prev, type }))}
          >
            <Stack gap="xs" align="center">
              {type === 'income' ? (
                <IconTrendingUp size={32} color="var(--mantine-color-green-5)" />
              ) : (
                <IconTrendingDown size={32} color="var(--mantine-color-red-5)" />
              )}
              <Text fw={500} size="sm">
                {FINANCE_TYPE_LABELS[type]}
              </Text>
            </Stack>
          </Card>
        ))}
      </div>
      {errors.type && <Text c="red" size="xs">{errors.type}</Text>}

      {/* Información básica */}
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Descripción *
          </Text>
          <TextInput
            placeholder="Ej: Pago de cliente, Compra de materiales..."
            value={formData.description}
            onChange={(e) => setFormData((prev: CreateFinanceData) => ({ ...prev, description: e.target.value }))}
            error={errors.description}
            leftSection={<IconFileText size={16} />}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Monto *
            </Text>
            <TextInput
              type="number"
              placeholder="0.00"
              value={formData.amount.toString()}
              onChange={(e) => {
                const num = parseFloat(e.target.value) || 0;
                setFormData((prev: CreateFinanceData) => ({ ...prev, amount: num }));
              }}
              error={errors.amount}
              leftSection={<IconCurrencyDollar size={16} />}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Fecha *
            </Text>
            <TextInput
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData((prev: CreateFinanceData) => ({ ...prev, date }));
              }}
              leftSection={<IconCalendar size={16} />}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Categoría *
            </Text>
            <Select
              placeholder="Selecciona una categoría"
              value={formData.category || ''}
              onChange={(value) => setFormData((prev: CreateFinanceData) => ({ ...prev, category: value as FinanceCategory }))}
              error={errors.category}
              data={FINANCE_CATEGORIES.map((category) => ({
                value: category,
                label: FINANCE_CATEGORY_LABELS[category]
              }))}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Estado *
            </Text>
            <Select
              placeholder="Selecciona un estado"
              value={formData.status || ''}
              onChange={(value) => setFormData((prev: CreateFinanceData) => ({ ...prev, status: value as FinanceStatus }))}
              data={FINANCE_STATUSES.map((status) => ({
                value: status,
                label: FINANCE_STATUS_LABELS[status]
              }))}
            />
          </div>
        </div>
      </Stack>

    </Stack>
  );

  const renderStep2 = () => (
    <Stack gap="lg">
      {/* Método de pago */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Método de pago *
        </Text>
        <Select
          placeholder="Selecciona un método de pago"
          value={formData.paymentMethod || ''}
          onChange={(value) => {
            if (value) {
              setFormData((prev: CreateFinanceData) => ({ ...prev, paymentMethod: value as PaymentMethod }));
            }
          }}
          data={PAYMENT_METHODS.map((method) => ({
            value: method,
            label: PAYMENT_METHOD_LABELS[method]
          }))}
        />
      </div>

      {/* Subcategoría */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Subcategoría
        </Text>
        <TextInput
          placeholder="Ej: Marketing, Mantenimiento, Bonos..."
          value={formData.subcategory || ''}
          onChange={(e) => setFormData((prev: CreateFinanceData) => ({ ...prev, subcategory: e.target.value }))}
          leftSection={<IconBuilding size={16} />}
        />
      </div>

      {/* Tags */}
      <Stack gap="sm">
        <Text size="sm" fw={500}>Etiquetas</Text>
        
        <Group gap="sm">
          <Autocomplete
            placeholder="Agregar etiqueta..."
            value={tagInput}
            onChange={setTagInput}
            onOptionSubmit={(value) => {
              handleTagAdd(value);
            }}
            onKeyDown={handleTagInputKeyDown}
            leftSection={<IconTag size={16} />}
            data={availableTags || []}
            style={{ flex: 1 }}
          />
          
          <Button
            size="sm"
            variant="light"
            onClick={() => handleTagAdd(tagInput.trim())}
            disabled={!tagInput.trim() || (formData.tags && formData.tags.includes(tagInput.trim()))}
          >
            Agregar
          </Button>
        </Group>

        {formData.tags && formData.tags.length > 0 && (
          <Group gap="xs">
            {formData.tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                color="blue"
                size="sm"
                rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => handleTagRemove(tag)}><IconX size={10} /></ActionIcon>}
                leftSection={<IconTag size={10} />}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      {/* Notas */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Notas adicionales
        </Text>
        <Textarea
          placeholder="Información adicional sobre esta transacción..."
          value={formData.notes || ''}
          onChange={(e) => setFormData((prev: CreateFinanceData) => ({ ...prev, notes: e.target.value }))}
          minRows={3}
        />
      </div>
    </Stack>
  );

  const renderSummary = () => (
    <Stack gap="md">
      <Card withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Tipo:</Text>
            <Badge
              color={formData.type === 'income' ? 'green' : 'red'}
              variant="light"
              size="sm"
              leftSection={formData.type === 'income' ? 
                <IconTrendingUp size={12} /> : 
                <IconTrendingDown size={12} />
              }
            >
              {FINANCE_TYPE_LABELS[formData.type as keyof typeof FINANCE_TYPE_LABELS]}
            </Badge>
          </Group>
          
          <Divider />
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Descripción:</Text>
            <Text size="sm" fw={500}>{formData.description}</Text>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Monto:</Text>
            <Text 
              size="sm" 
              fw={600}
              c={formData.type === 'income' ? 'green' : 'red'}
            >
              {formData.type === 'income' ? '+' : '-'}{formatCurrency(formData.amount)}
            </Text>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Categoría:</Text>
            <Text size="sm">{FINANCE_CATEGORY_LABELS[formData.category as keyof typeof FINANCE_CATEGORY_LABELS]}</Text>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Fecha:</Text>
            <Text size="sm">{formData.date.toLocaleDateString()}</Text>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Estado:</Text>
            <Text size="sm">{FINANCE_STATUS_LABELS[formData.status as keyof typeof FINANCE_STATUS_LABELS]}</Text>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Método de pago:</Text>
            <Text size="sm">{PAYMENT_METHOD_LABELS[formData.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</Text>
          </Group>

          {formData.subcategory && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Subcategoría:</Text>
              <Text size="sm">{formData.subcategory}</Text>
            </Group>
          )}

          {formData.reservationId && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Reserva vinculada:</Text>
              <div style={{ backgroundColor: 'var(--mantine-color-blue-0)', border: '1px solid var(--mantine-color-blue-3)', borderRadius: 'var(--mantine-radius-sm)', padding: 'var(--mantine-spacing-sm)' }}>
                <Group gap="xs">
                  <IconUser size={16} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500} c="blue">
                    {(() => {
                      const reservation = reservations?.find(r => r._id === formData.reservationId);
                      return reservation ? `${reservation.customer.name} - ${reservation.child.name}` : 'Reserva seleccionada';
                    })()}
                  </Text>
                </Group>
              </div>
            </Stack>
          )}

          {formData.tags && formData.tags.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Etiquetas:</Text>
              <Group gap="xs">
                {formData.tags.map((tag: string) => (
                  <Badge key={tag} variant="light" color="blue" size="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Stack>
          )}

          {formData.notes && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Notas:</Text>
              <Text size="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', padding: 'var(--mantine-spacing-xs)', borderRadius: 'var(--mantine-radius-sm)' }}>
                {formData.notes}
              </Text>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
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
                  Nueva Transacción
                </Title>
                <Group gap="sm" mt={4}>
                  <Text size="sm" c="dimmed">
                    Paso {step} de 3
                  </Text>
                  {formData.type && (
                    <Badge
                      color={formData.type === 'income' ? 'green' : 'red'}
                      variant="light"
                      size="sm"
                    >
                      {FINANCE_TYPE_LABELS[formData.type as keyof typeof FINANCE_TYPE_LABELS]}
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>
          </Group>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <Stack gap="lg">
            {/* Progress indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Group gap="xs">
                {[1, 2, 3].map((stepNumber) => (
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
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
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

            {/* Step content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderSummary()}
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
                  onClick={handleBack}
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
                onClick={onClose}
                disabled={loading}
                size="sm"
                c="dimmed"
              >
                Cancelar
              </Button>
              
              {step < 3 ? (
                <Button
                  onClick={handleNext}
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
                  {loading ? 'Creando...' : 'Crear Transacción'}
                </Button>
              )}
            </Group>
          </Group>
        </div>
    </Modal>
  );
}