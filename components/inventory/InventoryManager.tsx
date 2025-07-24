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
      {/* Header glassmorphism */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Inventario
            </h1>
            <p className="text-slate-600 text-sm">
              Control inteligente de materiales, equipos y suministros
            </p>
          </div>
          <button
            onClick={() => setActiveTab("products")}
            className="glass-button px-6 py-3 flex items-center gap-2 text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`glass-stat p-4 cursor-pointer group ${
              stat.color === 'blue' ? 'stat-blue' :
              stat.color === 'warning' ? 'stat-orange' :
              stat.color === 'success' ? 'stat-green' :
              stat.color === 'purple' ? 'stat-purple' : ''
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                  stat.color === 'blue' ? 'bg-blue-500' :
                  stat.color === 'warning' ? 'bg-orange-500' :
                  stat.color === 'success' ? 'bg-green-500' :
                  stat.color === 'purple' ? 'bg-purple-500' : 'bg-slate-500'
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-slate-800 mb-1 truncate">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 uppercase tracking-wider truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contenido principal glassmorphism */}
      <div className="glass-card overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-6"></div>
              <p className="text-slate-600 text-base font-medium">Cargando inventario...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs glassmorphism */}
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50/50 rounded-2xl backdrop-blur-sm border border-white/20">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                        ${isActive 
                          ? 'glass-tab active text-slate-800' 
                          : 'glass-tab text-slate-600 hover:text-slate-800 hover:bg-white/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* Tab Content */}
              <div className="min-h-[400px]">
                {filteredTabs.find(tab => tab.id === activeTab)?.component}
              </div>
            </div>
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