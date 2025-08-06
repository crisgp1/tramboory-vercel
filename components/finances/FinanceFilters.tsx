'use client';

import React, { useState } from 'react';
import {
  Input,
  Button,
  Select,
  SelectItem,
  DatePicker,
  Card,
  CardBody,
  Chip,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { 
  FINANCE_TYPES, 
  FINANCE_CATEGORIES, 
  FINANCE_STATUSES, 
  PAYMENT_METHODS,
  FINANCE_TYPE_LABELS,
  FINANCE_CATEGORY_LABELS,
  FINANCE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS
} from '@/types/finance';

interface FinanceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedPaymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  startDate?: Date;
  onStartDateChange: (date: Date | null) => void;
  endDate?: Date;
  onEndDateChange: (date: Date | null) => void;
  minAmount?: number;
  onMinAmountChange: (amount?: number) => void;
  maxAmount?: number;
  onMaxAmountChange: (amount?: number) => void;
  onClearFilters: () => void;
}

export default function FinanceFilters({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedPaymentMethod,
  onPaymentMethodChange,
  selectedTags,
  onTagsChange,
  availableTags,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  onClearFilters
}: FinanceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const hasActiveFilters = 
    selectedType !== '' ||
    selectedCategory !== '' ||
    selectedStatus !== '' ||
    selectedPaymentMethod !== '' ||
    selectedTags.length > 0 ||
    startDate ||
    endDate ||
    minAmount !== undefined ||
    maxAmount !== undefined;

  const handleTagAdd = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd(tagInput.trim());
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none bg-white">
      <CardBody className="p-4">
        {/* Barra de búsqueda principal */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por descripción, cliente, notas..."
              value={searchTerm}
              onValueChange={onSearchChange}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              classNames={{
                input: "text-sm",
                inputWrapper: "form-input"
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="light"
              size="sm"
              className={`border border-gray-200 hover:border-gray-300 ${
                isExpanded ? 'bg-gray-100' : 'bg-white'
              }`}
              onPress={() => setIsExpanded(!isExpanded)}
              startContent={<FunnelIcon className="w-4 h-4" />}
            >
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[selectedType, selectedCategory, selectedStatus, selectedPaymentMethod]
                    .filter(Boolean).length + 
                   selectedTags.length + 
                   (startDate ? 1 : 0) + 
                   (endDate ? 1 : 0) +
                   (minAmount !== undefined ? 1 : 0) +
                   (maxAmount !== undefined ? 1 : 0)}
                </span>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="light"
                size="sm"
                className="border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-red-600"
                onPress={onClearFilters}
                startContent={<XMarkIcon className="w-4 h-4" />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Fila 1: Tipo, Categoría, Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Tipo"
                placeholder="Todos los tipos"
                selectedKeys={selectedType ? [selectedType] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  onTypeChange(value || '');
                }}
                classNames={{
                  trigger: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              >
                {FINANCE_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    startContent={type === 'income' ?
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" /> :
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                    }
                  >
                    {FINANCE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Categoría"
                placeholder="Todas las categorías"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  onCategoryChange(value || '');
                }}
                classNames={{
                  trigger: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              >
                {FINANCE_CATEGORIES.map((category) => (
                  <SelectItem key={category}>
                    {FINANCE_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Estado"
                placeholder="Todos los estados"
                selectedKeys={selectedStatus ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  onStatusChange(value || '');
                }}
                classNames={{
                  trigger: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              >
                {FINANCE_STATUSES.map((status) => (
                  <SelectItem key={status}>
                    {FINANCE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Fila 2: Método de pago y rango de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Método de pago"
                placeholder="Todos los métodos"
                selectedKeys={selectedPaymentMethod ? [selectedPaymentMethod] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  onPaymentMethodChange(value || '');
                }}
                classNames={{
                  trigger: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              >
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="date"
                label="Fecha desde"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onStartDateChange(date);
                }}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
                startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
              />

              <Input
                type="date"
                label="Fecha hasta"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onEndDateChange(date);
                }}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
                startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Fila 3: Rango de montos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="number"
                label="Monto mínimo"
                placeholder="0.00"
                value={minAmount?.toString() || ''}
                onValueChange={(value) => {
                  const num = parseFloat(value);
                  onMinAmountChange(isNaN(num) ? undefined : num);
                }}
                startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              />

              <Input
                type="number"
                label="Monto máximo"
                placeholder="0.00"
                value={maxAmount?.toString() || ''}
                onValueChange={(value) => {
                  const num = parseFloat(value);
                  onMaxAmountChange(isNaN(num) ? undefined : num);
                }}
                startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "form-input",
                  label: "text-sm font-medium text-gray-700"
                }}
              />
            </div>

            {/* Fila 4: Tags */}
            <div className="space-y-2">
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
                  classNames={{
                    base: "flex-1"
                  }}
                  className="form-input"
                >
                  {availableTags.map((tag) => (
                    <AutocompleteItem key={tag}>
                      {tag}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
                
                <Button
                  size="sm"
                  variant="light"
                  className="border border-gray-200 hover:border-gray-300"
                  onPress={() => handleTagAdd(tagInput.trim())}
                  isDisabled={!tagInput.trim() || selectedTags.includes(tagInput.trim())}
                >
                  Agregar
                </Button>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
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
          </div>
        )}
      </CardBody>
    </Card>
  );
}