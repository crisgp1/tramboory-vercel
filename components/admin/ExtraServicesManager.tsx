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
  Switch
} from '@heroui/react';
import {
  PlusIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
        toast.error('Error al cargar los servicios extras');
      }
    } catch (error) {
      console.error('Error fetching extra services:', error);
      toast.error('Error al cargar los servicios extras');
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
    onOpen();
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
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price || !formData.category) {
      toast.error('Por favor completa todos los campos requeridos');
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
        toast.success(editingService ? 'Servicio extra actualizado exitosamente' : 'Servicio extra creado exitosamente');
        fetchExtraServices();
        onClose();
        resetForm();
      } else {
        toast.error(data.error || 'Error al guardar el servicio extra');
      }
    } catch (error) {
      console.error('Error saving extra service:', error);
      toast.error('Error al guardar el servicio extra');
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
        toast.success('Servicio extra eliminado correctamente');
        fetchExtraServices();
      } else {
        toast.error('Error al eliminar el servicio extra');
      }
    } catch (error) {
      console.error('Error deleting extra service:', error);
      toast.error('Error al eliminar el servicio extra');
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
      otros: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Servicios Extras
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona los servicios adicionales disponibles
            </p>
          </div>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreate}
          className="bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {extraServices.length}
            </div>
            <div className="text-sm text-gray-600">Total de Servicios</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">
              {extraServices.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Servicios Activos</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              {new Set(extraServices.map(s => s.category)).size}
            </div>
            <div className="text-sm text-gray-600">Categorías</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-orange-600 mb-2">
              {extraServices.length > 0 ? formatCurrency(extraServices.reduce((sum, s) => sum + s.price, 0) / extraServices.length) : '$0'}
            </div>
            <div className="text-sm text-gray-600">Precio Promedio</div>
          </CardBody>
        </Card>
      </div>

      {/* Extra Services Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner size="lg" className="text-gray-900" />
              <p className="text-gray-500 mt-4">Cargando servicios extras...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Tabla de servicios extras"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-gray-50 text-gray-700 font-semibold",
                  td: "py-4"
                }}
              >
                <TableHeader>
                  <TableColumn>SERVICIO</TableColumn>
                  <TableColumn className="hidden md:table-cell">CATEGORÍA</TableColumn>
                  <TableColumn className="hidden lg:table-cell">PRECIO</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay servicios extras registrados">
                  {extraServices.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {service.description}
                              </div>
                            )}
                            <div className="lg:hidden text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CurrencyDollarIcon className="w-3 h-3" />
                              {formatCurrency(service.price)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Chip
                          size="sm"
                          variant="flat"
                          className={getCategoryColor(service.category)}
                        >
                          {getCategoryLabel(service.category)}
                        </Chip>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formatCurrency(service.price)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={service.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {service.isActive ? 'Activo' : 'Inactivo'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onPress={() => {/* TODO: Implementar vista detallada */}}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onPress={() => handleEdit(service)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onPress={() => handleDelete(service._id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
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
        size="2xl"
        scrollBehavior="inside"
        isDismissable={!submitting}
        backdrop="opaque"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          base: "bg-white shadow-2xl border-0",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-200 bg-white",
          body: "py-6",
          footer: "border-t border-gray-200 bg-gray-50"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingService ? 'Editar servicio' : 'Nuevo servicio'}
                </h3>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del servicio *
                    </label>
                    <Input
                      placeholder="Ej: Fotografía profesional, DJ, Animador"
                      value={formData.name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <Input
                        placeholder="500"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
                        variant="flat"
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white text-gray-900"
                      >
                        {categories.map((category) => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <Textarea
                      placeholder="Describe qué incluye este servicio..."
                      value={formData.description}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      minRows={2}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700">Servicio activo</span>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-3">
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={submitting}
                  size="sm"
                  className="text-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  onPress={handleSubmit}
                  isLoading={submitting}
                  size="sm"
                  className="bg-gray-900 text-white"
                >
                  {submitting ? 'Guardando...' : (editingService ? 'Actualizar' : 'Crear')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}