"use client";

import { 
  Card, 
  CardBody, 
  Button, 
  Chip,
  Progress,
  Avatar
} from "@heroui/react";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  UserIcon,
  BellIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import SimpleHeader from "@/components/auth/SimpleHeader";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import SupplierNotificationCenter from "./SupplierNotificationCenter";
import SupplierPenaltyDisplay from "./SupplierPenaltyDisplay";

interface SupplierDashboardProps {
  dashboardData?: {
    supplier: {
      _id: string;
      name: string;
      code: string;
      rating: number;
      isActive: boolean;
      contactInfo: {
        email: string;
        [key: string]: any;
      };
    };
    orders: {
      pending: number;
      approved: number;
      ordered: number;
      received: number;
      total: number;
    };
    products: {
      active: number;
      inactive: number;
      total: number;
    };
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
      status: string;
    }>;
    stats?: {
      salesThisMonth: number;
      salesLastMonth: number;
      growthPercentage: number;
      averageOrderValue: number;
      completionRate: number;
      responseTime: string;
    };
  } | null;
}

export default function SupplierDashboardUber({ dashboardData }: SupplierDashboardProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader title="Portal de Proveedor" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="text-center">
            <BuildingStorefrontIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal de Proveedor</h1>
            <p className="text-gray-600 mb-6">
              No hay datos de proveedor asociados a tu cuenta.
            </p>
            <Button color="primary">Contactar Soporte</Button>
          </div>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    });
  };

  const stats = dashboardData.stats || {
    salesThisMonth: 45680,
    salesLastMonth: 38420,
    growthPercentage: 18.9,
    averageOrderValue: 2340,
    completionRate: 94.5,
    responseTime: "2h"
  };

  // Notifications are now handled by SupplierNotificationCenter component

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Uber-style */}
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <BuildingStorefrontIcon className="w-8 h-8" />
                <div>
                  <h1 className="font-bold text-lg">Portal Proveedor</h1>
                  <p className="text-xs text-gray-400 hidden sm:block">{dashboardData.supplier.name}</p>
                </div>
              </div>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center gap-2">
              {/* Notificaciones */}
              <SupplierNotificationCenter 
                supplierId={dashboardData.supplier._id}
                className="text-white"
              />

              {/* Avatar del usuario */}
              <div className="flex items-center gap-3">
                <Avatar
                  size="sm"
                  src=""
                  name={dashboardData.supplier.name}
                  className="hidden sm:block"
                />
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{dashboardData.supplier.name}</p>
                  <p className="text-xs text-gray-400">{dashboardData.supplier.code}</p>
                </div>
                
                {/* Logout Button */}
                <div className="hidden sm:block">
                  <LogoutButton 
                    variant="bordered" 
                    color="default" 
                    size="sm"
                    className="text-white border-white/30 hover:bg-white/10"
                    showIcon={false}
                  >
                    Salir
                  </LogoutButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación desktop */}
        <nav className="hidden lg:block border-t border-gray-800">
          <div className="px-4">
            <div className="flex gap-6">
              <Link href="/proveedor" className="py-3 border-b-2 border-white text-white font-medium">
                Dashboard
              </Link>
              <Link href="/proveedor/ordenes" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors">
                Órdenes
              </Link>
              <Link href="/proveedor/productos" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors">
                Productos
              </Link>
              <Link href="/proveedor/estadisticas" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors">
                Estadísticas
              </Link>
              <Link href="/proveedor/perfil" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors">
                Perfil
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-black text-white">
              <h2 className="font-bold text-lg">Menú</h2>
            </div>
            <nav className="p-4 space-y-2">
              <Link href="/proveedor" className="block px-4 py-2 bg-gray-100 rounded-lg font-medium">
                Dashboard
              </Link>
              <Link href="/proveedor/ordenes" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
                Órdenes
              </Link>
              <Link href="/proveedor/productos" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
                Productos
              </Link>
              <Link href="/proveedor/estadisticas" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
                Estadísticas
              </Link>
              <Link href="/proveedor/perfil" className="block px-4 py-2 hover:bg-gray-100 rounded-lg">
                Perfil
              </Link>
              <div className="px-4 py-2">
                <LogoutButton 
                  variant="light" 
                  color="danger" 
                  size="sm"
                  className="w-full justify-start"
                />
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Métricas principales estilo Uber */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Ventas del mes */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                <Chip
                  size="sm"
                  className={`${stats.growthPercentage > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {stats.growthPercentage > 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
                  {Math.abs(stats.growthPercentage)}%
                </Chip>
              </div>
              <p className="text-2xl font-bold">${stats.salesThisMonth.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Ventas este mes</p>
            </CardBody>
          </Card>

          {/* Órdenes activas */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ClipboardDocumentListIcon className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{dashboardData.orders.pending + dashboardData.orders.approved}</span>
              </div>
              <p className="text-lg font-semibold">Órdenes Activas</p>
              <p className="text-sm text-gray-500">Requieren atención</p>
            </CardBody>
          </Card>

          {/* Tasa de completado */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <Progress 
                  value={stats.completionRate} 
                  className="w-16" 
                  size="sm"
                  color="success"
                />
              </div>
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-sm text-gray-500">Tasa de completado</p>
            </CardBody>
          </Card>

          {/* Calificación */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-2">
                <StarIcon className="w-8 h-8 text-yellow-500" />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(dashboardData.supplier.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold">{dashboardData.supplier.rating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Calificación promedio</p>
            </CardBody>
          </Card>
        </div>

        {/* Acciones rápidas estilo Uber */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/proveedor/ordenes">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Gestionar Órdenes</h3>
                    <p className="text-blue-100">{dashboardData.orders.pending} pendientes</p>
                  </div>
                  <ClipboardDocumentListIcon className="w-12 h-12 text-blue-200" />
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link href="/proveedor/productos/nuevo">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Nuevo Producto</h3>
                    <p className="text-green-100">Agregar al catálogo</p>
                  </div>
                  <PlusIcon className="w-12 h-12 text-green-200" />
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link href="/proveedor/mensajes">
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Mensajes</h3>
                    <p className="text-purple-100">3 sin leer</p>
                  </div>
                  <ChatBubbleLeftIcon className="w-12 h-12 text-purple-200" />
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Órdenes recientes y actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Órdenes recientes */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-sm">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Órdenes Recientes</h2>
                  <Link href="/proveedor/ordenes">
                    <Button variant="light" size="sm" endContent={<ChevronRightIcon className="w-4 h-4" />}>
                      Ver todas
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {dashboardData.orders.pending > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Órdenes Pendientes</p>
                            <p className="text-sm text-gray-600">{dashboardData.orders.pending} órdenes esperan tu respuesta</p>
                          </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <TruckIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          <Chip size="sm" variant="flat" className="mt-1">
                            En proceso
                          </Chip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Panel de rendimiento */}
          <div>
            {/* Penalizaciones */}
            <SupplierPenaltyDisplay 
              supplierId={dashboardData.supplier._id} 
              className="mb-4"
            />
            
            <Card className="bg-white border-0 shadow-sm">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold mb-4">Tu Rendimiento</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Tiempo de respuesta</span>
                      <span className="text-sm font-bold text-green-600">{stats.responseTime}</span>
                    </div>
                    <Progress value={85} color="success" size="sm" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Productos activos</span>
                      <span className="text-sm font-bold">{dashboardData.products.active}/{dashboardData.products.total}</span>
                    </div>
                    <Progress value={(dashboardData.products.active / dashboardData.products.total) * 100} color="primary" size="sm" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Satisfacción del cliente</span>
                      <span className="text-sm font-bold">{(dashboardData.supplier.rating / 5 * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={dashboardData.supplier.rating / 5 * 100} color="warning" size="sm" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link href="/proveedor/estadisticas">
                    <Button color="primary" variant="flat" className="w-full">
                      Ver estadísticas completas
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Tips y recursos */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 mt-4">
              <CardBody className="p-6">
                <h3 className="font-bold mb-3">💡 Tip del día</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Mantén tu catálogo actualizado para recibir más órdenes. Los productos con fotos de alta calidad reciben 3x más pedidos.
                </p>
                <Button size="sm" variant="solid" color="primary">
                  Actualizar catálogo
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}