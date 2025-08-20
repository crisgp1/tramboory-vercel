"use client"

import React, { useState } from "react"
import {
  Paper,
  Button,
  Tabs,
  Badge,
  Menu,
  Group,
  Stack,
  Title,
  Text,
  Grid,
  Card,
  ThemeIcon,
  Center,
  ActionIcon,
  Loader
} from "@mantine/core"
import {
  IconArchive,
  IconBox,
  IconTruck,
  IconChartBar,
  IconAlertTriangle,
  IconPlus,
  IconAdjustmentsHorizontal,
  IconFileText,
  IconQrcode,
  IconArrowsLeftRight,
  IconTag,
  IconCalendar,
  IconChevronDown,
  IconSearch
} from "@tabler/icons-react"
import { useRole } from "@/hooks/useRole"
import { useInventoryStats } from "@/hooks/useInventoryStats"
import { usePendingProducts } from "@/hooks/usePendingProducts"
import ProductManager from "./products/ProductManager"
import PendingProductsManager from "./products/PendingProductsManager"
import StockManager from "./stock/StockManager"
import SupplierManager from "./suppliers/SupplierManager"
import InventoryReports from "./InventoryReports"
import InventoryAlerts from "./InventoryAlerts"
import PurchaseOrderManager from "./purchase-orders/PurchaseOrderManager"
import BatchManager from "./BatchManager"
import PricingTierManager from "./PricingTierManager"
import BarcodeScanner from "./BarcodeScanner"
import StockTransferModal from "./transfers/StockTransferModal"

export default function InventoryManager() {
  const { role, isAdmin, isGerente } = useRole()
  const { totalProducts, lowStockItems, totalValue, suppliersCount, loading: statsLoading } = useInventoryStats()
  const { pendingCount, refresh: refreshPendingCount } = usePendingProducts()
  const [activeTab, setActiveTab] = useState("stock")
  const [loading, setLoading] = useState(false)
  
  // Estados para modales
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<'lookup' | 'inventory' | 'receiving'>('lookup')

  // Estadísticas reales del inventario
  const stats = [
    { 
      label: "Productos Totales", 
      value: statsLoading ? "..." : totalProducts.toString(), 
      change: "", 
      trend: "neutral",
      icon: IconBox,
      color: "blue"
    },
    { 
      label: "Stock Bajo", 
      value: statsLoading ? "..." : lowStockItems.toString(), 
      change: "", 
      trend: lowStockItems > 0 ? "warning" : "neutral",
      icon: IconAlertTriangle,
      color: "orange"
    },
    { 
      label: "Valor Inventario", 
      value: statsLoading ? "..." : `$${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`, 
      change: "", 
      trend: "neutral",
      icon: IconChartBar,
      color: "green"
    },
    { 
      label: "Proveedores", 
      value: statsLoading ? "..." : suppliersCount.toString(), 
      change: "", 
      trend: "neutral",
      icon: IconTruck,
      color: "grape"
    }
  ]

  const tabs = [
    {
      id: "stock",
      label: "Control de Stock",
      icon: IconArchive,
      description: "Gestión de inventario y movimientos",
      component: <StockManager />
    },
    {
      id: "products",
      label: "Productos",
      icon: IconBox,
      description: "Catálogo de productos y configuración",
      component: <ProductManager />
    },
    {
      id: "pending-products",
      label: (isAdmin || isGerente) && pendingCount > 0 ? `Productos Pendientes (${pendingCount})` : "Productos Pendientes",
      icon: IconAlertTriangle,
      description: "Aprobación de productos de proveedores",
      component: <PendingProductsManager onRefresh={refreshPendingCount} />
    },
    {
      id: "purchase-orders",
      label: "Órdenes de Compra",
      icon: IconFileText,
      description: "Gestión de órdenes de compra y proveedores",
      component: <PurchaseOrderManager />
    },
    {
      id: "batches",
      label: "Gestión de Lotes",
      icon: IconCalendar,
      description: "Control de lotes y fechas de vencimiento",
      component: <BatchManager />
    },
    {
      id: "pricing",
      label: "Precios Escalonados",
      icon: IconTag,
      description: "Configuración de precios por volumen",
      component: <PricingTierManager />
    },
    {
      id: "suppliers",
      label: "Proveedores",
      icon: IconTruck,
      description: "Gestión de proveedores y órdenes",
      component: <SupplierManager />
    },
    {
      id: "reports",
      label: "Reportes",
      icon: IconChartBar,
      description: "Análisis y reportes de inventario",
      component: <InventoryReports />
    }
  ]

  // Filtrar tabs según el rol
  const filteredTabs = tabs.filter(tab => {
    switch (tab.id) {
      case "suppliers":
      case "purchase-orders":
      case "reports":
      case "pending-products":
        // Solo admin y gerente pueden gestionar proveedores, órdenes, reportes y aprobaciones
        return isAdmin || isGerente
      case "pricing":
        // Solo admin puede configurar precios
        return isAdmin
      default:
        return true
    }
  })

  const handleProductFound = (product: any) => {
    console.log('Producto encontrado:', product)
    // Aquí puedes manejar la lógica cuando se encuentra un producto
    // Por ejemplo, cambiar a la pestaña de productos y mostrar el producto
    setActiveTab("products")
  }

  const handleScannerOpen = (mode: 'lookup' | 'inventory' | 'receiving') => {
    setScannerMode(mode)
    setIsScannerOpen(true)
  }

  // Quick actions menu items
  const actionMenuItems = [
    {
      key: "new-product",
      label: "Nuevo Producto",
      icon: <IconPlus size={16} />,
      action: () => setActiveTab("products")
    },
    {
      key: "new-purchase-order",
      label: "Nueva Orden de Compra",
      icon: <IconFileText size={16} />,
      action: () => setActiveTab("purchase-orders")
    },
    {
      key: "new-batch",
      label: "Nuevo Lote",
      icon: <IconCalendar size={16} />,
      action: () => setActiveTab("batches")
    },
    {
      key: "stock-transfer",
      label: "Transferir Stock",
      icon: <IconArrowsLeftRight size={16} />,
      action: () => setIsTransferModalOpen(true)
    }
  ]

  // Scanner menu items
  const scannerMenuItems = [
    {
      key: "scan-lookup",
      label: "Buscar Producto",
      description: "Buscar información del producto",
      icon: <IconSearch size={16} />,
      action: () => handleScannerOpen('lookup')
    },
    {
      key: "scan-inventory",
      label: "Conteo de Inventario",
      description: "Realizar conteo de inventario",
      icon: <IconArchive size={16} />,
      action: () => handleScannerOpen('inventory')
    },
    {
      key: "scan-receiving",
      label: "Recepción de Productos",
      description: "Recibir productos en almacén",
      icon: <IconTruck size={16} />,
      action: () => handleScannerOpen('receiving')
    }
  ]

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={2}>Inventario</Title>
            <Text c="dimmed" size="sm">
              Control inteligente de materiales, equipos y suministros
            </Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setActiveTab("products")}
          >
            Nuevo Producto
          </Button>
        </Group>
      </Paper>

      {/* Statistics Grid */}
      <Grid>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colorMap = {
            'blue': 'blue',
            'orange': 'orange', 
            'green': 'green',
            'grape': 'grape'
          }
          const mantineColor = colorMap[stat.color as keyof typeof colorMap] || 'gray'
          
          return (
            <Grid.Col key={index} span={{ base: 6, md: 3 }}>
              <Card withBorder p="md">
                <Group>
                  <ThemeIcon size="lg" radius="md" color={mantineColor}>
                    <Icon size={24} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text size="xl" fw={600}>
                      {stat.value}
                    </Text>
                    <Text size="xs" c="dimmed" tt="uppercase">
                      {stat.label}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            </Grid.Col>
          )
        })}
      </Grid>

      {/* Main Content */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl" style={{ minHeight: 400 }}>
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed">Cargando inventario...</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="lg" p="lg">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'stock')}>
              <Tabs.List>
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Tabs.Tab
                      key={tab.id}
                      value={tab.id}
                      leftSection={<Icon size={16} />}
                    >
                      {tab.label}
                    </Tabs.Tab>
                  )
                })}
              </Tabs.List>
              
              {/* Tab Content */}
              {filteredTabs.map((tab) => (
                <Tabs.Panel key={tab.id} value={tab.id} pt="lg">
                  <div style={{ minHeight: 400 }}>
                    {tab.component}
                  </div>
                </Tabs.Panel>
              ))}
            </Tabs>
          </Stack>
        )}
      </Paper>

      {/* Modals */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductFound={handleProductFound}
        mode={scannerMode}
        title={`Escáner - ${
          scannerMode === 'lookup' ? 'Buscar Producto' :
          scannerMode === 'inventory' ? 'Conteo de Inventario' :
          'Recepción de Productos'
        }`}
      />

      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        mode="create"
        onSuccess={() => {
          setIsTransferModalOpen(false)
        }}
      />
    </Stack>
  )
}