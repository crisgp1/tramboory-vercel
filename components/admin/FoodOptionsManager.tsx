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
  ScrollArea,
  FileInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconCake,
  IconPencil,
  IconTrash,
  IconEye,
  IconCurrencyDollar,
  IconX,
  IconPhoto
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface FoodUpgrade {
  fromDish: string;
  toDish: string;
  additionalPrice: number;
  category: 'adult' | 'kids';
  image?: string;
}

interface FoodOption {
  _id: string;
  name: string;
  basePrice: number;
  description?: string;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  adultDishes: string[];
  kidsDishes: string[];
  upgrades: FoodUpgrade[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoodFormData {
  name: string;
  basePrice: string;
  description: string;
  category: 'main' | 'appetizer' | 'dessert' | 'beverage';
  adultDishes: string[];
  kidsDishes: string[];
  adultDishImages?: { dish: string; image?: string | null }[];
  kidsDishImages?: { dish: string; image?: string | null }[];
  upgrades: FoodUpgrade[];
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
    adultDishes: [],
    kidsDishes: [],
    upgrades: [],
    isActive: true
  });

  const [newUpgrade, setNewUpgrade] = useState({ 
    fromDish: '', 
    toDish: '', 
    additionalPrice: '', 
    category: 'adult' as 'adult' | 'kids',
    image: null as File | null
  });
  const [newAdultDish, setNewAdultDish] = useState('');
  const [newAdultDishImage, setNewAdultDishImage] = useState<File | null>(null);
  const [newKidsDish, setNewKidsDish] = useState('');
  const [newKidsDishImage, setNewKidsDishImage] = useState<File | null>(null);
  const [mainImage, setMainImage] = useState<File | null>(null);

  useEffect(() => {
    fetchFoodOptions();
  }, []);

  const fetchFoodOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/food-options');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error en la respuesta del servidor'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Food options loaded:', data.data);
        setFoodOptions(data.data);
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al cargar las opciones de comida', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching food options:', error);
      notifications.show({ title: 'Error', message: `Error al cargar las opciones de comida: ${error instanceof Error ? error.message : 'Error desconocido'}`, color: 'red' });
      // Set empty array to prevent UI issues
      setFoodOptions([]);
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
      adultDishes: [],
      kidsDishes: [],
      upgrades: [],
      isActive: true
    });
    setNewUpgrade({ fromDish: '', toDish: '', additionalPrice: '', category: 'adult', image: null });
    setNewAdultDish('');
    setNewAdultDishImage(null);
    setNewKidsDish('');
    setNewKidsDishImage(null);
    setMainImage(null);
    setEditingFood(null);
  };

  const handleCreate = () => {
    console.log('handleCreate called');
    resetForm();
    console.log('Opening modal for new food...');
    open();
  };

  const handleEdit = (food: FoodOption) => {
    console.log('handleEdit called with:', food);
    setEditingFood(food);
    setFormData({
      name: food.name,
      basePrice: food.basePrice.toString(),
      description: food.description || '',
      category: food.category,
      adultDishes: [...(food.adultDishes || [])],
      kidsDishes: [...(food.kidsDishes || [])],
      upgrades: [...(food.upgrades || [])],
      isActive: food.isActive
    });
    console.log('Opening modal...');
    open();
  };

  const addUpgrade = async () => {
    if (!newUpgrade.fromDish.trim() || !newUpgrade.toDish.trim() || !newUpgrade.additionalPrice) {
      notifications.show({ title: 'Error', message: 'Completa todos los campos del upgrade', color: 'red' });
      return;
    }

    // Check if the fromDish exists in the corresponding category dishes
    const dishExists = newUpgrade.category === 'adult' 
      ? formData.adultDishes.includes(newUpgrade.fromDish.trim())
      : formData.kidsDishes.includes(newUpgrade.fromDish.trim());

    if (!dishExists) {
      notifications.show({ title: 'Error', message: `El platillo "${newUpgrade.fromDish}" no existe en los platillos de ${newUpgrade.category === 'adult' ? 'adultos' : 'niños'}`, color: 'red' });
      return;
    }

    // Subir imagen del upgrade si existe
    let imageUrl = null;
    if (newUpgrade.image) {
      imageUrl = await uploadImage(newUpgrade.image);
    }

    const upgrade: FoodUpgrade = {
      fromDish: newUpgrade.fromDish.trim(),
      toDish: newUpgrade.toDish.trim(),
      additionalPrice: parseFloat(newUpgrade.additionalPrice),
      category: newUpgrade.category,
      image: imageUrl || undefined
    };

    setFormData(prev => ({
      ...prev,
      upgrades: [...prev.upgrades, upgrade]
    }));

    setNewUpgrade({ fromDish: '', toDish: '', additionalPrice: '', category: 'adult', image: null });
  };

  const removeUpgrade = (index: number) => {
    setFormData(prev => ({
      ...prev,
      upgrades: prev.upgrades.filter((_, i) => i !== index)
    }));
  };

  const addAdultDish = async () => {
    if (!newAdultDish.trim()) {
      notifications.show({ title: 'Error', message: 'Ingresa el nombre del platillo para adultos', color: 'red' });
      return;
    }

    if (formData.adultDishes.includes(newAdultDish.trim())) {
      notifications.show({ title: 'Error', message: 'Este platillo ya existe', color: 'red' });
      return;
    }

    // Subir imagen si existe
    let imageUrl = null;
    if (newAdultDishImage) {
      imageUrl = await uploadImage(newAdultDishImage);
    }

    setFormData(prev => ({
      ...prev,
      adultDishes: [...prev.adultDishes, newAdultDish.trim()],
      adultDishImages: [...(prev.adultDishImages || []), { dish: newAdultDish.trim(), image: imageUrl }]
    }));

    setNewAdultDish('');
    setNewAdultDishImage(null);
  };

  const removeAdultDish = (index: number) => {
    setFormData(prev => ({
      ...prev,
      adultDishes: prev.adultDishes.filter((_, i) => i !== index)
    }));
  };

  const addKidsDish = async () => {
    if (!newKidsDish.trim()) {
      notifications.show({ title: 'Error', message: 'Ingresa el nombre del platillo para niños', color: 'red' });
      return;
    }

    if (formData.kidsDishes.includes(newKidsDish.trim())) {
      notifications.show({ title: 'Error', message: 'Este platillo ya existe', color: 'red' });
      return;
    }

    // Subir imagen si existe
    let imageUrl = null;
    if (newKidsDishImage) {
      imageUrl = await uploadImage(newKidsDishImage);
    }

    setFormData(prev => ({
      ...prev,
      kidsDishes: [...prev.kidsDishes, newKidsDish.trim()],
      kidsDishImages: [...(prev.kidsDishImages || []), { dish: newKidsDish.trim(), image: imageUrl }]
    }));

    setNewKidsDish('');
    setNewKidsDishImage(null);
  };

  const removeKidsDish = (index: number) => {
    setFormData(prev => ({
      ...prev,
      kidsDishes: prev.kidsDishes.filter((_, i) => i !== index)
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/admin/food-options/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.basePrice) {
      notifications.show({ title: 'Error', message: 'Por favor completa todos los campos requeridos', color: 'red' });
      return;
    }

    setSubmitting(true);
    
    try {
      // Subir imagen principal si existe
      let mainImageUrl = null;
      if (mainImage) {
        mainImageUrl = await uploadImage(mainImage);
      }

      const foodData = {
        ...(editingFood && { _id: editingFood._id }),
        name: formData.name.trim(),
        basePrice: parseFloat(formData.basePrice),
        description: formData.description?.trim() || '',
        category: formData.category,
        adultDishes: formData.adultDishes,
        kidsDishes: formData.kidsDishes,
        adultDishImages: formData.adultDishImages || [],
        kidsDishImages: formData.kidsDishImages || [],
        upgrades: formData.upgrades,
        isActive: formData.isActive,
        mainImage: mainImageUrl || undefined
      };

      console.log('Sending food data:', foodData);

      const url = '/api/admin/food-options';
      const method = editingFood ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error en la respuesta del servidor'}`);
      }

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Success', message: editingFood ? 'Opción de comida actualizada exitosamente' : 'Opción de comida creada exitosamente', color: 'green' });
        fetchFoodOptions();
        close();
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al guardar la opción de comida', color: 'red' });
      }
    } catch (error) {
      console.error('Error saving food option:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar la opción de comida', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta opción de comida?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/food-options?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error en la respuesta del servidor'}`);
      }

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Success', message: 'Opción de comida eliminada correctamente', color: 'green' });
        fetchFoodOptions();
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al eliminar la opción de comida', color: 'red' });
      }
    } catch (error) {
      console.error('Error deleting food option:', error);
      notifications.show({ title: 'Error', message: 'Error al eliminar la opción de comida', color: 'red' });
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
              <Text size="sm" fw={500} c="dimmed">Total de Upgrades</Text>
              <Text size="xl" fw={700} c="blue">{(() => {
                const total = foodOptions.reduce((sum, f) => {
                  const upgradeCount = f.upgrades?.length || 0;
                  console.log(`Food ${f.name}: ${upgradeCount} upgrades`, f.upgrades);
                  return sum + upgradeCount;
                }, 0);
                console.log('Total upgrades:', total);
                return total;
              })()}</Text>
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
                  <Table.Th visibleFrom="lg">UPGRADES</Table.Th>
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
                          {/* Show dishes info */}
                          <Group gap="xs" mt={2}>
                            {(food.adultDishes?.length || 0) > 0 && (
                              <Badge size="xs" color="blue" variant="dot">
                                {food.adultDishes.length} adultos
                              </Badge>
                            )}
                            {(food.kidsDishes?.length || 0) > 0 && (
                              <Badge size="xs" color="green" variant="dot">
                                {food.kidsDishes.length} niños
                              </Badge>
                            )}
                          </Group>
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
                        {(food.upgrades || []).slice(0, 2).map((upgrade, index) => (
                          <Badge key={index} size="sm" variant="light" color="purple">
                            {upgrade?.fromDish} → {upgrade?.toDish}
                          </Badge>
                        ))}
                        {(food.upgrades?.length || 0) > 2 && (
                          <Badge size="sm" variant="light" color="gray">
                            +{(food.upgrades?.length || 0) - 2} más
                          </Badge>
                        )}
                        {(food.upgrades?.length || 0) === 0 && (
                          <Text size="sm" c="dimmed">Sin upgrades</Text>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit clicked for:', food.name);
                            handleEdit(food);
                          }}
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
        onClose={() => {
          console.log('Modal closing...');
          close();
        }}
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

          <FileInput
            label="Imagen principal de la opción (opcional)"
            description="Esta imagen aparecerá como la imagen principal de la opción de comida"
            placeholder="Seleccionar imagen"
            value={mainImage}
            onChange={setMainImage}
            accept="image/*"
            leftSection={<IconPhoto size={16} />}
            clearable
          />

          {/* Adult Dishes Section */}
          <Stack gap="sm">
            <Text size="sm" fw={500}>Platillos para Adultos</Text>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
              <Stack gap="md">
                <Group align="flex-end">
                  <TextInput
                    label="Nombre del platillo"
                    placeholder="Ej: Pollo a la plancha, Pasta alfredo"
                    value={newAdultDish}
                    onChange={(e) => setNewAdultDish(e.target.value)}
                    size="sm"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAdultDish();
                      }
                    }}
                  />
                  <Button
                    onClick={addAdultDish}
                    size="sm"
                    color="blue"
                  >
                    Agregar
                  </Button>
                </Group>
                <FileInput
                  label="Imagen del platillo (opcional)"
                  placeholder="Seleccionar imagen"
                  value={newAdultDishImage}
                  onChange={setNewAdultDishImage}
                  accept="image/*"
                  leftSection={<IconPhoto size={16} />}
                  size="sm"
                />
              </Stack>
            </Card>

            {formData.adultDishes.length > 0 && (
              <Stack gap="xs">
                {formData.adultDishes.map((dish, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>{dish}</Text>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => removeAdultDish(index)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          {/* Kids Dishes Section */}
          <Stack gap="sm">
            <Text size="sm" fw={500}>Platillos para Niños</Text>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
              <Stack gap="md">
                <Group align="flex-end">
                  <TextInput
                    label="Nombre del platillo"
                    placeholder="Ej: Nuggets con papas, Mini hamburguesa"
                    value={newKidsDish}
                    onChange={(e) => setNewKidsDish(e.target.value)}
                    size="sm"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKidsDish();
                      }
                    }}
                  />
                  <Button
                    onClick={addKidsDish}
                    size="sm"
                    color="green"
                  >
                    Agregar
                  </Button>
                </Group>
                <FileInput
                  label="Imagen del platillo (opcional)"
                  placeholder="Seleccionar imagen"
                  value={newKidsDishImage}
                  onChange={setNewKidsDishImage}
                  accept="image/*"
                  leftSection={<IconPhoto size={16} />}
                  size="sm"
                />
              </Stack>
            </Card>

            {formData.kidsDishes.length > 0 && (
              <Stack gap="xs">
                {formData.kidsDishes.map((dish, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>{dish}</Text>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => removeKidsDish(index)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          <Stack gap="sm">
            <Text size="sm" fw={500}>Upgrades de Platillos</Text>
            <Text size="xs" c="dimmed">
              Permite a los clientes cambiar de un platillo básico a uno premium por un costo adicional
            </Text>
            
            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-purple-0)' }}>
              <Stack gap="md">
                <Group grow>
                  <Select
                    label="Categoría"
                    placeholder="Selecciona categoría"
                    value={newUpgrade.category}
                    onChange={(value) => setNewUpgrade(prev => ({ ...prev, category: value as 'adult' | 'kids' }))}
                    data={[
                      { value: 'adult', label: 'Adultos' },
                      { value: 'kids', label: 'Niños' }
                    ]}
                    size="sm"
                  />
                  <TextInput
                    label="Precio adicional"
                    placeholder="20"
                    type="number"
                    step="0.01"
                    value={newUpgrade.additionalPrice}
                    onChange={(e) => setNewUpgrade(prev => ({ ...prev, additionalPrice: e.target.value }))}
                    leftSection={<IconCurrencyDollar size={16} />}
                    size="sm"
                  />
                </Group>
                
                <Group align="flex-end">
                  <Select
                    label="Platillo básico (incluido)"
                    placeholder="Selecciona el platillo base"
                    value={newUpgrade.fromDish}
                    onChange={(value) => setNewUpgrade(prev => ({ ...prev, fromDish: value || '' }))}
                    data={newUpgrade.category === 'adult' 
                      ? formData.adultDishes.map(dish => ({ value: dish, label: dish }))
                      : formData.kidsDishes.map(dish => ({ value: dish, label: dish }))
                    }
                    size="sm"
                    style={{ flex: 1 }}
                    searchable
                  />
                  <Text size="sm" c="dimmed" style={{ padding: '0 10px' }}>→</Text>
                  <TextInput
                    label="Platillo premium (upgrade)"
                    placeholder="Ej: Hamburguesa premium"
                    value={newUpgrade.toDish}
                    onChange={(e) => setNewUpgrade(prev => ({ ...prev, toDish: e.target.value }))}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={addUpgrade}
                    size="sm"
                    color="purple"
                  >
                    Agregar
                  </Button>
                </Group>
                <FileInput
                  label="Imagen del upgrade (opcional)"
                  placeholder="Seleccionar imagen del platillo premium"
                  value={newUpgrade.image}
                  onChange={(file) => setNewUpgrade(prev => ({ ...prev, image: file }))}
                  accept="image/*"
                  leftSection={<IconPhoto size={16} />}
                  size="sm"
                />
              </Stack>
            </Card>

            {formData.upgrades.length > 0 && (
              <Stack gap="xs">
                {formData.upgrades.map((upgrade, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <Group gap="md">
                        <Badge size="sm" color={upgrade.category === 'adult' ? 'blue' : 'green'}>
                          {upgrade.category === 'adult' ? 'Adultos' : 'Niños'}
                        </Badge>
                        <Text size="sm" fw={500}>
                          {upgrade.fromDish} → {upgrade.toDish}
                        </Text>
                        <Text size="xs" c="dimmed">+{formatCurrency(upgrade.additionalPrice)}</Text>
                      </Group>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => removeUpgrade(index)}
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