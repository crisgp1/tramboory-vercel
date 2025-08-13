'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  TextInput,
  Select,
  Switch,
  Badge,
  Modal,
  Checkbox,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  NumberInput,
  Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconClock,
  IconPlus,
  IconTrash,
  IconPencil,
  IconCalendar,
  IconCurrencyDollar
} from '@tabler/icons-react';
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
  const [blockOpened, { open: openBlock, close: closeBlock }] = useDisclosure(false);
  const [restDayOpened, { open: openRestDay, close: closeRestDay }] = useDisclosure(false);
  
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
    <Stack gap="lg">
      {/* Time Blocks Section */}
      <Card withBorder>
        <Card.Section p="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <IconClock size={20} />
              <Title order={4}>Bloques de Horarios</Title>
            </Group>
            <Button
              onClick={() => {
                resetBlockForm();
                openBlock();
              }}
              size="sm"
              leftSection={<IconPlus size={16} />}
            >
              Agregar Bloque
            </Button>
          </Group>
        </Card.Section>
        <Card.Section p="md">
          {timeBlocks.length === 0 ? (
            <Stack align="center" gap="sm" py="xl">
              <IconClock size={48} color="gray" />
              <Text c="dimmed">No hay bloques de horarios configurados</Text>
              <Text size="sm" c="dimmed">Agrega bloques para definir horarios de reserva</Text>
              <Button
                onClick={handleInitializeDefaultConfig}
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                Inicializar Configuración Por Defecto
              </Button>
            </Stack>
          ) : (
            <Stack gap="md">
              {timeBlocks.map((block, index) => (
                <Card key={index} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Title order={5}>{block.name}</Title>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Horario: {block.startTime} - {block.endTime}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Duración: {block.duration} horas {block.halfHourBreak ? '+ 30 min descanso' : ''}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Capacidad: {block.maxEventsPerBlock} {block.maxEventsPerBlock === 1 ? 'evento' : 'eventos'} por bloque
                        </Text>
                        <Group gap="xs" mt="xs">
                          {block.days.map(day => (
                            <Badge
                              key={day}
                              size="sm"
                              variant="light"
                              color="gray"
                            >
                              {daysOfWeek.find(d => d.key === day)?.shortLabel}
                            </Badge>
                          ))}
                        </Group>
                      </Stack>
                    </Stack>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="blue"
                        onClick={() => handleEditBlock(block, index)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteBlock(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Card.Section>
      </Card>

      {/* Rest Days Section */}
      <Card withBorder>
        <Card.Section p="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <IconCalendar size={20} />
              <Title order={4}>Días de Descanso</Title>
            </Group>
            <Button
              onClick={() => {
                resetRestDayForm();
                openRestDay();
              }}
              size="sm"
              leftSection={<IconPlus size={16} />}
            >
              Agregar Día
            </Button>
          </Group>
        </Card.Section>
        <Card.Section p="md">
          {restDays.length === 0 ? (
            <Stack align="center" gap="sm" py="xl">
              <IconCalendar size={48} color="gray" />
              <Text c="dimmed">No hay días de descanso configurados</Text>
              <Text size="sm" c="dimmed">Agrega días donde normalmente no trabajas</Text>
              <Button
                onClick={handleInitializeDefaultConfig}
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                Inicializar Configuración Por Defecto
              </Button>
            </Stack>
          ) : (
            <ScrollArea>
              <Stack gap="md">
                {restDays.map((day, index) => (
                  <Card key={index} withBorder p="md">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="sm" style={{ flex: 1 }}>
                        <Title order={5}>{day.name}</Title>
                        <Text size="sm" c="dimmed">
                          Cargo adicional: {formatCurrency(day.fee)}
                        </Text>
                        <Badge
                          size="sm"
                          color={day.canBeReleased ? 'green' : 'red'}
                          variant="light"
                        >
                          {day.canBeReleased ? 'Se puede liberar' : 'No se puede liberar'}
                        </Badge>
                      </Stack>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="blue"
                          onClick={() => handleEditRestDay(day, index)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="red"
                          onClick={() => handleDeleteRestDay(index)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Card.Section>
      </Card>

      {/* Time Block Modal */}
      <Modal
        opened={blockOpened}
        onClose={closeBlock}
        title={editingBlock ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="lg">
          <TextInput
            label="Nombre del bloque"
            placeholder="Ej: Miércoles a Lunes - Tarde"
            value={blockForm.name}
            onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
            withAsterisk
          />
          
          <Stack gap="sm">
            <Group gap="sm">
              <IconCalendar size={16} />
              <Text size="sm" fw={500}>Días de la semana</Text>
            </Group>
            <Card withBorder p="md">
              <Stack gap="sm">
                <Group>
                  {daysOfWeek.map((day) => (
                    <Checkbox
                      key={day.key}
                      label={day.shortLabel}
                      checked={blockForm.days.includes(day.key)}
                      onChange={(e) => {
                        const newDays = e.currentTarget.checked
                          ? [...blockForm.days, day.key]
                          : blockForm.days.filter(d => d !== day.key);
                        setBlockForm({ ...blockForm, days: newDays });
                      }}
                    />
                  ))}
                </Group>
                <Text size="xs" c="dimmed">
                  💡 Selecciona los días en los que este bloque de horario estará activo
                </Text>
              </Stack>
            </Card>
          </Stack>
          
          <Stack gap="sm">
            <Text size="sm" fw={500}>Configuración de Horario</Text>
            <Group grow>
              <Select
                label="Hora de inicio"
                placeholder="Selecciona hora de inicio"
                value={blockForm.startTime}
                onChange={(value) => setBlockForm({ ...blockForm, startTime: value || '14:00' })}
                data={timeOptions.map(t => ({ value: t.key, label: t.label }))}
              />
              <Select
                label="Hora de fin"
                placeholder="Selecciona hora de fin"
                value={blockForm.endTime}
                onChange={(value) => setBlockForm({ ...blockForm, endTime: value || '19:00' })}
                data={timeOptions.map(t => ({ value: t.key, label: t.label }))}
              />
            </Group>
          </Stack>
          
          <Group grow>
            <Select
              label="Duración del evento"
              placeholder="Selecciona duración"
              value={blockForm.duration.toString()}
              onChange={(value) => setBlockForm({ ...blockForm, duration: parseFloat(value || '3.5') })}
              data={durationOptions.map(d => ({ value: d.key, label: d.label }))}
            />
            <NumberInput
              label="Máximo de eventos por bloque"
              placeholder="1"
              value={blockForm.maxEventsPerBlock}
              onChange={(value) => setBlockForm({ ...blockForm, maxEventsPerBlock: typeof value === 'number' ? value : 1 })}
              min={1}
            />
          </Group>
          
          <Group>
            <Switch
              label="Media hora de despedida"
              description="Tiempo extra para que los niños se despidan"
              checked={blockForm.halfHourBreak}
              onChange={(e) => setBlockForm({ ...blockForm, halfHourBreak: e.currentTarget.checked })}
            />
          </Group>
          
          <Group justify="flex-end" mt="lg">
            <Button variant="light" onClick={closeBlock}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBlock}>
              {editingBlock ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rest Day Modal */}
      <Modal
        opened={restDayOpened}
        onClose={closeRestDay}
        title={editingRestDay ? 'Editar Día de Descanso' : 'Nuevo Día de Descanso'}
        size="lg"
      >
        <Stack gap="lg">
          <Select
            label="Día de la semana"
            placeholder="Selecciona día"
            value={restDayForm.day.toString()}
            onChange={(value) => {
              const dayNum = parseInt(value || '0');
              const dayName = daysOfWeek.find(d => d.key === dayNum)?.label || '';
              setRestDayForm({ 
                ...restDayForm, 
                day: dayNum,
                name: dayName
              });
            }}
            data={daysOfWeek.map(day => ({ value: day.key.toString(), label: day.label }))}
          />
          
          <NumberInput
            label="Cargo adicional"
            placeholder="1500.00"
            value={restDayForm.fee}
            onChange={(value) => setRestDayForm({ 
              ...restDayForm, 
              fee: typeof value === 'number' ? value : 0 
            })}
            leftSection={<IconCurrencyDollar size={16} />}
            min={0}
            step={100}
            description={`Cargo adicional: ${formatCurrency(restDayForm.fee)}`}
          />
          
          <Card withBorder p="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Text size="sm" fw={500}>Se puede liberar con costo adicional</Text>
                <Text size="xs" c="dimmed">
                  Permite reservar este día pagando el cargo extra
                </Text>
              </Stack>
              <Switch
                checked={restDayForm.canBeReleased}
                onChange={(e) => setRestDayForm({ 
                  ...restDayForm, 
                  canBeReleased: e.currentTarget.checked 
                })}
              />
            </Group>
          </Card>
          
          <Group justify="flex-end" mt="lg">
            <Button variant="light" onClick={closeRestDay}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRestDay}>
              {editingRestDay ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}