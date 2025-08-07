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
  Divider,
  Select,
  SelectItem
} from '@heroui/react';
import {
  PlusIcon,
  CakeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
    onOpen();
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
          <div style={{
          width: 'var(--space-12)',
          height: 'var(--space-12)',
          backgroundColor: 'var(--primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
            <CakeIcon className="icon-base text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Opciones de Comida
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Gestiona las opciones de alimentos y bebidas
            </p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <PlusIcon className="icon-base" />
          Nueva Opción
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="text-center p-6">
            <div className="text-2xl font-semibold text-foreground mb-2">
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
              <Spinner size="lg" className="text-foreground" />
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
                            <div className="font-semibold text-foreground">{food.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  food.category === 'main' ? 'primary' :
                                  food.category === 'appetizer' ? 'secondary' :
                                  food.category === 'dessert' ? 'success' : 'warning'
                                }
                              >
                                {food.category === 'main' ? 'Principal' :
                                 food.category === 'appetizer' ? 'Entrada' :
                                 food.category === 'dessert' ? 'Postre' : 'Bebida'}
                              </Chip>
                            </div>
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
                            onPress={() => handleEdit(food)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onPress={() => handleDelete(food._id)}
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
          header: "border-b border-gray-200 bg-white",
          body: "py-6",
          footer: "border-t border-gray-200 bg-gray-50"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="px-6 py-4">
                <h3 className="text-lg font-medium text-foreground">
                  {editingFood ? 'Editar opción de comida' : 'Nueva opción de comida'}
                </h3>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la opción *
                      </label>
                      <Input
                        placeholder="Ej: Menú infantil, Buffet, Cena formal"
                        value={formData.name}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                        variant="flat"
                        classNames={{
                          inputWrapper: "form-input"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio base *
                      </label>
                      <Input
                        placeholder="150"
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, basePrice: value }))}
                        variant="flat"
                        startContent={<span className="text-gray-400">$</span>}
                        classNames={{
                          inputWrapper: "form-input"
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700">Opción activa</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <Textarea
                      placeholder="Describe qué incluye esta opción de comida..."
                      value={formData.description}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      minRows={2}
                      variant="flat"
                      classNames={{
                        inputWrapper: "form-input"
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <Select
                      placeholder="Selecciona una categoría"
                      selectedKeys={[formData.category]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as 'main' | 'appetizer' | 'dessert' | 'beverage';
                        setFormData(prev => ({ ...prev, category: selected }));
                      }}
                      variant="flat"
                      classNames={{
                        trigger: "form-input"
                      }}
                    >
                      <SelectItem key="main">Plato Principal</SelectItem>
                      <SelectItem key="appetizer">Entrada</SelectItem>
                      <SelectItem key="dessert">Postre</SelectItem>
                      <SelectItem key="beverage">Bebida</SelectItem>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Extras disponibles</h4>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Nombre del extra</label>
                          <Input
                            placeholder="Ej: Postre adicional, Bebida premium"
                            value={newExtra.name}
                            onValueChange={(value) => setNewExtra(prev => ({ ...prev, name: value }))}
                            variant="flat"
                            size="sm"
                            classNames={{
                              inputWrapper: "form-input"
                            }}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-gray-500 mb-1">Precio</label>
                          <Input
                            placeholder="50"
                            type="number"
                            step="0.01"
                            value={newExtra.price}
                            onValueChange={(value) => setNewExtra(prev => ({ ...prev, price: value }))}
                            variant="flat"
                            size="sm"
                            startContent={<span className="text-gray-400">$</span>}
                            classNames={{
                              inputWrapper: "form-input"
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onPress={addExtra}
                            size="sm"
                            className="btn-primary btn-sm"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {formData.extras.length > 0 && (
                      <div className="space-y-2">
                        {formData.extras.map((extra, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-foreground">{extra.name}</span>
                              <span className="text-xs text-gray-500">{formatCurrency(extra.price)}</span>
                            </div>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => removeExtra(index)}
                              className="text-gray-400 hover:text-red-500"
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
                  {submitting ? 'Guardando...' : (editingFood ? 'Actualizar' : 'Crear')}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}