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
  CubeIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
        toast.error('Error al cargar los paquetes');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Error al cargar los paquetes');
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
    onOpen();
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
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.weekday || !formData.weekend || !formData.holiday || !formData.duration || !formData.maxGuests) {
      toast.error('Por favor completa todos los campos requeridos');
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
        toast.success(editingPackage ? 'Paquete actualizado exitosamente' : 'Paquete creado exitosamente');
        fetchPackages();
        onClose();
        resetForm();
      } else {
        toast.error(data.error || 'Error al guardar el paquete');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Error al guardar el paquete');
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
        toast.success('Paquete eliminado correctamente');
        fetchPackages();
      } else {
        toast.error('Error al eliminar el paquete');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Error al eliminar el paquete');
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
            <CubeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Gestión de Paquetes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Administra los paquetes de fiestas disponibles
            </p>
          </div>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreate}
          className="bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          Nuevo Paquete
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {packages.length}
            </div>
            <div className="text-sm text-gray-600">Total de Paquetes</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">
              {packages.filter(p => p.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Paquetes Activos</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              {packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.maxGuests, 0) / packages.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Promedio de Invitados</div>
          </CardBody>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner size="lg" className="text-gray-900" />
              <p className="text-gray-500 mt-4">Cargando paquetes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Tabla de paquetes"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-gray-50 text-gray-700 font-semibold",
                  td: "py-4"
                }}
              >
                <TableHeader>
                  <TableColumn>PAQUETE</TableColumn>
                  <TableColumn className="hidden md:table-cell">DURACIÓN</TableColumn>
                  <TableColumn className="hidden lg:table-cell">PRECIOS</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay paquetes registrados">
                  {packages.map((pkg) => (
                    <TableRow key={pkg._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CubeIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{pkg.name}</div>
                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                              {pkg.description}
                            </div>
                            <div className="md:hidden text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <UsersIcon className="w-3 h-3" />
                              {pkg.maxGuests} invitados • {pkg.duration}h
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{pkg.duration}h</span>
                          <span className="text-gray-500">•</span>
                          <UsersIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{pkg.maxGuests}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-500">Entre semana:</span> {formatCurrency(pkg.pricing.weekday)}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Fin de semana:</span> {formatCurrency(pkg.pricing.weekend)}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Festivo:</span> {formatCurrency(pkg.pricing.holiday)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={pkg.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {pkg.isActive ? 'Activo' : 'Inactivo'}
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
                              onPress={() => handleEdit(pkg)}
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDelete(pkg._id)}
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
                  {editingPackage ? 'Editar paquete' : 'Nuevo paquete'}
                </h3>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del paquete *
                    </label>
                    <Input
                      placeholder="Ej: Paquete Básico"
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
                        Duración (horas) *
                      </label>
                      <Input
                        placeholder="4"
                        type="number"
                        min="1"
                        max="24"
                        value={formData.duration}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                        variant="flat"
                        endContent={<span className="text-gray-400 text-sm">hrs</span>}
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de invitados *
                      </label>
                      <Input
                        placeholder="20"
                        type="number"
                        min="1"
                        value={formData.maxGuests}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, maxGuests: value }))}
                        variant="flat"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precios *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Lunes - Jueves</label>
                        <Input
                          placeholder="2500"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.weekday}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, weekday: value }))}
                          variant="flat"
                          startContent={<span className="text-gray-400">$</span>}
                          classNames={{
                            input: "text-gray-900",
                            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Viernes - Domingo</label>
                        <Input
                          placeholder="3000"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.weekend}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, weekend: value }))}
                          variant="flat"
                          startContent={<span className="text-gray-400">$</span>}
                          classNames={{
                            input: "text-gray-900",
                            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Días festivos</label>
                        <Input
                          placeholder="3500"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.holiday}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, holiday: value }))}
                          variant="flat"
                          startContent={<span className="text-gray-400">$</span>}
                          classNames={{
                            input: "text-gray-900",
                            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <Textarea
                      placeholder="Describe qué incluye este paquete..."
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Características incluidas
                    </label>
                    <Textarea
                      placeholder="Decoración básica, mesa de dulces, animación (separadas por comas)"
                      value={formData.features}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, features: value }))}
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
                    <span className="text-sm text-gray-700">Paquete activo</span>
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
                  {submitting ? 'Guardando...' : (editingPackage ? 'Actualizar' : 'Crear')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}