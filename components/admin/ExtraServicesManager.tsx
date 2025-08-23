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
  Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSparkles,
  IconPencil,
  IconTrash,
  IconEye,
  IconCurrencyDollar
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface ExtraService {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExtraServiceFormData {
  name: string;
  price: string;
  description: string;
  category: string;
  isActive: boolean;
}

const categories = [
  { key: 'animacion', label: 'Animación' },
  { key: 'decoracion', label: 'Decoración' },
  { key: 'fotografia', label: 'Fotografía' },
  { key: 'sonido', label: 'Sonido' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'otros', label: 'Otros' }
];

export default function ExtraServicesManager() {
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<ExtraService | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  
  const [formData, setFormData] = useState<ExtraServiceFormData>({
    name: '',
    price: '',
    description: '',
    category: 'otros',
    isActive: true
  });

  useEffect(() => {
    fetchExtraServices();
  }, []);

  const fetchExtraServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/extra-services');
      const data = await response.json();
      
      if (data.success) {
        setExtraServices(data.data);
      } else {
        notifications.show({ title: 'Error', message: 'Error al cargar los servicios extras', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching extra services:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar los servicios extras', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: 'otros',
      isActive: true
    });
    setEditingService(null);
  };

  const handleCreate = () => {
    resetForm();
    open();
  };

  const handleEdit = (service: ExtraService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      description: service.description || '',
      category: service.category,
      isActive: service.isActive
    });
    open();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price || !formData.category) {
      notifications.show({ title: 'Error', message: 'Por favor completa todos los campos requeridos', color: 'red' });
      return;
    }

    setSubmitting(true);
    
    try {
      const serviceData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        category: formData.category,
        isActive: formData.isActive
      };

      const url = editingService 
        ? `/api/admin/extra-services/${editingService._id}`
        : '/api/admin/extra-services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifications.show({ title: 'Success', message: editingService ? 'Servicio extra actualizado exitosamente' : 'Servicio extra creado exitosamente', color: 'green' });
        fetchExtraServices();
        close();
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al guardar el servicio extra', color: 'red' });
      }
    } catch (error) {
      console.error('Error saving extra service:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar el servicio extra', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio extra?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/extra-services/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Success', message: 'Servicio extra eliminado correctamente', color: 'green' });
        fetchExtraServices();
      } else {
        notifications.show({ title: 'Error', message: 'Error al eliminar el servicio extra', color: 'red' });
      }
    } catch (error) {
      console.error('Error deleting extra service:', error);
      notifications.show({ title: 'Error', message: 'Error al eliminar el servicio extra', color: 'red' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.key === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      animacion: 'bg-blue-100 text-blue-700',
      decoracion: 'bg-purple-100 text-purple-700',
      fotografia: 'bg-green-100 text-green-700',
      sonido: 'bg-yellow-100 text-yellow-700',
      transporte: 'bg-red-100 text-red-700',
      otros: 'bg-neutral-100 text-neutral-700'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="md">
          <div style={{ 
            width: 48, 
            height: 48, 
            backgroundColor: 'var(--mantine-primary-color-6)', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <IconSparkles size={24} color="white" />
          </div>
          <Stack gap={0}>
            <Title order={2}>Servicios Extras</Title>
            <Text size="sm" c="dimmed">
              Gestiona los servicios adicionales disponibles
            </Text>
          </Stack>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreate}
          size="lg"
        >
          Nuevo Servicio
        </Button>
      </Group>

      {/* Stats Cards */}
      <Group grow>
        <Card withBorder p="lg" style={{ textAlign: 'center' }}>
          <Text size="xl" fw={700} mb="sm">
            {extraServices.length}
          </Text>
          <Text size="sm" c="dimmed">Total de Servicios</Text>
        </Card>
        
        <Card withBorder p="lg" style={{ textAlign: 'center' }}>
          <Text size="xl" fw={700} mb="sm" c="green">
            {extraServices.filter(s => s.isActive).length}
          </Text>
          <Text size="sm" c="dimmed">Servicios Activos</Text>
        </Card>
        
        <Card withBorder p="lg" style={{ textAlign: 'center' }}>
          <Text size="xl" fw={700} mb="sm" c="blue">
            {new Set(extraServices.map(s => s.category)).size}
          </Text>
          <Text size="sm" c="dimmed">Categorías</Text>
        </Card>
        
        <Card withBorder p="lg" style={{ textAlign: 'center' }}>
          <Text size="xl" fw={700} mb="sm" c="orange">
            {extraServices.length > 0 ? formatCurrency(extraServices.reduce((sum, s) => sum + s.price, 0) / extraServices.length) : '$0'}
          </Text>
          <Text size="sm" c="dimmed">Precio Promedio</Text>
        </Card>
      </Group>

      {/* Extra Services Table */}
      <Card withBorder>
        {loading ? (
          <Stack align="center" gap="sm" py="xl">
            <Loader size="lg" />
            <Text c="dimmed">Cargando servicios extras...</Text>
          </Stack>
        ) : (
          <ScrollArea>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SERVICIO</Table.Th>
                  <Table.Th visibleFrom="md">CATEGORÍA</Table.Th>
                  <Table.Th visibleFrom="lg">PRECIO</Table.Th>
                  <Table.Th>ESTADO</Table.Th>
                  <Table.Th>ACCIONES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {extraServices.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text ta="center" c="dimmed" py="lg">
                        No hay servicios extras registrados
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  extraServices.map((service) => (
                    <Table.Tr key={service._id}>
                      <Table.Td>
                        <Group gap="sm">
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: 'var(--mantine-color-gray-1)', 
                            borderRadius: 8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <IconSparkles size={20} color="gray" />
                          </div>
                          <Stack gap={2}>
                            <Text fw={600}>{service.name}</Text>
                            {service.description && (
                              <Text size="sm" c="dimmed" lineClamp={1} maw={300}>
                                {service.description}
                              </Text>
                            )}
                            <Group gap="xs" hiddenFrom="lg">
                              <IconCurrencyDollar size={12} />
                              <Text size="xs" c="dimmed">
                                {formatCurrency(service.price)}
                              </Text>
                            </Group>
                          </Stack>
                        </Group>
                      </Table.Td>
                      <Table.Td visibleFrom="md">
                        <Badge
                          size="sm"
                          variant="light"
                          color={service.category === 'animacion' ? 'blue' : 
                                 service.category === 'decoracion' ? 'purple' :
                                 service.category === 'fotografia' ? 'green' :
                                 service.category === 'sonido' ? 'yellow' :
                                 service.category === 'transporte' ? 'red' : 'gray'}
                        >
                          {getCategoryLabel(service.category)}
                        </Badge>
                      </Table.Td>
                      <Table.Td visibleFrom="lg">
                        <Group gap="xs">
                          <IconCurrencyDollar size={16} color="gray" />
                          <Text fw={500}>{formatCurrency(service.price)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={service.isActive ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                        >
                          {service.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="blue"
                            onClick={() => {/* TODO: Implementar vista detallada */}}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="gray"
                            onClick={() => handleEdit(service)}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(service._id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingService ? 'Editar servicio' : 'Nuevo servicio'}
        size="lg"
        closeOnEscape={!submitting}
        closeOnClickOutside={!submitting}
      >
        <Stack gap="lg">
          <TextInput
            label="Nombre del servicio"
            placeholder="Ej: Fotografía profesional, DJ, Animador"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            withAsterisk
          />
          
          <Group grow>
            <TextInput
              label="Precio"
              placeholder="500"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              leftSection={<IconCurrencyDollar size={16} />}
              withAsterisk
            />
            
            <Select
              label="Categoría"
              placeholder="Selecciona categoría"
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value || 'otros' }))}
              data={categories.map(cat => ({ value: cat.key, label: cat.label }))}
              withAsterisk
            />
          </Group>
          
          <Textarea
            label="Descripción"
            placeholder="Describe qué incluye este servicio..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />

          <Group>
            <Switch
              label="Servicio activo"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
              size="sm"
            />
          </Group>
          
          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={close}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
            >
              {submitting ? 'Guardando...' : (editingService ? 'Actualizar' : 'Crear')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}