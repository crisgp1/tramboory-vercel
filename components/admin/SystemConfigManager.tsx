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
  Divider
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
        const defaultConfig = {
          advanceBookingDays: 7,
          maxConcurrentEvents: 3,
          defaultEventDuration: 4,
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
    
    console.log('🔍 DEBUG: Saving system config:', {
      configId: config._id,
      method: config._id ? 'PUT' : 'POST',
      restDays: config.restDays,
      timeBlocks: config.timeBlocks,
      fullConfig: config
    });
    
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
        notifications.show({ title: 'Success', message: 'Configuración guardada exitosamente', color: 'green' });
        setConfig(data.data);
        setHasChanges(false);
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Error al guardar la configuración', color: 'red' });
      }
    } catch (error) {
      console.error('Error saving system config:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar la configuración', color: 'red' });
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
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            leftSection={<IconCheck size={16} />}
            size="md"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
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
                      label="Días de anticipación mínima"
                      description={`Mínimo ${config.advanceBookingDays || 7} días de anticipación`}
                      value={config.advanceBookingDays || 7}
                      onChange={(value) => handleConfigChange('advanceBookingDays', typeof value === 'number' ? value : 1)}
                      min={1}
                      placeholder="7"
                    />

                    <NumberInput
                      label="Máximo de eventos simultáneos"
                      description={`Máximo ${config.maxConcurrentEvents || 3} eventos al mismo tiempo`}
                      value={config.maxConcurrentEvents || 3}
                      onChange={(value) => handleConfigChange('maxConcurrentEvents', typeof value === 'number' ? value : 1)}
                      min={1}
                      placeholder="3"
                    />

                    <NumberInput
                      label="Duración predeterminada del evento (horas)"
                      description={`Duración estándar: ${config.defaultEventDuration || 4} horas`}
                      value={config.defaultEventDuration || 4}
                      onChange={(value) => handleConfigChange('defaultEventDuration', typeof value === 'number' ? value : 4)}
                      min={1}
                      max={12}
                      placeholder="4"
                    />

                    <Stack gap="sm">
                      <Text size="sm" fw={500}>Estado del sistema</Text>
                      <Card 
                        withBorder
                        p="md" 
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: config.isActive ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-gray-0)',
                          borderColor: config.isActive ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-gray-3)'
                        }}
                        onClick={() => handleConfigChange('isActive', !config.isActive)}
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
      {hasChanges && (
        <Alert 
          icon={<IconAlertTriangle size={16} />}
          title="Cambios sin guardar"
          color="orange"
        >
          <div className="flex items-center justify-between">
            <span>Tienes cambios sin guardar en la configuración del sistema.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              loading={saving}
              className="ml-4"
            >
              Guardar ahora
            </Button>
          </div>
        </Alert>
      )}
    </Stack>
  );
}