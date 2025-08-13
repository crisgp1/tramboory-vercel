"use client";

import { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Badge,
  Progress,
  Select,
  Tabs,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  Center,
  Loader
} from "@mantine/core";
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
    <Stack gap="lg">
      {/* Métricas principales */}
      <Grid>
        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Paper 
            withBorder 
            p="md"
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderColor: '#bbf7d0'
            }}
          >
            <Group justify="space-between" mb="xs">
              <CurrencyDollarIcon style={{ width: '2rem', height: '2rem', color: '#059669' }} />
              <Badge size="sm" color="green" variant="light">
                +{statsData?.monthlyComparison.change.toFixed(1)}%
              </Badge>
            </Group>
            <Text size="xl" fw={700} style={{ color: '#065f46' }}>
              {formatCurrency(statsData?.performanceMetrics.totalSales || 0)}
            </Text>
            <Text size="sm" style={{ color: '#059669' }}>Ventas Totales</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Paper 
            withBorder 
            p="md"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderColor: '#93c5fd'
            }}
          >
            <Group justify="space-between" mb="xs">
              <ClipboardDocumentListIcon style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
              <Text size="xl" fw={700} style={{ color: '#1e40af' }}>
                {statsData?.performanceMetrics.totalOrders || 0}
              </Text>
            </Group>
            <Text size="xl" fw={700} style={{ color: '#1e40af' }}>
              {formatCurrency(statsData?.performanceMetrics.averageOrderValue || 0)}
            </Text>
            <Text size="sm" style={{ color: '#2563eb' }}>Valor Promedio</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Paper 
            withBorder 
            p="md"
            style={{
              background: 'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)',
              borderColor: '#c4b5fd'
            }}
          >
            <Group justify="space-between" mb="xs">
              <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: '#7c3aed' }} />
              <Progress 
                value={statsData?.performanceMetrics.completionRate || 0}
                color="violet"
                size="sm"
                w={60}
              />
            </Group>
            <Text size="xl" fw={700} style={{ color: '#5b21b6' }}>
              {statsData?.performanceMetrics.completionRate.toFixed(1)}%
            </Text>
            <Text size="sm" style={{ color: '#7c3aed' }}>Tasa de Completado</Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 6, lg: 3 }}>
          <Paper 
            withBorder 
            p="md"
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
              borderColor: '#fdba74'
            }}
          >
            <Group justify="space-between" mb="xs">
              <StarIcon style={{ width: '2rem', height: '2rem', color: '#ea580c' }} />
              <Group gap="xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      color: star <= Math.round(statsData?.performanceMetrics.customerSatisfaction || 0) ? '#fb923c' : '#d1d5db',
                      fill: star <= Math.round(statsData?.performanceMetrics.customerSatisfaction || 0) ? '#fb923c' : 'transparent'
                    }}
                  />
                ))}
              </Group>
            </Group>
            <Text size="xl" fw={700} style={{ color: '#9a3412' }}>
              {statsData?.performanceMetrics.customerSatisfaction.toFixed(1)}
            </Text>
            <Text size="sm" style={{ color: '#ea580c' }}>Satisfacción</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Gráfico de ventas */}
      <Paper withBorder p="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Tendencia de Ventas</Title>
          <Select
            value={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value || "6months")}
            data={[
              { value: "3months", label: "3 meses" },
              { value: "6months", label: "6 meses" },
              { value: "12months", label: "12 meses" }
            ]}
            w={120}
            size="sm"
          />
        </Group>
        
        <div style={{ height: '20rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'end', 
            justifyContent: 'space-between', 
            height: '100%', 
            padding: '1.5rem 1rem', 
            gap: '0.5rem' 
          }}>
            {statsData?.salesOverTime.map((data, index) => {
              const maxSales = Math.max(...(statsData?.salesOverTime.map(d => d.sales) || []));
              const height = (data.sales / maxSales) * 100;
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  flex: 1 
                }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{
                        width: '100%',
                        background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                        borderRadius: '0.5rem 0.5rem 0 0',
                        transition: 'all 0.5s ease',
                        cursor: 'pointer',
                        height: `${height}%`
                      }}
                      title={`${data.month}: ${formatCurrency(data.sales)} (${data.orders} órdenes)`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to top, #2563eb, #3b82f6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to top, #3b82f6, #60a5fa)';
                      }}
                    ></div>
                  </div>
                  <Stack gap="xs" mt="sm" align="center">
                    <Text size="xs" fw={500}>{data.month}</Text>
                    <Text size="xs" c="dimmed">${(data.sales / 1000).toFixed(0)}k</Text>
                  </Stack>
                </div>
              );
            })}
          </div>
        </div>
      </Paper>
    </Stack>
  );

  const renderAnalyticsTab = () => (
    <Grid>
      {/* Distribución de órdenes por estado */}
      <Grid.Col span={{ base: 12, lg: 6 }}>
        <Paper withBorder p="xl">
          <Title order={3} mb="md">Órdenes por Estado</Title>
          <div style={{ height: '16rem' }}>
            <Stack justify="center" h="100%" gap="md">
              {statsData?.ordersByStatus.map((status, index) => {
                const total = statsData.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
                const percentage = (status.count / total) * 100;
                return (
                  <Group key={index} gap="md">
                    <div 
                      style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '50%',
                        backgroundColor: status.color
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>{status.status}</Text>
                        <Text size="sm" c="dimmed">{status.count} ({percentage.toFixed(1)}%)</Text>
                      </Group>
                      <div style={{
                        width: '100%',
                        height: '0.5rem',
                        backgroundColor: 'var(--mantine-color-gray-2)',
                        borderRadius: '0.25rem',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: status.color,
                            width: `${percentage}%`,
                            transition: 'all 0.5s ease',
                            borderRadius: '0.25rem'
                          }}
                        />
                      </div>
                    </div>
                  </Group>
                );
              })}
            </Stack>
          </div>
        </Paper>
      </Grid.Col>

      {/* Top productos */}
      <Grid.Col span={{ base: 12, lg: 6 }}>
        <Paper withBorder p="xl">
          <Title order={3} mb="md">Productos Más Vendidos</Title>
          <div style={{ height: '16rem' }}>
            <Stack gap="md">
              {statsData?.topProducts.slice(0, 5).map((product, index) => {
                const maxSales = Math.max(...(statsData?.topProducts.map(p => p.sales) || []));
                const percentage = (product.sales / maxSales) * 100;
                return (
                  <Group key={index} gap="md">
                    <div style={{ width: '2rem', textAlign: 'center' }}>
                      <Text size="lg" fw={700} c="dimmed">#{index + 1}</Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500} truncate style={{ maxWidth: '60%' }}>
                          {product.name}
                        </Text>
                        <Text size="sm" fw={600}>{formatCurrency(product.sales)}</Text>
                      </Group>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" c="dimmed">{product.orders} órdenes</Text>
                      </Group>
                      <div style={{
                        width: '100%',
                        height: '0.5rem',
                        backgroundColor: 'var(--mantine-color-gray-2)',
                        borderRadius: '0.25rem',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            background: 'linear-gradient(to right, #22c55e, #16a34a)',
                            height: '100%',
                            width: `${percentage}%`,
                            transition: 'all 0.5s ease',
                            borderRadius: '0.25rem'
                          }}
                        />
                      </div>
                    </div>
                  </Group>
                );
              })}
            </Stack>
          </div>
        </Paper>
      </Grid.Col>

      {/* Métricas de rendimiento */}
      <Grid.Col span={12}>
        <Paper withBorder p="xl">
          <Title order={3} mb="md">Métricas de Rendimiento</Title>
          <Grid>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Center>
                <Stack align="center" gap="sm">
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: 'var(--mantine-color-blue-1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ClockIcon style={{ width: '2rem', height: '2rem', color: 'var(--mantine-color-blue-6)' }} />
                  </div>
                  <Text size="xl" fw={700}>
                    {statsData?.performanceMetrics.responseTime.toFixed(1)}h
                  </Text>
                  <Text size="sm" c="dimmed">Tiempo de Respuesta</Text>
                </Stack>
              </Center>
            </Grid.Col>
            
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Center>
                <Stack align="center" gap="sm">
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: 'var(--mantine-color-green-1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TruckIcon style={{ width: '2rem', height: '2rem', color: 'var(--mantine-color-green-6)' }} />
                  </div>
                  <Text size="xl" fw={700}>
                    {statsData?.performanceMetrics.onTimeDelivery.toFixed(1)}%
                  </Text>
                  <Text size="sm" c="dimmed">Entrega a Tiempo</Text>
                </Stack>
              </Center>
            </Grid.Col>
            
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Center>
                <Stack align="center" gap="sm">
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: 'var(--mantine-color-violet-1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowTrendingUpIcon style={{ width: '2rem', height: '2rem', color: 'var(--mantine-color-violet-6)' }} />
                  </div>
                  <Text size="xl" fw={700}>
                    +{statsData?.performanceMetrics.growthRate.toFixed(1)}%
                  </Text>
                  <Text size="sm" c="dimmed">Crecimiento</Text>
                </Stack>
              </Center>
            </Grid.Col>
            
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Center>
                <Stack align="center" gap="sm">
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: 'var(--mantine-color-orange-1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <StarIcon style={{ width: '2rem', height: '2rem', color: 'var(--mantine-color-orange-6)' }} />
                  </div>
                  <Text size="xl" fw={700}>
                    {statsData?.performanceMetrics.customerSatisfaction.toFixed(1)}/5
                  </Text>
                  <Text size="sm" c="dimmed">Calificación</Text>
                </Stack>
              </Center>
            </Grid.Col>
          </Grid>
        </Paper>
      </Grid.Col>
    </Grid>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', padding: '1.5rem' }}>
        <Stack gap="md">
          <div style={{ 
            height: '2rem', 
            backgroundColor: 'var(--mantine-color-gray-2)', 
            borderRadius: 'var(--mantine-radius-sm)', 
            width: '25%' 
          }} />
          <Grid>
            {[1, 2, 3, 4].map(i => (
              <Grid.Col key={i} span={3}>
                <div style={{ 
                  height: '8rem', 
                  backgroundColor: 'var(--mantine-color-gray-2)', 
                  borderRadius: 'var(--mantine-radius-sm)' 
                }} />
              </Grid.Col>
            ))}
          </Grid>
          <div style={{ 
            height: '20rem', 
            backgroundColor: 'var(--mantine-color-gray-2)', 
            borderRadius: 'var(--mantine-radius-sm)' 
          }} />
        </Stack>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      {/* Header */}
      <Paper shadow="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <div style={{ padding: '1rem 1.5rem' }}>
          <Group justify="space-between">
            <div>
              <Title order={2}>Panel de Estadísticas</Title>
              <Text c="dimmed">Analiza tu rendimiento y métricas clave</Text>
            </div>
            <Button
              variant="light"
              leftSection={<PresentationChartLineIcon className="w-5 h-5" />}
              onClick={() => window.print()}
            >
              Exportar Reporte
            </Button>
          </Group>
        </div>
      </Paper>

      {/* Contenido */}
      <div style={{ padding: '1.5rem' }}>
        <Tabs 
          value={activeTab} 
          onChange={(value) => setActiveTab(value || "overview")}
        >
          <Tabs.List mb="lg">
            <Tabs.Tab 
              value="overview"
              leftSection={<ChartBarIcon className="w-4 h-4" />}
            >
              Vista General
            </Tabs.Tab>
            
            <Tabs.Tab 
              value="analytics"
              leftSection={<PresentationChartLineIcon className="w-4 h-4" />}
            >
              Análisis Detallado
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            {renderOverviewTab()}
          </Tabs.Panel>
          
          <Tabs.Panel value="analytics">
            {renderAnalyticsTab()}
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}