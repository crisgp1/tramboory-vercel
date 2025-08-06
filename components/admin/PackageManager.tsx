'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
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
  Button
} from '@heroui/react';
import { PrimaryButton, SecondaryButton } from '@/components/shared/ui';
import { Package, Plus, Edit3, Trash2, Eye, Users, Clock } from 'lucide-react';
import {
  PlusIcon,
  CubeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Gestión de Paquetes
            </h1>
            <p className="text-sm text-slate-600">
              Administra los paquetes de fiestas disponibles
            </p>
          </div>
        </div>
        <PrimaryButton onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Nuevo Paquete
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Paquetes</p>
                <p className="text-2xl font-bold text-slate-900">{packages.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Paquetes Activos</p>
                <p className="text-2xl font-bold text-green-600">{packages.filter(p => p.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Promedio de Invitados</p>
                <p className="text-2xl font-bold text-blue-600">{packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.maxGuests, 0) / packages.length) : 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner size="lg" className="text-foreground" />
              <p className="text-neutral-500 mt-4">Cargando paquetes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Tabla de paquetes"
                classNames={{
                  wrapper: "shadow-none",
                  th: "surface-elevated text-neutral-700 font-semibold",
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
                            <div className="font-semibold text-foreground">{pkg.name}</div>
                            <div className="text-sm text-neutral-500 mt-1 max-w-xs truncate">
                              {pkg.description}
                            </div>
                            <div className="md:hidden text-xs text-neutral-500 mt-1 flex items-center gap-1">
                              <UsersIcon className="w-3 h-3" />
                              {pkg.maxGuests} invitados • {pkg.duration}h
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-neutral-500" />
                          <span className="font-medium">{pkg.duration}h</span>
                          <span className="text-neutral-500">•</span>
                          <UsersIcon className="w-4 h-4 text-neutral-500" />
                          <span className="font-medium">{pkg.maxGuests}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-neutral-500">Entre semana:</span> {formatCurrency(pkg.pricing.weekday)}
                          </div>
                          <div className="text-sm">
                            <span className="text-neutral-500">Fin de semana:</span> {formatCurrency(pkg.pricing.weekend)}
                          </div>
                          <div className="text-sm">
                            <span className="text-neutral-500">Festivo:</span> {formatCurrency(pkg.pricing.holiday)}
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
                            className="text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                            onPress={() => handleEdit(pkg)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onPress={() => handleDelete(pkg._id)}
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
          backdrop: "surface-overlay",
          base: "surface-modal",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-200",
          body: "py-6",
          footer: "border-t border-gray-200 surface-elevated"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="px-6 py-4">
                <h3 className="text-lg font-medium text-foreground">
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
                        input: "text-foreground",
                        inputWrapper: "form-input"
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
                          input: "text-foreground",
                          inputWrapper: "form-input"
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
                          input: "text-foreground",
                          inputWrapper: "form-input"
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
                        <label className="block text-xs text-neutral-500 mb-1">Lunes - Jueves</label>
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
                            input: "text-foreground",
                            inputWrapper: "form-input"
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Viernes - Domingo</label>
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
                            input: "text-foreground",
                            inputWrapper: "form-input"
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Días festivos</label>
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
                            input: "text-foreground",
                            inputWrapper: "form-input"
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
                        input: "text-foreground",
                        inputWrapper: "form-input"
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
                        input: "text-foreground",
                        inputWrapper: "form-input"
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
                <button
                  className="btn-primary btn-sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  {submitting && <div className="loading-spinner" style={{width: 'var(--space-3)', height: 'var(--space-3)'}}></div>}
                  {submitting ? 'Guardando...' : (editingPackage ? 'Actualizar' : 'Crear')}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}