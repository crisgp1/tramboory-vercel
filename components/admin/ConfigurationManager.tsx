'use client';

import React, { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import {
  Card,
  CardBody
} from '@heroui/react';
import { PrimaryButton } from '@/components/shared/ui';
import {
  CubeIcon,
  SparklesIcon,
  CakeIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import {
  CubeIcon as CubeSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  CakeIcon as CakeSolidIcon,
  Cog6ToothIcon as CogSolidIcon,
  BuildingStorefrontIcon as BuildingSolidIcon
} from '@heroicons/react/24/solid';
import PackageManager from './PackageManager';
import FoodOptionsManager from './FoodOptionsManager';
import ExtraServicesManager from './ExtraServicesManager';
import EventThemeManager from './EventThemeManager';
import SystemConfigManager from './SystemConfigManager';

const configTabs = [
  {
    id: 'packages',
    label: 'Paquetes',
    icon: CubeIcon,
    iconSolid: CubeSolidIcon,
    description: 'Gestiona los paquetes de fiestas disponibles'
  },
  {
    id: 'food',
    label: 'Alimentos',
    icon: CakeIcon,
    iconSolid: CakeSolidIcon,
    description: 'Configura opciones de comida y bebidas'
  },
  {
    id: 'extras',
    label: 'Servicios Extras',
    icon: SparklesIcon,
    iconSolid: SparklesSolidIcon,
    description: 'Administra servicios adicionales'
  },
  {
    id: 'themes',
    label: 'Temas de Evento',
    icon: BuildingStorefrontIcon,
    iconSolid: BuildingSolidIcon,
    description: 'Gestiona temas y decoraciones'
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Cog6ToothIcon,
    iconSolid: CogSolidIcon,
    description: 'Configuración general del sistema'
  }
];

export default function ConfigurationManager() {
  const { isAdmin, isLoaded } = useRole();
  const [activeTab, setActiveTab] = useState('packages');

  // Solo permitir acceso a administradores
  if (!isLoaded) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="surface-card" style={{
        maxWidth: '28rem',
        margin: '0 auto',
        marginTop: 'var(--space-8)',
        padding: 'var(--space-6)',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: '600',
          marginBottom: 'var(--space-2)'
        }}>
          Acceso Restringido
        </h3>
        <p className="text-neutral-600">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
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
      case 'system':
        return <SystemConfigManager />;
      default:
        return <PackageManager />;
    }
  };

  const activeTabData = configTabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full space-y-6 p-6">
      {/* Professional Header */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Configuración del Sistema
              </h1>
              <p className="text-sm text-slate-600">
                Administra todos los componentes de las reservas
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Nordic Navigation Tabs */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardBody className="p-0">
          <div className="border-b border-slate-200">
            <nav className="flex gap-1 px-6 pt-4" aria-label="Tabs">
              {configTabs.map((tab) => {
                const Icon = tab.icon;
                const IconSolid = tab.iconSolid;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-4 py-3 text-sm font-medium transition-colors rounded-t-lg
                      flex items-center gap-2
                      ${
                        isActive
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5
                      ${isActive ? 'text-blue-600' : 'text-slate-500'}
                    `}>
                      {isActive ? (
                        <IconSolid className="icon-sm" />
                      ) : (
                        <Icon className="icon-sm" />
                      )}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </CardBody>
      </Card>

      {/* Nordic Tab Content */}
      <div className="min-h-[600px] space-y-6">
        {renderTabContent()}
      </div>
    </div>
  );
}