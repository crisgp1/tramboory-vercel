'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Switch,
  Divider
} from '@heroui/react';
import {
  PlusIcon,
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ThemePackage {
  name: string;
  pieces: number;
  price: number;
}

interface EventTheme {
  _id: string;
  name: string;
  description?: string;
  packages: ThemePackage[];
  themes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventThemeFormData {
  name: string;
  description: string;
  packages: ThemePackage[];
  themes: string[];
  isActive: boolean;
}

export default function EventThemeManager() {
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTheme, setEditingTheme] = useState<EventTheme | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [formData, setFormData] = useState<EventThemeFormData>({
    name: '',
    description: '',
    packages: [],
    themes: [],
    isActive: true
  });

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
        toast.error('Error al cargar los temas de evento');
      }
    } catch (error) {
      console.error('Error fetching event themes:', error);
      toast.error('Error al cargar los temas de evento');
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
      packages: [],
      themes: [],
      isActive: true
    });
    setNewPackage({ name: '', pieces: '', price: '' });
    setNewTheme('');
    setEditingTheme(null);
  };

  const handleCreate = () => {
    resetForm();
    onOpen();
  };

  const handleEdit = (theme: EventTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      packages: [...theme.packages],
      themes: [...theme.themes],
      isActive: theme.isActive
    });
    onOpen();
  };

  const addPackage = () => {
    if (!newPackage.name.trim() || !newPackage.pieces || !newPackage.price) {
      toast.error('Completa todos los campos del paquete');
      return;
    }

    const packageData: ThemePackage = {
      name: newPackage.name.trim(),
      pieces: parseInt(newPackage.pieces),
      price: parseFloat(newPackage.price)
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
      toast.error('Ingresa el nombre del tema');
      return;
    }

    if (formData.themes.includes(newTheme.trim())) {
      toast.error('Este tema ya existe');
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

  const handleSubmit = async () => {
    if (!formData.name.trim() || formData.packages.length === 0) {
      toast.error('Por favor completa el nombre y agrega al menos un paquete');
      return;
    }

    setSubmitting(true);
    
    try {
      const themeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
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
        toast.success(editingTheme ? 'Tema de evento actualizado exitosamente' : 'Tema de evento creado exitosamente');
        fetchEventThemes();
        onClose();
        resetForm();
      } else {
        toast.error(data.error || 'Error al guardar el tema de evento');
      }
    } catch (error) {
      console.error('Error saving event theme:', error);
      toast.error('Error al guardar el tema de evento');
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
        toast.success('Tema de evento eliminado correctamente');
        fetchEventThemes();
      } else {
        toast.error('Error al eliminar el tema de evento');
      }
    } catch (error) {
      console.error('Error deleting event theme:', error);
      toast.error('Error al eliminar el tema de evento');
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
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Temas de Evento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona los temas y decoraciones disponibles
            </p>
          </div>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreate}
          className="bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          Nuevo Tema
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {eventThemes.length}
            </div>
            <div className="text-sm text-gray-600">Total de Temas</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">
              {eventThemes.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Temas Activos</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              {eventThemes.reduce((sum, t) => sum + t.packages.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Paquetes</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-purple-600 mb-2">
              {eventThemes.reduce((sum, t) => sum + t.themes.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Variaciones de Tema</div>
          </CardBody>
        </Card>
      </div>

      {/* Event Themes Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner size="lg" className="text-gray-900" />
              <p className="text-gray-500 mt-4">Cargando temas de evento...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Tabla de temas de evento"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-gray-50 text-gray-700 font-semibold",
                  td: "py-4"
                }}
              >
                <TableHeader>
                  <TableColumn>TEMA</TableColumn>
                  <TableColumn className="hidden md:table-cell">PAQUETES</TableColumn>
                  <TableColumn className="hidden lg:table-cell">VARIACIONES</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay temas de evento registrados">
                  {eventThemes.map((theme) => (
                    <TableRow key={theme._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
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
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {theme.packages.slice(0, 2).map((pkg, index) => (
                            <Chip key={index} size="sm" variant="flat" className="bg-gray-100 text-gray-700">
                              {pkg.name}
                            </Chip>
                          ))}
                          {theme.packages.length > 2 && (
                            <Chip size="sm" variant="flat" color="default">
                              +{theme.packages.length - 2} más
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {theme.themes.slice(0, 3).map((themeVariation, index) => (
                            <Chip key={index} size="sm" variant="flat" className="bg-blue-100 text-blue-700">
                              {themeVariation}
                            </Chip>
                          ))}
                          {theme.themes.length > 3 && (
                            <Chip size="sm" variant="flat" color="default">
                              +{theme.themes.length - 3} más
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={theme.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {theme.isActive ? 'Activo' : 'Inactivo'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<PencilIcon className="w-4 h-4" />}
                              onPress={() => handleEdit(theme)}
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDelete(theme._id)}
                            >
                              Eliminar
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
        isDismissable={!submitting}
        backdrop="opaque"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          base: "bg-white shadow-2xl border-0",
          header: "border-b border-gray-200 bg-white",
          body: "py-6",
          footer: "border-t border-gray-200 bg-gray-50"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingTheme ? 'Editar Tema de Evento' : 'Nuevo Tema de Evento'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {editingTheme ? 'Modifica los datos del tema' : 'Completa la información del nuevo tema'}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="px-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre del tema"
                      placeholder="Ej: Princesas Disney"
                      value={formData.name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                      isRequired
                      variant="bordered"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-300">
                      <Switch
                        isSelected={formData.isActive}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                        color="success"
                      />
                      <span className="text-sm font-medium text-gray-700">Tema activo</span>
                    </div>
                  </div>
                  
                  <Textarea
                    label="Descripción"
                    placeholder="Describe este tema de evento..."
                    value={formData.description}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    minRows={3}
                    variant="bordered"
                    classNames={{
                      input: "text-gray-900",
                      inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                    }}
                  />

                  <Divider />

                  {/* Packages Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Paquetes de Decoración</h4>
                    
                    {/* Add New Package */}
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardBody className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <Input
                            placeholder="Nombre del paquete"
                            value={newPackage.name}
                            onValueChange={(value) => setNewPackage(prev => ({ ...prev, name: value }))}
                            variant="bordered"
                            size="sm"
                            classNames={{
                              input: "text-gray-900",
                              inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 bg-white"
                            }}
                          />
                          <Input
                            placeholder="Piezas"
                            type="number"
                            value={newPackage.pieces}
                            onValueChange={(value) => setNewPackage(prev => ({ ...prev, pieces: value }))}
                            variant="bordered"
                            size="sm"
                            classNames={{
                              input: "text-gray-900",
                              inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 bg-white"
                            }}
                          />
                          <Input
                            placeholder="Precio"
                            type="number"
                            step="0.01"
                            value={newPackage.price}
                            onValueChange={(value) => setNewPackage(prev => ({ ...prev, price: value }))}
                            variant="bordered"
                            size="sm"
                            startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                            classNames={{
                              input: "text-gray-900",
                              inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 bg-white"
                            }}
                          />
                          <Button
                            onPress={addPackage}
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Agregar
                          </Button>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Packages List */}
                    {formData.packages.length > 0 && (
                      <div className="space-y-2">
                        {formData.packages.map((pkg, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{pkg.name}</span>
                              <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-700">
                                {pkg.pieces} piezas
                              </Chip>
                              <Chip size="sm" variant="flat" className="bg-blue-100 text-blue-700">
                                {formatCurrency(pkg.price)}
                              </Chip>
                            </div>
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              size="sm"
                              onPress={() => removePackage(index)}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Divider />

                  {/* Themes Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Variaciones de Tema</h4>
                    
                    {/* Add New Theme */}
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardBody className="p-4">
                        <div className="flex gap-3">
                          <Input
                            placeholder="Ej: Frozen, Bella y la Bestia, Cenicienta..."
                            value={newTheme}
                            onValueChange={setNewTheme}
                            variant="bordered"
                            size="sm"
                            startContent={<SparklesIcon className="w-4 h-4 text-gray-400" />}
                            classNames={{
                              input: "text-gray-900",
                              inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 bg-white"
                            }}
                          />
                          <Button
                            onPress={addTheme}
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Agregar
                          </Button>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Themes List */}
                    {formData.themes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.themes.map((theme, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{theme}</span>
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              size="sm"
                              onPress={() => removeTheme(index)}
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4">
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={submitting}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button
                  onPress={handleSubmit}
                  isLoading={submitting}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {submitting ? 'Guardando...' : (editingTheme ? 'Actualizar' : 'Crear Tema')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}