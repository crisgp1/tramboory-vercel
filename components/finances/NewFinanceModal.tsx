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
  Divider
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import {
  FINANCE_TYPES,
  FINANCE_CATEGORIES,
  FINANCE_STATUSES,
  PAYMENT_METHODS,
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  CreateFinanceData,
  FinanceCategory,
  FinanceStatus,
  PaymentMethod
} from '@/types/finance';

interface NewFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFinanceData) => Promise<void>;
  availableTags: string[];
  reservations?: Array<{
    _id: string;
    customer: {
      name: string;
    };
    child: {
      name: string;
    };
    eventDate: string;
    pricing: {
      total: number;
    };
    status: string;
  }>;
}

export default function NewFinanceModal({
  isOpen,
  onClose,
  onSubmit,
  availableTags = [],
  reservations = []
}: NewFinanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<CreateFinanceData>({
    type: 'income',
    category: 'other',
    description: '',
    amount: 0,
    date: new Date(),
    status: 'pending',
    paymentMethod: 'cash',
    tags: [],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        type: 'income',
        category: 'other',
        description: '',
        amount: 0,
        date: new Date(),
        status: 'pending',
        paymentMethod: 'cash',
        tags: [],
        notes: ''
      });
      setErrors({});
      setStep(1);
      setTagInput('');
    }
  }, [isOpen]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.description.trim()) {
        newErrors.description = 'La descripción es requerida';
      }
      if (formData.amount <= 0) {
        newErrors.amount = 'El monto debe ser mayor a 0';
      }
      if (!formData.type) {
        newErrors.type = 'El tipo es requerido';
      }
      if (!formData.category) {
        newErrors.category = 'La categoría es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error creating finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && formData.tags && !formData.tags.includes(tag)) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    } else if (tag && !formData.tags) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        tags: [tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev: CreateFinanceData) => ({
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

  const handleReservationSelect = (reservationId: string) => {
    const reservation = reservations.find(r => r._id === reservationId);
    if (reservation) {
      setFormData((prev: CreateFinanceData) => ({
        ...prev,
        reservationId,
        description: `Pago de reserva - ${reservation.customer.name} (${reservation.child.name})`,
        amount: reservation.pricing.total,
        category: 'reservation' as const
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Vinculación con reserva - Sección destacada */}
      {reservations && reservations.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">¿Relacionar con una reserva?</h4>
                <p className="text-sm text-blue-700">Selecciona una reserva existente para vincular esta transacción</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                placeholder="Seleccionar reserva existente..."
                selectedKeys={formData.reservationId ? [formData.reservationId] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  if (value) {
                    handleReservationSelect(value);
                  }
                }}
                variant="flat"
                aria-label="Vincular con reserva"
                classNames={{
                  base: "flex-1",
                  trigger: "bg-white border border-blue-200 hover:border-blue-300 focus-within:border-blue-500",
                  value: "text-gray-900",
                  listboxWrapper: "bg-white",
                  popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                }}
              >
                {reservations.map((reservation) => (
                  <SelectItem
                    key={reservation._id}
                    startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{reservation.customer.name}</span>
                      <span className="text-xs text-gray-500">
                        {reservation.child.name} - {formatCurrency(reservation.pricing.total)} - {new Date(reservation.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
              
              {formData.reservationId && (
                <Button
                  size="sm"
                  variant="light"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  onPress={() => {
                    setFormData((prev: CreateFinanceData) => ({
                      ...prev,
                      reservationId: undefined,
                      category: 'other',
                      description: '',
                      amount: 0
                    }));
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tipo de transacción */}
      <div className="grid grid-cols-2 gap-3">
        {FINANCE_TYPES.map((type) => (
          <Card
            key={type}
            isPressable
            className={`border-2 transition-colors cursor-pointer ${
              formData.type === type
                ? type === 'income'
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onPress={() => setFormData((prev: CreateFinanceData) => ({ ...prev, type }))}
          >
            <CardBody className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                {type === 'income' ? (
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-8 h-8 text-red-500" />
                )}
                <span className="font-medium text-sm">
                  {FINANCE_TYPE_LABELS[type]}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {errors.type && <p className="text-red-500 text-xs">{errors.type}</p>}

      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <Input
            placeholder="Ej: Pago de cliente, Compra de materiales..."
            value={formData.description}
            onValueChange={(value) => setFormData((prev: CreateFinanceData) => ({ ...prev, description: value }))}
            isInvalid={!!errors.description}
            errorMessage={errors.description}
            startContent={<DocumentTextIcon className="w-4 h-4 text-gray-400" />}
            variant="flat"
            aria-label="Descripción de la transacción"
            classNames={{
              input: "text-gray-900",
              inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
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
              value={formData.amount.toString()}
              onValueChange={(value) => {
                const num = parseFloat(value) || 0;
                setFormData((prev: CreateFinanceData) => ({ ...prev, amount: num }));
              }}
              isInvalid={!!errors.amount}
              errorMessage={errors.amount}
              startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              aria-label="Monto de la transacción"
              classNames={{
                input: "text-gray-900",
                inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <Input
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData((prev: CreateFinanceData) => ({ ...prev, date }));
              }}
              startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              aria-label="Fecha de la transacción"
              classNames={{
                input: "text-gray-900",
                inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <Select
              placeholder="Selecciona una categoría"
              selectedKeys={formData.category ? [formData.category] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData((prev: CreateFinanceData) => ({ ...prev, category: value as FinanceCategory }));
              }}
              isInvalid={!!errors.category}
              errorMessage={errors.category}
              variant="flat"
              aria-label="Categoría de la transacción"
              classNames={{
                trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
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
                setFormData((prev: CreateFinanceData) => ({ ...prev, status: value as FinanceStatus }));
              }}
              variant="flat"
              aria-label="Estado de la transacción"
              classNames={{
                trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
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
        </div>
      </div>

    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de pago *
        </label>
        <Select
          placeholder="Selecciona un método de pago"
          selectedKeys={formData.paymentMethod ? [formData.paymentMethod] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            if (value) {
              setFormData((prev: CreateFinanceData) => ({ ...prev, paymentMethod: value as PaymentMethod }));
            }
          }}
          variant="flat"
          aria-label="Método de pago"
          classNames={{
            trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
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

      {/* Subcategoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subcategoría
        </label>
        <Input
          placeholder="Ej: Marketing, Mantenimiento, Bonos..."
          value={formData.subcategory || ''}
          onValueChange={(value) => setFormData((prev: CreateFinanceData) => ({ ...prev, subcategory: value }))}
          startContent={<BuildingOfficeIcon className="w-4 h-4 text-gray-400" />}
          variant="flat"
          aria-label="Subcategoría de la transacción"
          classNames={{
            input: "text-gray-900",
            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
          }}
        />
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Etiquetas</label>
        
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
            classNames={{
              base: "flex-1 bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
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
            variant="light"
            className="bg-gray-50 border-0 hover:bg-gray-100 text-gray-700"
            onPress={() => handleTagAdd(tagInput.trim())}
            isDisabled={!tagInput.trim() || (formData.tags && formData.tags.includes(tagInput.trim()))}
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
          placeholder="Información adicional sobre esta transacción..."
          value={formData.notes || ''}
          onValueChange={(value) => setFormData((prev: CreateFinanceData) => ({ ...prev, notes: value }))}
          minRows={3}
          variant="flat"
          aria-label="Notas adicionales"
          classNames={{
            input: "text-gray-900",
            inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
          }}
        />
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardBody className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <Chip
                color={formData.type === 'income' ? 'success' : 'danger'}
                variant="flat"
                size="sm"
                startContent={formData.type === 'income' ? 
                  <ArrowTrendingUpIcon className="w-3 h-3" /> : 
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                }
              >
                {FINANCE_TYPE_LABELS[formData.type as keyof typeof FINANCE_TYPE_LABELS]}
              </Chip>
            </div>
            
            <Divider />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Descripción:</span>
              <span className="text-sm font-medium">{formData.description}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className={`text-sm font-semibold ${
                formData.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.type === 'income' ? '+' : '-'}{formatCurrency(formData.amount)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Categoría:</span>
              <span className="text-sm">{FINANCE_CATEGORY_LABELS[formData.category as keyof typeof FINANCE_CATEGORY_LABELS]}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fecha:</span>
              <span className="text-sm">{formData.date.toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado:</span>
              <span className="text-sm">{FINANCE_STATUS_LABELS[formData.status as keyof typeof FINANCE_STATUS_LABELS]}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Método de pago:</span>
              <span className="text-sm">{PAYMENT_METHOD_LABELS[formData.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</span>
            </div>

            {formData.subcategory && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subcategoría:</span>
                <span className="text-sm">{formData.subcategory}</span>
              </div>
            )}

            {formData.reservationId && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Reserva vinculada:</span>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {(() => {
                        const reservation = reservations?.find(r => r._id === formData.reservationId);
                        return reservation ? `${reservation.customer.name} - ${reservation.child.name}` : 'Reserva seleccionada';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {formData.tags && formData.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Etiquetas:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag: string) => (
                    <Chip key={tag} variant="flat" color="primary" size="sm">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {formData.notes && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Notas:</span>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                  {formData.notes}
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      isDismissable={!loading}
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-6 overflow-y-auto max-h-[calc(90vh-140px)]",
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
                  Nueva Transacción
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    Paso {step} de 3
                  </span>
                  {formData.type && (
                    <Chip
                      color={formData.type === 'income' ? 'success' : 'danger'}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {FINANCE_TYPE_LABELS[formData.type as keyof typeof FINANCE_TYPE_LABELS]}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalHeader>

        {/* Content */}
        <ModalBody className="overflow-y-auto">
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNumber === step
                        ? 'bg-gray-900 text-white'
                        : stepNumber < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-8 h-0.5 ${
                        stepNumber < step ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderSummary()}
          </div>
        </ModalBody>

        {/* Footer */}
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-between items-center w-full">
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="light"
                  onPress={handleBack}
                  isDisabled={loading}
                  size="sm"
                  className="text-gray-600 hover:bg-gray-100"
                >
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={loading}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              
              {step < 3 ? (
                <Button
                  color="primary"
                  onPress={handleNext}
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={loading}
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {loading ? 'Creando...' : 'Crear Transacción'}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}