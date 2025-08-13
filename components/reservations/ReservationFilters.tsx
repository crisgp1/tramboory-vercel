'use client';

import React, { useState } from 'react';
import {
  TextInput,
  Select,
  Button,
  Card,
  Badge,
  Group,
  Stack,
  Text,
  Collapse,
  ActionIcon
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconCalendar
} from '@tabler/icons-react';

interface ReservationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  startDate?: Date;
  onStartDateChange: (date: Date | null) => void;
  endDate?: Date;
  onEndDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'cancelled', label: 'Canceladas' },
  { key: 'completed', label: 'Completadas' }
];

export default function ReservationFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters
}: ReservationFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    searchTerm,
    filterStatus !== 'all' ? filterStatus : null,
    startDate,
    endDate
  ].filter(Boolean).length;

  return (
    <Card withBorder p="md" shadow="none" style={{ backgroundColor: 'white' }}>
      <Stack gap="md">
        {/* Barra de búsqueda principal */}
        <TextInput
          placeholder="Buscar por cliente, email o niño..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftSection={<IconSearch size={16} />}
          size="sm"
        />

        {/* Controles de filtro */}
        <Group justify="space-between" w="100%">
          <Group gap="sm">
            <Button
              variant="light"
              size="sm"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                backgroundColor: showAdvanced ? 'var(--mantine-color-gray-1)' : 'white',
                border: '1px solid var(--mantine-color-gray-3)'
              }}
            >
              Filtros
              {activeFiltersCount > 0 && (
                <Badge size="xs" color="blue" style={{ marginLeft: '4px' }}>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Filtros rápidos de estado */}
            <Group gap="xs" visibleFrom="sm">
              {statusOptions.slice(1).map((status) => (
                <Button
                  key={status.key}
                  variant={filterStatus === status.key ? "filled" : "light"}
                  size="xs"
                  onClick={() => onStatusChange(filterStatus === status.key ? 'all' : status.key)}
                  color={filterStatus === status.key ? "blue" : "gray"}
                >
                  {status.label}
                </Button>
              ))}
            </Group>
          </Group>

          {activeFiltersCount > 0 && (
            <Button
              variant="light"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={onClearFilters}
              c="red"
              style={{
                border: '1px solid var(--mantine-color-gray-3)'
              }}
            >
              Limpiar
            </Button>
          )}
        </Group>

        {/* Filtros avanzados */}
        <Collapse in={showAdvanced}>
          <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
              {/* Selector de estado */}
              <Stack gap="xs">
                <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                  Estado
                </Text>
                <Select
                  placeholder="Todos los estados"
                  value={filterStatus || 'all'}
                  onChange={(value) => onStatusChange(value || 'all')}
                  size="sm"
                  data={statusOptions.map((status) => ({
                    value: status.key,
                    label: status.label
                  }))}
                />
              </Stack>

              {/* Fecha desde */}
              <Stack gap="xs">
                <Group gap="xs">
                  <IconCalendar size={12} color="var(--mantine-color-gray-5)" />
                  <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                    Desde
                  </Text>
                </Group>
                <TextInput
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    onStartDateChange(date);
                  }}
                  size="sm"
                />
              </Stack>

              {/* Fecha hasta */}
              <Stack gap="xs">
                <Group gap="xs">
                  <IconCalendar size={12} color="var(--mantine-color-gray-5)" />
                  <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                    Hasta
                  </Text>
                </Group>
                <TextInput
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    onEndDateChange(date);
                  }}
                  size="sm"
                />
              </Stack>
            </div>

            {/* Filtros activos */}
            {activeFiltersCount > 0 && (
              <div style={{ marginTop: 'var(--mantine-spacing-md)', paddingTop: 'var(--mantine-spacing-md)', borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <Group gap="xs">
                  {searchTerm && (
                    <Badge
                      variant="filled"
                      size="sm"
                      color="blue"
                      rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => onSearchChange('')}><IconX size={10} /></ActionIcon>}
                    >
                      "{searchTerm}"
                    </Badge>
                  )}
                  
                  {filterStatus !== 'all' && (
                    <Badge
                      variant="light"
                      size="sm"
                      color="gray"
                      rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => onStatusChange('all')}><IconX size={10} /></ActionIcon>}
                    >
                      {statusOptions.find(s => s.key === filterStatus)?.label}
                    </Badge>
                  )}
                  
                  {startDate && (
                    <Badge
                      variant="light"
                      size="sm"
                      color="gray"
                      rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => onStartDateChange(null)}><IconX size={10} /></ActionIcon>}
                    >
                      Desde: {startDate.toLocaleDateString()}
                    </Badge>
                  )}
                  
                  {endDate && (
                    <Badge
                      variant="light"
                      size="sm"
                      color="gray"
                      rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => onEndDateChange(null)}><IconX size={10} /></ActionIcon>}
                    >
                      Hasta: {endDate.toLocaleDateString()}
                    </Badge>
                  )}
                </Group>
              </div>
            )}
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
}