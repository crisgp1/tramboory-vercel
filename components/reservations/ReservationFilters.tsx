'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Input,
  Select,
  SelectItem,
  Button,
  DateInput,
  Chip
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { CalendarDate } from '@internationalized/date';

interface ReservationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  startDate?: CalendarDate;
  onStartDateChange: (date: CalendarDate | null) => void;
  endDate?: CalendarDate;
  onEndDateChange: (date: CalendarDate | null) => void;
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
    <div className="w-full space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <Input
          placeholder="Buscar por cliente, email o niño..."
          value={searchTerm}
          onValueChange={onSearchChange}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          isClearable
          variant="bordered"
          size="md"
          classNames={{
            base: "w-full",
            input: "text-sm",
            inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 transition-colors"
          }}
        />
      </div>

      {/* Controles de filtro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="light"
            size="sm"
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowAdvanced(!showAdvanced)}
            className={`
              text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm
              ${showAdvanced ? 'bg-gray-100 text-gray-900' : ''}
            `}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-900 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Filtros rápidos de estado */}
          <div className="hidden sm:flex items-center gap-1">
            {statusOptions.slice(1).map((status) => (
              <Button
                key={status.key}
                variant="light"
                size="sm"
                onPress={() => onStatusChange(filterStatus === status.key ? 'all' : status.key)}
                className={`
                  text-xs px-3 py-1 transition-colors
                  ${filterStatus === status.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="light"
            size="sm"
            startContent={<XMarkIcon className="w-4 h-4" />}
            onPress={onClearFilters}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selector de estado */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Estado
                  </label>
                  <Select
                    placeholder="Todos los estados"
                    selectedKeys={filterStatus ? [filterStatus] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      onStatusChange(selected || 'all');
                    }}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      trigger: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 transition-colors",
                      value: "text-sm text-gray-900",
                      listboxWrapper: "bg-white",
                      popoverContent: "bg-white border border-gray-200 shadow-sm"
                    }}
                  >
                    {statusOptions.map((status) => (
                      <SelectItem key={status.key} textValue={status.label}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status.key === 'pending' ? 'bg-orange-500' :
                            status.key === 'confirmed' ? 'bg-green-500' :
                            status.key === 'cancelled' ? 'bg-red-500' :
                            status.key === 'completed' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm">{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Fecha desde */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <CalendarDaysIcon className="w-3 h-3 text-gray-500" />
                    Desde
                  </label>
                  <DateInput
                    value={startDate}
                    onChange={onStartDateChange}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      input: "text-sm text-gray-900",
                      inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 transition-colors"
                    }}
                  />
                </div>

                {/* Fecha hasta */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <CalendarDaysIcon className="w-3 h-3 text-gray-500" />
                    Hasta
                  </label>
                  <DateInput
                    value={endDate}
                    onChange={onEndDateChange}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      input: "text-sm text-gray-900",
                      inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-900 transition-colors"
                    }}
                  />
                </div>
              </div>

              {/* Filtros activos */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Chip
                        onClose={() => onSearchChange('')}
                        variant="flat"
                        size="sm"
                        className="bg-gray-900 text-white text-xs"
                      >
                        "{searchTerm}"
                      </Chip>
                    )}
                    
                    {filterStatus !== 'all' && (
                      <Chip
                        onClose={() => onStatusChange('all')}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800 text-xs"
                      >
                        {statusOptions.find(s => s.key === filterStatus)?.label}
                      </Chip>
                    )}
                    
                    {startDate && (
                      <Chip
                        onClose={() => onStartDateChange(null)}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800 text-xs"
                      >
                        Desde: {startDate.day}/{startDate.month}/{startDate.year}
                      </Chip>
                    )}
                    
                    {endDate && (
                      <Chip
                        onClose={() => onEndDateChange(null)}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800 text-xs"
                      >
                        Hasta: {endDate.day}/{endDate.month}/{endDate.year}
                      </Chip>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}