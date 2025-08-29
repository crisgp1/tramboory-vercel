'use client';

import React, { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import {
  Paper,
  Title,
  Text,
  Stack,
  Tabs,
  Center,
  Loader,
  ThemeIcon
} from '@mantine/core';
import {
  IconBox,
  IconSparkles,
  IconCake,
  IconSettings,
  IconBuildingStore,
  IconAlertTriangle,
  IconPhone
} from '@tabler/icons-react';
import PackageManager from './PackageManager';
import FoodOptionsManager from './FoodOptionsManager';
import ExtraServicesManager from './ExtraServicesManager';
import EventThemeManager from './EventThemeManager';
import SystemConfigManager from './SystemConfigManager';
import { ContactSettingsManager } from './ContactSettingsManager';

const configTabs = [
  {
    id: 'packages',
    label: 'Paquetes',
    icon: IconBox,
    description: 'Gestiona los paquetes de fiestas disponibles'
  },
  {
    id: 'food',
    label: 'Alimentos',
    icon: IconCake,
    description: 'Configura opciones de comida y bebidas'
  },
  {
    id: 'extras',
    label: 'Servicios Extras',
    icon: IconSparkles,
    description: 'Administra servicios adicionales'
  },
  {
    id: 'themes',
    label: 'Temas de Evento',
    icon: IconBuildingStore,
    description: 'Gestiona temas y decoraciones'
  },
  {
    id: 'contact',
    label: 'Datos de Contacto',
    icon: IconPhone,
    description: 'Información de contacto y WhatsApp'
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: IconSettings,
    description: 'Configuración general del sistema'
  }
];

export default function ConfigurationManager() {
  const { isAdmin, isLoaded } = useRole();
  const [activeTab, setActiveTab] = useState('packages');

  // Solo permitir acceso a administradores
  if (!isLoaded) {
    return (
      <Center h={200}>
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text c="dimmed">Cargando...</Text>
        </Stack>
      </Center>
    );
  }

  if (!isAdmin) {
    return (
      <Center h="60vh">
        <Paper p="xl" radius="md" withBorder shadow="sm" style={{maxWidth: 400, width: '100%'}}>
          <Stack align="center" gap="lg">
            <ThemeIcon size="xl" radius="xl" color="red">
              <IconAlertTriangle size={32} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
              <Title order={3}>Acceso Restringido</Title>
              <Text c="dimmed" ta="center">No tienes permisos para acceder a esta sección.</Text>
            </Stack>
          </Stack>
        </Paper>
      </Center>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'packages':
        return <PackageManager />;
      case 'food':
        return <FoodOptionsManager />;
      case 'extras':
        return <ExtraServicesManager />;
      case 'themes':
        return <EventThemeManager />;
      case 'contact':
        return <ContactSettingsManager />;
      case 'system':
        return <SystemConfigManager />;
      default:
        return <PackageManager />;
    }
  };

  const activeTabData = configTabs.find(tab => tab.id === activeTab);

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Stack gap="xs">
          <Title order={2}>Configuración del Sistema</Title>
          <Text c="dimmed">Administra todos los componentes de las reservas</Text>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'packages')}>
        <Tabs.List>
          {configTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tabs.Tab
                key={tab.id}
                value={tab.id}
                leftSection={<Icon size={16} />}
              >
                {tab.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        <Tabs.Panel value={activeTab} pt="lg">
          <div style={{ minHeight: 600 }}>
            {renderTabContent()}
          </div>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}