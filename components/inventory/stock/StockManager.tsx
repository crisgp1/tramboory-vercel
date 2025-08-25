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
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Grid,
  Badge,
  Select
} from "@mantine/core"
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
        let badgeColor: string
        let badgeVariant: "light" | "filled" = "light"
        
        switch (stockStatus.color) {
          case 'success':
            badgeColor = 'green'
            break
          case 'warning':
            badgeColor = 'yellow'
            break
          case 'danger':
            badgeColor = 'red'
            break
          default:
            badgeColor = 'gray'
        }
        
        return (
          <Badge
            color={badgeColor}
            variant={badgeVariant}
            size="sm"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'unset',
              minWidth: 'fit-content'
            }}
          >
            {stockStatus.label}
          </Badge>
        )
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
        let badgeColor: string
        let badgeVariant: "light" | "filled" = "light"
        
        switch (stockStatus.color) {
          case 'success':
            badgeColor = 'green'
            break
          case 'warning':
            badgeColor = 'yellow'
            break
          case 'danger':
            badgeColor = 'red'
            break
          default:
            badgeColor = 'gray'
        }
        
        return (
          <Badge
            color={badgeColor}
            variant={badgeVariant}
            size="sm"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'unset',
              minWidth: 'fit-content'
            }}
          >
            {stockStatus.label}
          </Badge>
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
      <div className="surface-card p-6">
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
                <DangerButton
                  onClick={() => setIsProductsWithoutMovementsModalOpen(true)}
                  icon={Package}
                  size="md"
                  className="animate-pulse"
                >
                  {productsWithoutInventory.length} Sin Movimientos
                </DangerButton>
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
      <div className="surface-card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Text size="sm" fw={500}>Ubicación:</Text>
            <Select
              value={selectedLocation}
              onChange={(value) => setSelectedLocation(value || 'all')}
              data={[
                { value: 'all', label: 'Todas' },
                { value: 'almacen', label: 'Almacén' },
                { value: 'cocina', label: 'Cocina' },
                { value: 'salon', label: 'Salón' }
              ]}
              size="sm"
              style={{ minWidth: 120 }}
              variant="filled"
            />
          </div>
        
          <div className="flex items-center gap-2">
            <Text size="sm" fw={500}>Categoría:</Text>
            <Select
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'all')}
              data={[
                { value: 'all', label: 'Todas' },
                { value: 'bebidas', label: 'Bebidas' },
                { value: 'comida', label: 'Comida' },
                { value: 'decoracion', label: 'Decoración' },
                { value: 'mobiliario', label: 'Mobiliario' }
              ]}
              size="sm"
              style={{ minWidth: 120 }}
              variant="filled"
            />
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

      {/* Modal de filtros - Mantine */}
      <Modal
        opened={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title={
          <Group>
            <Settings size={20} color="blue" />
            <Text size="lg" fw={600}>Filtros de Inventario</Text>
          </Group>
        }
        size="sm"
        centered
      >
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">Ubicación</Text>
            <Select
              value={selectedLocation}
              onChange={(value) => setSelectedLocation(value || 'all')}
              data={[
                { value: 'all', label: 'Todas' },
                { value: 'almacen', label: 'Almacén' },
                { value: 'cocina', label: 'Cocina' },
                { value: 'salon', label: 'Salón' }
              ]}
              placeholder="Seleccionar ubicación"
            />
          </div>
          
          <div>
            <Text size="sm" fw={500} mb="xs">Categoría</Text>
            <Select
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'all')}
              data={[
                { value: 'all', label: 'Todas' },
                { value: 'bebidas', label: 'Bebidas' },
                { value: 'comida', label: 'Comida' },
                { value: 'decoracion', label: 'Decoración' },
                { value: 'mobiliario', label: 'Mobiliario' }
              ]}
              placeholder="Seleccionar categoría"
            />
          </div>

          <Group justify="flex-end" gap="sm" mt="lg">
            <Button variant="light" onClick={() => setIsFiltersOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => setIsFiltersOpen(false)}
              leftSection={<CheckCircle size={16} />}
            >
              Aplicar Filtros
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de acciones de stock */}
      {selectedStock && (
        <StockModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          stockItem={selectedStock}
          onSuccess={fetchStockItems}
        />
      )}

      {/* Modal de detalles - Mantine */}
      <Modal
        opened={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          <Group>
            <Eye size={20} color="green" />
            <div>
              <Text size="lg" fw={600}>Detalles de Inventario</Text>
              {selectedStock && selectedStock.product && (
                <Text size="sm" c="dimmed">
                  {selectedStock.product.name} - {selectedStock.product.sku}
                </Text>
              )}
            </div>
          </Group>
        }
        size="xl"
        centered
      >
        {selectedStock && (
          <Stack gap="lg">
            {/* Información del producto */}
            <Paper p="md" bg="gray.0" withBorder>
              <Group mb="sm">
                <Package size={16} />
                <Text size="sm" fw={500}>Información del Producto</Text>
              </Group>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" fw={500} c="dimmed">Producto</Text>
                  <Text size="sm">{selectedStock.product?.name || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" fw={500} c="dimmed">SKU</Text>
                  <Text size="sm" ff="monospace">{selectedStock.product?.sku || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Información de stock */}
            <Paper p="md" bg="gray.0" withBorder>
              <Group mb="sm">
                <BarChart3 size={16} />
                <Text size="sm" fw={500}>Niveles de Stock</Text>
              </Group>
              <Grid>
                <Grid.Col span={4}>
                  <Paper ta="center" p="sm" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-3)' }}>
                    <Text size="xl" fw={700} c="green.6">
                      {selectedStock.available_quantity || 0}
                    </Text>
                    <Text size="xs" c="green.7">Disponible</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper ta="center" p="sm" bg="yellow.0" withBorder style={{ borderColor: 'var(--mantine-color-yellow-3)' }}>
                    <Text size="xl" fw={700} c="yellow.6">
                      {selectedStock.reserved_quantity || 0}
                    </Text>
                    <Text size="xs" c="yellow.7">Reservado</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper ta="center" p="sm" bg="red.0" withBorder style={{ borderColor: 'var(--mantine-color-red-3)' }}>
                    <Text size="xl" fw={700} c="red.6">
                      {selectedStock.quarantine_quantity || 0}
                    </Text>
                    <Text size="xs" c="red.7">Cuarentena</Text>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Ubicación */}
            <div>
              <Group mb="xs">
                <MapPin size={16} />
                <Text size="sm" fw={500}>Ubicación</Text>
              </Group>
              <Paper p="sm" bg="gray.0" withBorder>
                <Text size="sm">{selectedStock.location_id || 'N/A'}</Text>
              </Paper>
            </div>

            {/* Lotes */}
            <div>
              <Group mb="sm">
                <FileText size={16} />
                <Text size="sm" fw={500}>Lotes Disponibles ({selectedStock.batches?.length || 0})</Text>
              </Group>
              <Stack gap="sm">
                {selectedStock.batches?.map((batch, index) => (
                  <Paper key={index} p="md" bg="gray.0" withBorder>
                    <Group justify="space-between" mb="sm">
                      <Text fw={500}>Lote: {batch.batch_id}</Text>
                      <Badge color={batch.status === 'available' ? 'green' : 'yellow'} variant="light">
                        {batch.status === 'available' ? 'Activo' : 'Pendiente'}
                      </Badge>
                    </Group>
                    <Grid>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">Cantidad:</Text>
                        <Text size="sm" fw={500}>{batch.quantity} {batch.unit}</Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">Costo:</Text>
                        <Text size="sm" fw={500}>{formatCurrency(batch.cost_per_unit)}/{batch.unit}</Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c="dimmed">Recibido:</Text>
                        <Text size="sm">{formatDate(batch.received_date)}</Text>
                      </Grid.Col>
                      {batch.expiry_date && (
                        <Grid.Col span={6}>
                          <Text size="xs" c="dimmed">Vence:</Text>
                          <Text size="sm" c="orange.6">{formatDate(batch.expiry_date)}</Text>
                        </Grid.Col>
                      )}
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </div>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setIsDetailModalOpen(false)}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

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