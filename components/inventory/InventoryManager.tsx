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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header Section - Improved spacing and hierarchy */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Gestión de Inventario
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Control de materiales, equipos y suministros
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                variant="flat"
                color="primary"
                size="sm"
                className="bg-blue-50 text-blue-700"
              >
                {filteredTabs.length} secciones
              </Chip>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Better responsive design */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="primary"
                size="md"
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                startContent={<PlusIcon className="w-4 h-4" />}
                endContent={<ChevronDownIcon className="w-4 h-4" />}
              >
                Crear Nuevo
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Acciones rápidas"
              classNames={{
                base: "bg-white border border-gray-200 shadow-lg rounded-lg",
                list: "p-2"
              }}
            >
              {actionMenuItems.map(item => (
                <DropdownItem
                  key={item.key}
                  startContent={item.icon}
                  onPress={item.action}
                  className="rounded-md hover:bg-gray-50"
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                size="md"
                className="w-full sm:w-auto bg-white border-gray-300 hover:border-gray-400 text-gray-700"
                startContent={<QrCodeIcon className="w-4 h-4" />}
                endContent={<ChevronDownIcon className="w-4 h-4" />}
              >
                Escáner QR
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Opciones de escáner"
              classNames={{
                base: "bg-white border border-gray-200 shadow-lg rounded-lg",
                list: "p-2"
              }}
            >
              {scannerMenuItems.map(item => (
                <DropdownItem
                  key={item.key}
                  description={item.description}
                  startContent={item.icon}
                  onPress={item.action}
                  className="rounded-md hover:bg-gray-50"
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Alertas de Stock Bajo - Better spacing */}
        <div className="w-full">
          <InventoryAlerts />
        </div>

        {/* Stats Grid - Better design and spacing */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
                    <Chip
                      size="sm"
                      variant="flat"
                      color={stat.trend === "up" ? "success" : stat.color === "warning" ? "warning" : "danger"}
                      className="text-xs font-medium"
                    >
                      {stat.change}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>

        {/* Main Content Tabs - Better design matching finances/reservas */}
        <Card className="w-full border border-gray-200 shadow-sm bg-white">
          <CardBody className="p-0">
            <div className="w-full">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                variant="underlined"
                classNames={{
                  base: "w-full",
                  tabList: "gap-0 w-full relative rounded-none p-0 border-b border-gray-200 overflow-x-auto",
                  cursor: "w-full bg-gray-900",
                  tab: "max-w-fit px-4 py-4 h-auto text-sm font-medium",
                  tabContent: "group-data-[selected=true]:text-gray-900 whitespace-nowrap transition-colors duration-200"
                }}
              >
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Tab
                      key={tab.id}
                      title={
                        <div className="flex items-center gap-2 px-2">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium hidden sm:inline">{tab.label}</span>
                          <span className="font-medium sm:hidden">{tab.label.split(' ')[0]}</span>
                        </div>
                      }
                    >
                      <div className="p-6 min-h-[400px]">
                        {tab.component}
                      </div>
                    </Tab>
                  )
                })}
              </Tabs>
            </div>
          </CardBody>
        </Card>
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
          // Aquí puedes refrescar los datos si es necesario
        }}
      />
    </div>
  )
}