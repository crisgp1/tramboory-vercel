'use client';

import React, { useState } from 'react';
import {
  TextInput,
  Button,
  Select,
  Card,
  Badge,
  Autocomplete,
  Group,
  Stack,
  Text,
  ActionIcon
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconCalendar,
  IconTag,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
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
    <Card withBorder p="md" shadow="none" style={{ backgroundColor: 'white' }}>
        {/* Barra de búsqueda principal */}
        <Group gap="md" mb="md" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <TextInput
              placeholder="Buscar por descripción, cliente, notas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftSection={<IconSearch size={16} />}
              size="sm"
            />
          </div>
          
          <Group gap="xs">
            <Button
              variant="light"
              size="sm"
              style={{
                backgroundColor: isExpanded ? 'var(--mantine-color-gray-1)' : 'white',
                border: '1px solid var(--mantine-color-gray-3)'
              }}
              onClick={() => setIsExpanded(!isExpanded)}
              leftSection={<IconFilter size={16} />}
            >
              Filtros
              {hasActiveFilters && (
                <Badge size="xs" color="blue" style={{ marginLeft: '4px' }}>
                  {[selectedType, selectedCategory, selectedStatus, selectedPaymentMethod]
                    .filter(Boolean).length + 
                   selectedTags.length + 
                   (startDate ? 1 : 0) + 
                   (endDate ? 1 : 0) +
                   (minAmount !== undefined ? 1 : 0) +
                   (maxAmount !== undefined ? 1 : 0)}
                </Badge>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="light"
                size="sm"
                c="red"
                style={{
                  border: '1px solid var(--mantine-color-gray-3)'
                }}
                onClick={onClearFilters}
                leftSection={<IconX size={16} />}
              >
                Limpiar
              </Button>
            )}
          </Group>
        </Group>

        {/* Filtros expandidos */}
        {isExpanded && (
          <Stack gap="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            {/* Fila 1: Tipo, Categoría, Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-sm)' }}>
              <Select
                label="Tipo"
                placeholder="Todos los tipos"
                value={selectedType || ''}
                onChange={(value) => onTypeChange(value || '')}
                data={[
                  ...FINANCE_TYPES.map((type) => ({
                    value: type,
                    label: FINANCE_TYPE_LABELS[type]
                  }))
                ]}
                clearable
                size="sm"
              />

              <Select
                label="Categoría"
                placeholder="Todas las categorías"
                value={selectedCategory || ''}
                onChange={(value) => onCategoryChange(value || '')}
                data={[
                  ...FINANCE_CATEGORIES.map((category) => ({
                    value: category,
                    label: FINANCE_CATEGORY_LABELS[category]
                  }))
                ]}
                clearable
                size="sm"
              />

              <Select
                label="Estado"
                placeholder="Todos los estados"
                value={selectedStatus || ''}
                onChange={(value) => onStatusChange(value || '')}
                data={[
                  ...FINANCE_STATUSES.map((status) => ({
                    value: status,
                    label: FINANCE_STATUS_LABELS[status]
                  }))
                ]}
                clearable
                size="sm"
              />
            </div>

            {/* Fila 2: Método de pago y rango de fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-sm)' }}>
              <Select
                label="Método de pago"
                placeholder="Todos los métodos"
                value={selectedPaymentMethod || ''}
                onChange={(value) => onPaymentMethodChange(value || '')}
                data={[
                  ...PAYMENT_METHODS.map((method) => ({
                    value: method,
                    label: PAYMENT_METHOD_LABELS[method]
                  }))
                ]}
                clearable
                size="sm"
              />

              <TextInput
                type="date"
                label="Fecha desde"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onStartDateChange(date);
                }}
                leftSection={<IconCalendar size={16} />}
                size="sm"
              />

              <TextInput
                type="date"
                label="Fecha hasta"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onEndDateChange(date);
                }}
                leftSection={<IconCalendar size={16} />}
                size="sm"
              />
            </div>

            {/* Fila 3: Rango de montos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-sm)' }}>
              <TextInput
                type="number"
                label="Monto mínimo"
                placeholder="0.00"
                value={minAmount?.toString() || ''}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  onMinAmountChange(isNaN(num) ? undefined : num);
                }}
                leftSection={<IconCurrencyDollar size={16} />}
                size="sm"
              />

              <TextInput
                type="number"
                label="Monto máximo"
                placeholder="0.00"
                value={maxAmount?.toString() || ''}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  onMaxAmountChange(isNaN(num) ? undefined : num);
                }}
                leftSection={<IconCurrencyDollar size={16} />}
                size="sm"
              />
            </div>

            {/* Fila 4: Tags */}
            <Stack gap="sm">
              <Text size="sm" fw={500}>Etiquetas</Text>
              
              <Group gap="sm">
                <Autocomplete
                  placeholder="Agregar etiqueta..."
                  value={tagInput}
                  onChange={setTagInput}
                  onOptionSubmit={(value) => {
                    handleTagAdd(value);
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  leftSection={<IconTag size={16} />}
                  data={availableTags}
                  style={{ flex: 1 }}
                  size="sm"
                />
                
                <Button
                  size="sm"
                  variant="light"
                  style={{
                    border: '1px solid var(--mantine-color-gray-3)'
                  }}
                  onClick={() => handleTagAdd(tagInput.trim())}
                  disabled={!tagInput.trim() || selectedTags.includes(tagInput.trim())}
                >
                  Agregar
                </Button>
              </Group>

              {selectedTags.length > 0 && (
                <Group gap="xs" mt="xs">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      color="blue"
                      size="sm"
                      rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => handleTagRemove(tag)}><IconX size={10} /></ActionIcon>}
                      leftSection={<IconTag size={10} />}
                    >
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Stack>
        )}
    </Card>
  );
}