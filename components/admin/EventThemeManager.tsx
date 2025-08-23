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
  Divider,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  Menu,
  FileButton,
  Image,
  CloseButton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconBuilding,
  IconBuildingStore as BuildingStorefrontIcon,
  IconPencil,
  IconTrash,
  IconDots,
  IconCurrencyDollar,
  IconX,
  IconSparkles,
  IconUpload,
  IconPhoto
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface ThemePackage {
  name: string;
  pieces: number;
  price: number;
}

interface EventTheme {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  packages: ThemePackage[];
  themes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventThemeFormData {
  name: string;
  description: string;
  imageUrl: string;
  packages: ThemePackage[];
  themes: string[];
  isActive: boolean;
}

export default function EventThemeManager() {
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTheme, setEditingTheme] = useState<EventTheme | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  
  const [formData, setFormData] = useState<EventThemeFormData>({
    name: '',
    description: '',
    imageUrl: '',
    packages: [],
    themes: [],
    isActive: true
  });
  
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [newPackage, setNewPackage] = useState({ name: '', pieces: '', price: '' });
  const [newTheme, setNewTheme] = useState('');

  useEffect(() => {
    fetchEventThemes();
  }, []);

  const fetchEventThemes = async () => {
    try {
      setLoading(true);
      // Nota: Esta API necesita ser implementada
      const response = await fetch('/api/admin/event-themes');
      const data = await response.json();
      
      if (data.success) {
        setEventThemes(data.data);
      } else {
        notifications.show({ title: 'Error', message: 'Error al cargar los temas de evento', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching event themes:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar los temas de evento', color: 'red' });
      // Datos de ejemplo mientras se implementa la API
      setEventThemes([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      packages: [],
      themes: [],
      isActive: true
    });
    setNewPackage({ name: '', pieces: '', price: '' });
    setNewTheme('');
    setEditingTheme(null);
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleCreate = () => {
    resetForm();
    open();
  };

  const handleEdit = (theme: EventTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      imageUrl: theme.imageUrl || '',
      packages: [...(theme.packages || [])],
      themes: [...(theme.themes || [])],
      isActive: theme.isActive
    });
    setPreviewUrl(theme.imageUrl || '');
    open();
  };

  const addPackage = () => {
    if (!newPackage.name.trim() || !newPackage.pieces || !newPackage.price) {
      notifications.show({ title: 'Error', message: 'Completa todos los campos del paquete', color: 'red' });
      return;
    }

    const packageData: ThemePackage = {
      name: newPackage.name.trim(),
      pieces: parseInt(newPackage.pieces) || 0,
      price: parseFloat(newPackage.price) || 0
    };

    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, packageData]
    }));

    setNewPackage({ name: '', pieces: '', price: '' });
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const addTheme = () => {
    if (!newTheme.trim()) {
      notifications.show({ title: 'Error', message: 'Ingresa el nombre del tema', color: 'red' });
      return;
    }

    if (formData.themes.includes(newTheme.trim())) {
      notifications.show({ title: 'Error', message: 'Este tema ya existe', color: 'red' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme.trim()]
    }));

    setNewTheme('');
  };

  const removeTheme = (index: number) => {
    setFormData(prev => ({
      ...prev,
      themes: prev.themes.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    
    setImageFile(file);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setPreviewUrl(data.url);
        notifications.show({ title: 'Success', message: 'Imagen subida exitosamente', color: 'green' });
      } else {
        notifications.show({ title: 'Error', message: 'Error al subir la imagen', color: 'red' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      notifications.show({ title: 'Error', message: 'Error al subir la imagen', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setPreviewUrl('');
    setImageFile(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || formData.packages.length === 0) {
      notifications.show({ title: 'Error', message: 'Por favor completa el nombre y agrega al menos un paquete', color: 'red' });
      return;
    }

    setSubmitting(true);
    
    try {
      const themeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        packages: formData.packages,
        themes: formData.themes,
        isActive: formData.isActive
      };

      const url = editingTheme 
        ? `/api/admin/event-themes/${editingTheme._id}`
        : '/api/admin/event-themes';
      
      const method = editingTheme ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifications.show({ title: 'Success', message: editingTheme ? 'Tema de evento actualizado exitosamente' : 'Tema de evento creado exitosamente', color: 'green' });
        fetchEventThemes();
        close();
        resetForm();
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al guardar el tema de evento', color: 'red' });
      }
    } catch (error) {
      console.error('Error saving event theme:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar el tema de evento', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tema de evento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/event-themes/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Success', message: 'Tema de evento eliminado correctamente', color: 'green' });
        fetchEventThemes();
      } else {
        notifications.show({ title: 'Error', message: 'Error al eliminar el tema de evento', color: 'red' });
      }
    } catch (error) {
      console.error('Error deleting event theme:', error);
      notifications.show({ title: 'Error', message: 'Error al eliminar el tema de evento', color: 'red' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 btn-primary rounded-lg flex items-center justify-center">
            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Temas de Evento
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Gestiona los temas y decoraciones disponibles
            </p>
          </div>
        </div>
        <Button
          leftSection={<IconPlus className="w-4 h-4" />}
          onClick={handleCreate}
          className="btn-primary text-white hover:bg-gray-800"
          size="lg"
        >
          Nuevo Tema
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <Card.Section className="text-center p-6">
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {eventThemes.length}
            </div>
            <div className="text-sm text-gray-600">Total de Temas</div>
          </Card.Section>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <Card.Section className="text-center p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">
              {eventThemes.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Temas Activos</div>
          </Card.Section>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <Card.Section className="text-center p-6">
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              {eventThemes.reduce((sum, t) => sum + (t.packages?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Paquetes</div>
          </Card.Section>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <Card.Section className="text-center p-6">
            <div className="text-2xl font-semibold text-purple-600 mb-2">
              {eventThemes.reduce((sum, t) => sum + (t.themes?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Variaciones de Tema</div>
          </Card.Section>
        </Card>
      </div>

      {/* Event Themes Table */}
      <Card className="border border-gray-200 shadow-sm">
        <Card.Section className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader size="lg" className="text-gray-900" />
              <p className="text-gray-500 mt-4">Cargando temas de evento...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>TEMA</Table.Th>
                    <Table.Th className="hidden md:table-cell">PAQUETES</Table.Th>
                    <Table.Th className="hidden lg:table-cell">VARIACIONES</Table.Th>
                    <Table.Th>ESTADO</Table.Th>
                    <Table.Th>ACCIONES</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {eventThemes.map((theme) => (
                    <Table.Tr key={theme._id}>
                      <Table.Td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {theme.imageUrl ? (
                              <Image
                                src={theme.imageUrl}
                                alt={theme.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{theme.name}</div>
                            {theme.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {theme.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Table.Td>
                      <Table.Td className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(theme.packages || []).slice(0, 2).map((pkg, index) => (
                            <Badge key={index} size="sm" variant="flat" className="bg-gray-100 text-gray-700">
                              {pkg.name}
                            </Badge>
                          ))}
                          {(theme.packages?.length || 0) > 2 && (
                            <Badge size="sm" variant="flat" color="default">
                              +{(theme.packages?.length || 0) - 2} más
                            </Badge>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(theme.themes || []).slice(0, 3).map((themeVariation, index) => (
                            <Badge key={index} size="sm" variant="flat" className="bg-blue-100 text-blue-700">
                              {themeVariation}
                            </Badge>
                          ))}
                          {(theme.themes?.length || 0) > 3 && (
                            <Badge size="sm" variant="flat" color="default">
                              +{(theme.themes?.length || 0) - 3} más
                            </Badge>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={theme.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {theme.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu>
                          <Menu.Target>
                            <ActionIcon
                              variant="light"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <IconDots className="w-4 h-4" />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconPencil className="w-4 h-4" />}
                              onClick={() => handleEdit(theme)}
                            >
                              Editar
                            </Menu.Item>
                            <Menu.Item
                              className="text-red-600"
                              color="red"
                              leftSection={<IconTrash className="w-4 h-4" />}
                              onClick={() => handleDelete(theme._id)}
                            >
                              Eliminar
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </Card.Section>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        size="xl"
        title={editingTheme ? 'Editar tema' : 'Nuevo tema'}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="Nombre del tema *"
                placeholder="Ej: Princesas, Superhéroes"
                value={formData.name}
                onChange={(event) => setFormData(prev => ({ ...prev, name: event.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={formData.isActive}
                onChange={(event) => setFormData(prev => ({ ...prev, isActive: event.target.checked }))}
              />
              <span className="text-sm text-gray-700">Tema activo</span>
            </div>
          </div>
          
          <div>
            <Textarea
              label="Descripción"
              placeholder="Describe el tema y lo que incluye..."
              value={formData.description}
              onChange={(event) => setFormData(prev => ({ ...prev, description: event.target.value }))}
              minRows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">Imagen del tema</label>
            {previewUrl ? (
              <div className="relative inline-block">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <CloseButton
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-white shadow-md rounded-full"
                  size="sm"
                />
              </div>
            ) : (
              <FileButton
                onChange={handleImageUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                disabled={uploading}
              >
                {(props) => (
                  <Button
                    {...props}
                    leftSection={uploading ? <Loader size="xs" /> : <IconUpload className="w-4 h-4" />}
                    variant="light"
                    disabled={uploading}
                  >
                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                  </Button>
                )}
              </FileButton>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Paquetes de decoración</h4>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nombre del paquete</label>
                          <TextInput
                            placeholder="Básico"
                            value={newPackage.name}
                            onChange={(event) => setNewPackage(prev => ({ ...prev, name: event.target.value }))}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Número de piezas</label>
                          <TextInput
                            placeholder="15"
                            type="number"
                            value={newPackage.pieces}
                            onChange={(event) => setNewPackage(prev => ({ ...prev, pieces: event.target.value }))}
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Precio</label>
                          <TextInput
                            placeholder="500"
                            type="number"
                            step="0.01"
                            value={newPackage.price}
                            onChange={(event) => setNewPackage(prev => ({ ...prev, price: event.target.value }))}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={addPackage}
                            size="sm"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {formData.packages.length > 0 && (
                      <div className="space-y-2">
                        {formData.packages.map((pkg, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                              <span className="text-xs text-gray-500">{pkg.pieces} piezas</span>
                              <span className="text-xs text-gray-500">{formatCurrency(pkg.price)}</span>
                            </div>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => removePackage(index)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <IconX className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Variaciones del tema</h4>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Nombre de la variación</label>
                          <TextInput
                            placeholder="Ej: Rosa, Azul, Dorado"
                            value={newTheme}
                            onChange={(event) => setNewTheme(event.target.value)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={addTheme}
                            size="sm"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {formData.themes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.themes.map((theme, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full">
                            <span className="text-sm text-gray-900">{theme}</span>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => removeTheme(index)}
                              className="text-gray-400 hover:text-red-500 w-4 h-4 min-w-4"
                            >
                              <IconX className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Group justify="flex-end" mt="xl">
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
                    {submitting ? 'Guardando...' : (editingTheme ? 'Actualizar' : 'Crear')}
                  </Button>
                </Group>
      </Modal>
    </div>
  );
}