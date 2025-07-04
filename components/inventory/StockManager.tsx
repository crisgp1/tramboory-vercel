"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Spinner
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  FunnelIcon,
  CubeIcon,
  ChartBarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import StockModal from "./StockModal"
import InitiateMovementModal from "./InitiateMovementModal"
import InventoryFilters from "./InventoryFilters"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  units: {
    base: {
      code: string
      name: string
    }
  }
}

interface StockItem {
  _id: string
  productId: {
    _id: string
    name: string
    sku: string
    category: string
  }
  locationId: string
  totals: {
    available: number
    reserved: number
    quarantine: number
    unit: string
  }
  batches: Array<{
    batchId: string
    quantity: number
    unit: string
    costPerUnit: number
    expiryDate?: string
    receivedDate: string
    status: string
  }>
  lastMovement?: {
    type: string
    date: string
    quantity: number
  }
}

export default function StockManager() {
  const { role, isAdmin, isGerente } = useRole()
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
  
  const { isOpen: isStockModalOpen, onOpen: onStockModalOpen, onClose: onStockModalClose } = useDisclosure()
  const { isOpen: isFiltersOpen, onOpen: onFiltersOpen, onClose: onFiltersClose } = useDisclosure()
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure()
  const { isOpen: isInitiateModalOpen, onOpen: onInitiateModalOpen, onClose: onInitiateModalClose } = useDisclosure()

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
      const productsResponse = await fetch(`/api/inventory/products/without-inventory`)
      
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

  const handleStockAction = (action: string, stockItem: StockItem) => {
    setSelectedStock(stockItem)
    onStockModalOpen()
  }

  const handleInitiateMovement = (product: Product) => {
    setSelectedProductForInitiation(product)
    onInitiateModalOpen()
  }

  const handleViewDetails = (stockItem: StockItem) => {
    setSelectedStock(stockItem)
    onDetailModalOpen()
  }

  const getStockStatus = (item: StockItem) => {
    const { available } = item.totals
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
    { key: "product", label: "PRODUCTO" },
    { key: "sku", label: "SKU" },
    { key: "location", label: "UBICACIÓN" },
    { key: "available", label: "DISPONIBLE" },
    { key: "reserved", label: "RESERVADO" },
    { key: "status", label: "ESTADO" },
    { key: "lastMovement", label: "ÚLTIMO MOVIMIENTO" },
    { key: "actions", label: "ACCIONES" }
  ]

  return (
    <div className="space-y-6">
      {/* Header y controles - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
            variant="flat"
            classNames={{
              input: "text-gray-900",
              inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
            }}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="bordered"
            startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            onPress={onFiltersOpen}
            size="sm"
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            Filtros
          </Button>
          
          {(isAdmin || isGerente) && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => handleStockAction('adjust', {} as StockItem)}
              size="sm"
              className="flex-1 sm:flex-none min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              Ajustar Stock
            </Button>
          )}
        </div>
      </div>

      {/* Filtros rápidos - Responsive Flex */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Ubicación:</span>
          <Select
            placeholder="Todas"
            selectedKeys={selectedLocation !== 'all' ? [selectedLocation] : []}
            onSelectionChange={(keys) => setSelectedLocation(Array.from(keys)[0] as string || 'all')}
            size="sm"
            className="min-w-[120px]"
            variant="flat"
            classNames={{
              trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
              value: "text-gray-900"
            }}
          >
            <SelectItem key="all">Todas</SelectItem>
            <SelectItem key="almacen">Almacén</SelectItem>
            <SelectItem key="cocina">Cocina</SelectItem>
            <SelectItem key="salon">Salón</SelectItem>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Categoría:</span>
          <Select
            placeholder="Todas"
            selectedKeys={selectedCategory !== 'all' ? [selectedCategory] : []}
            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string || 'all')}
            size="sm"
            className="min-w-[120px]"
            variant="flat"
            classNames={{
              trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
              value: "text-gray-900"
            }}
          >
            <SelectItem key="all">Todas</SelectItem>
            <SelectItem key="bebidas">Bebidas</SelectItem>
            <SelectItem key="comida">Comida</SelectItem>
            <SelectItem key="decoracion">Decoración</SelectItem>
            <SelectItem key="mobiliario">Mobiliario</SelectItem>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600">
            {stockItems.length} productos encontrados
          </span>
        </div>
      </div>

      {/* Productos sin inventario - Antes de la tabla principal */}
      {productsWithoutInventory.length > 0 && (
        <Card className="border border-orange-200 bg-orange-50 mb-6">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <CubeIcon className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-orange-900">Productos sin Movimientos de Inventario</h4>
              <Chip size="sm" variant="flat" color="warning">
                {productsWithoutInventory.length} productos
              </Chip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsWithoutInventory.map((product) => (
                <Card key={product._id} className="border border-orange-200 bg-white">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 truncate">{product.name}</h5>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <Chip size="sm" variant="flat" color="primary" className="mt-1">
                          {product.sku}
                        </Chip>
                      </div>
                    </div>
                    
                    <Button
                      color="warning"
                      variant="solid"
                      size="sm"
                      className="w-full"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={() => handleInitiateMovement(product)}
                    >
                      Iniciar Movimientos
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vista responsiva - Desktop: Tabla, Mobile: Cards */}
      <Card className="border border-gray-200 shadow-sm">
        <CardBody className="p-0">
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block">
            <Table
              aria-label="Tabla de inventario"
              classNames={{
                wrapper: "min-h-[400px]",
                th: "bg-gray-50 text-gray-700 font-medium text-xs uppercase tracking-wide",
                td: "py-4"
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.key} className="bg-gray-50 text-gray-700 font-medium">
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={stockItems}
                isLoading={loading}
                loadingContent={<Spinner label="Cargando inventario..." />}
                emptyContent="No se encontraron productos en inventario"
              >
                {(item) => (
                  <TableRow key={item._id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CubeIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.productId.name}</p>
                          <p className="text-sm text-gray-500">{item.productId.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.productId.sku}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{item.locationId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-semibold text-green-600">{item.totals.available}</span>
                        <span className="text-gray-500 ml-1">{item.totals.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-semibold text-orange-600">{item.totals.reserved}</span>
                        <span className="text-gray-500 ml-1">{item.totals.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStockStatus(item).color as any}
                        className="font-medium"
                      >
                        {getStockStatus(item).label}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {item.lastMovement ? (
                        <div className="text-sm">
                          <p className="font-medium">{item.lastMovement.type}</p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatDate(item.lastMovement.date)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin movimientos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleViewDetails(item)}
                          className="hover:bg-gray-100"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        
                        {(isAdmin || isGerente) && (
                          <>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="success"
                              onPress={() => handleStockAction('in', item)}
                              className="hover:bg-green-50"
                            >
                              <ArrowUpIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleStockAction('out', item)}
                              className="hover:bg-red-50"
                            >
                              <ArrowDownIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => handleStockAction('transfer', item)}
                              className="hover:bg-blue-50"
                            >
                              <ArrowsRightLeftIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner label="Cargando inventario..." />
              </div>
            ) : stockItems.length === 0 ? (
              <div className="text-center py-12">
                <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron productos en inventario</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {stockItems.map((item) => (
                  <Card key={item._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CubeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{item.productId.name}</h3>
                            <p className="text-sm text-gray-500">{item.productId.category}</p>
                            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                              {item.productId.sku}
                            </p>
                          </div>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getStockStatus(item).color as any}
                          className="font-medium"
                        >
                          {getStockStatus(item).label}
                        </Chip>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-lg font-bold text-green-600">{item.totals.available}</p>
                          <p className="text-xs text-green-700">Disponible</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-lg font-bold text-orange-600">{item.totals.reserved}</p>
                          <p className="text-xs text-orange-700">Reservado</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{item.locationId}</span>
                        </div>
                        {item.lastMovement && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{formatDate(item.lastMovement.date)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => handleViewDetails(item)}
                          className="flex-1"
                          startContent={<EyeIcon className="w-4 h-4" />}
                        >
                          Ver
                        </Button>
                        
                        {(isAdmin || isGerente) && (
                          <>
                            <Button
                              size="sm"
                              variant="light"
                              color="success"
                              onPress={() => handleStockAction('in', item)}
                              isIconOnly
                            >
                              <ArrowUpIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleStockAction('out', item)}
                              isIconOnly
                            >
                              <ArrowDownIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => handleStockAction('transfer', item)}
                              isIconOnly
                            >
                              <ArrowsRightLeftIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-gray-100">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
                size="sm"
                classNames={{
                  wrapper: "gap-0 overflow-visible h-8",
                  item: "w-8 h-8 text-small rounded-none bg-transparent",
                  cursor: "bg-blue-600 shadow-lg from-blue-600 to-blue-600 text-white font-bold"
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de filtros */}
      <Modal
        isOpen={isFiltersOpen}
        onClose={onFiltersClose}
        size="lg"
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-gray-900/20",
          base: "bg-white border border-gray-200",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FunnelIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filtros de Inventario</h3>
            </div>
          </ModalHeader>
          <ModalBody className="px-6">
            <InventoryFilters
              selectedLocation={selectedLocation}
              selectedCategory={selectedCategory}
              onLocationChange={setSelectedLocation}
              onCategoryChange={setSelectedCategory}
            />
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onFiltersClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </Button>
              <Button
                color="primary"
                onPress={onFiltersClose}
                size="sm"
                startContent={<CheckCircleIcon className="w-4 h-4" />}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Aplicar Filtros
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de acciones de stock */}
      {selectedStock && (
        <StockModal
          isOpen={isStockModalOpen}
          onClose={onStockModalClose}
          stockItem={selectedStock}
          onSuccess={fetchStockItems}
        />
      )}

      {/* Modal de detalles */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={onDetailModalClose}
        size="2xl"
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-gray-900/20",
          base: "bg-white border border-gray-200",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Detalles de Inventario</h3>
                {selectedStock && selectedStock.productId && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStock.productId.name} - {selectedStock.productId.sku}
                  </p>
                )}
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6">
            {selectedStock && (
              <div className="space-y-6">
                {/* Información del producto */}
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CubeIcon className="w-4 h-4 text-gray-500" />
                      Información del Producto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Producto</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-900">{selectedStock.productId?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">SKU</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-900 font-mono">{selectedStock.productId?.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Información de stock */}
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4 text-gray-500" />
                      Niveles de Stock
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedStock.totals?.available || 0}
                        </p>
                        <p className="text-sm text-green-700">Disponible</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedStock.totals?.reserved || 0}
                        </p>
                        <p className="text-sm text-yellow-700">Reservado</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-600">
                          {selectedStock.totals?.quarantine || 0}
                        </p>
                        <p className="text-sm text-red-700">Cuarentena</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Información adicional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-500" />
                    Ubicación
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900">{selectedStock.locationId || 'N/A'}</p>
                  </div>
                </div>

                {/* Lotes */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                    Lotes Disponibles ({selectedStock.batches?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {selectedStock.batches?.map((batch, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-gray-900">Lote: {batch.batchId}</h5>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={batch.status === 'available' ? 'success' : 'warning'}
                                >
                                  {batch.status}
                                </Chip>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Cantidad:</span>
                                  <span className="ml-2 font-medium">{batch.quantity} {batch.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Costo:</span>
                                  <span className="ml-2 font-medium">{formatCurrency(batch.costPerUnit)}/{batch.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Recibido:</span>
                                  <span className="ml-2">{formatDate(batch.receivedDate)}</span>
                                </div>
                                {batch.expiryDate && (
                                  <div>
                                    <span className="text-gray-600">Vence:</span>
                                    <span className="ml-2 text-orange-600">{formatDate(batch.expiryDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onDetailModalClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para iniciar movimiento */}
      {selectedProductForInitiation && (
        <InitiateMovementModal
          isOpen={isInitiateModalOpen}
          onClose={onInitiateModalClose}
          product={selectedProductForInitiation}
          onSuccess={() => {
            fetchStockItems()
            setSelectedProductForInitiation(null)
          }}
        />
      )}
    </div>
  )
}