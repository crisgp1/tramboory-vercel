'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  DateInput,
  Chip,
  Badge
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  ClockIcon
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
  { key: 'all', label: 'Todos los estados', color: 'default' as const },
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const activeFiltersCount = [
    searchTerm,
    filterStatus !== 'all' ? filterStatus : null,
    startDate,
    endDate
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
        <CardBody className="p-0">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 border-b border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FunnelIcon className="w-6 h-6 text-white" />
                  </div>
                  {activeFiltersCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge content={activeFiltersCount} color="danger" size="sm">
                        <span></span>
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Filtros de Búsqueda</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Encuentra reservas específicas rápidamente
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {activeFiltersCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Button
                        variant="flat"
                        color="danger"
                        size="sm"
                        startContent={<XMarkIcon className="w-4 h-4" />}
                        onPress={onClearFilters}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-0"
                      >
                        Limpiar ({activeFiltersCount})
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                    onPress={() => setIsExpanded(!isExpanded)}
                    className={`${
                      isExpanded 
                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } border-0 transition-all duration-200`}
                  >
                    {isExpanded ? 'Menos filtros' : 'Más filtros'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Search Section - Always Visible */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6"
          >
            <motion.div
              animate={{ 
                scale: isSearchFocused ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Input
                placeholder="Buscar por cliente, niño/a, email o teléfono..."
                value={searchTerm}
                onValueChange={onSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                startContent={
                  <motion.div
                    animate={{ 
                      scale: isSearchFocused ? 1.1 : 1,
                      color: isSearchFocused ? '#3B82F6' : '#9CA3AF'
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </motion.div>
                }
                isClearable
                variant="flat"
                size="lg"
                classNames={{
                  base: "w-full",
                  mainWrapper: "h-full",
                  input: "text-gray-900 text-base",
                  inputWrapper: `
                    h-14 bg-gray-50 border-2 border-transparent hover:border-gray-200 
                    focus-within:border-blue-500 focus-within:bg-white transition-all duration-200
                    ${isSearchFocused ? 'shadow-lg shadow-blue-500/10' : 'shadow-sm'}
                  `
                }}
              />
              
              {/* Search suggestions */}
              <AnimatePresence>
                {isSearchFocused && searchTerm.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                  >
                    <div className="p-3 text-sm text-gray-500 border-b border-gray-100">
                      Presiona Enter para buscar
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Advanced Filters - Collapsible */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Status Filter */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Estado de la reserva
                      </label>
                      <Select
                        placeholder="Seleccionar estado"
                        selectedKeys={filterStatus ? [filterStatus] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          onStatusChange(selected || 'all');
                        }}
                        variant="flat"
                        size="lg"
                        classNames={{
                          trigger: "h-12 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200",
                          value: "text-gray-900"
                        }}
                        renderValue={(items) => {
                          const item = items[0];
                          if (!item) return "Seleccionar estado";
                          
                          const status = statusOptions.find(s => s.key === item.key);
                          return (
                            <div className="flex items-center gap-2">
                              <Chip
                                color={status?.color}
                                size="sm"
                                variant="flat"
                                className="text-xs"
                              >
                                {status?.label}
                              </Chip>
                            </div>
                          );
                        }}
                      >
                        {statusOptions.map((status) => (
                          <SelectItem key={status.key} textValue={status.label}>
                            <div className="flex items-center gap-2">
                              <Chip
                                color={status.color}
                                size="sm"
                                variant="flat"
                                className="text-xs"
                              >
                                {status.label}
                              </Chip>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </motion.div>

                    {/* Start Date */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-green-500" />
                        Fecha desde
                      </label>
                      <DateInput
                        value={startDate}
                        onChange={onStartDateChange}
                        placeholderValue={new CalendarDate(2024, 1, 1)}
                        variant="flat"
                        size="lg"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "h-12 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus-within:border-green-500 focus-within:bg-white transition-all duration-200"
                        }}
                      />
                    </motion.div>

                    {/* End Date */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        Fecha hasta
                      </label>
                      <DateInput
                        value={endDate}
                        onChange={onEndDateChange}
                        placeholderValue={new CalendarDate(2024, 12, 31)}
                        variant="flat"
                        size="lg"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "h-12 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus-within:border-orange-500 focus-within:bg-white transition-all duration-200"
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Active Filters Display */}
                  <AnimatePresence>
                    {activeFiltersCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 border-t border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {searchTerm && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Chip
                                onClose={() => onSearchChange('')}
                                variant="flat"
                                color="primary"
                                size="sm"
                              >
                                Búsqueda: "{searchTerm}"
                              </Chip>
                            </motion.div>
                          )}
                          
                          {filterStatus !== 'all' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Chip
                                onClose={() => onStatusChange('all')}
                                variant="flat"
                                color="secondary"
                                size="sm"
                              >
                                Estado: {statusOptions.find(s => s.key === filterStatus)?.label}
                              </Chip>
                            </motion.div>
                          )}
                          
                          {startDate && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Chip
                                onClose={() => onStartDateChange(null)}
                                variant="flat"
                                color="success"
                                size="sm"
                              >
                                Desde: {startDate.day}/{startDate.month}/{startDate.year}
                              </Chip>
                            </motion.div>
                          )}
                          
                          {endDate && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Chip
                                onClose={() => onEndDateChange(null)}
                                variant="flat"
                                color="warning"
                                size="sm"
                              >
                                Hasta: {endDate.day}/{endDate.month}/{endDate.year}
                              </Chip>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </motion.div>
  );
}