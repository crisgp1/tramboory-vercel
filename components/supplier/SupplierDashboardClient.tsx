"use client";

import {
  Paper,
  Button,
  Badge,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  ActionIcon,
  Divider,
  Alert,
  Card,
  Center,
  Loader
} from "@mantine/core";
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
  InformationCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { UnifiedSupplier, SupplierStatus, SupplierType } from "@/lib/types/supplier.types";
import { formatSupplierDisplay, needsProfileCompletion } from "@/lib/utils/supplier.utils";

// Updated types for unified supplier system
interface SupplierDashboardProps {
  userId?: string;
  userRole?: string;
  initialSupplierData?: UnifiedSupplier | null;
}

interface DashboardData {
  supplier: UnifiedSupplier;
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
}

export default function SupplierDashboardClient({
  userId,
  userRole,
  initialSupplierData
}: SupplierDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierDashboard();
  }, [userId]);

  const loadSupplierDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si tenemos datos iniciales, usarlos
      if (initialSupplierData) {
        await buildDashboardData(initialSupplierData);
        return;
      }

      // Si no hay userId, no podemos cargar datos
      if (!userId) {
        setError('No se pudo identificar el usuario');
        return;
      }

      // Obtener datos del proveedor desde la API
      const response = await fetch('/api/supplier/profile');
      if (!response.ok) {
        if (response.status === 403) {
          setError('Sin acceso de proveedor');
        } else {
          setError('Error al cargar datos del proveedor');
        }
        return;
      }

      const supplierData: UnifiedSupplier = await response.json();
      await buildDashboardData(supplierData);
      
    } catch (err) {
      console.error('Error loading supplier dashboard:', err);
      setError('Error inesperado al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const buildDashboardData = async (supplier: UnifiedSupplier) => {
    try {
      // TODO: Obtener datos reales de órdenes y productos desde APIs
      // Por ahora usamos datos mock
      const mockOrders = {
        pending: 3,
        approved: 5,
        ordered: 2,
        received: 8,
        total: 18
      };

      const mockProducts = {
        active: 12,
        inactive: 3,
        total: 15
      };

      const mockActivity = [
        {
          id: '1',
          type: 'order_approved',
          title: 'Orden #ORD-2024-001 Aprobada',
          description: 'Tu orden de materiales de oficina ha sido aprobada',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'order_in_process',
          title: 'Orden #ORD-2024-002 En Proceso',
          description: 'Orden de suministros de cocina en preparación',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'warning'
        },
        {
          id: '3',
          type: 'order_completed',
          title: 'Orden #ORD-2024-003 Entregada',
          description: 'Entrega exitosa de productos de limpieza',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        }
      ];

      setDashboardData({
        supplier,
        orders: mockOrders,
        products: mockProducts,
        recentActivity: mockActivity
      });
    } catch (err) {
      console.error('Error building dashboard data:', err);
      setError('Error al procesar datos del dashboard');
    }
  };

  // Estados de carga y error
  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Cargando dashboard de proveedor...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <Card withBorder p="xl" style={{ maxWidth: '500px', width: '100%' }}>
          <Stack align="center" gap="md">
            <ExclamationCircleIcon style={{ width: '3rem', height: '3rem', color: 'var(--mantine-color-orange-6)' }} />
            <Title order={3}>Acceso no disponible</Title>
            
            {error === 'Sin acceso de proveedor' ? (
              <Stack gap="sm">
                <Text ta="center" c="dimmed">
                  Tu cuenta no tiene un perfil de proveedor asociado.
                </Text>
                <Alert icon={<InformationCircleIcon style={{ width: '1rem', height: '1rem' }} />} color="blue">
                  Si deberías tener acceso como proveedor, contacta al administrador del sistema.
                </Alert>
              </Stack>
            ) : (
              <Text ta="center" c="dimmed">
                {error}
              </Text>
            )}
            
            <Group>
              <Button variant="light" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
              <Button variant="light" component={Link} href="/dashboard">
                Volver al Dashboard
              </Button>
            </Group>
          </Stack>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem'
      }}>
        <Text c="dimmed">No hay datos disponibles</Text>
      </div>
    );
  }

  const { supplier } = dashboardData;
  const supplierDisplay = formatSupplierDisplay(supplier);
  const needsCompletion = needsProfileCompletion(supplier);

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
      case "success": return "green";
      case "warning": return "yellow";
      case "danger": return "red";
      case "primary": return "blue";
      default: return "gray";
    }
  };
  
  return (
    <>
      {/* Bienvenida y alertas */}
      <div style={{ marginBottom: '2rem' }}>
        <Title order={2} mb="xs">Bienvenido, {supplierDisplay.displayName}</Title>
        <Text c="dimmed">Aquí tienes un resumen de tu actividad reciente y estado actual.</Text>
        
        {/* Alertas según el estado */}
        <Stack gap="sm" mt="md">
          {supplier.status === SupplierStatus.INVITED && (
            <Alert icon={<InformationCircleIcon style={{ width: '1rem', height: '1rem' }} />} color="blue">
              <Text fw={500}>¡Bienvenido al portal de proveedores!</Text>
              <Text size="sm">
                Tu cuenta ha sido activada. Completa tu perfil para aprovechar todas las funcionalidades.
              </Text>
            </Alert>
          )}
          
          {needsCompletion && (
            <Alert icon={<ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />} color="yellow">
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={500}>Perfil incompleto</Text>
                  <Text size="sm">
                    Completa tu información de contacto para recibir órdenes de compra.
                  </Text>
                </div>
                <Button size="sm" component={Link} href="/proveedor/perfil">
                  Completar
                </Button>
              </Group>
            </Alert>
          )}
          
          {supplier.status === SupplierStatus.INACTIVE && (
            <Alert icon={<ExclamationTriangleIcon style={{ width: '1rem', height: '1rem' }} />} color="orange">
              <Text fw={500}>Cuenta inactiva</Text>
              <Text size="sm">
                Tu cuenta está temporalmente inactiva. Contacta al administrador para más información.
              </Text>
            </Alert>
          )}
        </Stack>
      </div>
        
        {/* Tarjetas de resumen */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper withBorder p="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Órdenes Pendientes</Text>
                  <Text size="xl" fw={700}>{dashboardData.orders.pending}</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    De un total de {dashboardData.orders.total} órdenes
                  </Text>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--mantine-color-yellow-1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--mantine-color-yellow-6)' }} />
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper withBorder p="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Órdenes Aprobadas</Text>
                  <Text size="xl" fw={700}>{dashboardData.orders.approved}</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    Listas para procesar
                  </Text>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--mantine-color-green-1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--mantine-color-green-6)' }} />
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper withBorder p="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Órdenes En Proceso</Text>
                  <Text size="xl" fw={700}>{dashboardData.orders.ordered}</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    En camino a entrega
                  </Text>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--mantine-color-blue-1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--mantine-color-blue-6)' }} />
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper withBorder p="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Productos Activos</Text>
                  <Text size="xl" fw={700}>{dashboardData.products.active}</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    De un total de {dashboardData.products.total} productos
                  </Text>
                </div>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--mantine-color-violet-1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CubeIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--mantine-color-violet-6)' }} />
                </div>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
        
        {/* Contenido principal dividido en dos columnas */}
        <Grid>
          {/* Actividad reciente - 2 columnas */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder p="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Actividad Reciente</Title>
                <Link href="/proveedor/ordenes" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="light"
                    size="sm"
                    rightSection={<ChevronRightIcon className="w-4 h-4" />}
                  >
                    Ver todas
                  </Button>
                </Link>
              </Group>
              
              <Stack gap="md">
                {dashboardData.recentActivity.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">No hay actividad reciente</Text>
                ) : (
                  dashboardData.recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        borderRadius: 'var(--mantine-radius-lg)',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ marginTop: '0.25rem', flexShrink: 0 }}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" align="flex-start">
                          <Text fw={500} size="sm">{activity.title}</Text>
                          <Badge 
                            size="sm" 
                            color={getStatusColor(activity.status)} 
                            variant="light"
                          >
                            {formatTimeAgo(activity.timestamp)}
                          </Badge>
                        </Group>
                        <Text c="dimmed" size="sm" lineClamp={2}>{activity.description}</Text>
                      </div>
                    </div>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid.Col>
          
          {/* Acciones rápidas - 1 columna */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder p="md">
              <Title order={4} mb="md">Acciones Rápidas</Title>
              
              <Stack gap="xs">
                <Link href="/proveedor/ordenes" style={{ textDecoration: 'none' }}>
                  <Button
                    fullWidth
                    justify="flex-start"
                    leftSection={<ClipboardDocumentListIcon className="w-5 h-5" />}
                  >
                    Ver Órdenes Pendientes
                  </Button>
                </Link>
                
                <Link href="/proveedor/productos/nuevo" style={{ textDecoration: 'none' }}>
                  <Button
                    color="violet"
                    variant="light"
                    fullWidth
                    justify="flex-start"
                    leftSection={<CubeIcon className="w-5 h-5" />}
                  >
                    Registrar Nuevo Producto
                  </Button>
                </Link>
                
                <Link href="/proveedor/perfil" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="light"
                    fullWidth
                    justify="flex-start"
                    leftSection={<UserIcon className="w-5 h-5" />}
                  >
                    Actualizar Perfil
                  </Button>
                </Link>
              </Stack>
              
              <Divider mt="lg" mb="md" />
              
              <Title order={5} mb="md">Recursos</Title>
              
              <Stack gap="xs">
                <Link href="/proveedor/ayuda" style={{ textDecoration: 'none', color: 'var(--mantine-color-blue-6)' }}>
                  <Text size="sm" style={{ cursor: 'pointer' }} className="hover:underline">
                    Centro de Ayuda
                  </Text>
                </Link>
                <Link href="/proveedor/faq" style={{ textDecoration: 'none', color: 'var(--mantine-color-blue-6)' }}>
                  <Text size="sm" style={{ cursor: 'pointer' }} className="hover:underline">
                    Preguntas Frecuentes
                  </Text>
                </Link>
                <Link href="/proveedor/contacto" style={{ textDecoration: 'none', color: 'var(--mantine-color-blue-6)' }}>
                  <Text size="sm" style={{ cursor: 'pointer' }} className="hover:underline">
                    Contactar Soporte
                  </Text>
                </Link>
              </Stack>
            </Paper>
            
            {/* Calificación */}
            <Paper withBorder p="md" mt="md">
              <Title order={4} mb="sm">Tu Calificación</Title>
              
              <Group gap="sm" mb="md">
                <Text size="xl" fw={700}>
                  {supplier.overall_rating ? supplier.overall_rating.toFixed(1) : 'N/A'}
                </Text>
                <Group gap="xs">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        color: star <= Math.round(supplier.overall_rating || 0) ? '#fbbf24' : '#d1d5db'
                      }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </Group>
              </Group>
              
              {supplier.overall_rating && (
                <Stack gap="xs" mb="md">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Calidad</Text>
                    <Text size="sm" fw={500}>{supplier.rating_quality}/5</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Confiabilidad</Text>
                    <Text size="sm" fw={500}>{supplier.rating_reliability}/5</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Precio</Text>
                    <Text size="sm" fw={500}>{supplier.rating_pricing}/5</Text>
                  </Group>
                </Stack>
              )}
              
              <Link href="/proveedor/calificaciones" style={{ textDecoration: 'none' }}>
                <Button
                  variant="light"
                  size="sm"
                  fullWidth
                  rightSection={<ChevronRightIcon className="w-4 h-4" />}
                >
                  Ver detalles de calificación
                </Button>
              </Link>
            </Paper>
          </Grid.Col>
        </Grid>
      </>
    );
  }