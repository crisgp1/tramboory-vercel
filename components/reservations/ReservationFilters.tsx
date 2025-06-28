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
  { key: 'all', label: 'Todos', color: 'default' as const },
  { key: 'pending', label: 'Pendientes', color: 'warning' as const },
  { key: 'confirmed', label: 'Confirmadas', color: 'success' as const },
  { key: 'cancelled', label: 'Canceladas', color: 'danger' as const },
  { key: 'completed', label: 'Completadas', color: 'primary' as const }
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
      {/* Main Search Bar */}
      <div className="relative">
        <Input
          placeholder="Buscar reservas..."
          value={searchTerm}
          onValueChange={onSearchChange}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          isClearable
          variant="bordered"
          size="lg"
          classNames={{
            base: "w-full",
            input: "text-sm",
            inputWrapper: "h-12 border-gray-200 hover:border-gray-300 focus-within:border-black transition-colors duration-200"
          }}
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={showAdvanced ? "solid" : "bordered"}
            size="sm"
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowAdvanced(!showAdvanced)}
            className={`
              ${showAdvanced
                ? 'bg-black text-white border-black'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
              } transition-all duration-200
            `}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-black rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Quick Status Filter */}
          <div className="flex items-center gap-2">
            {statusOptions.slice(1).map((status) => (
              <Button
                key={status.key}
                variant={filterStatus === status.key ? "solid" : "bordered"}
                size="sm"
                onPress={() => onStatusChange(filterStatus === status.key ? 'all' : status.key)}
                className={`
                  ${filterStatus === status.key
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } transition-all duration-200 text-xs
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
            className="text-gray-500 hover:text-gray-700"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Select */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Estado de la reserva
                  </label>
                  <Select
                    placeholder="Seleccionar estado"
                    selectedKeys={filterStatus ? [filterStatus] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      onStatusChange(selected || 'all');
                    }}
                    variant="bordered"
                    size="md"
                    classNames={{
                      trigger: "h-11 border-gray-200 hover:border-gray-300 focus-within:border-black transition-colors pr-10",
                      value: "text-sm text-gray-900",
                      listboxWrapper: "bg-white p-2 rounded-lg",
                      popoverContent: "bg-white border border-gray-200 shadow-lg",
                      selectorIcon: "right-3"
                    }}
                  >
                    {statusOptions.map((status) => (
                      <SelectItem key={status.key} textValue={status.label}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status.key === 'pending' ? 'bg-yellow-500' :
                            status.key === 'confirmed' ? 'bg-green-500' :
                            status.key === 'cancelled' ? 'bg-red-500' :
                            status.key === 'completed' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    Fecha desde
                  </label>
                  <DateInput
                    value={startDate}
                    onChange={onStartDateChange}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: "text-sm text-gray-900",
                      inputWrapper: "h-11 border-gray-200 hover:border-gray-300 focus-within:border-black transition-colors"
                    }}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    Fecha hasta
                  </label>
                  <DateInput
                    value={endDate}
                    onChange={onEndDateChange}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: "text-sm text-gray-900",
                      inputWrapper: "h-11 border-gray-200 hover:border-gray-300 focus-within:border-black transition-colors"
                    }}
                  />
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Chip
                        onClose={() => onSearchChange('')}
                        variant="flat"
                        size="sm"
                        className="bg-black text-white"
                      >
                        "{searchTerm}"
                      </Chip>
                    )}
                    
                    {filterStatus !== 'all' && (
                      <Chip
                        onClose={() => onStatusChange('all')}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800"
                      >
                        {statusOptions.find(s => s.key === filterStatus)?.label}
                      </Chip>
                    )}
                    
                    {startDate && (
                      <Chip
                        onClose={() => onStartDateChange(null)}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800"
                      >
                        Desde: {startDate.day}/{startDate.month}/{startDate.year}
                      </Chip>
                    )}
                    
                    {endDate && (
                      <Chip
                        onClose={() => onEndDateChange(null)}
                        variant="flat"
                        size="sm"
                        className="bg-gray-200 text-gray-800"
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