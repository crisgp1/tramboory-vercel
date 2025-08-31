'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Card,
  Button,
  TextInput,
  Select,
  Switch,
  Loader,
  Tabs,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  NumberInput,
  Badge,
  Alert,
  Center,
  ThemeIcon,
  Divider,
  Radio
} from '@mantine/core';
import {
  IconSettings,
  IconCurrencyDollar,
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import TimeBlocksManager from './TimeBlocksManager';

interface SystemConfig {
  _id?: string;
  advanceBookingDays: number;
  minAdvanceBookingDays: number;
  maxConcurrentEvents: number;
  defaultEventDuration: number;
  oneEventPerDay: boolean;
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
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  { value: '6', label: 'Domingo' }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function SystemConfigManager() {
  const [config, setConfig] = useState<SystemConfig>({
    advanceBookingDays: 7,
    minAdvanceBookingDays: 7,
    maxConcurrentEvents: 3,
    defaultEventDuration: 4,
    oneEventPerDay: true,
    timeBlocks: [],
    restDays: [],
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          advanceBookingDays: data.data.advanceBookingDays ?? 7,
          minAdvanceBookingDays: data.data.minAdvanceBookingDays ?? 7,
          maxConcurrentEvents: data.data.maxConcurrentEvents ?? 3,
          defaultEventDuration: data.data.defaultEventDuration ?? 4,
          oneEventPerDay: data.data.oneEventPerDay ?? true,
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
        const defaultConfig = {
          advanceBookingDays: 7,
          minAdvanceBookingDays: 7,
          maxConcurrentEvents: 3,
          defaultEventDuration: 4,
          oneEventPerDay: true,
          timeBlocks: [],
          restDays: [],
          isActive: true
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar la configuración del sistema', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = async (field: string, value: any) => {
    const newConfig = (() => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...config,
          [parent]: {
            ...(config as any)[parent] || {},
            [child]: value
          }
        };
      }
      return {
        ...config,
        [field]: value
      };
    })();
    
    setConfig(newConfig);
    setSaving(true);
    
    // Auto-save configuration
    try {
      const response = await fetch('/api/admin/system-config', {
        method: config._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConfig(data.data);
        notifications.show({ 
          title: 'Guardado', 
          message: 'Cambios guardados automáticamente', 
          color: 'green',
          autoClose: 2000 
        });
      } else {
        notifications.show({ 
          title: 'Error', 
          message: data.error || 'Error al guardar la configuración', 
          color: 'red' 
        });
      }
    } catch (error) {
      console.error('Error saving system config:', error);
      notifications.show({ 
        title: 'Error', 
        message: 'Error al guardar la configuración', 
        color: 'red' 
      });
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
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text c="dimmed">Cargando configuración del sistema...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" radius="md" color="blue">
              <IconSettings size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Configuración del Sistema</Title>
              <Text size="sm" c="dimmed">
                Ajusta los parámetros generales del sistema
              </Text>
            </Stack>
          </Group>
          {saving && (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Guardando cambios...</Text>
            </Group>
          )}
        </Group>
      </Paper>

      {/* Tabs for different sections */}
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">Configuración General</Tabs.Tab>
          <Tabs.Tab value="blocks">Bloques de Horarios</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="lg">
          <Grid>
            {/* Business Hours & Days */}

            {/* Booking Settings */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Card withBorder>
                <Card.Section p="md" withBorder>
                  <Group gap="sm">
                    <IconClock size={20} />
                    <Title order={4}>Configuración de Reservas</Title>
                  </Group>
                </Card.Section>
                <Card.Section p="md">
                  <Stack gap="md">
                    <NumberInput
                      label="Días mínimos de anticipación para reservar"
                      description={`Los clientes deben reservar con al menos ${config.minAdvanceBookingDays || 7} días de anticipación`}
                      value={config.minAdvanceBookingDays || 7}
                      onChange={(value) => handleConfigChange('minAdvanceBookingDays', typeof value === 'number' ? value : 0)}
                      min={0}
                      placeholder="7"
                    />

                    <NumberInput
                      label="Días máximos de anticipación"
                      description={`Los clientes pueden reservar hasta ${config.advanceBookingDays || 30} días en el futuro`}
                      value={config.advanceBookingDays || 30}
                      onChange={(value) => handleConfigChange('advanceBookingDays', typeof value === 'number' ? value : 1)}
                      min={1}
                      placeholder="30"
                    />

                    {/* CONFIGURACIÓN GLOBAL DE EVENTOS POR DÍA */}
                    <Card withBorder p="md" bg="orange.0">
                      <Stack gap="md">
                        <Group gap="xs">
                          <IconCalendar size={20} color="#f08c00" />
                          <Text size="md" fw={600} c="orange.9">
                            Política de Eventos por Día
                          </Text>
                        </Group>
                        
                        <Radio.Group
                          value={config.oneEventPerDay ? 'one' : 'multiple'}
                          onChange={(value) => {
                            const isOnePerDay = value === 'one';
                            handleConfigChange('oneEventPerDay', isOnePerDay);
                            if (isOnePerDay) {
                              handleConfigChange('maxConcurrentEvents', 1);
                            }
                          }}
                        >
                          <Stack gap="md">
                            <Radio 
                              value="one" 
                              label={
                                <Stack gap="xs">
                                  <Group gap="xs">
                                    <Text fw={600}>Un evento por día</Text>
                                    <Badge color="orange" size="sm">Recomendado</Badge>
                                  </Group>
                                  <Text size="sm" c="dimmed">
                                    Solo se permite UNA reserva por día. Ideal para eventos exclusivos.
                                  </Text>
                                  <Alert icon={<IconCheck size={16} />} color="blue" p="xs">
                                    <Text size="xs">
                                      Cuando un cliente reserva cualquier horario, todos los demás horarios 
                                      del mismo día se bloquean automáticamente.
                                    </Text>
                                  </Alert>
                                </Stack>
                              }
                            />
                            
                            <Radio 
                              value="multiple" 
                              label={
                                <Stack gap="xs">
                                  <Text fw={600}>Múltiples eventos por día</Text>
                                  <Text size="sm" c="dimmed">
                                    Permite varios eventos en el mismo día según la capacidad.
                                  </Text>
                                  {!config.oneEventPerDay && (
                                    <NumberInput
                                      label="Máximo de eventos simultáneos"
                                      description="Eventos que pueden ocurrir al mismo tiempo"
                                      value={config.maxConcurrentEvents || 3}
                                      onChange={(value) => handleConfigChange('maxConcurrentEvents', typeof value === 'number' ? value : 1)}
                                      min={1}
                                      max={10}
                                      mt="sm"
                                    />
                                  )}
                                </Stack>
                              }
                            />
                          </Stack>
                        </Radio.Group>
                        
                        <Badge 
                          size="lg" 
                          color={config.oneEventPerDay ? "orange" : "green"}
                          variant="filled"
                          fullWidth
                        >
                          {config.oneEventPerDay 
                            ? "Sistema configurado: 1 evento máximo por día" 
                            : `Sistema configurado: ${config.maxConcurrentEvents} eventos simultáneos`}
                        </Badge>
                      </Stack>
                    </Card>


                    <Stack gap="sm">
                      <Text size="sm" fw={500}>Estado del sistema</Text>
                      <Card 
                        withBorder
                        p="md" 
                        style={{ 
                          backgroundColor: config.isActive ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-gray-0)',
                          borderColor: config.isActive ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-gray-3)'
                        }}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon 
                              size="sm" 
                              radius="xl" 
                              color={config.isActive ? 'green' : 'gray'}
                              variant={config.isActive ? 'filled' : 'light'}
                            >
                              {config.isActive ? <IconCheck size={12} /> : <IconAlertTriangle size={12} />}
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={500}>
                                {config.isActive ? 'Sistema Activo' : 'Sistema Inactivo'}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {config.isActive ? 'Permite nuevas reservas' : 'No permite nuevas reservas'}
                              </Text>
                            </Stack>
                          </Group>
                          <Switch
                            checked={config.isActive}
                            onChange={(e) => handleConfigChange('isActive', e.currentTarget.checked)}
                            size="md"
                          />
                        </Group>
                      </Card>
                    </Stack>
                  </Stack>
                </Card.Section>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
        
        <Tabs.Panel value="blocks" pt="lg">
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
        </Tabs.Panel>
      </Tabs>

      {/* Summary Card */}
      <Card withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Card.Section p="md" withBorder>
          <Title order={4}>Resumen de Configuración</Title>
        </Card.Section>
        <Card.Section p="md">
          <Grid>


            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder ta="center" p="md">
                <Text size="xl" fw={700} c="green">
                  {config.advanceBookingDays || 7}
                </Text>
                <Text size="sm" c="dimmed">Días de anticipación</Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder ta="center" p="md">
                <Text size="xl" fw={700} c="violet">
                  {config.maxConcurrentEvents || 3}
                </Text>
                <Text size="sm" c="dimmed">Eventos simultáneos</Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Card.Section>
      </Card>

      {/* Changes Indicator */}
    </Stack>
  );
}