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
  ChevronDownIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
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
  const [activeTab, setActiveTab] = useState("stock")
  
  // Estados para modales
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<'lookup' | 'inventory' | 'receiving'>('lookup')

  // Estadísticas de ejemplo (estas vendrían de la API)
  const stats = [
    { 
      label: "Productos Totales", 
      value: "245", 
      change: "+12", 
      trend: "up",
      icon: CubeIcon,
      color: "blue"
    },
    { 
      label: "Stock Bajo", 
      value: "8", 
      change: "-3", 
      trend: "down",
      icon: ExclamationTriangleIcon,
      color: "warning"
    },
    { 
      label: "Valor Inventario", 
      value: "$125,430", 
      change: "+5.2%", 
      trend: "up",
      icon: ChartBarIcon,
      color: "success"
    },
    { 
      label: "Proveedores", 
      value: "15", 
      change: "+2", 
      trend: "up",
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Gestión de Inventario
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Control de materiales, equipos y suministros
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dropdown de Acciones Rápidas */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="primary"
                endContent={<ChevronDownIcon className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Acciones Rápidas
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="new-product"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={() => setActiveTab("products")}
              >
                Nuevo Producto
              </DropdownItem>
              <DropdownItem
                key="new-purchase-order"
                startContent={<DocumentTextIcon className="w-4 h-4" />}
                onPress={() => setActiveTab("purchase-orders")}
              >
                Nueva Orden de Compra
              </DropdownItem>
              <DropdownItem
                key="new-batch"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setActiveTab("batches")}
              >
                Nuevo Lote
              </DropdownItem>
              <DropdownItem
                key="stock-transfer"
                startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                onPress={() => setIsTransferModalOpen(true)}
              >
                Transferir Stock
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Dropdown de Escáner */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                startContent={<QrCodeIcon className="w-4 h-4" />}
                endContent={<ChevronDownIcon className="w-4 h-4" />}
              >
                Escáner
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="scan-lookup"
                description="Buscar información del producto"
                onPress={() => handleScannerOpen('lookup')}
              >
                Buscar Producto
              </DropdownItem>
              <DropdownItem
                key="scan-inventory"
                description="Realizar conteo de inventario"
                onPress={() => handleScannerOpen('inventory')}
              >
                Conteo de Inventario
              </DropdownItem>
              <DropdownItem
                key="scan-receiving"
                description="Recibir productos en almacén"
                onPress={() => handleScannerOpen('receiving')}
              >
                Recepción de Productos
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            variant="bordered"
            startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
          >
            Configurar
          </Button>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      <InventoryAlerts />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'warning' ? 'bg-orange-100' :
                      stat.color === 'success' ? 'bg-green-100' :
                      stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'warning' ? 'text-orange-600' :
                        stat.color === 'success' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={stat.trend === "up" ? "success" : stat.color === "warning" ? "warning" : "danger"}
                      className="text-xs"
                    >
                      {stat.change}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Main Content Tabs */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-blue-600",
              tab: "max-w-fit px-6 py-4 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600"
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
                      <span className="font-medium">{tab.label}</span>
                    </div>
                  }
                >
                  <div className="p-6">
                    {tab.component}
                  </div>
                </Tab>
              )
            })}
          </Tabs>
        </CardBody>
      </Card>

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
          // Aquí puedes refrescar los datos si es necesario
        }}
      />
    </div>
  )
}