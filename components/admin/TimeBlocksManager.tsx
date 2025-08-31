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
  Center,
  Radio
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconClock,
  IconPlus,
  IconTrash,
  IconPencil,
  IconCalendar,
  IconCurrencyDollar,
  IconRefresh,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface TimeBlock {
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  duration: number;
  halfHourBreak: boolean;
  maxEventsPerBlock: number;
  multipleTimeSlots?: boolean;
  timeSlots?: TimeSlot[];
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
  { key: 0, label: 'Lunes', shortLabel: 'Lun' },
  { key: 1, label: 'Martes', shortLabel: 'Mar' },
  { key: 2, label: 'Miércoles', shortLabel: 'Mié' },
  { key: 3, label: 'Jueves', shortLabel: 'Jue' },
  { key: 4, label: 'Viernes', shortLabel: 'Vie' },
  { key: 5, label: 'Sábado', shortLabel: 'Sáb' },
  { key: 6, label: 'Domingo', shortLabel: 'Dom' }
];

// Convert 24-hour time to 12-hour format with A.M./P.M.
const to12HourFormat = (time24: string): string => {
  const [hourStr, minute] = time24.split(':');
  const hour = parseInt(hourStr);
  
  if (hour === 0) {
    return `12:${minute} A.M.`;
  } else if (hour < 12) {
    return `${hour}:${minute} A.M.`;
  } else if (hour === 12) {
    return `12:${minute} P.M.`;
  } else {
    return `${hour - 12}:${minute} P.M.`;
  }
};

// Función para validar formato de hora HH:MM
const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

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
    maxEventsPerBlock: 1,
    multipleTimeSlots: false,
    timeSlots: []
  });
  
  // Auto-calculate end time when start time or duration changes
  const [isEndTimeManual, setIsEndTimeManual] = useState(false);
  const [customFarewellMinutes, setCustomFarewellMinutes] = useState(30);
  const [isCustomFarewell, setIsCustomFarewell] = useState(false);
  
  const [restDayForm, setRestDayForm] = useState<RestDay>({
    day: 1,
    name: 'Martes',
    fee: 1500,
    canBeReleased: true
  });

  const handleEditBlock = (block: TimeBlock, index: number) => {
    setEditingBlock(block);
    setEditingBlockIndex(index);
    setBlockForm(block);
    // Check if the end time matches the calculated value
    const calculatedEnd = calculateEndTime(block.startTime, block.duration, block.halfHourBreak, 30);
    setIsEndTimeManual(block.endTime !== calculatedEnd);
    setIsCustomFarewell(false);
    setCustomFarewellMinutes(30);
    openBlock();
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = timeBlocks.filter((_, i) => i !== index);
    onUpdateTimeBlocks(newBlocks);
    notifications.show({ title: 'Success', message: 'Bloque de horario eliminado', color: 'green' });
  };

  const handleSaveBlock = () => {
    if (!blockForm.name || blockForm.days.length === 0) {
      notifications.show({ title: 'Error', message: 'Por favor completa todos los campos requeridos', color: 'red' });
      return;
    }

    // Validate the time block configuration
    const validation = validateTimeBlock(blockForm);
    if (!validation.valid) {
      notifications.show({ title: 'Error', message: validation.error || 'Error de validación', color: 'red' });
      return;
    }

    let newBlocks = [...timeBlocks];
    
    if (editingBlockIndex !== null) {
      newBlocks[editingBlockIndex] = blockForm;
      notifications.show({ title: 'Success', message: 'Bloque de horario actualizado', color: 'green' });
    } else {
      newBlocks.push(blockForm);
      notifications.show({ title: 'Success', message: 'Bloque de horario creado', color: 'green' });
    }
    
    onUpdateTimeBlocks(newBlocks);
    closeBlock();
    resetBlockForm();
  };

  const handleEditRestDay = (day: RestDay, index: number) => {
    setEditingRestDay(day);
    setEditingRestDayIndex(index);
    setRestDayForm(day);
    openRestDay();
  };

  const handleDeleteRestDay = (index: number) => {
    const newDays = restDays.filter((_, i) => i !== index);
    onUpdateRestDays(newDays);
    notifications.show({ title: 'Success', message: 'Día de descanso eliminado', color: 'green' });
  };

  const handleSaveRestDay = () => {
    let newDays = [...restDays];
    
    // Check if day already exists
    const existingIndex = newDays.findIndex(d => d.day === restDayForm.day);
    
    if (editingRestDayIndex !== null) {
      newDays[editingRestDayIndex] = restDayForm;
      notifications.show({ title: 'Success', message: 'Día de descanso actualizado', color: 'green' });
    } else if (existingIndex !== -1) {
      notifications.show({ title: 'Error', message: 'Este día ya está configurado como día de descanso', color: 'red' });
      return;
    } else {
      newDays.push(restDayForm);
      notifications.show({ title: 'Success', message: 'Día de descanso agregado', color: 'green' });
    }
    
    onUpdateRestDays(newDays);
    closeRestDay();
    resetRestDayForm();
  };

  const resetBlockForm = () => {
    const defaultStartTime = '14:00';
    const defaultDuration = 3.5;
    const defaultHalfHourBreak = true;
    const calculatedEndTime = calculateEndTime(defaultStartTime, defaultDuration, defaultHalfHourBreak, 30);
    
    setBlockForm({
      name: '',
      days: [],
      startTime: defaultStartTime,
      endTime: calculatedEndTime,
      duration: defaultDuration,
      halfHourBreak: defaultHalfHourBreak,
      maxEventsPerBlock: 1,
      multipleTimeSlots: false,
      timeSlots: []
    });
    setEditingBlock(null);
    setEditingBlockIndex(null);
    setIsEndTimeManual(false);
    setIsCustomFarewell(false);
    setCustomFarewellMinutes(30);
  };

  const resetRestDayForm = () => {
    setRestDayForm({
      day: 1,
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

  const calculateEndTime = (startTime: string, durationHours: number, halfHourBreak: boolean, customMinutes?: number): string => {
    const startMinutes = timeToMinutes(startTime);
    const durationMinutes = durationHours * 60;
    const breakMinutes = halfHourBreak ? (customMinutes || 30) : 0;
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
            error: `Este horario se superpone con el bloque "${otherBlock.name}" en días compartidos.`
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
        
        notifications.show({ title: 'Success', message: 'Configuración por defecto inicializada exitosamente', color: 'green' });
        
        // Force a page reload to refresh the system config
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al inicializar la configuración', color: 'red' });
      }
    } catch (error) {
      console.error('Error initializing default config:', error);
      notifications.show({ title: 'Error', message: 'Error al inicializar la configuración', color: 'red' });
    }
  };

  // Calculate summary stats
  const totalCapacity = timeBlocks.reduce((total, block) => {
    const daysCount = block.days.length;
    return total + (block.maxEventsPerBlock * daysCount);
  }, 0);

  const activeDays = new Set(timeBlocks.flatMap(block => block.days));

  return (
    <>
      <Stack gap="lg">
      {/* Configuration Summary */}
      {(timeBlocks.length > 0 || restDays.length > 0) && (
        <Card 
          withBorder 
          p="md" 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Text size="lg" fw={600} c="white">Estado de Configuración</Text>
              <Group gap="xl">
                <Stack gap={2}>
                  <Text size="xs" c="white" opacity={0.8}>BLOQUES ACTIVOS</Text>
                  <Text size="xl" fw={700} c="white">{timeBlocks.length}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="white" opacity={0.8}>CAPACIDAD SEMANAL</Text>
                  <Text size="xl" fw={700} c="white">{totalCapacity} eventos</Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="white" opacity={0.8}>DÍAS ACTIVOS</Text>
                  <Text size="xl" fw={700} c="white">{activeDays.size}/7</Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="white" opacity={0.8}>DÍAS DE DESCANSO</Text>
                  <Text size="xl" fw={700} c="white">{restDays.length}</Text>
                </Stack>
              </Group>
            </Stack>
          </Group>
        </Card>
      )}

      {/* Time Blocks Section */}
      <Card withBorder>
        <Card.Section p="md" withBorder bg="blue.0">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="sm">
                <IconClock size={20} color="#1971c2" />
                <Title order={4}>Bloques de Horarios</Title>
              </Group>
              <Text size="sm" c="dimmed">
                Define los horarios disponibles para reservaciones
              </Text>
            </Stack>
            <Button
              onClick={() => {
                resetBlockForm();
                openBlock();
              }}
              size="sm"
              leftSection={<IconPlus size={16} />}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            >
              Agregar Bloque
            </Button>
          </Group>
        </Card.Section>
        <Card.Section p="md">
          {timeBlocks.length === 0 ? (
            <Stack align="center" gap="md" py="xl">
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                backgroundColor: '#e7f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconClock size={40} color="#1971c2" />
              </div>
              <Stack gap="xs" align="center">
                <Text size="lg" fw={500}>Comienza a configurar tus horarios</Text>
                <Text size="sm" c="dimmed" ta="center" maw={400}>
                  Los bloques de horarios definen cuándo pueden reservar tus clientes.
                  Puedes crear múltiples bloques con diferentes configuraciones.
                </Text>
              </Stack>
              <Group gap="sm" mt="md">
                <Button
                  onClick={handleInitializeDefaultConfig}
                  leftSection={<IconRefresh size={16} />}
                  size="md"
                  variant="light"
                >
                  Usar Configuración Recomendada
                </Button>
                <Button
                  onClick={() => {
                    resetBlockForm();
                    openBlock();
                  }}
                  leftSection={<IconPlus size={16} />}
                  size="md"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                >
                  Crear Mi Primer Bloque
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack gap="md">
              {timeBlocks.map((block, index) => (
                <Card key={index} withBorder p="md" shadow="sm" radius="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <IconClock size={18} color="#1971c2" />
                        <Title order={5}>{block.name}</Title>
                      </Group>
                      <Stack gap={6}>
                        <Group gap="xl">
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>HORARIO</Text>
                            <Text size="sm">
                              {to12HourFormat(block.startTime)} - {to12HourFormat(block.endTime)}
                            </Text>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>DURACIÓN</Text>
                            <Group gap="xs">
                              <Text size="sm">
                                {block.duration} {block.duration === 1 ? 'hora' : 'horas'}
                              </Text>
                              {block.halfHourBreak && (
                                <Badge size="xs" color="green" variant="light">
                                  +30min despedida
                                </Badge>
                              )}
                            </Group>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>CAPACIDAD</Text>
                            <Text size="sm">
                              {block.maxEventsPerBlock} {block.maxEventsPerBlock === 1 ? 'evento' : 'eventos'}
                            </Text>
                          </Stack>
                        </Group>
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed" fw={500}>DÍAS ACTIVOS</Text>
                          <Group gap="xs">
                            {daysOfWeek.map(day => (
                              <Badge
                                key={day.key}
                                size="md"
                                variant={block.days.includes(day.key) ? "filled" : "light"}
                                color={block.days.includes(day.key) ? "blue" : "gray"}
                                style={{ minWidth: 36 }}
                              >
                                {day.shortLabel}
                              </Badge>
                            ))}
                          </Group>
                        </Stack>
                      </Stack>
                    </Stack>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        size="md"
                        color="blue"
                        onClick={() => handleEditBlock(block, index)}
                        title="Editar bloque"
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        size="md"
                        color="red"
                        onClick={() => handleDeleteBlock(index)}
                        title="Eliminar bloque"
                      >
                        <IconTrash size={18} />
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
        <Card.Section p="md" withBorder bg="orange.0">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="sm">
                <IconCalendar size={20} color="#fd7e14" />
                <Title order={4}>Días de Descanso</Title>
              </Group>
              <Text size="sm" c="dimmed">
                Días que normalmente no trabajas pero pueden liberarse con cargo extra
              </Text>
            </Stack>
            <Button
              onClick={() => {
                resetRestDayForm();
                openRestDay();
              }}
              size="sm"
              leftSection={<IconPlus size={16} />}
              variant="gradient"
              gradient={{ from: 'orange', to: 'yellow', deg: 90 }}
            >
              Agregar Día
            </Button>
          </Group>
        </Card.Section>
        <Card.Section p="md">
          {restDays.length === 0 ? (
            <Stack align="center" gap="md" py="xl">
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                backgroundColor: '#fff4e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconCalendar size={40} color="#fd7e14" />
              </div>
              <Stack gap="xs" align="center">
                <Text size="lg" fw={500}>Configura tus días de descanso</Text>
                <Text size="sm" c="dimmed" ta="center" maw={400}>
                  Los días de descanso pueden tener un cargo adicional o bloquearse completamente.
                  Ideal para días que normalmente no trabajas.
                </Text>
              </Stack>
              <Group gap="sm" mt="md">
                <Button
                  onClick={handleInitializeDefaultConfig}
                  leftSection={<IconRefresh size={16} />}
                  size="md"
                  variant="light"
                  color="orange"
                >
                  Usar Configuración Recomendada
                </Button>
                <Button
                  onClick={() => {
                    resetRestDayForm();
                    openRestDay();
                  }}
                  leftSection={<IconPlus size={16} />}
                  size="md"
                  variant="gradient"
                  gradient={{ from: 'orange', to: 'yellow', deg: 90 }}
                >
                  Configurar Día de Descanso
                </Button>
              </Group>
            </Stack>
          ) : (
            <ScrollArea>
              <Stack gap="md">
                {restDays.map((day, index) => (
                  <Card key={index} withBorder p="md" shadow="sm" radius="md">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="sm" style={{ flex: 1 }}>
                        <Group gap="xs">
                          <IconCalendar size={18} color="#fd7e14" />
                          <Title order={5}>{day.name}</Title>
                        </Group>
                        <Group gap="xl">
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>CARGO EXTRA</Text>
                            <Text size="lg" fw={600} c="orange.7">
                              {formatCurrency(day.fee)}
                            </Text>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={500}>DISPONIBILIDAD</Text>
                            <Badge
                              size="lg"
                              color={day.canBeReleased ? 'green' : 'red'}
                              variant="filled"
                              leftSection={
                                day.canBeReleased ? 
                                <IconCheck size={14} /> : 
                                <IconX size={14} />
                              }
                            >
                              {day.canBeReleased ? 'Liberable' : 'Bloqueado'}
                            </Badge>
                          </Stack>
                        </Group>
                        {day.canBeReleased && (
                          <Text size="xs" c="dimmed">
                            Los clientes pueden reservar pagando {formatCurrency(day.fee)} adicionales
                          </Text>
                        )}
                      </Stack>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          size="md"
                          color="blue"
                          onClick={() => handleEditRestDay(day, index)}
                          title="Editar día"
                        >
                          <IconPencil size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="md"
                          color="red"
                          onClick={() => handleDeleteRestDay(index)}
                          title="Eliminar día"
                        >
                          <IconTrash size={18} />
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
        title={
          <Group gap="sm">
            <IconClock size={24} color="#1971c2" />
            <Title order={3}>{editingBlock ? 'Editar Bloque de Horario' : 'Nuevo Bloque de Horario'}</Title>
          </Group>
        }
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
        radius="md"
      >
        <Stack gap="lg">
          <Card withBorder p="md" bg="blue.0">
            <Stack gap="sm">
              <Group gap="xs">
                <IconPencil size={16} color="#1971c2" />
                <Text size="sm" fw={500}>Nombre del Bloque</Text>
              </Group>
              <TextInput
                placeholder="Ej: Horario de Tarde, Fin de Semana, etc."
                value={blockForm.name}
                onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                size="md"
                styles={{
                  input: { backgroundColor: 'white' }
                }}
              />
              <Text size="xs" c="dimmed">
                Dale un nombre descriptivo para identificar fácilmente este bloque
              </Text>
            </Stack>
          </Card>
          
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconCalendar size={16} color="#1971c2" />
                <Text size="sm" fw={500}>Días Activos</Text>
              </Group>
              <Group gap="xs">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.key}
                    variant={blockForm.days.includes(day.key) ? "filled" : "light"}
                    color={blockForm.days.includes(day.key) ? "blue" : "gray"}
                    size="md"
                    radius="xl"
                    onClick={() => {
                      const newDays = blockForm.days.includes(day.key)
                        ? blockForm.days.filter(d => d !== day.key)
                        : [...blockForm.days, day.key];
                      setBlockForm({ ...blockForm, days: newDays });
                    }}
                    styles={{
                      root: { minWidth: 50 }
                    }}
                  >
                    {day.shortLabel}
                  </Button>
                ))}
              </Group>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setBlockForm({ ...blockForm, days: [0,1,2,3,4] })}
                >
                  Lun-Vie
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setBlockForm({ ...blockForm, days: [5,6] })}
                >
                  Fin de semana
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setBlockForm({ ...blockForm, days: [0,1,2,3,4,5,6] })}
                >
                  Todos
                </Button>
              </Group>
              <Text size="xs" c="dimmed">
                Selecciona en qué días estará disponible este horario
              </Text>
            </Stack>
          </Card>
          
          <Card withBorder p="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconClock size={16} color="#1971c2" />
                <Text size="sm" fw={500}>Configuración de Horario</Text>
              </Group>
              <Card withBorder p="sm" bg="blue.0">
                <Group gap="xs">
                  <IconInfoCircle size={16} color="#1971c2" />
                  <Text size="xs" c="blue.7">
                    La hora de fin se calcula automáticamente según la duración del evento
                  </Text>
                </Group>
              </Card>
                <Group grow>
                  <TextInput
                    label="Hora de inicio"
                    placeholder="14:30"
                    description="Formato: HH:MM (24 horas)"
                    value={blockForm.startTime}
                    onChange={(event) => {
                      let value = event.currentTarget.value;
                      
                      // Auto-formato mientras escribes
                      value = value.replace(/[^0-9:]/g, ''); // Solo números y :
                      if (value.length === 2 && !value.includes(':')) {
                        value += ':';
                      }
                      
                      if (value && isValidTimeFormat(value)) {
                        if (!isEndTimeManual) {
                          // Calcular la duración actual del evento (sin tiempo de despedida)
                          const startMinutes = timeToMinutes(blockForm.startTime);
                          const endMinutes = timeToMinutes(blockForm.endTime);
                          const totalMinutes = endMinutes - startMinutes;
                          const despedidaMinutes = blockForm.halfHourBreak ? (isCustomFarewell ? customFarewellMinutes : 30) : 0;
                          const currentEventDuration = (totalMinutes - despedidaMinutes) / 60; // en horas
                          
                          // Usar la duración actual o una por defecto
                          const duration = currentEventDuration > 0 ? currentEventDuration : 3.5;
                          
                          const newEndTime = calculateEndTime(
                            value, 
                            duration, 
                            blockForm.halfHourBreak,
                            isCustomFarewell ? customFarewellMinutes : 30
                          );
                          setBlockForm({ 
                            ...blockForm, 
                            startTime: value,
                            endTime: newEndTime,
                            duration: duration
                          });
                        } else {
                          setBlockForm({ 
                            ...blockForm, 
                            startTime: value
                          });
                        }
                      } else {
                        // Actualizar el valor para mostrar el auto-formato
                        setBlockForm({ 
                          ...blockForm, 
                          startTime: value
                        });
                      }
                    }}
                    error={blockForm.startTime && !isValidTimeFormat(blockForm.startTime) ? "Formato inválido. Use HH:MM" : null}
                    withAsterisk
                  />
                  <Group align="flex-end" grow>
                    <TextInput
                      label="Hora de fin"
                      description={isEndTimeManual ? "Hora personalizada" : "Calculada automáticamente"}
                      placeholder="18:00"
                      value={blockForm.endTime}
                      onChange={(event) => {
                        let value = event.currentTarget.value;
                        
                        // Auto-formato mientras escribes
                        value = value.replace(/[^0-9:]/g, ''); // Solo números y :
                        if (value.length === 2 && !value.includes(':')) {
                          value += ':';
                        }
                        
                        if (value && isValidTimeFormat(value)) {
                          setBlockForm({ ...blockForm, endTime: value });
                          setIsEndTimeManual(true);
                        } else {
                          // Actualizar el valor para mostrar el auto-formato
                          setBlockForm({ ...blockForm, endTime: value });
                        }
                      }}
                      error={blockForm.endTime && !isValidTimeFormat(blockForm.endTime) ? "Formato inválido. Use HH:MM" : null}
                    />
                    <Button
                      variant={isEndTimeManual ? "filled" : "light"}
                      color={isEndTimeManual ? "orange" : "blue"}
                      size="sm"
                      leftSection={<IconRefresh size={14} />}
                      onClick={() => {
                        const defaultDuration = 3.5; // 3 horas 30 minutos por defecto
                        const newEndTime = calculateEndTime(
                          blockForm.startTime, 
                          defaultDuration, 
                          blockForm.halfHourBreak,
                          isCustomFarewell ? customFarewellMinutes : 30
                        );
                        setBlockForm({ ...blockForm, endTime: newEndTime, duration: defaultDuration });
                        setIsEndTimeManual(false);
                      }}
                    >
                      {isEndTimeManual ? "Reactivar Auto" : "Recalcular"}
                    </Button>
                  </Group>
                </Group>
                
                {/* Time Summary Display */}
                <Card withBorder p="sm" bg="blue.0">
                  <Group gap="xs" align="center">
                    <IconClock size={16} className="text-blue-600" />
                    <Text size="sm" fw={500} c="blue.7">
                      Resumen del horario:
                    </Text>
                    <Text size="sm" c="blue.6">
                      {to12HourFormat(blockForm.startTime)} - {to12HourFormat(blockForm.endTime)}
                    </Text>
                    <Badge size="sm" color="blue" variant="light">
                      {(() => {
                        const startMinutes = timeToMinutes(blockForm.startTime);
                        const endMinutes = timeToMinutes(blockForm.endTime);
                        const totalMinutes = endMinutes - startMinutes;
                        const despedidaMinutes = blockForm.halfHourBreak ? (isCustomFarewell ? customFarewellMinutes : 30) : 0;
                        const eventoMinutes = totalMinutes - despedidaMinutes;
                        const eventoHours = Math.floor(eventoMinutes / 60);
                        const eventoMins = eventoMinutes % 60;
                        return `${eventoHours}h ${eventoMins > 0 ? `${eventoMins}min` : ''} evento`;
                      })()}
                    </Badge>
                    {blockForm.halfHourBreak && (
                      <Badge size="sm" color="orange" variant="light">
                        Incluye {isCustomFarewell ? customFarewellMinutes : 30}min de despedida
                      </Badge>
                    )}
                  </Group>
                </Card>
              </Stack>
            </Card>
          
          
          <NumberInput
            label="Capacidad del horario"
            description="Número máximo de eventos que pueden ocurrir en este horario"
            placeholder="1"
            value={blockForm.maxEventsPerBlock}
            onChange={(value) => setBlockForm({ ...blockForm, maxEventsPerBlock: typeof value === 'number' ? value : 1 })}
            min={1}
            max={10}
          />
          
          <Card withBorder p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500}>Tiempo de despedida</Text>
                  <Text size="xs" c="dimmed">Tiempo extra para que los niños se despidan</Text>
                </div>
                <Switch
                  checked={blockForm.halfHourBreak}
                  onChange={(e) => {
                    const halfHourBreak = e.currentTarget.checked;
                    if (!isEndTimeManual) {
                      // Calcular la duración actual del evento
                      const startMinutes = timeToMinutes(blockForm.startTime);
                      const endMinutes = timeToMinutes(blockForm.endTime);
                      const totalMinutes = endMinutes - startMinutes;
                      const oldDespedidaMinutes = blockForm.halfHourBreak ? (isCustomFarewell ? customFarewellMinutes : 30) : 0;
                      const currentEventDuration = (totalMinutes - oldDespedidaMinutes) / 60;
                      const duration = currentEventDuration > 0 ? currentEventDuration : 3.5;
                      
                      const newEndTime = calculateEndTime(
                        blockForm.startTime, 
                        duration, 
                        halfHourBreak,
                        isCustomFarewell ? customFarewellMinutes : 30
                      );
                      setBlockForm({ 
                        ...blockForm, 
                        halfHourBreak,
                        endTime: newEndTime,
                        duration: duration
                      });
                    } else {
                      setBlockForm({ ...blockForm, halfHourBreak });
                    }
                    if (!halfHourBreak) {
                      setIsCustomFarewell(false);
                      setCustomFarewellMinutes(30);
                    }
                  }}
                />
              </Group>
              
              {blockForm.halfHourBreak && (
                <Stack gap="sm">
                  <Group gap="xs">
                    <Checkbox
                      label="Personalizar tiempo de despedida"
                      checked={isCustomFarewell}
                      onChange={(e) => {
                        setIsCustomFarewell(e.currentTarget.checked);
                        if (!e.currentTarget.checked) {
                          setCustomFarewellMinutes(30);
                          if (!isEndTimeManual) {
                            const newEndTime = calculateEndTime(
                              blockForm.startTime,
                              blockForm.duration,
                              blockForm.halfHourBreak,
                              30
                            );
                            setBlockForm({ ...blockForm, endTime: newEndTime });
                          }
                        }
                      }}
                    />
                  </Group>
                  
                  {isCustomFarewell && (
                    <Group grow align="flex-end">
                      <NumberInput
                        label="Minutos de despedida"
                        description={!isEndTimeManual ? "La hora de fin se actualizará automáticamente" : "Cambia a modo automático para recalcular"}
                        placeholder="30"
                        value={customFarewellMinutes}
                        onChange={(value) => {
                          const minutes = typeof value === 'number' ? value : 30;
                          setCustomFarewellMinutes(minutes);
                          if (!isEndTimeManual) {
                            // Calcular la duración actual del evento
                            const startMinutes = timeToMinutes(blockForm.startTime);
                            const endMinutes = timeToMinutes(blockForm.endTime);
                            const totalMinutes = endMinutes - startMinutes;
                            const oldDespedidaMinutes = blockForm.halfHourBreak ? (isCustomFarewell ? customFarewellMinutes : 30) : 0;
                            const currentEventDuration = (totalMinutes - oldDespedidaMinutes) / 60;
                            const duration = currentEventDuration > 0 ? currentEventDuration : 3.5;
                            
                            const newEndTime = calculateEndTime(
                              blockForm.startTime,
                              duration,
                              blockForm.halfHourBreak,
                              minutes
                            );
                            setBlockForm({ ...blockForm, endTime: newEndTime, duration: duration });
                          }
                        }}
                        min={5}
                        max={60}
                        step={5}
                        rightSection={<Text size="xs" c="dimmed">min</Text>}
                      />
                      <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconRefresh size={14} />}
                        onClick={() => {
                          const startMinutes = timeToMinutes(blockForm.startTime);
                          const endMinutes = timeToMinutes(blockForm.endTime);
                          const totalMinutes = endMinutes - startMinutes;
                          const oldDespedidaMinutes = blockForm.halfHourBreak ? (isCustomFarewell ? customFarewellMinutes : 30) : 0;
                          const currentEventDuration = (totalMinutes - oldDespedidaMinutes) / 60;
                          const duration = currentEventDuration > 0 ? currentEventDuration : 3.5;
                          
                          const newEndTime = calculateEndTime(
                            blockForm.startTime,
                            duration,
                            blockForm.halfHourBreak,
                            customFarewellMinutes
                          );
                          setBlockForm({ ...blockForm, endTime: newEndTime, duration: duration });
                          setIsEndTimeManual(false);
                        }}
                      >
                        Recalcular hora fin
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>

          
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
        title={
          <Group gap="sm">
            <IconCalendar size={24} color="#fd7e14" />
            <Title order={3}>{editingRestDay ? 'Editar Día de Descanso' : 'Nuevo Día de Descanso'}</Title>
          </Group>
        }
        size="lg"
        radius="md"
      >
        <Stack gap="lg">
          <Card withBorder p="md" bg="orange.0">
            <Stack gap="sm">
              <Group gap="xs">
                <IconCalendar size={16} color="#fd7e14" />
                <Text size="sm" fw={500}>Selecciona el Día</Text>
              </Group>
              <Select
                placeholder="Elige un día de la semana"
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
                size="md"
                styles={{
                  input: { backgroundColor: 'white' }
                }}
              />
            </Stack>
          </Card>
          
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
    </>
  );
}