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
import ProductManager from "./products/ProductManager"
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
    <div className="space-y-8 p-6">
      {/* Professional Header */}
      <div className="surface-card">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{fontSize: 'var(--text-2xl)'}}>
              Inventario
            </h1>
            <p className="text-neutral-600" style={{fontSize: 'var(--text-sm)'}}>
              Control inteligente de materiales, equipos y suministros
            </p>
          </div>
          <button
            onClick={() => setActiveTab("products")}
            className="btn-primary"
          >
            <PlusIcon className="icon-base" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Professional Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{gap: 'var(--space-4)'}}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const statusClass = 
            stat.color === 'blue' ? 'status-info' :
            stat.color === 'warning' ? 'status-warning' :
            stat.color === 'success' ? 'status-success' :
            stat.color === 'purple' ? 'status-neutral' : 'status-neutral'
          
          return (
            <div key={index} className={`metric-card surface-card-interactive ${statusClass}`}>
              <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
                <div className={`rounded-xl flex items-center justify-center motion-safe ${
                  stat.color === 'blue' ? 'bg-blue-500' :
                  stat.color === 'warning' ? 'bg-orange-500' :
                  stat.color === 'success' ? 'bg-green-500' :
                  stat.color === 'purple' ? 'bg-purple-500' : 'bg-slate-500'
                }`} style={{
                  width: 'var(--space-10)',
                  height: 'var(--space-10)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <Icon className="icon-base text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold mb-1 truncate" style={{
                    fontSize: 'var(--text-lg)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {stat.value}
                  </div>
                  <div className="text-neutral-600 uppercase tracking-wider truncate" style={{
                    fontSize: 'var(--text-xs)'
                  }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Professional Main Content */}
      <div className="surface-card overflow-hidden">
        <div style={{padding: 'var(--space-6)'}}>
          {loading ? (
            <div className="flex flex-col justify-center items-center" style={{padding: 'var(--space-20) 0'}}>
              <div className="loading-spinner" style={{marginBottom: 'var(--space-6)'}}></div>
              <p className="text-neutral-600 font-medium" style={{fontSize: 'var(--text-base)'}}>Cargando inventario...</p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-6)'}}>
              {/* Professional Tab Navigation */}
              <div className="flex flex-wrap border rounded-xl surface-elevated" style={{
                gap: 'var(--space-2)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-xl)',
                border: `0.0625rem solid var(--border-default)`
              }}>
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`nav-tab ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="icon-base" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* Tab Content */}
              <div style={{minHeight: '25rem'}}>
                {filteredTabs.find(tab => tab.id === activeTab)?.component}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Modals */}
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