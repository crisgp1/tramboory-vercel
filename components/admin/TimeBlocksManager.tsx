'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Checkbox,
  CheckboxGroup
} from '@heroui/react';
import {
  ClockIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface TimeBlock {
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  duration: number;
  halfHourBreak: boolean;
  maxEventsPerBlock: number;
}

interface RestDay {
  day: number;
  name: string;
  fee: number;
  canBeReleased: boolean;
}

interface Props {
  timeBlocks: TimeBlock[];
  restDays: RestDay[];
  onUpdateTimeBlocks: (blocks: TimeBlock[]) => void;
  onUpdateRestDays: (days: RestDay[]) => void;
}

const daysOfWeek = [
  { key: 0, label: 'Domingo', shortLabel: 'Dom' },
  { key: 1, label: 'Lunes', shortLabel: 'Lun' },
  { key: 2, label: 'Martes', shortLabel: 'Mar' },
  { key: 3, label: 'Miércoles', shortLabel: 'Mié' },
  { key: 4, label: 'Jueves', shortLabel: 'Jue' },
  { key: 5, label: 'Viernes', shortLabel: 'Vie' },
  { key: 6, label: 'Sábado', shortLabel: 'Sáb' }
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  return { key: time, label: time };
});

const durationOptions = [
  { key: '0.5', label: '30 minutos' },
  { key: '1', label: '1 hora' },
  { key: '1.5', label: '1 hora 30 minutos' },
  { key: '2', label: '2 horas' },
  { key: '2.5', label: '2 horas 30 minutos' },
  { key: '3', label: '3 horas' },
  { key: '3.5', label: '3 horas 30 minutos' },
  { key: '4', label: '4 horas' },
  { key: '4.5', label: '4 horas 30 minutos' },
  { key: '5', label: '5 horas' }
];

export default function TimeBlocksManager({ 
  timeBlocks = [], 
  restDays = [],
  onUpdateTimeBlocks,
  onUpdateRestDays 
}: Props) {
  const { isOpen: isBlockOpen, onOpen: onBlockOpen, onClose: onBlockClose } = useDisclosure();
  const { isOpen: isRestDayOpen, onOpen: onRestDayOpen, onClose: onRestDayClose } = useDisclosure();
  
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingRestDay, setEditingRestDay] = useState<RestDay | null>(null);
  const [editingRestDayIndex, setEditingRestDayIndex] = useState<number | null>(null);
  
  const [blockForm, setBlockForm] = useState<TimeBlock>({
    name: '',
    days: [],
    startTime: '14:00',
    endTime: '19:00',
    duration: 3.5,
    halfHourBreak: true,
    maxEventsPerBlock: 1
  });
  
  const [timeCalculationMode, setTimeCalculationMode] = useState<'start' | 'end'>('start'); // Calculate end time from start time
  
  const [restDayForm, setRestDayForm] = useState<RestDay>({
    day: 2,
    name: 'Martes',
    fee: 1500,
    canBeReleased: true
  });

  const handleEditBlock = (block: TimeBlock, index: number) => {
    setEditingBlock(block);
    setEditingBlockIndex(index);
    setBlockForm(block);
    onBlockOpen();
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = timeBlocks.filter((_, i) => i !== index);
    onUpdateTimeBlocks(newBlocks);
    toast.success('Bloque de horario eliminado');
  };

  const handleSaveBlock = () => {
    if (!blockForm.name || blockForm.days.length === 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Validate the time block configuration
    const validation = validateTimeBlock(blockForm);
    if (!validation.valid) {
      toast.error(validation.error || 'Error de validación');
      return;
    }

    let newBlocks = [...timeBlocks];
    
    if (editingBlockIndex !== null) {
      newBlocks[editingBlockIndex] = blockForm;
      toast.success('Bloque de horario actualizado');
    } else {
      newBlocks.push(blockForm);
      toast.success('Bloque de horario creado');
    }
    
    onUpdateTimeBlocks(newBlocks);
    onBlockClose();
    resetBlockForm();
  };

  const handleEditRestDay = (day: RestDay, index: number) => {
    setEditingRestDay(day);
    setEditingRestDayIndex(index);
    setRestDayForm(day);
    onRestDayOpen();
  };

  const handleDeleteRestDay = (index: number) => {
    const newDays = restDays.filter((_, i) => i !== index);
    onUpdateRestDays(newDays);
    toast.success('Día de descanso eliminado');
  };

  const handleSaveRestDay = () => {
    let newDays = [...restDays];
    
    // Check if day already exists
    const existingIndex = newDays.findIndex(d => d.day === restDayForm.day);
    
    if (editingRestDayIndex !== null) {
      newDays[editingRestDayIndex] = restDayForm;
      toast.success('Día de descanso actualizado');
    } else if (existingIndex !== -1) {
      toast.error('Este día ya está configurado como día de descanso');
      return;
    } else {
      newDays.push(restDayForm);
      toast.success('Día de descanso agregado');
    }
    
    onUpdateRestDays(newDays);
    onRestDayClose();
    resetRestDayForm();
  };

  const resetBlockForm = () => {
    setBlockForm({
      name: '',
      days: [],
      startTime: '14:00',
      endTime: '19:00',
      duration: 3.5,
      halfHourBreak: true,
      maxEventsPerBlock: 1
    });
    setEditingBlock(null);
    setEditingBlockIndex(null);
  };

  const resetRestDayForm = () => {
    setRestDayForm({
      day: 2,
      name: 'Martes',
      fee: 1500,
      canBeReleased: true
    });
    setEditingRestDay(null);
    setEditingRestDayIndex(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Helper functions for time calculations
  const timeToMinutes = (time: string): number => {
    const [hour, min] = time.split(':').map(Number);
    return hour * 60 + min;
  };

  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const calculateEndTime = (startTime: string, durationHours: number, halfHourBreak: boolean): string => {
    const startMinutes = timeToMinutes(startTime);
    const durationMinutes = durationHours * 60;
    const breakMinutes = halfHourBreak ? 30 : 0;
    const endMinutes = startMinutes + durationMinutes + breakMinutes;
    
    // Don't allow time to exceed 24:00 (1440 minutes)
    if (endMinutes >= 1440) {
      return '23:59';
    }
    
    return minutesToTime(endMinutes);
  };

  const calculateStartTime = (endTime: string, durationHours: number, halfHourBreak: boolean): string => {
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = durationHours * 60;
    const breakMinutes = halfHourBreak ? 30 : 0;
    const startMinutes = endMinutes - durationMinutes - breakMinutes;
    
    // Don't allow time to be negative
    if (startMinutes < 0) {
      return '00:00';
    }
    
    return minutesToTime(startMinutes);
  };

  const validateTimeBlock = (block: TimeBlock): { valid: boolean; error?: string } => {
    const startMinutes = timeToMinutes(block.startTime);
    const endMinutes = timeToMinutes(block.endTime);
    const durationMinutes = block.duration * 60;
    const breakMinutes = block.halfHourBreak ? 30 : 0;
    const requiredMinutes = durationMinutes + breakMinutes;
    const availableMinutes = endMinutes - startMinutes;

    if (startMinutes >= endMinutes) {
      return { valid: false, error: 'La hora de inicio debe ser anterior a la hora de fin' };
    }

    if (availableMinutes < requiredMinutes) {
      return { 
        valid: false, 
        error: `El tiempo disponible (${Math.floor(availableMinutes/60)}:${(availableMinutes%60).toString().padStart(2,'0')}) es menor al requerido (${Math.floor(requiredMinutes/60)}:${(requiredMinutes%60).toString().padStart(2,'0')})`
      };
    }

    // Check for overlaps with other blocks
    for (let i = 0; i < timeBlocks.length; i++) {
      if (editingBlockIndex !== null && i === editingBlockIndex) continue;
      
      const otherBlock = timeBlocks[i];
      const hasCommonDay = block.days.some(day => otherBlock.days.includes(day));
      
      if (hasCommonDay) {
        const otherStartMinutes = timeToMinutes(otherBlock.startTime);
        const otherEndMinutes = timeToMinutes(otherBlock.endTime);
        
        // Check if times overlap
        if ((startMinutes < otherEndMinutes && endMinutes > otherStartMinutes)) {
          return {
            valid: false,
            error: `Este horario se superpone con el bloque "${otherBlock.name}" en días compartidos`
          };
        }
      }
    }

    return { valid: true };
  };

  const handleInitializeDefaultConfig = async () => {
    try {
      const response = await fetch('/api/admin/init-system-config', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Use the data returned from the API
        const configData = data.data;
        onUpdateTimeBlocks(configData.timeBlocks || []);
        onUpdateRestDays(configData.restDays || []);
        
        toast.success('Configuración por defecto inicializada exitosamente');
        
        // Force a page reload to refresh the system config
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || 'Error al inicializar la configuración');
      }
    } catch (error) {
      console.error('Error initializing default config:', error);
      toast.error('Error al inicializar la configuración');
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Blocks Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Bloques de Horarios</h3>
            </div>
            <Button
              onPress={() => {
                resetBlockForm();
                onBlockOpen();
              }}
              size="sm"
              className="btn-primary"
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Agregar Bloque
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          {timeBlocks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay bloques de horarios configurados</p>
              <p className="text-sm mt-1">Agrega bloques para definir horarios de reserva</p>
              <Button
                onPress={handleInitializeDefaultConfig}
                className="mt-4 btn-primary"
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                Inicializar Configuración Por Defecto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {timeBlocks.map((block, index) => (
                <div key={index} className="surface-card p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{block.name}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-neutral-600">
                          Horario: {block.startTime} - {block.endTime}
                        </p>
                        <p className="text-neutral-600">
                          Duración: {block.duration} horas {block.halfHourBreak ? '+ 30 min descanso' : ''}
                        </p>
                        <p className="text-neutral-600">
                          Capacidad: {block.maxEventsPerBlock} {block.maxEventsPerBlock === 1 ? 'evento' : 'eventos'} por bloque
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {block.days.map(day => (
                            <Chip
                              key={day}
                              size="sm"
                              variant="flat"
                              className="bg-gray-100 text-gray-700"
                            >
                              {daysOfWeek.find(d => d.key === day)?.shortLabel}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditBlock(block, index)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteBlock(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Rest Days Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Días de Descanso</h3>
            </div>
            <Button
              onPress={() => {
                resetRestDayForm();
                onRestDayOpen();
              }}
              size="sm"
              className="btn-primary"
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Agregar Día
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          {restDays.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No hay días de descanso configurados</p>
              <p className="text-sm mt-1">Agrega días donde normalmente no trabajas</p>
              <Button
                onPress={handleInitializeDefaultConfig}
                className="mt-4 btn-primary"
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                Inicializar Configuración Por Defecto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {restDays.map((day, index) => (
                <div key={index} className="surface-card p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{day.name}</h4>
                      <p className="text-sm text-neutral-600 mt-1">
                        Cargo adicional: {formatCurrency(day.fee)}
                      </p>
                      <Chip
                        size="sm"
                        variant="flat"
                        className={day.canBeReleased ? 'bg-green-100 text-green-700 mt-2' : 'bg-red-100 text-red-700 mt-2'}
                      >
                        {day.canBeReleased ? 'Se puede liberar' : 'No se puede liberar'}
                      </Chip>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditRestDay(day, index)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteRestDay(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Time Block Modal */}
      <Modal 
        isOpen={isBlockOpen} 
        onClose={onBlockClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          body: "py-6 max-h-[80vh] overflow-y-auto",
          backdrop: "surface-overlay",
          base: "surface-modal max-h-[90vh]",
          header: "border-b border-gray-200 flex-shrink-0",
          footer: "border-t border-gray-200 flex-shrink-0",
          closeButton: "hover:bg-gray-100 active:bg-gray-200"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingBlock ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nombre del bloque <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ej: Miércoles a Lunes - Tarde"
                      value={blockForm.name}
                      onValueChange={(value) => setBlockForm({ ...blockForm, name: value })}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "min-h-[48px]"
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-600" />
                      <label className="text-sm font-medium text-gray-700">Días de la semana</label>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        {daysOfWeek.map((day) => {
                          const isSelected = blockForm.days.includes(day.key);
                          return (
                            <div
                              key={day.key}
                              className={`
                                relative cursor-pointer rounded-lg border-2 transition-all duration-200 p-3 text-center
                                ${isSelected 
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }
                              `}
                              onClick={() => {
                                const newDays = isSelected 
                                  ? blockForm.days.filter(d => d !== day.key)
                                  : [...blockForm.days, day.key];
                                setBlockForm({ ...blockForm, days: newDays });
                              }}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <span className={`
                                  text-xs font-medium uppercase tracking-wide
                                  ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                                `}>
                                  {day.shortLabel}
                                </span>
                                <span className={`
                                  text-xs
                                  ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                                `}>
                                  {day.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <span>💡</span>
                        <span>Selecciona los días en los que este bloque de horario estará activo</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Configuración de Horario
                      </label>
                      
                      <div className="flex gap-2 mb-4">
                        <Button
                          size="sm"
                          color={timeCalculationMode === 'start' ? 'primary' : 'default'}
                          variant={timeCalculationMode === 'start' ? 'solid' : 'bordered'}
                          onPress={() => setTimeCalculationMode('start')}
                          className="flex-1"
                        >
                          📅 Definir inicio
                        </Button>
                        <Button
                          size="sm"
                          color={timeCalculationMode === 'end' ? 'primary' : 'default'}
                          variant={timeCalculationMode === 'end' ? 'solid' : 'bordered'}
                          onPress={() => setTimeCalculationMode('end')}
                          className="flex-1"
                        >
                          🏁 Definir fin
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timeCalculationMode === 'start' ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hora de inicio</label>
                            <Select
                              placeholder="Selecciona hora"
                              selectedKeys={new Set([blockForm.startTime])}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                const calculatedEndTime = calculateEndTime(selected, blockForm.duration, blockForm.halfHourBreak);
                                setBlockForm({ 
                                  ...blockForm, 
                                  startTime: selected,
                                  endTime: calculatedEndTime
                                });
                              }}
                              variant="bordered"
                              classNames={{
                                trigger: "min-h-[48px]"
                              }}
                            >
                              {timeOptions.map((time) => (
                                <SelectItem key={time.key}>{time.label}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          
                          <div className="relative space-y-2">
                            <label className="text-sm font-medium text-blue-600">Hora de fin</label>
                            <Input
                              value={blockForm.endTime}
                              variant="bordered"
                              isReadOnly
                              startContent={<span className="text-sm">🕐</span>}
                              classNames={{
                                input: "bg-blue-50 text-blue-700 font-medium",
                                inputWrapper: "min-h-[48px]"
                              }}
                            />
                            <div className="absolute top-0 right-0">
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                Calculada
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative space-y-2">
                            <label className="text-sm font-medium text-blue-600">Hora de inicio</label>
                            <Input
                              value={blockForm.startTime}
                              variant="bordered"
                              isReadOnly
                              startContent={<span className="text-sm">🕐</span>}
                              classNames={{
                                input: "bg-blue-50 text-blue-700 font-medium",
                                inputWrapper: "min-h-[48px]"
                              }}
                            />
                            <div className="absolute top-0 right-0">
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                Calculada
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hora de fin</label>
                            <Select
                              placeholder="Selecciona hora"
                              selectedKeys={new Set([blockForm.endTime])}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                const calculatedStartTime = calculateStartTime(selected, blockForm.duration, blockForm.halfHourBreak);
                                setBlockForm({ 
                                  ...blockForm, 
                                  endTime: selected,
                                  startTime: calculatedStartTime
                                });
                              }}
                              variant="bordered"
                              startContent={<span className="text-sm">🕐</span>}
                              classNames={{
                                trigger: "min-h-[48px]"
                              }}
                            >
                              {timeOptions.map((time) => (
                                <SelectItem key={time.key}>{time.label}</SelectItem>
                              ))}
                            </Select>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duración del evento</label>
                      <Select
                        placeholder="Selecciona duración"
                        selectedKeys={new Set([blockForm.duration.toString()])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          const newDuration = parseFloat(selected);
                          
                          let newForm = { ...blockForm, duration: newDuration };
                          
                          // Recalculate based on mode
                          if (timeCalculationMode === 'start') {
                            newForm.endTime = calculateEndTime(blockForm.startTime, newDuration, blockForm.halfHourBreak);
                          } else {
                            newForm.startTime = calculateStartTime(blockForm.endTime, newDuration, blockForm.halfHourBreak);
                          }
                          
                          setBlockForm(newForm);
                        }}
                        variant="bordered"
                        startContent={<span className="text-sm">⏱️</span>}
                        classNames={{
                          trigger: "min-h-[48px]"
                        }}
                      >
                        {durationOptions.map((duration) => (
                          <SelectItem key={duration.key}>{duration.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Máximo de eventos por bloque</label>
                      <Input
                        type="number"
                        placeholder="Ej: 1"
                        min="1"
                        value={blockForm.maxEventsPerBlock.toString()}
                        onValueChange={(value) => setBlockForm({ 
                          ...blockForm, 
                          maxEventsPerBlock: parseInt(value) || 1 
                        })}
                        variant="bordered"
                        startContent={<span className="text-sm">👥</span>}
                        classNames={{
                          inputWrapper: "min-h-[48px]"
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👋</span>
                        <div>
                          <span className="text-sm font-medium text-amber-800">Media hora de despedida</span>
                          <p className="text-xs text-amber-600">Tiempo extra para que los niños se despidan</p>
                        </div>
                      </div>
                      <Switch
                        isSelected={blockForm.halfHourBreak}
                        onValueChange={(value) => {
                          let newForm = { ...blockForm, halfHourBreak: value };
                          
                          // Recalculate based on mode
                          if (timeCalculationMode === 'start') {
                            newForm.endTime = calculateEndTime(blockForm.startTime, blockForm.duration, value);
                          } else {
                            newForm.startTime = calculateStartTime(blockForm.endTime, blockForm.duration, value);
                          }
                          
                          setBlockForm(newForm);
                        }}
                        color="warning"
                      />
                    </div>
                  </div>
                  
                  {/* Validation display */}
                  {(() => {
                    const validation = validateTimeBlock(blockForm);
                    if (!validation.valid) {
                      return (
                        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <span className="text-xl">⚠️</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-red-800 mb-1">
                                Configuración inválida
                              </h4>
                              <p className="text-sm text-red-700">{validation.error}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Show success info
                    const startMinutes = timeToMinutes(blockForm.startTime);
                    const endMinutes = timeToMinutes(blockForm.endTime);
                    const totalMinutes = endMinutes - startMinutes;
                    const requiredMinutes = (blockForm.duration * 60) + (blockForm.halfHourBreak ? 30 : 0);
                    const remainingMinutes = totalMinutes - requiredMinutes;
                    
                    return (
                      <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className="text-xl">✅</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-800 mb-2">
                              Configuración válida
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div className="bg-white p-2 rounded border border-green-200">
                                <div className="text-green-600 font-medium">Tiempo total</div>
                                <div className="text-green-700 text-sm font-semibold">
                                  {Math.floor(totalMinutes/60)}:{(totalMinutes%60).toString().padStart(2,'0')}h
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded border border-green-200">
                                <div className="text-green-600 font-medium">Requerido</div>
                                <div className="text-green-700 text-sm font-semibold">
                                  {Math.floor(requiredMinutes/60)}:{(requiredMinutes%60).toString().padStart(2,'0')}h
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded border border-green-200">
                                <div className="text-green-600 font-medium">Margen</div>
                                <div className="text-green-700 text-sm font-semibold">
                                  {Math.floor(remainingMinutes/60)}:{(remainingMinutes%60).toString().padStart(2,'0')}h
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  className="btn-primary"
                  onPress={handleSaveBlock}
                >
                  {editingBlock ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Rest Day Modal */}
      <Modal 
        isOpen={isRestDayOpen} 
        onClose={onRestDayClose}
        size="lg"
        classNames={{
          body: "py-6",
          backdrop: "surface-overlay",
          base: "surface-modal",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
          closeButton: "hover:bg-gray-100 active:bg-gray-200"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingRestDay ? 'Editar Día de Descanso' : 'Nuevo Día de Descanso'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Día de la semana"
                    selectedKeys={new Set([restDayForm.day.toString()])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      const dayNum = parseInt(selected);
                      const dayName = daysOfWeek.find(d => d.key === dayNum)?.label || '';
                      setRestDayForm({ 
                        ...restDayForm, 
                        day: dayNum,
                        name: dayName
                      });
                    }}
                    variant="bordered"
                  >
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.key.toString()}>{day.label}</SelectItem>
                    ))}
                  </Select>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo adicional</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        type="number"
                        step="100"
                        value={restDayForm.fee.toString()}
                        onValueChange={(value) => setRestDayForm({ 
                          ...restDayForm, 
                          fee: parseFloat(value) || 0 
                        })}
                        variant="bordered"
                        placeholder="1500.00"
                        classNames={{
                          input: "pl-8"
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Cargo adicional: {formatCurrency(restDayForm.fee)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Se puede liberar con costo adicional</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Permite reservar este día pagando el cargo extra
                      </p>
                    </div>
                    <Switch
                      isSelected={restDayForm.canBeReleased}
                      onValueChange={(value) => setRestDayForm({ 
                        ...restDayForm, 
                        canBeReleased: value 
                      })}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  className="btn-primary"
                  onPress={handleSaveRestDay}
                >
                  {editingRestDay ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}