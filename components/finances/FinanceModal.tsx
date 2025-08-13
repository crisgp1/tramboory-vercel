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
  Divider,
  Tabs,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Autocomplete
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
  IconBuilding,
  IconEdit,
  IconEye,
  IconClock,
  IconPlus,
  IconList,
  IconTrash,
  IconSettings
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FINANCE_TYPES,
  FINANCE_CATEGORIES,
  FINANCE_STATUSES,
  PAYMENT_METHODS,
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  Finance,
  FinanceCategory,
  FinanceStatus,
  PaymentMethod
} from '@/types/finance';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  finance: Finance | null;
  onUpdate?: (id: string, data: Partial<Finance>) => Promise<void>;
  availableTags: string[];
  mode?: 'view' | 'edit';
  onRefresh?: () => void; // Para refrescar la lista después de agregar children
}

export default function FinanceModal({
  isOpen,
  onClose,
  finance,
  onUpdate,
  availableTags = [],
  mode: initialMode = 'view',
  onRefresh
}: FinanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [children, setChildren] = useState<Finance[]>([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Finance>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && finance) {
      setFormData({ ...finance });
      // Si la finanza es generada por el sistema o no es editable, forzar modo 'view'
      setMode((finance.isSystemGenerated || finance.isEditable === false || !!finance.reservation) ? 'view' : initialMode);
      setActiveTab('details');
      setErrors({});
      setTagInput('');
      setChildren([]);
      fetchChildren();
    }
  }, [isOpen, finance, initialMode]);

  const fetchChildren = async () => {
    if (!finance) return;
    
    setLoadingChildren(true);
    try {
      const response = await fetch(`/api/finances/${finance._id}/children`);
      const data = await response.json();
      
      if (data.success) {
        setChildren(data.data.children || []);
        console.log('Children loaded:', data.data.children?.length || 0);
      } else {
        console.error('Error fetching children:', data.error);
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleAddChild = async (childData: any) => {
    if (!finance) return;
    
    try {
      const response = await fetch(`/api/finances/${finance._id}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Child created successfully:', result.data);
        await fetchChildren(); // Refrescar children
        if (onRefresh) {
          onRefresh(); // Refrescar lista principal
        }
        setShowAddChildModal(false);
      } else {
        console.error('Error al crear child:', result.error);
        alert('Error al crear el registro relacionado: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating child:', error);
      alert('Error al crear el registro relacionado');
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return typeof date === 'string' ? date : date.toLocaleDateString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !finance || !onUpdate) return;

    setLoading(true);
    try {
      await onUpdate(finance._id, formData);
      setMode('view');
    } catch (error) {
      console.error('Error updating finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (finance) {
      setFormData({ ...finance });
      setErrors({});
      setMode('view');
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && formData.tags && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
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

  if (!finance) return null;

  const typeColorMap = {
    income: 'green',
    expense: 'red'
  } as const;

  const statusColorMap = {
    pending: 'orange',
    completed: 'green',
    cancelled: 'red'
  } as const;

  const categoryColorMap = {
    reservation: 'blue',
    operational: 'gray',
    salary: 'orange',
    other: 'gray'
  } as const;

  const renderDetailsTab = () => (
    <Stack gap="lg">
      {/* Header con tipo y estado */}
      <Group justify="space-between">
        <Group gap="md">
          <div 
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: finance.type === 'income' ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)'
            }}
          />
          <Stack gap={0}>
            <Title order={3} size="md">
              {finance.description}
            </Title>
            <Text size="sm" c="dimmed">
              {formatDate(finance.date)}
            </Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Badge
            color={typeColorMap[finance.type]}
            variant="light"
            leftSection={finance.type === 'income' ? 
              <IconTrendingUp size={12} /> : 
              <IconTrendingDown size={12} />
            }
          >
            {FINANCE_TYPE_LABELS[finance.type as keyof typeof FINANCE_TYPE_LABELS]}
          </Badge>
          <Badge
            color={statusColorMap[finance.status]}
            variant="light"
          >
            {FINANCE_STATUS_LABELS[finance.status as keyof typeof FINANCE_STATUS_LABELS]}
          </Badge>
        </Group>
      </Group>

      {/* Monto destacado */}
      <Card withBorder p="xl" style={{ textAlign: 'center', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">Monto</Text>
          <Text 
            size="xl" 
            fw={700}
            c={finance.type === 'income' ? 'green' : 'red'}
            style={{ fontSize: '2rem' }}
          >
            {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
          </Text>
        </Stack>
      </Card>

      {/* Información principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-lg)' }}>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} c="dark">Categoría</Text>
            <div style={{ marginTop: '4px' }}>
              <Badge
                color={categoryColorMap[finance.category]}
                variant="light"
              >
                {FINANCE_CATEGORY_LABELS[finance.category as keyof typeof FINANCE_CATEGORY_LABELS]}
              </Badge>
            </div>
          </div>

          {finance.subcategory && (
            <div>
              <Text size="sm" fw={500} c="dark">Subcategoría</Text>
              <Text size="sm" mt={4}>{finance.subcategory}</Text>
            </div>
          )}

          <div>
            <Text size="sm" fw={500} c="dark">Método de pago</Text>
            <Text size="sm" mt={4}>
              {PAYMENT_METHOD_LABELS[finance.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}
            </Text>
          </div>
        </Stack>

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} c="dark">Fecha</Text>
            <Text size="sm" mt={4}>{formatDate(finance.date)}</Text>
          </div>

          {finance.reference && (
            <div>
              <Text size="sm" fw={500} c="dark">Referencia</Text>
              <Text size="sm" mt={4}>{finance.reference}</Text>
            </div>
          )}

          {finance.createdBy && (
            <div>
              <Text size="sm" fw={500} c="dark">Creado por</Text>
              <Text size="sm" mt={4}>{finance.createdBy}</Text>
            </div>
          )}
        </Stack>
      </div>

      {/* Reserva vinculada */}
      {finance.reservation && (
        <div>
          <Text size="sm" fw={500} c="dark">Reserva vinculada</Text>
          <Card withBorder mt="xs">
            <Group gap="md">
              <IconUser size={20} color="gray" />
              <Stack gap={0}>
                <Text fw={500}>{finance.reservation.customerName}</Text>
                <Text size="sm" c="dimmed">
                  {formatDate(finance.reservation.eventDate)}
                </Text>
              </Stack>
            </Group>
          </Card>
        </div>
      )}

      {/* Etiquetas */}
      {finance.tags && finance.tags.length > 0 && (
        <div>
          <Text size="sm" fw={500} c="dark">Etiquetas</Text>
          <Group gap="xs" mt="xs">
            {finance.tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                color="blue"
                size="sm"
                leftSection={<IconTag size={12} />}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        </div>
      )}

      {/* Notas */}
      {finance.notes && (
        <div>
          <Text size="sm" fw={500} c="dark">Notas</Text>
          <Card withBorder mt="xs">
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{finance.notes}</Text>
          </Card>
        </div>
      )}
    </Stack>
  );

  const renderEditTab = () => (
    <Stack gap="lg">
      {(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) && (
        <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Group gap="sm">
            <IconSettings size={20} color="var(--mantine-color-blue-5)" />
            <Stack gap="xs">
              <Text size="sm" fw={500} c="blue">Finanza Generada Automáticamente</Text>
              <Text size="xs" c="blue">
                Esta finanza fue generada automáticamente desde una reservación y no puede ser editada.
                Puedes agregar gastos o ingresos relacionados en la pestaña "Relacionados".
              </Text>
            </Stack>
          </Group>
        </Card>
      )}
      {/* Información básica */}
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Descripción *
          </Text>
          <TextInput
            placeholder="Descripción de la transacción"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            error={errors.description}
            leftSection={<IconFileText size={16} />}
            disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
            style={{
              input: {
                backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                  ? 'var(--mantine-color-gray-1)' 
                  : undefined,
                opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                  ? 0.6 
                  : undefined
              }
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Monto *
            </Text>
            <TextInput
              type="number"
              placeholder="0.00"
              value={formData.amount?.toString() || ''}
              onChange={(e) => {
                const num = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ ...prev, amount: num }));
              }}
              error={errors.amount}
              leftSection={<IconCurrencyDollar size={16} />}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Fecha *
            </Text>
            <TextInput
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData(prev => ({ ...prev, date }));
              }}
              leftSection={<IconCalendar size={16} />}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Categoría *
            </Text>
            <Select
              placeholder="Selecciona una categoría"
              value={formData.category || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value as FinanceCategory }))}
              data={FINANCE_CATEGORIES.map((category) => ({
                value: category,
                label: FINANCE_CATEGORY_LABELS[category]
              }))}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Estado *
            </Text>
            <Select
              placeholder="Selecciona un estado"
              value={formData.status || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value as FinanceStatus }))}
              data={FINANCE_STATUSES.map((status) => ({
                value: status,
                label: FINANCE_STATUS_LABELS[status]
              }))}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Método de pago *
            </Text>
            <Select
              placeholder="Selecciona un método"
              value={formData.paymentMethod || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
              data={PAYMENT_METHODS.map((method) => ({
                value: method,
                label: PAYMENT_METHOD_LABELS[method]
              }))}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Subcategoría
            </Text>
            <TextInput
              placeholder="Subcategoría específica"
              value={formData.subcategory || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              leftSection={<IconBuilding size={16} />}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Referencia
            </Text>
            <TextInput
              placeholder="Número de referencia o folio"
              value={formData.reference || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              style={{
                input: {
                  backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 'var(--mantine-color-gray-1)' 
                    : undefined,
                  opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                    ? 0.6 
                    : undefined
                }
              }}
            />
          </div>
        </div>
      </Stack>

      {/* Tags */}
      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Etiquetas
        </Text>
        
        <Group>
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
            disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
            style={{
              flex: 1,
              input: {
                backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                  ? 'var(--mantine-color-gray-1)' 
                  : undefined,
                opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                  ? 0.6 
                  : undefined
              }
            }}
          />
          
          <Button
            size="sm"
            variant="light"
            onClick={() => handleTagAdd(tagInput.trim())}
            disabled={(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) || !tagInput.trim() || (formData.tags || []).includes(tagInput.trim())}
            style={{
              backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                ? 'var(--mantine-color-gray-1)' 
                : undefined,
              opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                ? 0.6 
                : undefined
            }}
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
          placeholder="Información adicional sobre la transacción..."
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          minRows={3}
          disabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
          style={{
            input: {
              backgroundColor: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                ? 'var(--mantine-color-gray-1)' 
                : undefined,
              opacity: (finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) 
                ? 0.6 
                : undefined
            }
          }}
        />
      </div>
    </Stack>
  );

  const renderChildrenTab = () => (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm" c="dimmed">
          <IconList size={16} />
          <Text size="sm">Gastos e ingresos relacionados</Text>
        </Group>
        {finance && (finance.isSystemGenerated || !!finance.reservation) && (
          <Button
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowAddChildModal(true)}
            color="dark"
          >
            Agregar
          </Button>
        )}
      </Group>

      {/* Resumen de totales */}
      {finance && (
        <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mantine-spacing-md)', textAlign: 'center' }}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Monto Original</Text>
              <Text 
                size="lg" 
                fw={600}
                c={finance.type === 'income' ? 'green' : 'red'}
              >
                {formatCurrency(finance.amount)}
              </Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Relacionados</Text>
              <Text size="lg" fw={600}>
                {formatCurrency(children.reduce((sum, child) => {
                  return child.type === 'income' ? sum + child.amount : sum - child.amount;
                }, 0))}
              </Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total</Text>
              <Text 
                size="lg" 
                fw={600}
                c={(finance.amount + children.reduce((sum, child) => {
                  return child.type === 'income' ? sum + child.amount : sum - child.amount;
                }, 0)) >= 0 ? 'green' : 'red'}
              >
                {formatCurrency(finance.amount + children.reduce((sum, child) => {
                  return child.type === 'income' ? sum + child.amount : sum - child.amount;
                }, 0))}
              </Text>
            </Stack>
          </div>
        </Card>
      )}

      {/* Lista de children */}
      {loadingChildren ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      ) : children.length > 0 ? (
        <Stack gap="sm">
          {children.map((child) => (
            <Card key={child._id} withBorder>
              <Group justify="space-between">
                <Group gap="md">
                  <div 
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: child.type === 'income' ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)'
                    }}
                  />
                  <Stack gap={0}>
                    <Text fw={500}>{child.description}</Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(child.date)}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="md">
                  <Stack gap="xs" align="flex-end">
                    <Text 
                      fw={600}
                      c={child.type === 'income' ? 'green' : 'red'}
                    >
                      {child.type === 'income' ? '+' : '-'}{formatCurrency(child.amount)}
                    </Text>
                    <Group gap="xs">
                      <Badge
                        size="sm"
                        variant="light"
                        color={child.type === 'income' ? 'green' : 'red'}
                      >
                        {child.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                      {child.tags && child.tags.length > 0 && (
                        <Badge size="sm" variant="light" color="gray">
                          {child.tags[0]}
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                </Group>
              </Group>
              {child.notes && (
                <Text size="sm" c="dimmed" mt="sm" pl="lg">{child.notes}</Text>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <IconList size={48} color="var(--mantine-color-gray-4)" style={{ margin: '0 auto 1rem' }} />
          <Text c="dimmed">No hay gastos o ingresos relacionados</Text>
          {finance && (finance.isSystemGenerated || !!finance.reservation) && (
            <Text size="sm" c="dimmed" mt="xs">Puedes agregar gastos o ingresos adicionales relacionados a esta transacción</Text>
          )}
        </div>
      )}
    </Stack>
  );

  const renderHistoryTab = () => (
    <Stack gap="md">
      <Group gap="sm" c="dimmed">
        <IconClock size={16} />
        <Text size="sm">Historial de cambios</Text>
      </Group>
      
      <Stack gap="sm">
        <Group gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
          <div 
            style={{
              width: 8,
              height: 8,
              backgroundColor: 'var(--mantine-color-green-5)',
              borderRadius: '50%',
              marginTop: 2
            }}
          />
          <Stack gap={0} style={{ flex: 1 }}>
            <Text size="sm" fw={500}>Transacción creada</Text>
            <Text size="xs" c="dimmed">
              {formatDate(finance.createdAt || finance.date)}
              {finance.createdBy && ` por ${finance.createdBy}`}
            </Text>
          </Stack>
        </Group>

        {finance.updatedAt && finance.updatedAt !== finance.createdAt && (
          <Group gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <div 
              style={{
                width: 8,
                height: 8,
                backgroundColor: 'var(--mantine-color-blue-5)',
                borderRadius: '50%',
                marginTop: 2
              }}
            />
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" fw={500}>Última actualización</Text>
              <Text size="xs" c="dimmed">
                {formatDate(finance.updatedAt)}
              </Text>
            </Stack>
          </Group>
        )}
      </Stack>
    </Stack>
  );

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        size="xl"
        title={null}
        styles={{
          content: {
            maxHeight: '95vh',
            overflow: 'hidden',
            opacity: showAddChildModal ? 0.75 : 1
          },
          body: {
            padding: 0,
            maxHeight: 'calc(95vh - 140px)',
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
                    {mode === 'edit' ? 'Editar Transacción' : 'Detalles de Transacción'}
                  </Title>
                  <Group gap="sm" mt={4}>
                    <Badge
                      color={typeColorMap[finance.type]}
                      variant="light"
                      size="sm"
                    >
                      {FINANCE_TYPE_LABELS[finance.type as keyof typeof FINANCE_TYPE_LABELS]}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      ID: {finance._id.slice(-6).toUpperCase()}
                    </Text>
                  </Group>
                </Stack>
              </Group>
              <Group gap="xs">
                {mode === 'view' && onUpdate && !finance.isSystemGenerated && finance.isEditable !== false && !finance.reservation && (
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => setMode('edit')}
                    leftSection={<IconEdit size={16} />}
                  >
                    Editar
                  </Button>
                )}
              </Group>
            </Group>
          </div>

          {/* Navigation Tabs */}
          <div style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', backgroundColor: 'white' }}>
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')} variant="outline">
              <Tabs.List style={{ borderBottom: 'none', padding: '0 1.5rem' }}>
                <Tabs.Tab value="details" leftSection={mode === 'edit' ? <IconEdit size={16} /> : <IconEye size={16} />}>
                  {mode === 'edit' ? 'Editar' : 'Detalles'}
                </Tabs.Tab>
                <Tabs.Tab value="children" leftSection={<IconList size={16} />}>
                  Relacionados ({children.length})
                </Tabs.Tab>
                <Tabs.Tab value="history" leftSection={<IconClock size={16} />}>
                  Historial
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            {activeTab === 'details' && (mode === 'view' ? renderDetailsTab() : renderEditTab())}
            {activeTab === 'children' && renderChildrenTab()}
            {activeTab === 'history' && renderHistoryTab()}
          </div>

          {/* Footer */}
          <div style={{ 
            padding: '1.5rem', 
            borderTop: '1px solid var(--mantine-color-gray-2)', 
            backgroundColor: 'var(--mantine-color-gray-0)' 
          }}>
            <Group justify="space-between" w="100%">
              <Group gap="sm">
                {mode === 'edit' && (
                  <Button
                    variant="light"
                    onClick={handleCancel}
                    size="sm"
                    c="dimmed"
                  >
                    Cancelar
                  </Button>
                )}
              </Group>
              
              <Group gap="sm">
                <Button
                  variant="light"
                  onClick={onClose}
                  size="sm"
                  c="dimmed"
                >
                  Cerrar
                </Button>
                
                {mode === 'edit' && onUpdate && !finance.isSystemGenerated && finance.isEditable !== false && !finance.reservation && (
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    size="sm"
                    color="dark"
                  >
                    Guardar Cambios
                  </Button>
                )}
              </Group>
            </Group>
          </div>
      </Modal>

      {/* Modal para agregar child */}
      <Modal
        opened={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        size="md"
        styles={{
          content: {
            maxHeight: '90vh',
            overflow: 'hidden'
          },
          body: {
            maxHeight: 'calc(90vh - 120px)',
            overflow: 'auto'
          }
        }}
        title={
          <Group gap="md">
            <div 
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'var(--mantine-color-gray-1)',
                borderRadius: 'var(--mantine-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconPlus size={16} color="var(--mantine-color-gray-6)" />
            </div>
            <Stack gap={0}>
              <Text fw={600}>Agregar Relacionado</Text>
              <Text size="xs" c="dimmed">
                {finance?.description}
              </Text>
            </Stack>
          </Group>
        }
      >
        <AddChildForm
          onSubmit={handleAddChild}
          onCancel={() => setShowAddChildModal(false)}
          parentFinance={finance}
        />
      </Modal>
    </>
  );
}

// Componente para agregar child
function AddChildForm({
  onSubmit,
  onCancel,
  parentFinance
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  parentFinance: Finance | null;
}) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      {/* Selector de tipo */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Tipo *
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mantine-spacing-xs)' }}>
          <Card
            withBorder
            p="sm"
            style={{
              cursor: 'pointer',
              borderColor: formData.type === 'income' ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-gray-3)',
              backgroundColor: formData.type === 'income' ? 'var(--mantine-color-green-0)' : 'transparent',
              textAlign: 'center'
            }}
            onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
          >
            <Stack gap="xs" align="center">
              <IconTrendingUp size={24} color="var(--mantine-color-green-5)" />
              <Text size="sm" fw={500}>Ingreso</Text>
            </Stack>
          </Card>
          
          <Card
            withBorder
            p="sm"
            style={{
              cursor: 'pointer',
              borderColor: formData.type === 'expense' ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-gray-3)',
              backgroundColor: formData.type === 'expense' ? 'var(--mantine-color-red-0)' : 'transparent',
              textAlign: 'center'
            }}
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
          >
            <Stack gap="xs" align="center">
              <IconTrendingDown size={24} color="var(--mantine-color-red-5)" />
              <Text size="sm" fw={500}>Gasto</Text>
            </Stack>
          </Card>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Descripción *
        </Text>
        <TextInput
          placeholder="Ej: Gasto adicional de materiales..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          size="sm"
          leftSection={<IconFileText size={16} />}
        />
      </div>
      
      {/* Monto */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Monto *
        </Text>
        <TextInput
          type="number"
          placeholder="0.00"
          value={formData.amount.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
          leftSection={<IconCurrencyDollar size={16} />}
          size="sm"
        />
      </div>

      {/* Notas */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Notas (opcional)
        </Text>
        <Textarea
          placeholder="Información adicional..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          minRows={2}
          size="sm"
        />
      </div>

      {/* Botones */}
      <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <Button
          variant="light"
          onClick={onCancel}
          size="sm"
          c="dimmed"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!formData.description.trim() || formData.amount <= 0}
          size="sm"
          color="dark"
          leftSection={!loading && <IconPlus size={16} />}
        >
          {loading ? 'Agregando...' : 'Agregar'}
        </Button>
      </Group>
    </Stack>
  );
}