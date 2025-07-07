"use client"

import React, { useState } from "react"
import {
  Card,
  CardBody,
  Button,
  Tabs,
  Tab,
  Badge,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react"
import {
  ArchiveBoxIcon,
  CubeIcon,
  TruckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  QrCodeIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  CalendarIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import { useInventoryStats } from "@/hooks/useInventoryStats"
import ProductManager from "./ProductManager"
import StockManager from "./StockManager"
import SupplierManager from "./SupplierManager"
import InventoryReports from "./InventoryReports"
import InventoryAlerts from "./InventoryAlerts"
import PurchaseOrderManager from "./PurchaseOrderManager"
import BatchManager from "./BatchManager"
import PricingTierManager from "./PricingTierManager"
import BarcodeScanner from "./BarcodeScanner"
import StockTransferModal from "./StockTransferModal"

export default function InventoryManager() {
  const { role, isAdmin, isGerente } = useRole()
  const { totalProducts, lowStockItems, totalValue, suppliersCount, loading: statsLoading } = useInventoryStats()
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
      icon: CubeIcon,
      color: "blue"
    },
    { 
      label: "Stock Bajo", 
      value: statsLoading ? "..." : lowStockItems.toString(), 
      change: "", 
      trend: lowStockItems > 0 ? "warning" : "neutral",
      icon: ExclamationTriangleIcon,
      color: "warning"
    },
    { 
      label: "Valor Inventario", 
      value: statsLoading ? "..." : `$${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`, 
      change: "", 
      trend: "neutral",
      icon: ChartBarIcon,
      color: "success"
    },
    { 
      label: "Proveedores", 
      value: statsLoading ? "..." : suppliersCount.toString(), 
      change: "", 
      trend: "neutral",
      icon: TruckIcon,
      color: "purple"
    }
  ]

  const tabs = [
    {
      id: "stock",
      label: "Control de Stock",
      icon: ArchiveBoxIcon,
      description: "Gestión de inventario y movimientos",
      component: <StockManager />
    },
    {
      id: "products",
      label: "Productos",
      icon: CubeIcon,
      description: "Catálogo de productos y configuración",
      component: <ProductManager />
    },
    {
      id: "purchase-orders",
      label: "Órdenes de Compra",
      icon: DocumentTextIcon,
      description: "Gestión de órdenes de compra y proveedores",
      component: <PurchaseOrderManager />
    },
    {
      id: "batches",
      label: "Gestión de Lotes",
      icon: CalendarIcon,
      description: "Control de lotes y fechas de vencimiento",
      component: <BatchManager />
    },
    {
      id: "pricing",
      label: "Precios Escalonados",
      icon: TagIcon,
      description: "Configuración de precios por volumen",
      component: <PricingTierManager />
    },
    {
      id: "suppliers",
      label: "Proveedores",
      icon: TruckIcon,
      description: "Gestión de proveedores y órdenes",
      component: <SupplierManager />
    },
    {
      id: "reports",
      label: "Reportes",
      icon: ChartBarIcon,
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
        // Solo admin y gerente pueden gestionar proveedores, órdenes y reportes
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
      icon: <PlusIcon className="w-4 h-4" />,
      action: () => setActiveTab("products")
    },
    {
      key: "new-purchase-order",
      label: "Nueva Orden de Compra",
      icon: <DocumentTextIcon className="w-4 h-4" />,
      action: () => setActiveTab("purchase-orders")
    },
    {
      key: "new-batch",
      label: "Nuevo Lote",
      icon: <CalendarIcon className="w-4 h-4" />,
      action: () => setActiveTab("batches")
    },
    {
      key: "stock-transfer",
      label: "Transferir Stock",
      icon: <ArrowsRightLeftIcon className="w-4 h-4" />,
      action: () => setIsTransferModalOpen(true)
    }
  ]

  // Scanner menu items
  const scannerMenuItems = [
    {
      key: "scan-lookup",
      label: "Buscar Producto",
      description: "Buscar información del producto",
      icon: <MagnifyingGlassIcon className="w-4 h-4 text-blue-600" />,
      action: () => handleScannerOpen('lookup')
    },
    {
      key: "scan-inventory",
      label: "Conteo de Inventario",
      description: "Realizar conteo de inventario",
      icon: <ArchiveBoxIcon className="w-4 h-4 text-green-600" />,
      action: () => handleScannerOpen('inventory')
    },
    {
      key: "scan-receiving",
      label: "Recepción de Productos",
      description: "Recibir productos en almacén",
      icon: <TruckIcon className="w-4 h-4 text-purple-600" />,
      action: () => handleScannerOpen('receiving')
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header minimalista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Inventario
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Control de materiales, equipos y suministros
          </p>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => setActiveTab("products")}
          className="bg-gray-900 text-white hover:bg-gray-800 text-sm"
          size="md"
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Estadísticas minimalistas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border border-gray-200 shadow-none">
              <CardBody className="p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'warning' ? 'bg-orange-100' :
                    stat.color === 'success' ? 'bg-green-100' :
                    stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'warning' ? 'text-orange-600' :
                      stat.color === 'success' ? 'text-green-600' :
                      stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-medium text-gray-900 truncate">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide truncate">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Contenido principal */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600 text-sm">Cargando inventario...</p>
            </div>
          ) : (
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              variant="underlined"
              classNames={{
                tabList: "border-b border-gray-200 flex-nowrap overflow-x-auto scrollbar-hide",
                cursor: "bg-gray-900",
                tab: "px-3 py-3 min-w-fit whitespace-nowrap",
                tabContent: "group-data-[selected=true]:text-gray-900"
              }}
            >
              {filteredTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Tab
                    key={tab.id}
                    title={
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </div>
                    }
                  >
                    <div className="pt-6">
                      {tab.component}
                    </div>
                  </Tab>
                )
              })}
            </Tabs>
          )}
        </div>
      </div>

      {/* Modales */}
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
    </div>
  )
}