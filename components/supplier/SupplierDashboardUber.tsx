"use client";

import {
  Paper,
  Button,
  Badge,
  Progress,
  Avatar,
  Group,
  Stack,
  Text,
  SimpleGrid,
  ActionIcon,
  Burger,
  Drawer,
  Title,
  Center,
  Divider,
  Grid
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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
  const [mobileMenuOpen, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);

  if (!dashboardData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <SimpleHeader title="Portal de Proveedor" />
        <Center style={{ minHeight: 'calc(100vh - 80px)' }} p="md">
          <Stack align="center" gap="md">
            <BuildingStorefrontIcon className="w-16 h-16 text-gray-400" />
            <Title order={2}>Portal de Proveedor</Title>
            <Text c="dimmed" ta="center" mb="lg">
              No hay datos de proveedor asociados a tu cuenta.
            </Text>
            <Button color="blue">Contactar Soporte</Button>
          </Stack>
        </Center>
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      {/* Header */}
      <Paper 
        component="header" 
        pos="sticky" 
        top={0} 
        style={{ zIndex: 50 }}
        p="md"
        bg="blue.6"
        c="white"
        withBorder
      >
        <Group justify="space-between">
          <Group>
            <Burger 
              opened={mobileMenuOpen} 
              onClick={toggleMobileMenu} 
              hiddenFrom="lg" 
              color="white"
            />
            <Group gap="sm">
              <BuildingStorefrontIcon className="w-8 h-8" />
              <Stack gap={0}>
                <Text fw={700} size="lg">Portal Proveedor</Text>
                <Text size="xs" c="blue.1" visibleFrom="sm">
                  {dashboardData.supplier.name}
                </Text>
              </Stack>
            </Group>
          </Group>

          <Group gap="sm">
            <SupplierNotificationCenter 
              supplierId={dashboardData.supplier._id}
              className="text-white"
            />
            <Group visibleFrom="sm">
              <Avatar
                size="sm"
                name={dashboardData.supplier.name}
              />
              <Stack gap={0} visibleFrom="md">
                <Text size="sm" fw={500}>{dashboardData.supplier.name}</Text>
                <Text size="xs" c="blue.1">{dashboardData.supplier.code}</Text>
              </Stack>
              <LogoutButton 
                variant="bordered" 
                color="default" 
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                showIcon={false}
              >
                Salir
              </LogoutButton>
            </Group>
          </Group>
        </Group>

        {/* Desktop Navigation */}
        <Group gap="lg" mt="md" visibleFrom="lg">
          <Button component={Link} href="/proveedor" variant="subtle" c="white" style={{ textDecoration: 'none', borderBottom: '2px solid white' }}>
            Dashboard
          </Button>
          <Button component={Link} href="/proveedor/ordenes" variant="subtle" c="blue.1" style={{ textDecoration: 'none' }}>
            Órdenes
          </Button>
          <Button component={Link} href="/proveedor/productos" variant="subtle" c="blue.1" style={{ textDecoration: 'none' }}>
            Productos
          </Button>
          <Button component={Link} href="/proveedor/estadisticas" variant="subtle" c="blue.1" style={{ textDecoration: 'none' }}>
            Estadísticas
          </Button>
          <Button component={Link} href="/proveedor/perfil" variant="subtle" c="blue.1" style={{ textDecoration: 'none' }}>
            Perfil
          </Button>
        </Group>
      </Paper>

      {/* Mobile Menu Drawer */}
      <Drawer opened={mobileMenuOpen} onClose={closeMobileMenu} size="md" hiddenFrom="lg" title="Menú">
        <Stack gap="xs">
          <Button component={Link} href="/proveedor" variant="light" fullWidth justify="start" style={{ textDecoration: 'none' }}>
            Dashboard
          </Button>
          <Button component={Link} href="/proveedor/ordenes" variant="subtle" fullWidth justify="start" style={{ textDecoration: 'none' }}>
            Órdenes
          </Button>
          <Button component={Link} href="/proveedor/productos" variant="subtle" fullWidth justify="start" style={{ textDecoration: 'none' }}>
            Productos
          </Button>
          <Button component={Link} href="/proveedor/estadisticas" variant="subtle" fullWidth justify="start" style={{ textDecoration: 'none' }}>
            Estadísticas
          </Button>
          <Button component={Link} href="/proveedor/perfil" variant="subtle" fullWidth justify="start" style={{ textDecoration: 'none' }}>
            Perfil
          </Button>
          <LogoutButton 
            variant="light" 
            color="danger" 
            size="sm"
            className="w-full"
          />
        </Stack>
      </Drawer>

      {/* Main Content */}
      <main style={{ padding: 'var(--mantine-spacing-md)', maxWidth: '7xl', margin: '0 auto' }}>
        {/* Metrics Grid */}
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md" mb="lg">
          {/* Sales Metric */}
          <Paper withBorder p="md" shadow="sm" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}>
            <Group justify="space-between" mb="xs">
              <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              <Badge
                size="sm"
                color={stats.growthPercentage > 0 ? 'green' : 'red'}
                variant="light"
              >
                {stats.growthPercentage > 0 ? '↗' : '↘'} {Math.abs(stats.growthPercentage)}%
              </Badge>
            </Group>
            <Text size="xl" fw={700} mb="xs">
              ${stats.salesThisMonth.toLocaleString()}
            </Text>
            <Text size="sm" c="dimmed">Ventas este mes</Text>
          </Paper>

          {/* Orders Metric */}
          <Paper withBorder p="md" shadow="sm" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}>
            <Group justify="space-between" mb="xs">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-500" />
              <Text size="xl" fw={700} c="blue.6">
                {dashboardData.orders.pending + dashboardData.orders.approved}
              </Text>
            </Group>
            <Text size="lg" fw={600} mb="xs">Órdenes Activas</Text>
            <Text size="sm" c="dimmed">Requieren atención</Text>
          </Paper>

          {/* Completion Rate */}
          <Paper withBorder p="md" shadow="sm" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}>
            <Group justify="space-between" mb="xs">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <Progress value={stats.completionRate} size="sm" color="green" w={64} />
            </Group>
            <Text size="xl" fw={700} mb="xs">{stats.completionRate}%</Text>
            <Text size="sm" c="dimmed">Tasa de completado</Text>
          </Paper>

          {/* Rating */}
          <Paper withBorder p="md" shadow="sm" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}>
            <Group justify="space-between" mb="xs">
              <StarIcon className="w-8 h-8 text-yellow-500" />
              <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(dashboardData.supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    style={{ fill: star <= Math.round(dashboardData.supplier.rating) ? 'currentColor' : 'none' }}
                  />
                ))}
              </Group>
            </Group>
            <Text size="xl" fw={700} mb="xs">{dashboardData.supplier.rating.toFixed(1)}</Text>
            <Text size="sm" c="dimmed">Calificación promedio</Text>
          </Paper>
        </SimpleGrid>

        {/* Quick Actions */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
          <Paper 
            component={Link} 
            href="/proveedor/ordenes"
            p="lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-blue-7))',
              color: 'white',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text size="xl" fw={700}>Gestionar Órdenes</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {dashboardData.orders.pending} pendientes
                </Text>
              </Stack>
              <ClipboardDocumentListIcon className="w-12 h-12" style={{ opacity: 0.8 }} />
            </Group>
          </Paper>

          <Paper 
            component={Link} 
            href="/proveedor/productos/nuevo"
            p="lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--mantine-color-green-6), var(--mantine-color-green-7))',
              color: 'white',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text size="xl" fw={700}>Nuevo Producto</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Agregar al catálogo</Text>
              </Stack>
              <PlusIcon className="w-12 h-12" style={{ opacity: 0.8 }} />
            </Group>
          </Paper>

          <Paper 
            component={Link} 
            href="/proveedor/mensajes"
            p="lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--mantine-color-violet-6), var(--mantine-color-violet-7))',
              color: 'white',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text size="xl" fw={700}>Mensajes</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>3 sin leer</Text>
              </Stack>
              <ChatBubbleLeftIcon className="w-12 h-12" style={{ opacity: 0.8 }} />
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Content Grid */}
        <Grid gutter="lg">
          {/* Recent Orders */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder p="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Title order={3}>Órdenes Recientes</Title>
                <Button component={Link} href="/proveedor/ordenes" variant="light" size="sm"
                  rightSection={<ChevronRightIcon className="w-4 h-4" />} style={{ textDecoration: 'none' }}>
                  Ver todas
                </Button>
              </Group>

              <Stack gap="md">
                {dashboardData.orders.pending > 0 && (
                  <Paper p="md" bg="yellow.0" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-yellow-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ClockIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <Stack gap={0}>
                          <Text fw={600}>Órdenes Pendientes</Text>
                          <Text size="sm" c="dimmed">
                            {dashboardData.orders.pending} órdenes esperan tu respuesta
                          </Text>
                        </Stack>
                      </Group>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </Group>
                  </Paper>
                )}

                {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                  <Paper key={activity.id} p="md" withBorder
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}>
                    <Group justify="space-between">
                      <Group>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TruckIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <Stack gap={0}>
                          <Text fw={600}>{activity.title}</Text>
                          <Text size="sm" c="dimmed">{activity.description}</Text>
                        </Stack>
                      </Group>
                      <Stack gap={0} align="flex-end">
                        <Text size="xs" c="dimmed">{formatTimeAgo(activity.timestamp)}</Text>
                        <Badge size="sm" variant="light" mt="xs">En proceso</Badge>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Performance Panel */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack>
            <SupplierPenaltyDisplay 
              supplierId={dashboardData.supplier._id} 
              className="mb-4"
            />
            
            <Paper withBorder p="lg" shadow="sm">
              <Title order={3} mb="md">Tu Rendimiento</Title>
              
              <Stack gap="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Tiempo de respuesta</Text>
                    <Text size="sm" fw={700} c="green.6">{stats.responseTime}</Text>
                  </Group>
                  <Progress value={85} color="green" size="sm" />
                </Stack>

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Productos activos</Text>
                    <Text size="sm" fw={700}>
                      {dashboardData.products.active}/{dashboardData.products.total}
                    </Text>
                  </Group>
                  <Progress 
                    value={(dashboardData.products.active / dashboardData.products.total) * 100} 
                    color="blue" 
                    size="sm" 
                  />
                </Stack>

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Satisfacción del cliente</Text>
                    <Text size="sm" fw={700}>
                      {(dashboardData.supplier.rating / 5 * 100).toFixed(0)}%
                    </Text>
                  </Group>
                  <Progress 
                    value={dashboardData.supplier.rating / 5 * 100} 
                    color="yellow" 
                    size="sm" 
                  />
                </Stack>
              </Stack>

              <Divider my="lg" />
              <Button component={Link} href="/proveedor/estadisticas" color="blue" variant="light" fullWidth style={{ textDecoration: 'none' }}>
                Ver estadísticas completas
              </Button>
            </Paper>

            {/* Tips Card */}
            <Paper 
              p="lg" 
              mt="md"
              style={{ 
                background: 'linear-gradient(135deg, var(--mantine-color-blue-0), var(--mantine-color-blue-1))',
              }}
              withBorder
            >
              <Text fw={700} mb="xs">💡 Tip del día</Text>
              <Text size="sm" c="dimmed" mb="md">
                Mantén tu catálogo actualizado para recibir más órdenes. Los productos con fotos de alta calidad reciben 3x más pedidos.
              </Text>
              <Button size="sm" color="blue">
                Actualizar catálogo
              </Button>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
      </main>
    </div>
  );
}