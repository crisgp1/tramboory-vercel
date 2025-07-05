"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Progress,
  Select,
  SelectItem,
  Tabs,
  Tab
} from "@heroui/react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  StarIcon,
  CalendarIcon,
  ChartBarIcon,
  PresentationChartLineIcon
} from "@heroicons/react/24/outline";
// Using CSS-based charts instead of recharts to avoid additional dependencies

interface StatsDashboardProps {
  supplierId: string;
}

interface StatsData {
  salesOverTime: Array<{ month: string; sales: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; color: string }>;
  topProducts: Array<{ name: string; sales: number; orders: number }>;
  performanceMetrics: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    completionRate: number;
    responseTime: number;
    customerSatisfaction: number;
    growthRate: number;
    onTimeDelivery: number;
  };
  monthlyComparison: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
}

export default function SupplierStatsDashboard({ supplierId }: StatsDashboardProps) {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchStats();
  }, [supplierId, selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/stats?supplierId=${supplierId}&period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Mock data for demonstration
      setStatsData(generateMockStats());
    } finally {
      setLoading(false);
    }
  };

  const generateMockStats = (): StatsData => ({
    salesOverTime: [
      { month: "Ene", sales: 45000, orders: 23 },
      { month: "Feb", sales: 52000, orders: 28 },
      { month: "Mar", sales: 48000, orders: 25 },
      { month: "Abr", sales: 61000, orders: 32 },
      { month: "May", sales: 55000, orders: 29 },
      { month: "Jun", sales: 67000, orders: 35 }
    ],
    ordersByStatus: [
      { status: "Completadas", count: 142, color: "#10B981" },
      { status: "En Proceso", count: 28, color: "#3B82F6" },
      { status: "Pendientes", count: 15, color: "#F59E0B" },
      { status: "Canceladas", count: 5, color: "#EF4444" }
    ],
    topProducts: [
      { name: "Laptop HP ProBook 450", sales: 125000, orders: 45 },
      { name: "Monitor Samsung 24\"", sales: 89000, orders: 67 },
      { name: "Teclado Logitech", sales: 45000, orders: 89 },
      { name: "Mouse Inalámbrico", sales: 23000, orders: 156 },
      { name: "Impresora Canon", sales: 67000, orders: 23 }
    ],
    performanceMetrics: {
      totalSales: 328000,
      totalOrders: 190,
      averageOrderValue: 1726,
      completionRate: 94.7,
      responseTime: 2.3,
      customerSatisfaction: 4.6,
      growthRate: 18.5,
      onTimeDelivery: 96.2
    },
    monthlyComparison: {
      thisMonth: 67000,
      lastMonth: 55000,
      change: 21.8
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              <Chip size="sm" color="success" variant="flat">
                +{statsData?.monthlyComparison.change.toFixed(1)}%
              </Chip>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(statsData?.performanceMetrics.totalSales || 0)}
            </p>
            <p className="text-sm text-green-600">Ventas Totales</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-800">
                {statsData?.performanceMetrics.totalOrders || 0}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(statsData?.performanceMetrics.averageOrderValue || 0)}
            </p>
            <p className="text-sm text-blue-600">Valor Promedio</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="w-8 h-8 text-purple-600" />
              <Progress 
                value={statsData?.performanceMetrics.completionRate || 0}
                color="secondary"
                size="sm"
                className="w-16"
              />
            </div>
            <p className="text-2xl font-bold text-purple-800">
              {statsData?.performanceMetrics.completionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-purple-600">Tasa de Completado</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <StarIcon className="w-8 h-8 text-orange-600" />
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(statsData?.performanceMetrics.customerSatisfaction || 0) ? 'text-orange-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-800">
              {statsData?.performanceMetrics.customerSatisfaction.toFixed(1)}
            </p>
            <p className="text-sm text-orange-600">Satisfacción</p>
          </CardBody>
        </Card>
      </div>

      {/* Gráfico de ventas */}
      <Card>
        <CardBody className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Tendencia de Ventas</h3>
            <Select
              selectedKeys={[selectedPeriod]}
              onSelectionChange={(keys) => setSelectedPeriod(Array.from(keys)[0] as string)}
              className="w-32"
              size="sm"
            >
              <SelectItem key="3months" value="3months">3 meses</SelectItem>
              <SelectItem key="6months" value="6months">6 meses</SelectItem>
              <SelectItem key="12months" value="12months">12 meses</SelectItem>
            </Select>
          </div>
          
          <div className="h-80">
            <div className="flex items-end justify-between h-full px-4 py-6 space-x-2">
              {statsData?.salesOverTime.map((data, index) => {
                const maxSales = Math.max(...(statsData?.salesOverTime.map(d => d.sales) || []));
                const height = (data.sales / maxSales) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-400 cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${data.month}: ${formatCurrency(data.sales)} (${data.orders} órdenes)`}
                      ></div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-gray-700">{data.month}</p>
                      <p className="text-xs text-gray-500">${(data.sales / 1000).toFixed(0)}k</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribución de órdenes por estado */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-xl font-bold mb-4">Órdenes por Estado</h3>
          <div className="h-64 flex flex-col justify-center">
            <div className="space-y-3">
              {statsData?.ordersByStatus.map((status, index) => {
                const total = statsData.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
                const percentage = (status.count / total) * 100;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{status.status}</span>
                        <span className="text-sm text-gray-500">{status.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: status.color
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Top productos */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-xl font-bold mb-4">Productos Más Vendidos</h3>
          <div className="h-64">
            <div className="space-y-3">
              {statsData?.topProducts.slice(0, 5).map((product, index) => {
                const maxSales = Math.max(...(statsData?.topProducts.map(p => p.sales) || []));
                const percentage = (product.sales / maxSales) * 100;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 text-center">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">{product.name}</span>
                        <span className="text-sm text-gray-900 font-semibold">{formatCurrency(product.sales)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">{product.orders} órdenes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Métricas de rendimiento */}
      <Card className="lg:col-span-2">
        <CardBody className="p-6">
          <h3 className="text-xl font-bold mb-4">Métricas de Rendimiento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.performanceMetrics.responseTime.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Tiempo de Respuesta</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TruckIcon className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.performanceMetrics.onTimeDelivery.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Entrega a Tiempo</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                +{statsData?.performanceMetrics.growthRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Crecimiento</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <StarIcon className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {statsData?.performanceMetrics.customerSatisfaction.toFixed(1)}/5
              </p>
              <p className="text-sm text-gray-500">Calificación</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Estadísticas</h1>
              <p className="text-gray-600">Analiza tu rendimiento y métricas clave</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="flat"
                startContent={<PresentationChartLineIcon className="w-5 h-5" />}
                onClick={() => window.print()}
              >
                Exportar Reporte
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="mb-6"
        >
          <Tab 
            key="overview" 
            title={
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4" />
                Vista General
              </div>
            }
          >
            {renderOverviewTab()}
          </Tab>
          
          <Tab 
            key="analytics" 
            title={
              <div className="flex items-center gap-2">
                <PresentationChartLineIcon className="w-4 h-4" />
                Análisis Detallado
              </div>
            }
          >
            {renderAnalyticsTab()}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}