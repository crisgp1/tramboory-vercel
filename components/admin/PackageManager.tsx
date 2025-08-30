'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  TextInput,
  Textarea,
  Modal,
  Table,
  Badge,
  Loader,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconPackage,
  IconPencil,
  IconTrash,
  IconEye,
  IconUsers,
  IconCurrencyDollar,
  IconClock,
  IconCopy
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Package {
  _id: string;
  name: string;
  description: string;
  pricing: {
    weekday: number;
    weekend: number;
    holiday: number;
  };
  duration: number;
  maxGuests: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PackageFormData {
  name: string;
  description: string;
  weekday: string;
  weekend: string;
  holiday: string;
  duration: string;
  maxGuests: string;
  features: string;
  isActive: boolean;
}

export default function PackageManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    description: '',
    weekday: '',
    weekend: '',
    holiday: '',
    duration: '',
    maxGuests: '',
    features: '',
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/packages');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
      } else {
        notifications.show({ title: 'Error', message: 'Error al cargar los paquetes', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar los paquetes', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      weekday: '',
      weekend: '',
      holiday: '',
      duration: '',
      maxGuests: '',
      features: '',
      isActive: true
    });
    setEditingPackage(null);
  };

  const handleCreate = () => {
    resetForm();
    open();
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      weekday: pkg.pricing.weekday.toString(),
      weekend: pkg.pricing.weekend.toString(),
      holiday: pkg.pricing.holiday.toString(),
      duration: pkg.duration.toString(),
      maxGuests: pkg.maxGuests.toString(),
      features: pkg.features.join(', '),
      isActive: pkg.isActive
    });
    open();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.weekday || !formData.weekend || !formData.holiday || !formData.duration || !formData.maxGuests) {
      notifications.show({ title: 'Error', message: 'Por favor completa todos los campos requeridos', color: 'red' });
      return;
    }

    setSubmitting(true);
    
    try {
      const packageData = {
        ...(editingPackage && { _id: editingPackage._id }),
        name: formData.name.trim(),
        description: formData.description.trim(),
        pricing: {
          weekday: parseFloat(formData.weekday),
          weekend: parseFloat(formData.weekend),
          holiday: parseFloat(formData.holiday)
        },
        duration: parseInt(formData.duration),
        maxGuests: parseInt(formData.maxGuests),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0),
        isActive: formData.isActive
      };

      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch('/api/admin/packages', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifications.show({ title: 'Success', message: editingPackage ? 'Paquete actualizado exitosamente' : 'Paquete creado exitosamente', color: 'green' });
        fetchPackages();
        close();
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al guardar el paquete', color: 'red' });
      }
    } catch (error) {
      console.error('Error saving package:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar el paquete', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este paquete?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/packages?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Success', message: 'Paquete eliminado correctamente', color: 'green' });
        fetchPackages();
      } else {
        notifications.show({ title: 'Error', message: 'Error al eliminar el paquete', color: 'red' });
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      notifications.show({ title: 'Error', message: 'Error al eliminar el paquete', color: 'red' });
    }
  };

  const handleDuplicate = async (pkg: Package) => {
    if (!confirm(`¿Duplicar el paquete "${pkg.name}"?`)) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Create the duplicated package data
      const duplicatedPackage = {
        name: `${pkg.name} - Copia`,
        description: pkg.description,
        pricing: {
          weekday: pkg.pricing.weekday,
          weekend: pkg.pricing.weekend,
          holiday: pkg.pricing.holiday
        },
        duration: pkg.duration,
        maxGuests: pkg.maxGuests,
        features: pkg.features,
        isActive: pkg.isActive
      };

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedPackage),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ 
          title: 'Éxito', 
          message: `Paquete "${pkg.name}" duplicado correctamente`, 
          color: 'green' 
        });
        fetchPackages();
      } else {
        notifications.show({ title: 'Error', message: 'Error al duplicar el paquete', color: 'red' });
      }
    } catch (error) {
      console.error('Error duplicating package:', error);
      notifications.show({ title: 'Error', message: 'Error al duplicar el paquete', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="md">
          <div 
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--mantine-color-blue-6)',
              borderRadius: 'var(--mantine-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconPackage size={24} color="white" />
          </div>
          <Stack gap={0}>
            <Title order={1} size="h2">
              Gestión de Paquetes
            </Title>
            <Text size="sm" c="dimmed">
              Administra los paquetes de fiestas disponibles
            </Text>
          </Stack>
        </Group>
        <Button onClick={handleCreate} leftSection={<IconPlus size={16} />}>
          Nuevo Paquete
        </Button>
      </Group>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Total de Paquetes</Text>
              <Text size="xl" fw={700}>{packages.length}</Text>
            </Stack>
            <div 
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--mantine-color-blue-1)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconPackage size={24} color="var(--mantine-color-blue-6)" />
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Paquetes Activos</Text>
              <Text size="xl" fw={700} c="green">{packages.filter(p => p.isActive).length}</Text>
            </Stack>
            <div 
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--mantine-color-green-1)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconPackage size={24} color="var(--mantine-color-green-6)" />
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Promedio de Invitados</Text>
              <Text size="xl" fw={700} c="blue">{packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.maxGuests, 0) / packages.length) : 0}</Text>
            </Stack>
            <div 
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--mantine-color-blue-1)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconUsers size={24} color="var(--mantine-color-blue-6)" />
            </div>
          </Group>
        </Card>
      </div>

      {/* Packages Table */}
      <Card withBorder style={{ backgroundColor: 'white' }}>
        {loading ? (
          <Stack align="center" py="xl" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Cargando paquetes...</Text>
          </Stack>
        ) : (
          <ScrollArea>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>PAQUETE</Table.Th>
                  <Table.Th visibleFrom="md">DURACIÓN</Table.Th>
                  <Table.Th visibleFrom="lg">PRECIOS</Table.Th>
                  <Table.Th>ESTADO</Table.Th>
                  <Table.Th>ACCIONES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{packages.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="md">No hay paquetes registrados</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                packages.map((pkg) => (
                  <Table.Tr key={pkg._id}>
                    <Table.Td>
                      <Group gap="sm">
                        <div 
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'var(--mantine-color-gray-1)',
                            borderRadius: 'var(--mantine-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconPackage size={20} color="var(--mantine-color-gray-6)" />
                        </div>
                        <Stack gap={0}>
                          <Text fw={600}>{pkg.name}</Text>
                          <Text size="sm" c="dimmed" style={{ maxWidth: '300px' }} truncate="end">
                            {pkg.description}
                          </Text>
                          <Group gap="xs" hiddenFrom="md" mt={2}>
                            <IconUsers size={12} />
                            <Text size="xs" c="dimmed">{pkg.maxGuests} invitados • {pkg.duration}h</Text>
                          </Group>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="md">
                      <Group gap="xs">
                        <IconClock size={16} color="var(--mantine-color-gray-5)" />
                        <Text fw={500}>{pkg.duration}h</Text>
                        <Text c="dimmed">•</Text>
                        <IconUsers size={16} color="var(--mantine-color-gray-5)" />
                        <Text fw={500}>{pkg.maxGuests}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="lg">
                      <Stack gap="xs">
                        <Text size="sm">
                          <Text component="span" c="dimmed">Entre semana:</Text> {formatCurrency(pkg.pricing.weekday)}
                        </Text>
                        <Text size="sm">
                          <Text component="span" c="dimmed">Fin de semana:</Text> {formatCurrency(pkg.pricing.weekend)}
                        </Text>
                        <Text size="sm">
                          <Text component="span" c="dimmed">Festivo:</Text> {formatCurrency(pkg.pricing.holiday)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={pkg.isActive ? 'green' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {pkg.isActive ? 'Activo' : 'Inactivo'}
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
                          onClick={() => handleEdit(pkg)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="teal"
                          onClick={() => handleDuplicate(pkg)}
                          disabled={submitting}
                          title="Duplicar paquete"
                        >
                          <IconCopy size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="red"
                          onClick={() => handleDelete(pkg._id)}
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
        size="xl"
        title={editingPackage ? 'Editar paquete' : 'Nuevo paquete'}
        closeOnEscape={!submitting}
        closeOnClickOutside={!submitting}
        styles={{
          content: {
            maxHeight: '90vh'
          },
          body: {
            maxHeight: 'calc(90vh - 140px)',
            overflowY: 'auto'
          }
        }}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre del paquete *"
            placeholder="Ej: Paquete Básico"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
            <TextInput
              label="Duración (horas) *"
              placeholder="4"
              type="number"
              min="1"
              max="24"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              rightSection={<Text size="sm" c="dimmed">hrs</Text>}
            />
            
            <TextInput
              label="Máximo de invitados *"
              placeholder="20"
              type="number"
              min="1"
              value={formData.maxGuests}
              onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
            />
          </div>
          
          <Stack gap="sm">
            <Text size="sm" fw={500}>Precios *</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--mantine-spacing-sm)' }}>
              <TextInput
                label="Lunes - Jueves"
                placeholder="2500"
                type="number"
                step="0.01"
                min="0"
                value={formData.weekday}
                onChange={(e) => setFormData(prev => ({ ...prev, weekday: e.target.value }))}
                leftSection={<IconCurrencyDollar size={16} />}
              />
              
              <TextInput
                label="Viernes - Domingo"
                placeholder="3000"
                type="number"
                step="0.01"
                min="0"
                value={formData.weekend}
                onChange={(e) => setFormData(prev => ({ ...prev, weekend: e.target.value }))}
                leftSection={<IconCurrencyDollar size={16} />}
              />
              
              <TextInput
                label="Días festivos"
                placeholder="3500"
                type="number"
                step="0.01"
                min="0"
                value={formData.holiday}
                onChange={(e) => setFormData(prev => ({ ...prev, holiday: e.target.value }))}
                leftSection={<IconCurrencyDollar size={16} />}
              />
            </div>
          </Stack>
          
          <Textarea
            label="Descripción"
            placeholder="Describe qué incluye este paquete..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />
          
          <Textarea
            label="Características incluidas"
            placeholder="Decoración básica, mesa de dulces, animación (separadas por comas)"
            value={formData.features}
            onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
            minRows={2}
          />

          <Group gap="sm">
            <Switch
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
              size="sm"
            />
            <Text size="sm">Paquete activo</Text>
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
              color="blue"
            >
              {submitting ? 'Guardando...' : (editingPackage ? 'Actualizar' : 'Crear')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}