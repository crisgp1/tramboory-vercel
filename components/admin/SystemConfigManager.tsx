'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Spinner,
  Divider,
  Tabs,
  Tab
} from '@heroui/react';
import {
  Cog6ToothIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import TimeBlocksManager from './TimeBlocksManager';

interface SystemConfig {
  _id?: string;
  restDay: number;
  restDayFee: number;
  businessHours: {
    start: string;
    end: string;
  };
  advanceBookingDays: number;
  maxConcurrentEvents: number;
  defaultEventDuration: number;
  timeBlocks?: {
    name: string;
    days: number[];
    startTime: string;
    endTime: string;
    duration: number;
    halfHourBreak: boolean;
    maxEventsPerBlock: number;
  }[];
  restDays?: {
    day: number;
    name: string;
    fee: number;
    canBeReleased: boolean;
  }[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const daysOfWeek = [
  { key: 0, label: 'Domingo' },
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miércoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sábado' }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { key: `${hour}:00`, label: `${hour}:00` };
});

export default function SystemConfigManager() {
  const [config, setConfig] = useState<SystemConfig>({
    restDay: 1, // Lunes por defecto
    restDayFee: 500,
    businessHours: {
      start: '09:00',
      end: '18:00'
    },
    advanceBookingDays: 7,
    maxConcurrentEvents: 3,
    defaultEventDuration: 4,
    timeBlocks: [],
    restDays: [],
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-config');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Ensure all properties are properly structured with defaults
        const configData = {
          restDay: data.data.restDay ?? 1,
          restDayFee: data.data.restDayFee ?? 500,
          businessHours: {
            start: data.data.businessHours?.start || '09:00',
            end: data.data.businessHours?.end || '18:00'
          },
          advanceBookingDays: data.data.advanceBookingDays ?? 7,
          maxConcurrentEvents: data.data.maxConcurrentEvents ?? 3,
          defaultEventDuration: data.data.defaultEventDuration ?? 4,
          timeBlocks: data.data.timeBlocks || [],
          restDays: data.data.restDays || [],
          isActive: data.data.isActive ?? true,
          _id: data.data._id,
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt
        };
        setConfig(configData);
      } else {
        // Si no hay configuración, usar valores por defecto
        console.log('No system config found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
      toast.error('Error al cargar la configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent] || {},
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/system-config', {
        method: config._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Configuración guardada exitosamente');
        setConfig(data.data);
        setHasChanges(false);
      } else {
        toast.error(data.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving system config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-gray-500 mt-4">Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <>
      {/* Add the shimmer animation as a global style */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-effect {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Configuración del Sistema
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ajusta los parámetros generales del sistema
              </p>
            </div>
          </div>
          <Button
            onPress={handleSave}
            isLoading={saving}
            isDisabled={!hasChanges}
            className="bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 flex items-center gap-2"
            size="lg"
          >
            {!saving && <CheckCircleIcon className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* Tabs for different sections */}
        <Tabs 
          aria-label="Configuración"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-200",
            cursor: "w-full bg-gray-900",
            tab: "max-w-fit px-4 h-12",
            tabContent: "group-data-[selected=true]:text-gray-900"
          }}
          color="primary"
          variant="underlined"
        >
          <Tab key="general" title="Configuración General">
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Hours & Days */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Horarios y Días</h3>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Día de descanso</label>
                    <Select
                      placeholder="Selecciona el día de descanso"
                      selectedKeys={new Set([(config.restDay || 1).toString()])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleConfigChange('restDay', parseInt(selected));
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 min-h-[40px]",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg",
                        selectorIcon: "text-gray-400"
                      }}
                    >
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.key.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cargo por día de descanso</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={(config.restDayFee || 500).toString()}
                        onValueChange={(value) => handleConfigChange('restDayFee', parseFloat(value) || 0)}
                        variant="bordered"
                        placeholder="500.00"
                        classNames={{
                          input: "text-gray-900 pl-8",
                          inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Cargo adicional: {formatCurrency(config.restDayFee || 500)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Hora de inicio</label>
                      <Select
                        placeholder="Selecciona hora de inicio"
                        selectedKeys={new Set([config.businessHours?.start || '09:00'])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          handleConfigChange('businessHours.start', selected);
                        }}
                        variant="bordered"
                        classNames={{
                          trigger: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 min-h-[40px]",
                          value: "text-gray-900",
                          listboxWrapper: "bg-white",
                          popoverContent: "bg-white border border-gray-200 shadow-lg",
                          selectorIcon: "text-gray-400"
                        }}
                      >
                        {timeSlots.map((time) => (
                          <SelectItem key={time.key}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Hora de cierre</label>
                      <Select
                        placeholder="Selecciona hora de cierre"
                        selectedKeys={new Set([config.businessHours?.end || '18:00'])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          handleConfigChange('businessHours.end', selected);
                        }}
                        variant="bordered"
                        classNames={{
                          trigger: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900 min-h-[40px]",
                          value: "text-gray-900",
                          listboxWrapper: "bg-white",
                          popoverContent: "bg-white border border-gray-200 shadow-lg",
                          selectorIcon: "text-gray-400"
                        }}
                      >
                        {timeSlots.map((time) => (
                          <SelectItem key={time.key}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Booking Settings */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Configuración de Reservas</h3>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Días de anticipación mínima</label>
                    <Input
                      type="number"
                      min="1"
                      value={(config.advanceBookingDays || 7).toString()}
                      onValueChange={(value) => handleConfigChange('advanceBookingDays', parseInt(value) || 1)}
                      variant="bordered"
                      placeholder="7"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                    <p className="text-xs text-gray-500">Mínimo {config.advanceBookingDays || 7} días de anticipación</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Máximo de eventos simultáneos</label>
                    <Input
                      type="number"
                      min="1"
                      value={(config.maxConcurrentEvents || 3).toString()}
                      onValueChange={(value) => handleConfigChange('maxConcurrentEvents', parseInt(value) || 1)}
                      variant="bordered"
                      placeholder="3"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                    <p className="text-xs text-gray-500">Máximo {config.maxConcurrentEvents || 3} eventos al mismo tiempo</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Duración predeterminada del evento (horas)</label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={(config.defaultEventDuration || 4).toString()}
                      onValueChange={(value) => handleConfigChange('defaultEventDuration', parseInt(value) || 4)}
                      variant="bordered"
                      placeholder="4"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "border-gray-300 hover:border-gray-400 focus-within:border-gray-900"
                      }}
                    />
                    <p className="text-xs text-gray-500">Duración estándar: {config.defaultEventDuration || 4} horas</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Estado del sistema</label>
                    <div 
                      className={`relative p-5 rounded-lg border transition-all duration-300 cursor-pointer group overflow-hidden ${
                        config.isActive 
                          ? 'border-emerald-200 bg-white shadow-sm' 
                          : 'border-slate-300 bg-slate-50'
                      }`}
                      onClick={() => handleConfigChange('isActive', !config.isActive)}
                    >
                      {/* Efecto de borde iluminado progresivo */}
                      {config.isActive && (
                        <>
                          <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 opacity-60 animate-pulse"></div>
                          <div className="absolute inset-0 rounded-lg">
                            <div 
                              className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-transparent via-emerald-300 to-transparent bg-[length:200%_100%] shimmer-effect border-solid"
                              style={{
                                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.4) 50%, transparent 100%)',
                                backgroundSize: '200% 100%'
                              }}
                            >
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Indicador minimalista nórdico */}
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              config.isActive 
                                ? 'bg-emerald-500 shadow-sm' 
                                : 'bg-slate-400'
                            }`}></div>
                            {/* Sutil efecto de glow solo cuando está activo */}
                            {config.isActive && (
                              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 opacity-30 animate-ping"></div>
                            )}
                          </div>
                          
                          <div>
                            <span className={`text-base font-medium transition-colors duration-300 ${
                              config.isActive ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {config.isActive ? 'Sistema Activo' : 'Sistema Inactivo'}
                            </span>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {config.isActive ? 'Permite nuevas reservas' : 'No permite nuevas reservas'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Toggle minimalista nórdico */}
                        <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          config.isActive 
                            ? 'bg-emerald-500' 
                            : 'bg-slate-300'
                        }`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 transform ${
                            config.isActive ? 'translate-x-6' : 'translate-x-0.5'
                          }`}></div>
                        </div>
                      </div>
                      
                      {/* Efecto hover muy sutil */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-50/50"></div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
          
          <Tab key="blocks" title="Bloques de Horarios">
            <div className="mt-6">
              <TimeBlocksManager
                timeBlocks={config.timeBlocks || []}
                restDays={config.restDays || []}
                onUpdateTimeBlocks={(blocks) => {
                  handleConfigChange('timeBlocks', blocks);
                }}
                onUpdateRestDays={(days) => {
                  handleConfigChange('restDays', days);
                }}
              />
            </div>
          </Tab>
        </Tabs>

        {/* Summary Card */}
        <Card className="border border-gray-200 shadow-sm bg-gray-50">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">Resumen de Configuración</h3>
          </CardHeader>
          <Divider />
          <CardBody className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-orange-600 mb-1">
                  {daysOfWeek.find(d => d.key === (config.restDay || 1))?.label}
                </div>
                <div className="text-sm text-gray-600">Día de descanso</div>
                <div className="text-xs text-gray-500 mt-1">
                  +{formatCurrency(config.restDayFee || 500)}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-blue-600 mb-1">
                  {config.businessHours?.start || '09:00'} - {config.businessHours?.end || '18:00'}
                </div>
                <div className="text-sm text-gray-600">Horario de atención</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-green-600 mb-1">
                  {config.advanceBookingDays || 7}
                </div>
                <div className="text-sm text-gray-600">Días de anticipación</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-purple-600 mb-1">
                  {config.maxConcurrentEvents || 3}
                </div>
                <div className="text-sm text-gray-600">Eventos simultáneos</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Changes Indicator */}
        {hasChanges && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-orange-800 font-medium">
                    Tienes cambios sin guardar
                  </span>
                </div>
                <Button
                  variant="flat"
                  size="sm"
                  onPress={handleSave}
                  isLoading={saving}
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  Guardar ahora
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}