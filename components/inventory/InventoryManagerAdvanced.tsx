"use client"

import React, { useState } from "react"
import { Tabs, Tab, Input } from "@heroui/react"
import {
  ArchiveBoxIcon,
  CubeIcon,
  TruckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import { useInventoryStats } from "@/hooks/useInventoryStats"
import { 
  NordicCard, 
  NordicStatsCard,
  NordicButton,
  nordicTokens 
} from "@/components/ui/nordic"
import ProductManagerNordic from "./ProductManagerNordic"
import StockManagerNordic from "./StockManagerNordic"
import SupplierManagerNordic from "./SupplierManagerNordic"
import InventoryReportsNordic from "./InventoryReportsNordic"
import InventoryAlertsNordic from "./InventoryAlertsNordic"
import PurchaseOrderManagerNordic from "./PurchaseOrderManagerNordic"

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
    <div className="w-full space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`
              text-[${nordicTokens.typography.fontSize['4xl']}]
              font-[${nordicTokens.typography.fontWeight.bold}]
              text-[${nordicTokens.colors.text.primary}]
              leading-[${nordicTokens.typography.lineHeight.tight}]
              mb-2
            `}>
              Inventario
            </h1>
            <p className={`
              text-[${nordicTokens.typography.fontSize.lg}]
              text-[${nordicTokens.colors.text.secondary}]
            `}>
              Gestiona tu inventario, productos y proveedores
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                className="w-80"
                classNames={{
                  inputWrapper: `
                    bg-[${nordicTokens.colors.background.primary}]
                    border border-[${nordicTokens.colors.border.primary}]
                    rounded-[${nordicTokens.radius.lg}]
                    hover:border-[${nordicTokens.colors.text.secondary}]
                    focus-within:border-[${nordicTokens.colors.border.focus}]
                    h-12
                  `,
                  input: `
                    text-[${nordicTokens.colors.text.primary}]
                    placeholder:text-[${nordicTokens.colors.text.tertiary}]
                  `
                }}
              />
            </div>
            <NordicButton variant="ghost" size="md">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </NordicButton>
            <NordicButton variant="primary" size="md">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Producto
            </NordicButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NordicStatsCard
            title="Total Productos"
            value={statsLoading ? "..." : totalProducts.toString()}
            change={statsLoading ? "" : "+12% vs mes anterior"}
            trend="up"
            icon={<CubeIcon className="w-6 h-6" />}
          />
          <NordicStatsCard
            title="Stock Bajo"
            value={statsLoading ? "..." : lowStockItems.toString()}
            change={statsLoading ? "" : "4 productos críticos"}
            trend="down"
            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          />
          <NordicStatsCard
            title="Valor Inventario"
            value={statsLoading ? "..." : formatCurrency(totalValue)}
            change={statsLoading ? "" : "+8.5% vs mes anterior"}
            trend="up"
            icon={<ChartBarIcon className="w-6 h-6" />}
          />
          <NordicStatsCard
            title="Proveedores"
            value={statsLoading ? "..." : suppliersCount.toString()}
            change={statsLoading ? "" : "3 activos"}
            trend="neutral"
            icon={<TruckIcon className="w-6 h-6" />}
          />
        </div>
      </div>

      {/* Main Content */}
      <NordicCard variant="default" padding="none">
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => setActiveTab(key as string)}
          variant="underlined"
          className="w-full"
          classNames={{
            base: "w-full",
            tabList: `
              gap-8
              w-full
              relative
              rounded-none
              p-0
              bg-transparent
              border-b border-[${nordicTokens.colors.border.secondary}]
              px-[${nordicTokens.spacing['3xl']}]
              pt-[${nordicTokens.spacing['2xl']}]
            `,
            cursor: `
              w-full 
              bg-[${nordicTokens.colors.text.primary}] 
              h-0.5
              rounded-none
            `,
            tab: `
              max-w-fit 
              px-0 
              h-12 
              text-[${nordicTokens.colors.text.secondary}]
              font-[${nordicTokens.typography.fontWeight.medium}]
              text-[${nordicTokens.typography.fontSize.sm}]
              hover:text-[${nordicTokens.colors.text.primary}]
              data-[selected=true]:text-[${nordicTokens.colors.text.primary}]
              transition-colors
            `,
            tabContent: "group-data-[selected=true]:text-inherit"
          }}
        >
          <Tab 
            key="products" 
            title={
              <div className="flex items-center gap-2">
                <CubeIcon className="w-4 h-4" />
                <span>Productos</span>
              </div>
            }
          >
            <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
              <ProductManagerNordic searchQuery={searchQuery} />
            </div>
          </Tab>
          
          <Tab 
            key="stock" 
            title={
              <div className="flex items-center gap-2">
                <ArchiveBoxIcon className="w-4 h-4" />
                <span>Stock</span>
              </div>
            }
          >
            <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
              <StockManagerNordic />
            </div>
          </Tab>

          {canManageSuppliers && (
            <Tab 
              key="suppliers" 
              title={
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-4 h-4" />
                  <span>Proveedores</span>
                </div>
              }
            >
              <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
                <SupplierManagerNordic />
              </div>
            </Tab>
          )}

          <Tab 
            key="purchase-orders" 
            title={
              <div className="flex items-center gap-2">
                <TruckIcon className="w-4 h-4" />
                <span>Órdenes de Compra</span>
              </div>
            }
          >
            <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
              <PurchaseOrderManagerNordic />
            </div>
          </Tab>

          <Tab 
            key="alerts" 
            title={
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Alertas</span>
                {lowStockItems > 0 && (
                  <span className={`
                    bg-[${nordicTokens.colors.action.danger}]
                    text-white
                    text-[${nordicTokens.typography.fontSize.xs}]
                    px-2 py-1
                    rounded-[${nordicTokens.radius.full}]
                    min-w-[20px]
                    h-5
                    flex items-center justify-center
                    font-[${nordicTokens.typography.fontWeight.medium}]
                  `}>
                    {lowStockItems}
                  </span>
                )}
              </div>
            }
          >
            <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
              <InventoryAlertsNordic />
            </div>
          </Tab>

          {canViewReports && (
            <Tab 
              key="reports" 
              title={
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Reportes</span>
                </div>
              }
            >
              <div className={`p-[${nordicTokens.spacing['3xl']}] pt-[${nordicTokens.spacing['2xl']}]`}>
                <InventoryReportsNordic />
              </div>
            </Tab>
          )}
        </Tabs>
      </NordicCard>
    </div>
  )
}