"use client";

import { 
  Card, 
  CardBody, 
  Button, 
  Chip 
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
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Define types for our props
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
  } | null;
}

export default function SupplierDashboardClient({ dashboardData }: SupplierDashboardProps) {
  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vista de Proveedor</h1>
          <p className="text-gray-600 mb-6">
            No hay datos de proveedor asociados a este usuario. Si eres administrador o gerente, puedes usar esta vista para pruebas o supervisión.
          </p>
        </div>
      </div>
    );
  }

  // Formato para mostrar tiempo relativo
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    });
  };
  
  // Mapeo de tipos de actividad a iconos
  const getActivityIcon = (type: string) => {
    switch(type) {
      case "order_created":
        return <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />;
      case "order_approved":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "order_in_process":
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case "order_completed":
        return <ArrowTrendingUpIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Mapeo de status a colores
  const getStatusColor = (status: string) => {
    switch(status) {
      case "success": return "success";
      case "warning": return "warning";
      case "danger": return "danger";
      case "primary": return "primary";
      default: return "default";
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegación */}
      <nav className="hidden lg:block w-64 border-r border-gray-200 bg-white h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-gray-900">Portal Proveedor</h1>
              <p className="text-xs text-gray-500">Gestiona tus órdenes y productos</p>
            </div>
          </div>
          
          <div className="space-y-1 mb-8">
            <Link href="/proveedor" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
              <div className="w-6 h-6 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <span>Dashboard</span>
            </Link>
            
            <Link href="/proveedor/ordenes" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <div className="w-6 h-6 flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </div>
              <span>Órdenes de Compra</span>
            </Link>
            
            <Link href="/proveedor/productos" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <div className="w-6 h-6 flex items-center justify-center">
                <CubeIcon className="w-5 h-5" />
              </div>
              <span>Productos</span>
            </Link>
            
            <Link href="/proveedor/perfil" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <div className="w-6 h-6 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <span>Perfil</span>
            </Link>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex flex-col px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{dashboardData.supplier.name}</p>
              <p className="text-xs text-gray-500">{dashboardData.supplier.contactInfo.email}</p>
              <div className="mt-1">
                <Chip size="sm" color={dashboardData.supplier.isActive ? "success" : "danger"} variant="flat">
                  {dashboardData.supplier.isActive ? "Activo" : "Inactivo"}
                </Chip>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8">
        {/* Header móvil */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-gray-900">Portal Proveedor</h1>
                <p className="text-xs text-gray-500">{dashboardData.supplier.name}</p>
              </div>
            </div>
            
            <Button isIconOnly variant="light" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
          
          {/* Navegación móvil */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Link href="/proveedor">
              <Button size="sm" color="primary" variant="flat" className="whitespace-nowrap">
                Dashboard
              </Button>
            </Link>
            <Link href="/proveedor/ordenes">
              <Button size="sm" variant="light" className="whitespace-nowrap">
                Órdenes
              </Button>
            </Link>
            <Link href="/proveedor/productos">
              <Button size="sm" variant="light" className="whitespace-nowrap">
                Productos
              </Button>
            </Link>
            <Link href="/proveedor/perfil">
              <Button size="sm" variant="light" className="whitespace-nowrap">
                Perfil
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {dashboardData.supplier.name}</h1>
          <p className="text-gray-600">Aquí tienes un resumen de tu actividad reciente y estado actual.</p>
        </div>
        
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Órdenes Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orders.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    De un total de {dashboardData.orders.total} órdenes
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Órdenes Aprobadas</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orders.approved}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Listas para procesar
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Órdenes En Proceso</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orders.ordered}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    En camino a entrega
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Productos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.products.active}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    De un total de {dashboardData.products.total} productos
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CubeIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Contenido principal dividido en dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad reciente - 2 columnas */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
                  <Link href="/proveedor/ordenes">
                    <Button
                      variant="light"
                      size="sm"
                      endContent={<ChevronRightIcon className="w-4 h-4" />}
                    >
                      Ver todas
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {dashboardData.recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No hay actividad reciente</p>
                  ) : (
                    dashboardData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="mt-1 flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                            <Chip size="sm" color={getStatusColor(activity.status)} variant="flat">
                              {formatTimeAgo(activity.timestamp)}
                            </Chip>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">{activity.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Acciones rápidas - 1 columna */}
          <div>
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                
                <div className="space-y-2">
                  <Link href="/proveedor/ordenes">
                    <Button
                      color="primary"
                      className="w-full justify-start"
                      startContent={<ClipboardDocumentListIcon className="w-5 h-5" />}
                    >
                      Ver Órdenes Pendientes
                    </Button>
                  </Link>
                  
                  <Link href="/proveedor/productos/nuevo">
                    <Button
                      color="secondary"
                      variant="flat"
                      className="w-full justify-start"
                      startContent={<CubeIcon className="w-5 h-5" />}
                    >
                      Registrar Nuevo Producto
                    </Button>
                  </Link>
                  
                  <Link href="/proveedor/perfil">
                    <Button
                      variant="flat"
                      className="w-full justify-start"
                      startContent={<UserIcon className="w-5 h-5" />}
                    >
                      Actualizar Perfil
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recursos</h3>
                  
                  <div className="space-y-2">
                    <Link href="/proveedor/ayuda" className="block text-sm text-blue-600 hover:underline">
                      Centro de Ayuda
                    </Link>
                    <Link href="/proveedor/faq" className="block text-sm text-blue-600 hover:underline">
                      Preguntas Frecuentes
                    </Link>
                    <Link href="/proveedor/contacto" className="block text-sm text-blue-600 hover:underline">
                      Contactar Soporte
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Calificación */}
            <Card className="border border-gray-200 mt-4">
              <CardBody className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Tu Calificación</h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-3xl font-bold text-gray-900">{dashboardData.supplier.rating.toFixed(1)}</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(dashboardData.supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                <Link href="/proveedor/calificaciones">
                  <Button
                    variant="light"
                    size="sm"
                    className="w-full"
                    endContent={<ChevronRightIcon className="w-4 h-4" />}
                  >
                    Ver detalles de calificación
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}