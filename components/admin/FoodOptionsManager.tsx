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
  Select,
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
  IconCake,
  IconPencil,
  IconTrash,
  IconEye,
  IconCurrencyDollar,
  IconX
} from '@tabler/icons-react';
import toast from 'react-hot-toast';

interface FoodExtra {
  name: string;
  price: number;
}

interface FoodOption {
  _id: string;
  name: string;
  basePrice: number;
  description?: string;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  extras: FoodExtra[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoodFormData {
  name: string;
  basePrice: string;
  description: string;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  extras: FoodExtra[];
  isActive: boolean;
}

export default function FoodOptionsManager() {
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodOption | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  
  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    basePrice: '',
    description: '',
    category: 'main',
    extras: [],
    isActive: true
  });

  const [newExtra, setNewExtra] = useState({ name: '', price: '' });

  useEffect(() => {
    fetchFoodOptions();
  }, []);

  const fetchFoodOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/food-options');
      const data = await response.json();
      
      if (data.success) {
        setFoodOptions(data.data);
      } else {
        toast.error('Error al cargar las opciones de comida');
      }
    } catch (error) {
      console.error('Error fetching food options:', error);
      toast.error('Error al cargar las opciones de comida');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      basePrice: '',
      description: '',
      category: 'main',
      extras: [],
      isActive: true
    });
    setNewExtra({ name: '', price: '' });
    setEditingFood(null);
  };

  const handleCreate = () => {
    resetForm();
    open();
  };

  const handleEdit = (food: FoodOption) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      basePrice: food.basePrice.toString(),
      description: food.description || '',
      category: food.category,
      extras: [...food.extras],
      isActive: food.isActive
    });
    open();
  };

  const addExtra = () => {
    if (!newExtra.name.trim() || !newExtra.price) {
      toast.error('Completa el nombre y precio del extra');
      return;
    }

    const extra: FoodExtra = {
      name: newExtra.name.trim(),
      price: parseFloat(newExtra.price)
    };

    setFormData(prev => ({
      ...prev,
      extras: [...prev.extras, extra]
    }));

    setNewExtra({ name: '', price: '' });
  };

  const removeExtra = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.basePrice) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);
    
    try {
      const foodData = {
        name: formData.name.trim(),
        basePrice: parseFloat(formData.basePrice),
        description: formData.description.trim(),
        category: formData.category,
        extras: formData.extras,
        isActive: formData.isActive
      };

      const url = editingFood 
        ? `/api/admin/food-options/${editingFood._id}`
        : '/api/admin/food-options';
      
      const method = editingFood ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(editingFood ? 'Opción de comida actualizada exitosamente' : 'Opción de comida creada exitosamente');
        fetchFoodOptions();
        close();
        resetForm();
      } else {
        toast.error(data.error || 'Error al guardar la opción de comida');
      }
    } catch (error) {
      console.error('Error saving food option:', error);
      toast.error('Error al guardar la opción de comida');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta opción de comida?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/food-options/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Opción de comida eliminada correctamente');
        fetchFoodOptions();
      } else {
        toast.error('Error al eliminar la opción de comida');
      }
    } catch (error) {
      console.error('Error deleting food option:', error);
      toast.error('Error al eliminar la opción de comida');
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
              backgroundColor: 'var(--mantine-color-orange-6)',
              borderRadius: 'var(--mantine-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconCake size={24} color="white" />
          </div>
          <Stack gap={0}>
            <Title order={1} size="h2">
              Opciones de Comida
            </Title>
            <Text size="sm" c="dimmed">
              Gestiona las opciones de alimentos y bebidas
            </Text>
          </Stack>
        </Group>
        <Button onClick={handleCreate} leftSection={<IconPlus size={16} />}>
          Nueva Opción
        </Button>
      </Group>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Total de Opciones</Text>
              <Text size="xl" fw={700}>{foodOptions.length}</Text>
            </Stack>
            <div 
              style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--mantine-color-orange-1)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconCake size={24} color="var(--mantine-color-orange-6)" />
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Opciones Activas</Text>
              <Text size="xl" fw={700} c="green">{foodOptions.filter(f => f.isActive).length}</Text>
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
              <IconCake size={24} color="var(--mantine-color-green-6)" />
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ backgroundColor: 'white' }}>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={500} c="dimmed">Total de Extras</Text>
              <Text size="xl" fw={700} c="blue">{foodOptions.reduce((sum, f) => sum + f.extras.length, 0)}</Text>
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
              <IconCake size={24} color="var(--mantine-color-blue-6)" />
            </div>
          </Group>
        </Card>
      </div>

      {/* Food Options Table */}
      <Card withBorder style={{ backgroundColor: 'white' }}>
        {loading ? (
          <Stack align="center" py="xl" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Cargando opciones de comida...</Text>
          </Stack>
        ) : (
          <ScrollArea>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>OPCIÓN</Table.Th>
                  <Table.Th visibleFrom="md">PRECIO BASE</Table.Th>
                  <Table.Th visibleFrom="lg">EXTRAS</Table.Th>
                  <Table.Th>ESTADO</Table.Th>
                  <Table.Th>ACCIONES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{foodOptions.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="md">No hay opciones de comida registradas</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                foodOptions.map((food) => (
                  <Table.Tr key={food._id}>
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
                          <IconCake size={20} color="var(--mantine-color-gray-6)" />
                        </div>
                        <Stack gap={0}>
                          <Text fw={600}>{food.name}</Text>
                          <Group gap="xs" mt={2}>
                            <Badge
                              size="sm"
                              variant="light"
                              color={
                                food.category === 'main' ? 'blue' :
                                food.category === 'appetizer' ? 'grape' :
                                food.category === 'dessert' ? 'green' : 'orange'
                              }
                            >
                              {food.category === 'main' ? 'Principal' :
                               food.category === 'appetizer' ? 'Entrada' :
                               food.category === 'dessert' ? 'Postre' : 'Bebida'}
                            </Badge>
                          </Group>
                          {food.description && (
                            <Text size="sm" c="dimmed" style={{ maxWidth: '300px' }} truncate="end">
                              {food.description}
                            </Text>
                          )}
                          <Group gap="xs" hiddenFrom="md" mt={2}>
                            <IconCurrencyDollar size={12} />
                            <Text size="xs" c="dimmed">{formatCurrency(food.basePrice)}</Text>
                          </Group>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="md">
                      <Group gap="xs">
                        <IconCurrencyDollar size={16} color="var(--mantine-color-gray-5)" />
                        <Text fw={500}>{formatCurrency(food.basePrice)}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="lg">
                      <Group gap="xs">
                        {food.extras.slice(0, 2).map((extra, index) => (
                          <Badge key={index} size="sm" variant="light" color="gray">
                            {extra.name}
                          </Badge>
                        ))}
                        {food.extras.length > 2 && (
                          <Badge size="sm" variant="light" color="gray">
                            +{food.extras.length - 2} más
                          </Badge>
                        )}
                        {food.extras.length === 0 && (
                          <Text size="sm" c="dimmed">Sin extras</Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={food.isActive ? 'green' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {food.isActive ? 'Activo' : 'Inactivo'}
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
                          onClick={() => handleEdit(food)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="red"
                          onClick={() => handleDelete(food._id)}
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
        title={editingFood ? 'Editar opción de comida' : 'Nueva opción de comida'}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
            <TextInput
              label="Nombre de la opción *"
              placeholder="Ej: Menú infantil, Buffet, Cena formal"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <TextInput
              label="Precio base *"
              placeholder="150"
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
              leftSection={<IconCurrencyDollar size={16} />}
            />
          </div>

          <Group gap="sm">
            <Switch
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
              size="sm"
            />
            <Text size="sm">Opción activa</Text>
          </Group>
                  
          <Textarea
            label="Descripción"
            placeholder="Describe qué incluye esta opción de comida..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />

          <Select
            label="Categoría *"
            placeholder="Selecciona una categoría"
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value as 'main' | 'appetizer' | 'dessert' | 'beverage' }))}
            data={[
              { value: 'main', label: 'Plato Principal' },
              { value: 'appetizer', label: 'Entrada' },
              { value: 'dessert', label: 'Postre' },
              { value: 'beverage', label: 'Bebida' }
            ]}
          />

          <Stack gap="sm">
            <Text size="sm" fw={500}>Extras disponibles</Text>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Group align="flex-end">
                <TextInput
                  label="Nombre del extra"
                  placeholder="Ej: Postre adicional, Bebida premium"
                  value={newExtra.name}
                  onChange={(e) => setNewExtra(prev => ({ ...prev, name: e.target.value }))}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Precio"
                  placeholder="50"
                  type="number"
                  step="0.01"
                  value={newExtra.price}
                  onChange={(e) => setNewExtra(prev => ({ ...prev, price: e.target.value }))}
                  leftSection={<IconCurrencyDollar size={16} />}
                  size="sm"
                  style={{ width: 120 }}
                />
                <Button
                  onClick={addExtra}
                  size="sm"
                  color="blue"
                >
                  Agregar
                </Button>
              </Group>
            </Card>

            {formData.extras.length > 0 && (
              <Stack gap="xs">
                {formData.extras.map((extra, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <Group gap="md">
                        <Text size="sm" fw={500}>{extra.name}</Text>
                        <Text size="xs" c="dimmed">{formatCurrency(extra.price)}</Text>
                      </Group>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => removeExtra(index)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
          
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
              color="orange"
            >
              {submitting ? 'Guardando...' : (editingFood ? 'Actualizar' : 'Crear')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}