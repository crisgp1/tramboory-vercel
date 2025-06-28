'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Divider
} from '@heroui/react';
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
  const [activeTab, setActiveTab] = useState('packages');

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra todos los componentes de las reservas
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {configTabs.map((tab) => {
                const Icon = tab.icon;
                const IconSolid = tab.iconSolid;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-3 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${isActive 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200
                      ${isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {isActive ? (
                        <IconSolid className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </CardBody>
      </Card>

      {/* Active Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}