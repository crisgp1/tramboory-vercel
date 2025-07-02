'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Chip,
  Autocomplete,
  AutocompleteItem,
  Divider,
  Tabs,
  Tab
} from '@heroui/react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  PlusIcon,
  ListBulletIcon,
  TrashIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FINANCE_TYPES,
  FINANCE_CATEGORIES,
  FINANCE_STATUSES,
  PAYMENT_METHODS,
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  Finance,
  FinanceCategory,
  FinanceStatus,
  PaymentMethod
} from '@/types/finance';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  finance: Finance | null;
  onUpdate?: (id: string, data: Partial<Finance>) => Promise<void>;
  availableTags: string[];
  mode?: 'view' | 'edit';
  onRefresh?: () => void; // Para refrescar la lista después de agregar children
}

export default function FinanceModal({
  isOpen,
  onClose,
  finance,
  onUpdate,
  availableTags = [],
  mode: initialMode = 'view',
  onRefresh
}: FinanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [children, setChildren] = useState<Finance[]>([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Finance>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && finance) {
      setFormData({ ...finance });
      // Si la finanza es generada por el sistema o no es editable, forzar modo 'view'
      setMode((finance.isSystemGenerated || finance.isEditable === false || !!finance.reservation) ? 'view' : initialMode);
      setActiveTab('details');
      setErrors({});
      setTagInput('');
      setChildren([]);
      fetchChildren();
    }
  }, [isOpen, finance, initialMode]);

  const fetchChildren = async () => {
    if (!finance) return;
    
    setLoadingChildren(true);
    try {
      const response = await fetch(`/api/finances/${finance._id}/children`);
      const data = await response.json();
      
      if (data.success) {
        setChildren(data.data.children || []);
        console.log('Children loaded:', data.data.children?.length || 0);
      } else {
        console.error('Error fetching children:', data.error);
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleAddChild = async (childData: any) => {
    if (!finance) return;
    
    try {
      const response = await fetch(`/api/finances/${finance._id}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Child created successfully:', result.data);
        await fetchChildren(); // Refrescar children
        if (onRefresh) {
          onRefresh(); // Refrescar lista principal
        }
        setShowAddChildModal(false);
      } else {
        console.error('Error al crear child:', result.error);
        alert('Error al crear el registro relacionado: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating child:', error);
      alert('Error al crear el registro relacionado');
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return typeof date === 'string' ? date : date.toLocaleDateString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !finance || !onUpdate) return;

    setLoading(true);
    try {
      await onUpdate(finance._id, formData);
      setMode('view');
    } catch (error) {
      console.error('Error updating finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (finance) {
      setFormData({ ...finance });
      setErrors({});
      setMode('view');
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && formData.tags && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((tag: string) => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd(tagInput.trim());
    }
  };

  if (!finance) return null;

  const typeColorMap = {
    income: 'success',
    expense: 'danger'
  } as const;

  const statusColorMap = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger'
  } as const;

  const categoryColorMap = {
    reservation: 'primary',
    operational: 'secondary',
    salary: 'warning',
    other: 'default'
  } as const;

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Header con tipo y estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            finance.type === 'income' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {finance.description}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(finance.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            color={typeColorMap[finance.type]}
            variant="flat"
            startContent={finance.type === 'income' ? 
              <ArrowTrendingUpIcon className="w-4 h-4" /> : 
              <ArrowTrendingDownIcon className="w-4 h-4" />
            }
          >
            {FINANCE_TYPE_LABELS[finance.type as keyof typeof FINANCE_TYPE_LABELS]}
          </Chip>
          <Chip
            color={statusColorMap[finance.status]}
            variant="flat"
          >
            {FINANCE_STATUS_LABELS[finance.status as keyof typeof FINANCE_STATUS_LABELS]}
          </Chip>
        </div>
      </div>

      {/* Monto destacado */}
      <Card className="border border-gray-200 bg-gray-50">
        <CardBody className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Monto</p>
            <p className={`text-3xl font-bold ${
              finance.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <div className="mt-1">
              <Chip
                color={categoryColorMap[finance.category]}
                variant="flat"
              >
                {FINANCE_CATEGORY_LABELS[finance.category as keyof typeof FINANCE_CATEGORY_LABELS]}
              </Chip>
            </div>
          </div>

          {finance.subcategory && (
            <div>
              <label className="text-sm font-medium text-gray-700">Subcategoría</label>
              <p className="mt-1 text-sm text-gray-900">{finance.subcategory}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Método de pago</label>
            <p className="mt-1 text-sm text-gray-900">
              {PAYMENT_METHOD_LABELS[finance.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(finance.date)}</p>
          </div>

          {finance.reference && (
            <div>
              <label className="text-sm font-medium text-gray-700">Referencia</label>
              <p className="mt-1 text-sm text-gray-900">{finance.reference}</p>
            </div>
          )}

          {finance.createdBy && (
            <div>
              <label className="text-sm font-medium text-gray-700">Creado por</label>
              <p className="mt-1 text-sm text-gray-900">{finance.createdBy}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reserva vinculada */}
      {finance.reservation && (
        <div>
          <label className="text-sm font-medium text-gray-700">Reserva vinculada</label>
          <Card className="mt-2 border border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{finance.reservation.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(finance.reservation.eventDate)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Etiquetas */}
      {finance.tags && finance.tags.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">Etiquetas</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {finance.tags.map((tag: string) => (
              <Chip
                key={tag}
                variant="flat"
                color="primary"
                size="sm"
                startContent={<TagIcon className="w-3 h-3" />}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {finance.notes && (
        <div>
          <label className="text-sm font-medium text-gray-700">Notas</label>
          <Card className="mt-2 border border-gray-200">
            <CardBody className="p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{finance.notes}</p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );

  const renderEditTab = () => (
    <div className="space-y-6">
      {(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CogIcon className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Finanza Generada Automáticamente</h4>
              <p className="text-xs text-blue-700 mt-1">
                Esta finanza fue generada automáticamente desde una reservación y no puede ser editada.
                Puedes agregar gastos o ingresos relacionados en la pestaña "Relacionados".
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <Input
            placeholder="Descripción de la transacción"
            value={formData.description || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            isInvalid={!!errors.description}
            errorMessage={errors.description}
            startContent={<DocumentTextIcon className="w-4 h-4 text-gray-400" />}
            variant="flat"
            aria-label="Descripción de la transacción"
            isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
            classNames={{
              input: "text-gray-900",
              inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount?.toString() || ''}
              onValueChange={(value) => {
                const num = parseFloat(value) || 0;
                setFormData(prev => ({ ...prev, amount: num }));
              }}
              isInvalid={!!errors.amount}
              errorMessage={errors.amount}
              startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              aria-label="Monto de la transacción"
              isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                input: "text-gray-900",
                inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <Input
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData(prev => ({ ...prev, date }));
              }}
              startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              aria-label="Fecha de la transacción"
              isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                input: "text-gray-900",
                inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <Select
              placeholder="Selecciona una categoría"
              selectedKeys={formData.category ? [formData.category] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData(prev => ({ ...prev, category: value as FinanceCategory }));
              }}
              variant="flat"
              aria-label="Categoría de la transacción"
              isDisabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                trigger: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                value: "text-gray-900",
                listboxWrapper: "bg-white",
                popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
              }}
            >
              {FINANCE_CATEGORIES.map((category) => (
                <SelectItem key={category}>
                  {FINANCE_CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <Select
              placeholder="Selecciona un estado"
              selectedKeys={formData.status ? [formData.status] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData(prev => ({ ...prev, status: value as FinanceStatus }));
              }}
              variant="flat"
              aria-label="Estado de la transacción"
              isDisabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                trigger: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                value: "text-gray-900",
                listboxWrapper: "bg-white",
                popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
              }}
            >
              {FINANCE_STATUSES.map((status) => (
                <SelectItem key={status}>
                  {FINANCE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago *
            </label>
            <Select
              placeholder="Selecciona un método"
              selectedKeys={formData.paymentMethod ? [formData.paymentMethod] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }));
              }}
              variant="flat"
              aria-label="Método de pago"
              isDisabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                trigger: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                value: "text-gray-900",
                listboxWrapper: "bg-white",
                popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
              }}
            >
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategoría
            </label>
            <Input
              placeholder="Subcategoría específica"
              value={formData.subcategory || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
              startContent={<BuildingOfficeIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              aria-label="Subcategoría"
              isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                input: "text-gray-900",
                inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia
            </label>
            <Input
              placeholder="Número de referencia o folio"
              value={formData.reference || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, reference: value }))}
              variant="flat"
              aria-label="Referencia"
              isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
              classNames={{
                input: "text-gray-900",
                inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
              }}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Etiquetas
        </label>
        
        <div className="flex gap-2">
          <Autocomplete
            placeholder="Agregar etiqueta..."
            value={tagInput}
            onInputChange={setTagInput}
            onSelectionChange={(key) => {
              if (key) {
                handleTagAdd(key as string);
              }
            }}
            onKeyDown={handleTagInputKeyDown}
            startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
            variant="flat"
            aria-label="Agregar etiqueta"
            isDisabled={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
            classNames={{
              base: `flex-1 ${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
              listboxWrapper: "bg-white",
              popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
            }}
          >
            {(availableTags || []).map((tag) => (
              <AutocompleteItem key={tag}>
                {tag}
              </AutocompleteItem>
            ))}
          </Autocomplete>
          
          <Button
            size="sm"
            variant="flat"
            onPress={() => handleTagAdd(tagInput.trim())}
            isDisabled={(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) || !tagInput.trim() || (formData.tags || []).includes(tagInput.trim())}
            className={`${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 hover:bg-gray-100'} text-gray-700 border-0`}
          >
            Agregar
          </Button>
        </div>

        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag: string) => (
              <Chip
                key={tag}
                variant="flat"
                color="primary"
                size="sm"
                onClose={() => handleTagRemove(tag)}
                startContent={<TagIcon className="w-3 h-3" />}
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales
        </label>
        <Textarea
          placeholder="Información adicional sobre la transacción..."
          value={formData.notes || ''}
          onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
          minRows={3}
          variant="flat"
          aria-label="Notas adicionales"
          isReadOnly={finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation}
          classNames={{
            input: "text-gray-900",
            inputWrapper: `${(finance?.isSystemGenerated || finance?.isEditable === false || !!finance?.reservation) ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
          }}
        />
      </div>
    </div>
  );

  const renderChildrenTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ListBulletIcon className="w-4 h-4" />
          <span>Gastos e ingresos relacionados</span>
        </div>
        {finance && (finance.isSystemGenerated || !!finance.reservation) && (
          <Button
            size="sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setShowAddChildModal(true)}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Agregar
          </Button>
        )}
      </div>

      {/* Resumen de totales */}
      {finance && (
        <Card className="border border-gray-200 bg-gray-50">
          <CardBody className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Monto Original</p>
                <p className={`text-lg font-semibold ${
                  finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(finance.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Relacionados</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(children.reduce((sum, child) => {
                    return child.type === 'income' ? sum + child.amount : sum - child.amount;
                  }, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className={`text-lg font-semibold ${
                  (finance.amount + children.reduce((sum, child) => {
                    return child.type === 'income' ? sum + child.amount : sum - child.amount;
                  }, 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(finance.amount + children.reduce((sum, child) => {
                    return child.type === 'income' ? sum + child.amount : sum - child.amount;
                  }, 0))}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lista de children */}
      {loadingChildren ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      ) : children.length > 0 ? (
        <div className="space-y-3">
          {children.map((child) => (
            <Card key={child._id} className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      child.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{child.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(child.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${
                        child.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {child.type === 'income' ? '+' : '-'}{formatCurrency(child.amount)}
                      </p>
                      <div className="flex gap-1">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={child.type === 'income' ? 'success' : 'danger'}
                        >
                          {child.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </Chip>
                        {child.tags && child.tags.length > 0 && (
                          <Chip size="sm" variant="flat" color="default">
                            {child.tags[0]}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {child.notes && (
                  <p className="text-sm text-gray-600 mt-2 pl-6">{child.notes}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ListBulletIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay gastos o ingresos relacionados</p>
          {finance && (finance.isSystemGenerated || !!finance.reservation) && (
            <p className="text-sm mt-1">Puedes agregar gastos o ingresos adicionales relacionados a esta transacción</p>
          )}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ClockIcon className="w-4 h-4" />
        <span>Historial de cambios</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Transacción creada</p>
            <p className="text-xs text-gray-600">
              {formatDate(finance.createdAt || finance.date)}
              {finance.createdBy && ` por ${finance.createdBy}`}
            </p>
          </div>
        </div>

        {finance.updatedAt && finance.updatedAt !== finance.createdAt && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Última actualización</p>
              <p className="text-xs text-gray-600">
                {formatDate(finance.updatedAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-gray-900/20",
          base: `bg-white border border-gray-200 max-h-[90vh] my-4 ${showAddChildModal ? 'brightness-75' : ''}`,
          wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-0 overflow-y-auto max-h-[calc(90vh-140px)]",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          {/* Header */}
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mode === 'edit' ? 'Editar Transacción' : 'Detalles de Transacción'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      color={typeColorMap[finance.type]}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {FINANCE_TYPE_LABELS[finance.type as keyof typeof FINANCE_TYPE_LABELS]}
                    </Chip>
                    <span className="text-sm text-gray-500">
                      ID: {finance._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'view' && onUpdate && !finance.isSystemGenerated && finance.isEditable !== false && !finance.reservation && (
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setMode('edit')}
                    startContent={<PencilIcon className="w-4 h-4" />}
                    className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-0"
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </ModalHeader>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-100 bg-white">
            <div className="flex px-6">
              {[
                { key: 'details', label: mode === 'edit' ? 'Editar' : 'Detalles', icon: mode === 'edit' ? PencilIcon : EyeIcon },
                { key: 'children', label: `Relacionados (${children.length})`, icon: ListBulletIcon },
                { key: 'history', label: 'Historial', icon: ClockIcon }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <ModalBody className="p-6 overflow-y-auto">
            {activeTab === 'details' && (mode === 'view' ? renderDetailsTab() : renderEditTab())}
            {activeTab === 'children' && renderChildrenTab()}
            {activeTab === 'history' && renderHistoryTab()}
          </ModalBody>

          {/* Footer */}
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-between items-center w-full">
              <div className="flex gap-3">
                {mode === 'edit' && (
                  <Button
                    variant="light"
                    onPress={handleCancel}
                    size="sm"
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="light"
                  onPress={onClose}
                  size="sm"
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Cerrar
                </Button>
                
                {mode === 'edit' && onUpdate && !finance.isSystemGenerated && finance.isEditable !== false && !finance.reservation && (
                  <Button
                    color="primary"
                    onPress={handleSave}
                    isLoading={loading}
                    size="sm"
                    className="bg-gray-900 text-white hover:bg-gray-800"
                  >
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Overlay para oscurecer el modal padre */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/30 z-[1001]" />
      )}

      {/* Modal para agregar child */}
      <Modal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        size="md"
        backdrop="transparent"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-transparent",
          base: "bg-white border border-gray-200 shadow-2xl",
          wrapper: "z-[1002] items-center justify-center p-4",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-0 overflow-y-auto",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Agregar Relacionado</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {finance?.description}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <AddChildForm
              onSubmit={handleAddChild}
              onCancel={() => setShowAddChildModal(false)}
              parentFinance={finance}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

// Componente para agregar child
function AddChildForm({
  onSubmit,
  onCancel,
  parentFinance
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  parentFinance: Finance | null;
}) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.description.trim() || formData.amount <= 0) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Card
            isPressable
            className={`border-2 transition-all duration-200 cursor-pointer ${
              formData.type === 'income'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
          >
            <CardBody className="p-3 text-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <span className="text-sm font-medium text-gray-900">Ingreso</span>
            </CardBody>
          </Card>
          
          <Card
            isPressable
            className={`border-2 transition-all duration-200 cursor-pointer ${
              formData.type === 'expense'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
          >
            <CardBody className="p-3 text-center">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <span className="text-sm font-medium text-gray-900">Gasto</span>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción *
        </label>
        <Input
          placeholder="Ej: Gasto adicional de materiales..."
          value={formData.description}
          onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
          variant="flat"
          size="sm"
          startContent={<DocumentTextIcon className="w-4 h-4 text-gray-400" />}
          classNames={{
            input: "text-gray-900",
            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
          }}
        />
      </div>
      
      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto *
        </label>
        <Input
          type="number"
          placeholder="0.00"
          value={formData.amount.toString()}
          onValueChange={(value) => setFormData(prev => ({ ...prev, amount: parseFloat(value) || 0 }))}
          startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
          variant="flat"
          size="sm"
          classNames={{
            input: "text-gray-900",
            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
          }}
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <Textarea
          placeholder="Información adicional..."
          value={formData.notes}
          onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
          minRows={2}
          variant="flat"
          size="sm"
          classNames={{
            input: "text-gray-900",
            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
          }}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
        <Button
          variant="light"
          onPress={onCancel}
          size="sm"
          className="text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSubmit}
          isLoading={loading}
          isDisabled={!formData.description.trim() || formData.amount <= 0}
          size="sm"
          className="bg-gray-900 text-white hover:bg-gray-800"
          startContent={!loading && <PlusIcon className="w-4 h-4" />}
        >
          {loading ? 'Agregando...' : 'Agregar'}
        </Button>
      </div>
    </div>
  );
}