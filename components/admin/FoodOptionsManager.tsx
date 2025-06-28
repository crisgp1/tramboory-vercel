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
  CakeIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
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
  extras: FoodExtra[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoodFormData {
  name: string;
  basePrice: string;
  description: string;
  extras: FoodExtra[];
  isActive: boolean;
}

export default function FoodOptionsManager() {
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodOption | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    basePrice: '',
    description: '',
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
      extras: [],
      isActive: true
    });
    setNewExtra({ name: '', price: '' });
    setEditingFood(null);
  };

  const handleCreate = () => {
    resetForm();
    onOpen();
  };

  const handleEdit = (food: FoodOption) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      basePrice: food.basePrice.toString(),
      description: food.description || '',
      extras: [...food.extras],
      isActive: food.isActive
    });
    onOpen();
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
        onClose();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <CakeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Opciones de Comida
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las opciones de alimentos y bebidas
            </p>
          </div>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreate}
          className="bg-gray-900 text-white hover:bg-gray-800"
          size="lg"
        >
          Nueva Opción
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-gray-900 mb-2">
              {foodOptions.length}
            </div>
            <div className="text-sm text-gray-600">Total de Opciones</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">
              {foodOptions.filter(f => f.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Opciones Activas</div>
          </CardBody>
        </Card>
        
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-blue-600 mb-2">
              {foodOptions.reduce((sum, f) => sum + f.extras.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Extras</div>
          </CardBody>
        </Card>
      </div>

      {/* Food Options Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner size="lg" className="text-gray-900" />
              <p className="text-gray-500 mt-4">Cargando opciones de comida...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Tabla de opciones de comida"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-gray-50 text-gray-700 font-semibold",
                  td: "py-4"
                }}
              >
                <TableHeader>
                  <TableColumn>OPCIÓN</TableColumn>
                  <TableColumn className="hidden md:table-cell">PRECIO BASE</TableColumn>
                  <TableColumn className="hidden lg:table-cell">EXTRAS</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay opciones de comida registradas">
                  {foodOptions.map((food) => (
                    <TableRow key={food._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CakeIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{food.name}</div>
                            {food.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {food.description}
                              </div>
                            )}
                            <div className="md:hidden text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CurrencyDollarIcon className="w-3 h-3" />
                              {formatCurrency(food.basePrice)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formatCurrency(food.basePrice)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {food.extras.slice(0, 2).map((extra, index) => (
                            <Chip key={index} size="sm" variant="flat" className="bg-gray-100 text-gray-700">
                              {extra.name}
                            </Chip>
                          ))}
                          {food.extras.length > 2 && (
                            <Chip size="sm" variant="flat" color="default">
                              +{food.extras.length - 2} más
                            </Chip>
                          )}
                          {food.extras.length === 0 && (
                            <span className="text-sm text-gray-400">Sin extras</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={food.isActive ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {food.isActive ? 'Activo' : 'Inactivo'}
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
                              onPress={() => handleEdit(food)}
                            >
                              Editar
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDelete(food._id)}
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
        size="3xl"
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
                    <CakeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingFood ? 'Editar Opción de Comida' : 'Nueva Opción de Comida'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {editingFood ? 'Modifica los datos de la opción' : 'Completa la información de la nueva opción'}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="px-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre de la opción"
                      placeholder="Ej: Menú Infantil"
                      value={formData.name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                      isRequired
                      variant="bordered"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                    
                    <Input
                      label="Precio base"
                      placeholder="Ej: 150"
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, basePrice: value }))}
                      isRequired
                      variant="bordered"
                      startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-300">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                      color="success"
                    />
                    <span className="text-sm font-medium text-gray-700">Opción activa</span>
                  </div>
                  
                  <Textarea
                    label="Descripción"
                    placeholder="Describe qué incluye esta opción de comida..."
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

                  {/* Extras Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Extras Disponibles</h4>
                    
                    {/* Add New Extra */}
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardBody className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="Nombre del extra"
                            value={newExtra.name}
                            onValueChange={(value) => setNewExtra(prev => ({ ...prev, name: value }))}
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
                            value={newExtra.price}
                            onValueChange={(value) => setNewExtra(prev => ({ ...prev, price: value }))}
                            variant="bordered"
                            size="sm"
                            startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                            classNames={{
                              input: "text-gray-900",
                              inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 bg-white"
                            }}
                          />
                          <Button
                            onPress={addExtra}
                            startContent={<PlusIcon className="w-4 h-4" />}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Agregar
                          </Button>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Extras List */}
                    {formData.extras.length > 0 && (
                      <div className="space-y-2">
                        {formData.extras.map((extra, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{extra.name}</span>
                              <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-700">
                                {formatCurrency(extra.price)}
                              </Chip>
                            </div>
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              size="sm"
                              onPress={() => removeExtra(index)}
                            >
                              <XMarkIcon className="w-4 h-4" />
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
                  {submitting ? 'Guardando...' : (editingFood ? 'Actualizar' : 'Crear Opción')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}