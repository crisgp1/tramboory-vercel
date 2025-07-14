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

  const handleInitializeDefaultConfig = async () => {
    try {
      const response = await fetch('/api/admin/init-system-config', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Initialize default time blocks
        const defaultTimeBlocks = [
          {
            name: "Lunes a Viernes - Tarde",
            days: [1, 3, 4, 5], // Lunes, Miércoles, Jueves, Viernes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Fin de Semana - Tarde",
            days: [6, 0], // Sábado, Domingo
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Martes - Día de Descanso",
            days: [2], // Martes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          }
        ];
        
        const defaultRestDays = [
          {
            day: 2, // Martes
            name: "Martes",
            fee: 1500,
            canBeReleased: true
          }
        ];
        
        onUpdateTimeBlocks(defaultTimeBlocks);
        onUpdateRestDays(defaultRestDays);
        
        toast.success('Configuración por defecto inicializada exitosamente');
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
              className="bg-gray-900 text-white hover:bg-gray-800"
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Agregar Bloque
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          {timeBlocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay bloques de horarios configurados</p>
              <p className="text-sm mt-1">Agrega bloques para definir horarios de reserva</p>
              <Button
                onPress={handleInitializeDefaultConfig}
                className="mt-4 bg-blue-500 text-white hover:bg-blue-600"
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                Inicializar Configuración Por Defecto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {timeBlocks.map((block, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{block.name}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">
                          Horario: {block.startTime} - {block.endTime}
                        </p>
                        <p className="text-gray-600">
                          Duración: {block.duration} horas {block.halfHourBreak ? '+ 30 min descanso' : ''}
                        </p>
                        <p className="text-gray-600">
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
              className="bg-gray-900 text-white hover:bg-gray-800"
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Agregar Día
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          {restDays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay días de descanso configurados</p>
              <p className="text-sm mt-1">Agrega días donde normalmente no trabajas</p>
              <Button
                onPress={handleInitializeDefaultConfig}
                className="mt-4 bg-blue-500 text-white hover:bg-blue-600"
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                Inicializar Configuración Por Defecto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {restDays.map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{day.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
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
        classNames={{
          body: "py-6",
          backdrop: "bg-gray-900/50 backdrop-blur-sm",
          base: "border border-gray-200 bg-white",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
          closeButton: "hover:bg-gray-100 active:bg-gray-200"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingBlock ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Nombre del bloque"
                    placeholder="Ej: Miércoles a Lunes - Tarde"
                    value={blockForm.name}
                    onValueChange={(value) => setBlockForm({ ...blockForm, name: value })}
                    variant="bordered"
                    isRequired
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Días de la semana</label>
                    <CheckboxGroup
                      orientation="horizontal"
                      value={blockForm.days.map(String)}
                      onValueChange={(values) => setBlockForm({ 
                        ...blockForm, 
                        days: values.map(Number) 
                      })}
                    >
                      {daysOfWeek.map((day) => (
                        <Checkbox key={day.key} value={day.key.toString()}>
                          {day.label}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Hora de inicio"
                      selectedKeys={new Set([blockForm.startTime])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setBlockForm({ ...blockForm, startTime: selected });
                      }}
                      variant="bordered"
                    >
                      {timeOptions.map((time) => (
                        <SelectItem key={time.key}>{time.label}</SelectItem>
                      ))}
                    </Select>
                    
                    <Select
                      label="Hora de fin"
                      selectedKeys={new Set([blockForm.endTime])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setBlockForm({ ...blockForm, endTime: selected });
                      }}
                      variant="bordered"
                    >
                      {timeOptions.map((time) => (
                        <SelectItem key={time.key}>{time.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <Select
                    label="Duración del evento"
                    selectedKeys={new Set([blockForm.duration.toString()])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setBlockForm({ ...blockForm, duration: parseFloat(selected) });
                    }}
                    variant="bordered"
                  >
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration.key}>{duration.label}</SelectItem>
                    ))}
                  </Select>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Media hora de despedida</span>
                    <Switch
                      isSelected={blockForm.halfHourBreak}
                      onValueChange={(value) => setBlockForm({ ...blockForm, halfHourBreak: value })}
                    />
                  </div>
                  
                  <Input
                    type="number"
                    label="Máximo de eventos por bloque"
                    min="1"
                    value={blockForm.maxEventsPerBlock.toString()}
                    onValueChange={(value) => setBlockForm({ 
                      ...blockForm, 
                      maxEventsPerBlock: parseInt(value) || 1 
                    })}
                    variant="bordered"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-gray-900 text-white"
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
          backdrop: "bg-gray-900/50 backdrop-blur-sm",
          base: "border border-gray-200 bg-white",
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
                  className="bg-gray-900 text-white"
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