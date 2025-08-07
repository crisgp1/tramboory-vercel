"use client"

import React, { useState, useEffect } from "react"
import {
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
  Eye,
  Settings,
  Package,
  BarChart3,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  X
} from 'lucide-react'
import { useRole } from "@/hooks/useRole"
import StockModal from "./StockModal"
import InitiateMovementModal from "./InitiateMovementModal"
import { DataTable, StatusChip, PrimaryButton, SecondaryButton, DangerButton } from "@/components/shared/ui"
import { SearchInput } from "@/components/shared/forms"
import ProductsWithoutMovementsModal from "@/components/supplier/ProductsWithoutMovementsModal"
import { createPortal } from "react-dom"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  base_unit: string
}

interface StockItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  location_id: string
  available_quantity: number
  reserved_quantity: number
  quarantine_quantity: number
  unit: string
  batches?: Array<{
    batch_id: string
    quantity: number
    unit: string
    cost_per_unit: number
    expiry_date?: string
    received_date: string
    status: string
  }>
  last_movement?: {
    movement_type: string
    created_at: string
    quantity: number
  }
}

export default function StockManager() {
  const { isAdmin, isGerente } = useRole()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [productsWithoutInventory, setProductsWithoutInventory] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
  const [selectedProductForInitiation, setSelectedProductForInitiation] = useState<Product | null>(null)
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false)
  const [isProductsWithoutMovementsModalOpen, setIsProductsWithoutMovementsModalOpen] = useState(false)

  const itemsPerPage = 10

  useEffect(() => {
    fetchStockItems()
  }, [currentPage, searchTerm, selectedLocation, selectedCategory])

  const fetchStockItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedLocation !== 'all' && { locationId: selectedLocation }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      })

      // Obtener inventario existente
      const stockResponse = await fetch(`/api/inventory/stock?${params}`)
      
      // NUEVA: Obtener productos sin registros de inventario
      const productsResponse = await fetch(`/api/inventory/products?withoutMovements=true&limit=1000`)
      
      if (stockResponse.ok && productsResponse.ok) {
        const stockData = await stockResponse.json()
        const productsData = await productsResponse.json()
        
        setStockItems(stockData.inventories || [])
        setProductsWithoutInventory(productsData.products || [])
        setTotalPages(stockData.totalPages || Math.ceil((stockData.total || 0) / itemsPerPage))
      } else {
        console.error('Error fetching data:', 
          stockResponse.ok ? '' : `Stock: ${stockResponse.status}`,
          productsResponse.ok ? '' : `Products: ${productsResponse.status}`)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockAction = (_action: string, stockItem: StockItem) => {
    setSelectedStock(stockItem)
    setIsStockModalOpen(true)
  }

  const handleInitiateMovement = (product: Product) => {
    setSelectedProductForInitiation(product)
    setIsInitiateModalOpen(true)
  }

  const handleViewDetails = (stockItem: StockItem) => {
    setSelectedStock(stockItem)
    setIsDetailModalOpen(true)
  }

  const getStockStatus = (item: StockItem) => {
    const available = item.available_quantity
    if (available <= 0) return { color: 'danger', label: 'Sin Stock' }
    if (available <= 10) return { color: 'warning', label: 'Stock Bajo' }
    return { color: 'success', label: 'Disponible' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  const columns = [
    {
      key: "product",
      label: "Producto",
      render: (value: any, item: StockItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.product?.name || 'Producto sin nombre'}</p>
            <p className="text-sm text-gray-500">{item.product?.category || 'Sin categoría'}</p>
          </div>
        </div>
      )
    },
    {
      key: "sku",
      label: "SKU",
      render: (value: any, item: StockItem) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {item.product?.sku || 'N/A'}
        </span>
      )
    },
    {
      key: "location",
      label: "Ubicación",
      render: (value: any, item: StockItem) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{item.location_id}</span>
        </div>
      )
    },
    {
      key: "available",
      label: "Disponible",
      render: (value: any, item: StockItem) => (
        <div className="text-sm text-right">
          <span className="font-semibold text-green-600">{item.available_quantity}</span>
          <span className="text-gray-500 ml-1">{item.unit}</span>
        </div>
      )
    },
    {
      key: "reserved",
      label: "Reservado",
      render: (value: any, item: StockItem) => (
        <div className="text-sm text-right">
          <span className="font-semibold text-orange-600">{item.reserved_quantity}</span>
          <span className="text-gray-500 ml-1">{item.unit}</span>
        </div>
      )
    },
    {
      key: "status",
      label: "Estado",
      render: (value: any, item: StockItem) => {
        const stockStatus = getStockStatus(item)
        return <StatusChip status={stockStatus.label} />
      }
    },
    {
      key: "lastMovement",
      label: "Último Movimiento",
      render: (value: any, item: StockItem) => (
        item.last_movement ? (
          <div className="text-sm">
            <p className="font-medium">{item.last_movement.movement_type}</p>
            <p className="text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.last_movement.created_at)}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">Sin movimientos</span>
        )
      )
    }
  ]

  const actions = [
    {
      label: "Ver detalles",
      icon: Eye,
      variant: 'secondary' as const,
      onClick: (item: StockItem) => handleViewDetails(item)
    },
    ...(isAdmin || isGerente ? [
      {
        label: "Entrada",
        icon: ArrowUp,
        variant: 'primary' as const,
        onClick: (item: StockItem) => handleStockAction('in', item)
      },
      {
        label: "Salida",
        icon: ArrowDown,
        variant: 'secondary' as const,
        onClick: (item: StockItem) => handleStockAction('out', item)
      },
      {
        label: "Transferir",
        icon: ArrowRightLeft,
        variant: 'secondary' as const,
        onClick: (item: StockItem) => handleStockAction('transfer', item)
      }
    ] : [])
  ]

  const renderCell = (item: StockItem, columnKey: string) => {
    switch (columnKey) {
      case "product": {
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.product?.name || 'Producto sin nombre'}</p>
              <p className="text-sm text-gray-500">{item.product?.category || 'Sin categoría'}</p>
            </div>
          </div>
        )
      }
      case "sku": {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {item.product?.sku || 'N/A'}
          </span>
        )
      }
      case "location": {
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{item.location_id}</span>
          </div>
        )
      }
      case "available": {
        return (
          <div className="text-sm text-right">
            <span className="font-semibold text-green-600">{item.available_quantity}</span>
            <span className="text-gray-500 ml-1">{item.unit}</span>
          </div>
        )
      }
      case "reserved": {
        return (
          <div className="text-sm text-right">
            <span className="font-semibold text-orange-600">{item.reserved_quantity}</span>
            <span className="text-gray-500 ml-1">{item.unit}</span>
          </div>
        )
      }
      case "status": {
        const stockStatus = getStockStatus(item)
        return (
          <StatusChip status={stockStatus.label} />
        )
      }
      case "lastMovement": {
        return item.last_movement ? (
          <div className="text-sm">
            <p className="font-medium">{item.last_movement.movement_type}</p>
            <p className="text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.last_movement.created_at)}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">Sin movimientos</span>
        )
      }
      default: {
        return null
      }
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header y controles */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar productos en stock..."
              value={searchTerm}
              onSearch={setSearchTerm}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <SecondaryButton
              onClick={() => setIsFiltersOpen(true)}
              icon={Settings}
              size="md"
            >
              Filtros
            </SecondaryButton>
            
            {productsWithoutInventory.length > 0 && (
              <div className="relative">
                <SecondaryButton
                  onClick={() => setIsProductsWithoutMovementsModalOpen(true)}
                  icon={Package}
                  size="md"
                  className="bg-red-500 text-white hover:bg-red-600 animate-pulse"
                >
                  {productsWithoutInventory.length} Sin Movimientos
                </SecondaryButton>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
              </div>
            )}
            
            {(isAdmin || isGerente) && (
              <PrimaryButton
                onClick={() => handleStockAction('adjust', {} as StockItem)}
                icon={Plus}
                size="md"
              >
                Ajustar Stock
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Ubicación:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="glass-input px-3 py-2 text-sm min-w-[120px]"
            >
              <option value="all">Todas</option>
              <option value="almacen">Almacén</option>
              <option value="cocina">Cocina</option>
              <option value="salon">Salón</option>
            </select>
          </div>
        
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input px-3 py-2 text-sm min-w-[120px]"
            >
              <option value="all">Todas</option>
              <option value="bebidas">Bebidas</option>
              <option value="comida">Comida</option>
              <option value="decoracion">Decoración</option>
              <option value="mobiliario">Mobiliario</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-600 bg-white/40 px-3 py-1 rounded-lg backdrop-blur-sm">
              {stockItems.length} productos encontrados
            </span>
          </div>
        </div>
      </div>


      {/* Data Table */}
      <DataTable
        columns={columns}
        data={stockItems}
        loading={loading}
        actions={actions}
        emptyMessage="No se encontraron productos en inventario"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de filtros */}
      {isFiltersOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros de Inventario</h3>
              </div>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas</option>
                    <option value="almacen">Almacén</option>
                    <option value="cocina">Cocina</option>
                    <option value="salon">Salón</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="comida">Comida</option>
                    <option value="decoracion">Decoración</option>
                    <option value="mobiliario">Mobiliario</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <SecondaryButton
                onClick={() => setIsFiltersOpen(false)}
              >
                Cerrar
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setIsFiltersOpen(false)}
                icon={CheckCircle}
              >
                Aplicar Filtros
              </PrimaryButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de acciones de stock */}
      {selectedStock && (
        <StockModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          stockItem={selectedStock}
          onSuccess={fetchStockItems}
        />
      )}

      {/* Modal de detalles */}
      {isDetailModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Detalles de Inventario</h3>
                  {selectedStock && selectedStock.product && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedStock.product.name} - {selectedStock.product.sku}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              {selectedStock && (
                <div className="space-y-6">
                  {/* Información del producto */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      Información del Producto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Producto</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStock.product?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">SKU</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedStock.product?.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información de stock */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-gray-500" />
                      Niveles de Stock
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedStock.available_quantity || 0}
                        </p>
                        <p className="text-sm text-green-700">Disponible</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedStock.reserved_quantity || 0}
                        </p>
                        <p className="text-sm text-yellow-700">Reservado</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-600">
                          {selectedStock.quarantine_quantity || 0}
                        </p>
                        <p className="text-sm text-red-700">Cuarentena</p>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      Ubicación
                    </label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded border">
                      {selectedStock.location_id || 'N/A'}
                    </p>
                  </div>

                  {/* Lotes */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      Lotes Disponibles ({selectedStock.batches?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {selectedStock.batches?.map((batch, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">Lote: {batch.batch_id}</h5>
                                <StatusChip status={batch.status === 'available' ? 'active' : 'pending'} />
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Cantidad:</span>
                                  <span className="ml-2 font-medium">{batch.quantity} {batch.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Costo:</span>
                                  <span className="ml-2 font-medium">{formatCurrency(batch.cost_per_unit)}/{batch.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Recibido:</span>
                                  <span className="ml-2">{formatDate(batch.received_date)}</span>
                                </div>
                                {batch.expiry_date && (
                                  <div>
                                    <span className="text-gray-600">Vence:</span>
                                    <span className="ml-2 text-orange-600">{formatDate(batch.expiry_date)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <SecondaryButton
                onClick={() => setIsDetailModalOpen(false)}
              >
                Cerrar
              </SecondaryButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para iniciar movimiento */}
      {selectedProductForInitiation && (
        <InitiateMovementModal
          isOpen={isInitiateModalOpen}
          onClose={() => setIsInitiateModalOpen(false)}
          product={selectedProductForInitiation}
          onSuccess={() => {
            fetchStockItems()
            setSelectedProductForInitiation(null)
          }}
        />
      )}

      {/* Modal de productos sin movimientos */}
      <ProductsWithoutMovementsModal
        isOpen={isProductsWithoutMovementsModalOpen}
        onClose={() => setIsProductsWithoutMovementsModalOpen(false)}
        onSuccess={fetchStockItems}
      />
    </div>
  )
}