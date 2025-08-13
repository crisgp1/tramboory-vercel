# SupplierDashboardUber Migration Specification

This document provides detailed specifications for migrating the main supplier dashboard from HeroUI to Mantine components.

## Component Analysis

### Current Implementation
- **File**: `components/supplier/SupplierDashboardUber.tsx`
- **Primary HeroUI Components**: Card, CardBody, Button, Chip, Progress, Avatar
- **Dependencies**: LogoutButton, SimpleHeader, SupplierNotificationCenter, SupplierPenaltyDisplay
- **Complex Features**: Uber-style dashboard, responsive mobile menu, metrics cards, progress indicators

### HeroUI Components Used
1. `Card` - Used extensively for metric cards and content sections
2. `CardBody` - Wrapper for card content
3. `Button` - Various actions and navigation
4. `Chip` - Status indicators and badges
5. `Progress` - Performance metrics display
6. `Avatar` - User profile display

## Migration Specification

### Import Statement Updates
```typescript
// Replace HeroUI imports:
import { 
  Card, 
  CardBody, 
  Button, 
  Chip,
  Progress,
  Avatar
} from "@heroui/react";

// With Mantine imports:
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
  Drawer
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
```

### Component Structure Migration

#### 1. Metrics Cards Section
**Current HeroUI Pattern:**
```typescript
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
```

**New Mantine Pattern:**
```typescript
<Paper withBorder p="md" shadow="sm" style={{ cursor: 'pointer' }} 
  sx={{ '&:hover': { boxShadow: 'md' } }}>
  <Group justify="space-between" mb="xs">
    <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
    <Badge
      size="sm"
      color={stats.growthPercentage > 0 ? 'green' : 'red'}
      variant="light"
      leftSection={stats.growthPercentage > 0 ? 
        <ArrowUpIcon className="w-3 h-3" /> : 
        <ArrowDownIcon className="w-3 h-3" />
      }
    >
      {Math.abs(stats.growthPercentage)}%
    </Badge>
  </Group>
  <Text size="xl" fw={700} mb="xs">
    ${stats.salesThisMonth.toLocaleString()}
  </Text>
  <Text size="sm" c="dimmed">Ventas este mes</Text>
</Paper>
```

#### 2. Quick Actions Section
**Current HeroUI Pattern:**
```typescript
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
</div>
```

**New Mantine Pattern:**
```typescript
<SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
  <Paper 
    component={Link} 
    href="/proveedor/ordenes"
    p="lg"
    style={{ 
      background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-blue-7))',
      color: 'white',
      cursor: 'pointer',
      textDecoration: 'none'
    }}
    sx={{ '&:hover': { boxShadow: 'lg' } }}
  >
    <Group justify="space-between" align="flex-start">
      <Stack gap="xs">
        <Text size="xl" fw={700}>Gestionar Órdenes</Text>
        <Text c="blue.1">{dashboardData.orders.pending} pendientes</Text>
      </Stack>
      <ClipboardDocumentListIcon className="w-12 h-12" style={{ opacity: 0.8 }} />
    </Group>
  </Paper>
</SimpleGrid>
```

#### 3. Performance Progress Section
**Current HeroUI Pattern:**
```typescript
<div>
  <div className="flex justify-between items-center mb-1">
    <span className="text-sm font-medium">Tiempo de respuesta</span>
    <span className="text-sm font-bold text-green-600">{stats.responseTime}</span>
  </div>
  <Progress value={85} color="success" size="sm" />
</div>
```

**New Mantine Pattern:**
```typescript
<Stack gap="xs">
  <Group justify="space-between">
    <Text size="sm" fw={500}>Tiempo de respuesta</Text>
    <Text size="sm" fw={700} c="green.6">{stats.responseTime}</Text>
  </Group>
  <Progress value={85} color="green" size="sm" />
</Stack>
```

#### 4. Mobile Menu Implementation
**Current HeroUI Pattern:**
```typescript
{mobileMenuOpen && (
  <div className="lg:hidden fixed inset-0 z-40" style={{
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  }} onClick={() => setMobileMenuOpen(false)}>
    <div className="bg-white w-64 h-full shadow-lg" onClick={e => e.stopPropagation()}>
      {/* Menu content */}
    </div>
  </div>
)}
```

**New Mantine Pattern:**
```typescript
<Drawer
  opened={mobileMenuOpen}
  onClose={() => setMobileMenuOpen(false)}
  size="md"
  hiddenFrom="lg"
  title="Menú"
>
  <Stack gap="xs">
    <Button component={Link} href="/proveedor" variant="light" fullWidth justify="start">
      Dashboard
    </Button>
    {/* Other menu items */}
  </Stack>
</Drawer>
```

### Complete Migrated Component Structure

```typescript
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
  Title
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
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import SupplierNotificationCenter from "./SupplierNotificationCenter";
import SupplierPenaltyDisplay from "./SupplierPenaltyDisplay";

// Interface remains the same
interface SupplierDashboardProps {
  dashboardData?: {
    // ... existing interface
  } | null;
}

export default function SupplierDashboardUber({ dashboardData }: SupplierDashboardProps) {
  const [mobileMenuOpen, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);

  if (!dashboardData) {
    return (
      <Stack align="center" justify="center" h="100vh" p="md">
        <BuildingStorefrontIcon className="w-16 h-16 text-gray-400" />
        <Title order={2}>Portal de Proveedor</Title>
        <Text c="dimmed" ta="center" mb="lg">
          No hay datos de proveedor asociados a tu cuenta.
        </Text>
        <Button color="blue">Contactar Soporte</Button>
      </Stack>
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
                variant="outline" 
                color="gray" 
                size="sm"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                showIcon={false}
              >
                Salir
              </LogoutButton>
            </Group>
          </Group>
        </Group>

        {/* Desktop Navigation */}
        <Group gap="lg" mt="md" visibleFrom="lg">
          <Button component={Link} href="/proveedor" variant="subtle" color="white">
            Dashboard
          </Button>
          <Button component={Link} href="/proveedor/ordenes" variant="subtle" color="gray" c="blue.1">
            Órdenes
          </Button>
          <Button component={Link} href="/proveedor/productos" variant="subtle" color="gray" c="blue.1">
            Productos
          </Button>
          <Button component={Link} href="/proveedor/estadisticas" variant="subtle" color="gray" c="blue.1">
            Estadísticas
          </Button>
          <Button component={Link} href="/proveedor/perfil" variant="subtle" color="gray" c="blue.1">
            Perfil
          </Button>
        </Group>
      </Paper>

      {/* Mobile Menu Drawer */}
      <Drawer opened={mobileMenuOpen} onClose={closeMobileMenu} size="md" hiddenFrom="lg" title="Menú">
        <Stack gap="xs">
          <Button component={Link} href="/proveedor" variant="light" fullWidth justify="start">
            Dashboard
          </Button>
          <Button component={Link} href="/proveedor/ordenes" variant="subtle" fullWidth justify="start">
            Órdenes
          </Button>
          <Button component={Link} href="/proveedor/productos" variant="subtle" fullWidth justify="start">
            Productos
          </Button>
          <Button component={Link} href="/proveedor/estadisticas" variant="subtle" fullWidth justify="start">
            Estadísticas
          </Button>
          <Button component={Link} href="/proveedor/perfil" variant="subtle" fullWidth justify="start">
            Perfil
          </Button>
          <LogoutButton 
            variant="light" 
            color="red" 
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
          <Paper withBorder p="md" shadow="sm" sx={{ '&:hover': { boxShadow: 'md' } }}>
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
          <Paper withBorder p="md" shadow="sm" sx={{ '&:hover': { boxShadow: 'md' } }}>
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
          <Paper withBorder p="md" shadow="sm" sx={{ '&:hover': { boxShadow: 'md' } }}>
            <Group justify="space-between" mb="xs">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <Progress value={stats.completionRate} size="sm" color="green" w={64} />
            </Group>
            <Text size="xl" fw={700} mb="xs">{stats.completionRate}%</Text>
            <Text size="sm" c="dimmed">Tasa de completado</Text>
          </Paper>

          {/* Rating */}
          <Paper withBorder p="md" shadow="sm" sx={{ '&:hover': { boxShadow: 'md' } }}>
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
              textDecoration: 'none'
            }}
            sx={{ '&:hover': { boxShadow: 'lg' } }}
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
              textDecoration: 'none'
            }}
            sx={{ '&:hover': { boxShadow: 'lg' } }}
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
              textDecoration: 'none'
            }}
            sx={{ '&:hover': { boxShadow: 'lg' } }}
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
        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          {/* Recent Orders */}
          <div style={{ gridColumn: 'span 2 / span 2' }}>
            <Paper withBorder p="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Title order={3}>Órdenes Recientes</Title>
                <Button component={Link} href="/proveedor/ordenes" variant="light" size="sm" 
                  rightSection={<ChevronRightIcon className="w-4 h-4" />}>
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
                    sx={{ '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' }, cursor: 'pointer' }}>
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
          </div>

          {/* Performance Panel */}
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

              <Paper mt="lg" pt="md" withBorder={false} style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                <Button component={Link} href="/proveedor/estadisticas" color="blue" variant="light" fullWidth>
                  Ver estadísticas completas
                </Button>
              </Paper>
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
        </SimpleGrid>
      </main>
    </div>
  );
}
```

## Key Migration Points

### 1. Component Replacements
- `Card` → `Paper` with `withBorder` and `shadow` props
- `CardBody` → Direct content inside `Paper` with `p` prop for padding
- `Chip` → `Badge` with appropriate variant and color
- Mobile menu → `Drawer` component with `useDisclosure` hook

### 2. Layout System
- CSS Grid classes → `SimpleGrid` with responsive columns
- Flexbox classes → `Group` and `Stack` components
- Custom spacing → Mantine spacing props (`gap`, `p`, `m`, etc.)

### 3. Styling Approach
- Custom CSS classes → Mantine props and `sx` prop
- CSS custom properties → Mantine theme colors
- Gradient backgrounds → Inline styles with CSS variables

### 4. Responsive Design
- Tailwind responsive classes → Mantine responsive props
- Mobile-specific elements → `visibleFrom` and `hiddenFrom` props

### 5. State Management
- Custom mobile menu state → `useDisclosure` hook
- Event handlers remain mostly the same

## Testing Checklist

- [ ] All metrics display correctly
- [ ] Quick action buttons navigate properly
- [ ] Mobile menu works on all screen sizes
- [ ] Progress bars animate correctly
- [ ] All colors and gradients match original design
- [ ] Responsive layout works across devices
- [ ] Performance is equal or better than original
- [ ] Accessibility features are maintained

This specification should enable a complete migration while maintaining all functionality and improving the component architecture with Mantine's optimized components.