"use client"

import React, { useState } from "react"
import { Tabs, TextInput, Card, Group, Stack, Title, Text, Badge, Button, Grid, Loader } from "@mantine/core"
import {
  IconArchive,
  IconCube,
  IconTruck,
  IconChartBar,
  IconAlertTriangle,
  IconSearch,
  IconPlus,
  IconAdjustments
} from "@tabler/icons-react"
import { useRole } from "@/hooks/useRole"
import { useInventoryStats } from "@/hooks/useInventoryStats"
import { 
  NordicCard, 
  NordicStatsCard,
  NordicButton,
  nordicTokens 
} from "@/components/ui/nordic"
import ProductManager from "./products/ProductManager"
import StockManagerMantine from "./stock/StockManagerMantine"
import SupplierManager from "./suppliers/SupplierManager"
import InventoryReports from "./InventoryReports"
import InventoryAlerts from "./InventoryAlerts"
import PurchaseOrderManager from "./purchase-orders/PurchaseOrderManager"

export default function InventoryManagerNordic() {
  const { role, isAdmin, isGerente } = useRole()
  const { totalProducts, lowStockItems, totalValue, suppliersCount, loading: statsLoading } = useInventoryStats()
  const [activeTab, setActiveTab] = useState("products")
  const [searchQuery, setSearchQuery] = useState("")

  const canManageSuppliers = isAdmin || isGerente
  const canViewReports = isAdmin || isGerente

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  return (
    <Stack spacing="xl" p="xl">
      {/* Header Section */}
      <Stack spacing="lg">
        <Group position="apart">
          <div>
            <Title order={1}>Inventario</Title>
            <Text size="lg" color="dimmed">
              Gestiona tu inventario, productos y proveedores
            </Text>
          </div>
          
          {/* Quick Actions */}
          <Group>
            <TextInput
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              icon={<IconSearch size={16} />}
              style={{ width: 320 }}
            />
            <Button variant="light" size="md">
              <IconAdjustments size={20} />
            </Button>
            <Button size="md" leftIcon={<IconPlus size={20} />}>
              Nuevo Producto
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={12} sm={6} lg={3}>
            <Card>
              <Group position="apart">
                <div>
                  <Text size="sm" color="dimmed">Total Productos</Text>
                  <Title order={3}>{statsLoading ? <Loader size="sm" /> : totalProducts}</Title>
                  {!statsLoading && <Text size="xs" color="green">+12% vs mes anterior</Text>}
                </div>
                <IconCube size={24} className="text-blue-600" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={12} sm={6} lg={3}>
            <Card>
              <Group position="apart">
                <div>
                  <Text size="sm" color="dimmed">Stock Bajo</Text>
                  <Title order={3}>{statsLoading ? <Loader size="sm" /> : lowStockItems}</Title>
                  {!statsLoading && <Text size="xs" color="red">4 productos críticos</Text>}
                </div>
                <IconAlertTriangle size={24} className="text-red-600" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={12} sm={6} lg={3}>
            <Card>
              <Group position="apart">
                <div>
                  <Text size="sm" color="dimmed">Valor Inventario</Text>
                  <Title order={3}>{statsLoading ? <Loader size="sm" /> : formatCurrency(totalValue)}</Title>
                  {!statsLoading && <Text size="xs" color="green">+8.5% vs mes anterior</Text>}
                </div>
                <IconChartBar size={24} className="text-green-600" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={12} sm={6} lg={3}>
            <Card>
              <Group position="apart">
                <div>
                  <Text size="sm" color="dimmed">Proveedores</Text>
                  <Title order={3}>{statsLoading ? <Loader size="sm" /> : suppliersCount}</Title>
                  {!statsLoading && <Text size="xs" color="dimmed">3 activos</Text>}
                </div>
                <IconTruck size={24} className="text-purple-600" />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Main Content */}
      <Card>
        <Tabs 
          value={activeTab} 
          onTabChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="products" icon={<IconCube size={16} />}>
              Productos
            </Tabs.Tab>
            <Tabs.Tab value="stock" icon={<IconArchive size={16} />}>
              Stock
            </Tabs.Tab>
            {canManageSuppliers && (
              <Tabs.Tab value="suppliers" icon={<IconTruck size={16} />}>
                Proveedores
              </Tabs.Tab>
            )}
            <Tabs.Tab value="purchase-orders" icon={<IconTruck size={16} />}>
              Órdenes de Compra
            </Tabs.Tab>
            <Tabs.Tab value="alerts" icon={<IconAlertTriangle size={16} />}>
              Alertas
              {lowStockItems > 0 && (
                <Badge size="xs" color="red" ml="xs">
                  {lowStockItems}
                </Badge>
              )}
            </Tabs.Tab>
            {canViewReports && (
              <Tabs.Tab value="reports" icon={<IconChartBar size={16} />}>
                Reportes
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="products" pt="xl">
            <ProductManager />
          </Tabs.Panel>
          
          <Tabs.Panel value="stock" pt="xl">
            <StockManagerMantine />
          </Tabs.Panel>

          {canManageSuppliers && (
            <Tabs.Panel value="suppliers" pt="xl">
              <SupplierManager />
            </Tabs.Panel>
          )}

          <Tabs.Panel value="purchase-orders" pt="xl">
            <PurchaseOrderManager />
          </Tabs.Panel>

          <Tabs.Panel value="alerts" pt="xl">
            <InventoryAlerts />
          </Tabs.Panel>

          {canViewReports && (
            <Tabs.Panel value="reports" pt="xl">
              <InventoryReports />
            </Tabs.Panel>
          )}
        </Tabs>
      </Card>
    </Stack>
  )
}