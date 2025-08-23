'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  TextInput,
  Textarea,
  Modal,
  Table,
  Badge,
  Loader,
  Switch,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  Select,
  NumberInput,
  MultiSelect,
  Checkbox,
  Tabs,
  Grid,
  Paper,
  Timeline,
  Progress,
  Divider
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconTicket,
  IconPencil,
  IconTrash,
  IconEye,
  IconPercentage,
  IconCurrencyDollar,
  IconCalendar,
  IconClock,
  IconUsers,
  IconTarget,
  IconChartBar,
  IconCopy,
  IconSettings
} from '@tabler/icons-react';
import toast from 'react-hot-toast';

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_service';
  discountValue: number;
  freeServiceId?: string;
  applicableTo: 'total' | 'package' | 'food' | 'extras' | 'specific_service';
  specificServiceIds?: string[];
  maxUses?: number;
  usedCount: number;
  maxUsesPerCustomer?: number;
  validFrom: string;
  validUntil: string;
  validDays?: number[];
  validTimeFrom?: string;
  validTimeTo?: string;
  minOrderAmount?: number;
  minGuests?: number;
  validPackageIds?: string[];
  excludedPackageIds?: string[];
  validFoodOptionIds?: string[];
  newCustomersOnly: boolean;
  excludedCustomerEmails?: string[];
  allowedCustomerEmails?: string[];
  isActive: boolean;
  createdBy: string;
  notes?: string;
  analytics: {
    totalUsage: number;
    totalDiscountGiven: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_service';
  discountValue: string;
  freeServiceId: string;
  applicableTo: 'total' | 'package' | 'food' | 'extras' | 'specific_service';
  specificServiceIds: string[];
  maxUses: string;
  maxUsesPerCustomer: string;
  validFrom: Date | null;
  validUntil: Date | null;
  validDays: string[];
  validTimeFrom: string;
  validTimeTo: string;
  minOrderAmount: string;
  minGuests: string;
  validPackageIds: string[];
  excludedPackageIds: string[];
  validFoodOptionIds: string[];
  newCustomersOnly: boolean;
  excludedCustomerEmails: string;
  allowedCustomerEmails: string;
  isActive: boolean;
  notes: string;
}

const initialFormData: CouponFormData = {
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  freeServiceId: '',
  applicableTo: 'total',
  specificServiceIds: [],
  maxUses: '',
  maxUsesPerCustomer: '',
  validFrom: null,
  validUntil: null,
  validDays: [],
  validTimeFrom: '',
  validTimeTo: '',
  minOrderAmount: '',
  minGuests: '',
  validPackageIds: [],
  excludedPackageIds: [],
  validFoodOptionIds: [],
  newCustomersOnly: false,
  excludedCustomerEmails: '',
  allowedCustomerEmails: '',
  isActive: true,
  notes: ''
};

const dayOptions = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' }
];

const discountTypeOptions = [
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'fixed_amount', label: 'Cantidad Fija' },
  { value: 'free_service', label: 'Servicio Gratuito' }
];

const applicableToOptions = [
  { value: 'total', label: 'Total de la reserva' },
  { value: 'package', label: 'Solo paquete' },
  { value: 'food', label: 'Solo comida' },
  { value: 'extras', label: 'Solo servicios extra' },
  { value: 'specific_service', label: 'Servicio específico' }
];

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);

  // Load data on component mount
  useEffect(() => {
    fetchCoupons();
    fetchPackages();
    fetchFoodOptions();
    fetchExtraServices();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      } else {
        toast.error('Error al cargar cupones');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchFoodOptions = async () => {
    try {
      const response = await fetch('/api/admin/food-options');
      if (response.ok) {
        const data = await response.json();
        setFoodOptions(data);
      }
    } catch (error) {
      console.error('Error fetching food options:', error);
    }
  };

  const fetchExtraServices = async () => {
    try {
      const response = await fetch('/api/admin/extra-services');
      if (response.ok) {
        const data = await response.json();
        setExtraServices(data);
      }
    } catch (error) {
      console.error('Error fetching extra services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Código y nombre son requeridos');
      return;
    }

    if (!formData.validFrom || !formData.validUntil) {
      toast.error('Las fechas de validez son requeridas');
      return;
    }

    if (formData.validFrom >= formData.validUntil) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    const couponData = {
      ...formData,
      code: formData.code.toUpperCase(),
      discountValue: parseFloat(formData.discountValue) || 0,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      maxUsesPerCustomer: formData.maxUsesPerCustomer ? parseInt(formData.maxUsesPerCustomer) : null,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
      minGuests: formData.minGuests ? parseInt(formData.minGuests) : null,
      validDays: formData.validDays.map(day => parseInt(day)),
      excludedCustomerEmails: formData.excludedCustomerEmails.split(',').map(email => email.trim()).filter(email => email),
      allowedCustomerEmails: formData.allowedCustomerEmails.split(',').map(email => email.trim()).filter(email => email)
    };

    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon._id}` : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        toast.success(`Cupón ${editingCoupon ? 'actualizado' : 'creado'} exitosamente`);
        fetchCoupons();
        handleCloseModal();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al procesar cupón');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar cupón');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      freeServiceId: coupon.freeServiceId || '',
      applicableTo: coupon.applicableTo,
      specificServiceIds: coupon.specificServiceIds || [],
      maxUses: coupon.maxUses?.toString() || '',
      maxUsesPerCustomer: coupon.maxUsesPerCustomer?.toString() || '',
      validFrom: new Date(coupon.validFrom),
      validUntil: new Date(coupon.validUntil),
      validDays: coupon.validDays?.map(day => day.toString()) || [],
      validTimeFrom: coupon.validTimeFrom || '',
      validTimeTo: coupon.validTimeTo || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      minGuests: coupon.minGuests?.toString() || '',
      validPackageIds: coupon.validPackageIds || [],
      excludedPackageIds: coupon.excludedPackageIds || [],
      validFoodOptionIds: coupon.validFoodOptionIds || [],
      newCustomersOnly: coupon.newCustomersOnly,
      excludedCustomerEmails: coupon.excludedCustomerEmails?.join(', ') || '',
      allowedCustomerEmails: coupon.allowedCustomerEmails?.join(', ') || '',
      isActive: coupon.isActive,
      notes: coupon.notes || ''
    });
    open();
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cupón eliminado exitosamente');
        fetchCoupons();
      } else {
        toast.error('Error al eliminar cupón');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error al eliminar cupón');
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingCoupon(null);
    setFormData(initialFormData);
  };

  const handleView = (coupon: Coupon) => {
    setViewingCoupon(coupon);
    openView();
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return <Badge color="gray">Inactivo</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge color="yellow">Pendiente</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge color="red">Expirado</Badge>;
    }
    
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return <Badge color="red">Agotado</Badge>;
    }
    
    return <Badge color="green">Activo</Badge>;
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.maxUses) return 0;
    return (coupon.usedCount / coupon.maxUses) * 100;
  };

  if (loading) {
    return (
      <Card>
        <Group justify="center" p="xl">
          <Loader />
          <Text>Cargando cupones...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Group>
          <IconTicket size={24} />
          <Title order={2}>Gestión de Cupones</Title>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Crear Cupón
        </Button>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Código</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Descuento</Table.Th>
              <Table.Th>Validez</Table.Th>
              <Table.Th>Uso</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {coupons.map((coupon) => (
              <Table.Tr key={coupon._id}>
                <Table.Td>
                  <Group>
                    <Text fw={700} c="blue">{coupon.code}</Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        toast.success('Código copiado');
                      }}
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{coupon.name}</Text>
                  {coupon.description && (
                    <Text size="xs" c="dimmed">{coupon.description}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {coupon.discountType === 'percentage' ? (
                      <IconPercentage size={16} />
                    ) : (
                      <IconCurrencyDollar size={16} />
                    )}
                    <Text size="sm">
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%`
                        : coupon.discountType === 'fixed_amount'
                        ? formatPrice(coupon.discountValue)
                        : 'Servicio Gratuito'
                      }
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap="xs">
                    <Text size="xs">
                      {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''} usos
                    </Text>
                    {coupon.maxUses && (
                      <Progress 
                        value={getUsagePercentage(coupon)} 
                        size="xs"
                        color={getUsagePercentage(coupon) > 80 ? 'red' : 'blue'}
                      />
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>{getStatusBadge(coupon)}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => handleView(coupon)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => handleEdit(coupon)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(coupon._id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={`${editingCoupon ? 'Editar' : 'Crear'} Cupón`}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <Tabs.List>
              <Tabs.Tab value="basic" leftSection={<IconSettings size={16} />}>
                Información Básica
              </Tabs.Tab>
              <Tabs.Tab value="restrictions" leftSection={<IconTarget size={16} />}>
                Restricciones
              </Tabs.Tab>
              <Tabs.Tab value="advanced" leftSection={<IconChartBar size={16} />}>
                Avanzado
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack>
                <Group grow>
                  <TextInput
                    label="Código del Cupón"
                    placeholder="DESCUENTO2024"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      code: e.currentTarget?.value.toUpperCase() || '' 
                    }))}
                    required
                    rightSection={
                      <Button size="xs" variant="subtle" onClick={generateRandomCode}>
                        Generar
                      </Button>
                    }
                  />
                  <TextInput
                    label="Nombre del Cupón"
                    placeholder="Descuento de Año Nuevo"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      name: e.currentTarget?.value || '' 
                    }))}
                    required
                  />
                </Group>

                <Textarea
                  label="Descripción"
                  placeholder="Descripción del cupón para mostrar a los usuarios"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: e.currentTarget?.value || '' 
                  }))}
                />

                <Group grow>
                  <Select
                    label="Tipo de Descuento"
                    value={formData.discountType}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      discountType: value as any
                    }))}
                    data={discountTypeOptions}
                    required
                  />
                  <NumberInput
                    label={formData.discountType === 'percentage' ? 'Porcentaje (%)' : 'Cantidad ($)'}
                    placeholder={formData.discountType === 'percentage' ? '15' : '500'}
                    value={formData.discountValue}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      discountValue: value?.toString() || ''
                    }))}
                    min={0}
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    required={formData.discountType !== 'free_service'}
                  />
                </Group>

                {formData.discountType === 'free_service' && (
                  <Select
                    label="Servicio Gratuito"
                    value={formData.freeServiceId}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      freeServiceId: value || ''
                    }))}
                    data={extraServices.map(service => ({ 
                      value: service._id, 
                      label: `${service.name} - ${formatPrice(service.price)}`
                    }))}
                    required
                  />
                )}

                <Select
                  label="Aplicable a"
                  value={formData.applicableTo}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    applicableTo: value as any
                  }))}
                  data={applicableToOptions}
                  required
                />

                <Group grow>
                  <DateTimePicker
                    label="Válido desde"
                    value={formData.validFrom}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      validFrom: value ? new Date(value) : null
                    }))}
                    required
                  />
                  <DateTimePicker
                    label="Válido hasta"
                    value={formData.validUntil}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      validUntil: value ? new Date(value) : null
                    }))}
                    required
                  />
                </Group>

                <Switch
                  label="Cupón activo"
                  checked={formData.isActive}
                  onChange={(event) => setFormData(prev => ({ 
                    ...prev, 
                    isActive: event.currentTarget.checked
                  }))}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="restrictions" pt="md">
              <Stack>
                <Group grow>
                  <NumberInput
                    label="Máximo de usos totales"
                    placeholder="100"
                    value={formData.maxUses}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      maxUses: value?.toString() || ''
                    }))}
                    min={1}
                  />
                  <NumberInput
                    label="Máximo de usos por cliente"
                    placeholder="1"
                    value={formData.maxUsesPerCustomer}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      maxUsesPerCustomer: value?.toString() || ''
                    }))}
                    min={1}
                  />
                </Group>

                <MultiSelect
                  label="Días válidos"
                  placeholder="Selecciona días de la semana"
                  value={formData.validDays}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    validDays: value
                  }))}
                  data={dayOptions}
                />

                <Group grow>
                  <TextInput
                    label="Hora válida desde"
                    placeholder="09:00"
                    value={formData.validTimeFrom}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      validTimeFrom: e.currentTarget?.value || ''
                    }))}
                  />
                  <TextInput
                    label="Hora válida hasta"
                    placeholder="17:00"
                    value={formData.validTimeTo}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      validTimeTo: e.currentTarget?.value || ''
                    }))}
                  />
                </Group>

                <Group grow>
                  <NumberInput
                    label="Monto mínimo de pedido"
                    placeholder="1000"
                    value={formData.minOrderAmount}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      minOrderAmount: value?.toString() || ''
                    }))}
                    min={0}
                  />
                  <NumberInput
                    label="Mínimo de invitados"
                    placeholder="5"
                    value={formData.minGuests}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      minGuests: value?.toString() || ''
                    }))}
                    min={1}
                  />
                </Group>

                <Checkbox
                  label="Solo para clientes nuevos"
                  checked={formData.newCustomersOnly}
                  onChange={(event) => setFormData(prev => ({ 
                    ...prev, 
                    newCustomersOnly: event.currentTarget.checked
                  }))}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="advanced" pt="md">
              <Stack>
                {packages.length > 0 && (
                  <>
                    <MultiSelect
                      label="Paquetes válidos (dejar vacío para todos)"
                      value={formData.validPackageIds}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        validPackageIds: value
                      }))}
                      data={packages.map(pkg => ({ 
                        value: pkg._id, 
                        label: pkg.name
                      }))}
                    />
                    <MultiSelect
                      label="Paquetes excluidos"
                      value={formData.excludedPackageIds}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        excludedPackageIds: value
                      }))}
                      data={packages.map(pkg => ({ 
                        value: pkg._id, 
                        label: pkg.name
                      }))}
                    />
                  </>
                )}

                {foodOptions.length > 0 && (
                  <MultiSelect
                    label="Opciones de comida válidas"
                    value={formData.validFoodOptionIds}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      validFoodOptionIds: value
                    }))}
                    data={foodOptions.map(option => ({ 
                      value: option._id, 
                      label: option.name
                    }))}
                  />
                )}

                <Textarea
                  label="Emails de clientes excluidos (separados por coma)"
                  placeholder="cliente1@email.com, cliente2@email.com"
                  value={formData.excludedCustomerEmails}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    excludedCustomerEmails: e.currentTarget?.value || ''
                  }))}
                />

                <Textarea
                  label="Emails de clientes permitidos (dejar vacío para todos)"
                  placeholder="vip1@email.com, vip2@email.com"
                  value={formData.allowedCustomerEmails}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    allowedCustomerEmails: e.currentTarget?.value || ''
                  }))}
                />

                <Textarea
                  label="Notas internas"
                  placeholder="Notas para el equipo administrativo"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notes: e.currentTarget?.value || ''
                  }))}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
            </Button>
          </Group>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        opened={viewOpened}
        onClose={closeView}
        title="Detalles del Cupón"
        size="lg"
      >
        {viewingCoupon && (
          <Stack>
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3}>{viewingCoupon.name}</Title>
                {getStatusBadge(viewingCoupon)}
              </Group>
              
              <Grid>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Código</Text>
                  <Text fw={700} c="blue">{viewingCoupon.code}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Descuento</Text>
                  <Text fw={500}>
                    {viewingCoupon.discountType === 'percentage' 
                      ? `${viewingCoupon.discountValue}%`
                      : viewingCoupon.discountType === 'fixed_amount'
                      ? formatPrice(viewingCoupon.discountValue)
                      : 'Servicio Gratuito'
                    }
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper p="md" withBorder>
              <Title order={4} mb="md">Estadísticas de Uso</Title>
              <Grid>
                <Grid.Col span={3}>
                  <Text ta="center">
                    <Text fw={700} size="xl">{viewingCoupon.usedCount}</Text>
                    <Text size="sm" c="dimmed">Usos totales</Text>
                  </Text>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Text ta="center">
                    <Text fw={700} size="xl">{formatPrice(viewingCoupon.analytics.totalDiscountGiven)}</Text>
                    <Text size="sm" c="dimmed">Descuento dado</Text>
                  </Text>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Text ta="center">
                    <Text fw={700} size="xl">{formatPrice(viewingCoupon.analytics.avgOrderValue)}</Text>
                    <Text size="sm" c="dimmed">Valor promedio</Text>
                  </Text>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Text ta="center">
                    <Text fw={700} size="xl">{viewingCoupon.analytics.conversionRate.toFixed(1)}%</Text>
                    <Text size="sm" c="dimmed">Conversión</Text>
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {viewingCoupon.description && (
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Descripción</Title>
                <Text>{viewingCoupon.description}</Text>
              </Paper>
            )}

            {viewingCoupon.notes && (
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Notas Internas</Title>
                <Text c="dimmed">{viewingCoupon.notes}</Text>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>
    </Card>
  );
}