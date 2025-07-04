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
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  CubeIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import ProductModal from "./ProductModal"
import { PRODUCT_CATEGORIES } from "@/types/inventory"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  description?: string
  units: {
    base: {
      code: string
      name: string
      category: string
    }
    alternatives: Array<{
      code: string
      name: string
      conversionFactor: number
    }>
  }
  stockLevels: {
    minimum: number
    reorderPoint: number
    unit: string
  }
  suppliers: Array<{
    supplierId: string
    supplierName: string
    isPreferred: boolean
    lastPurchasePrice: number
  }>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ProductManager() {
  const { role, isAdmin, isGerente } = useRole()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  
  const { isOpen: isProductModalOpen, onOpen: onProductModalOpen, onClose: onProductModalClose } = useDisclosure()
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure()

  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchTerm])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/inventory/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setModalMode('create')
    onProductModalOpen()
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    onProductModalOpen()
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('view')
    onProductModalOpen()
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    onDeleteModalOpen()
  }

  const confirmDelete = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/inventory/products/${selectedProduct._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProducts()
        onDeleteModalClose()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alimentos': 'success',
      'Bebidas': 'primary',
      'Insumos de Limpieza': 'warning',
      'Materiales de Cocina': 'secondary',
      'Decoración': 'danger',
      'Servicios': 'default',
      'Otros': 'default'
    }
    return colors[category] || 'default'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const columns = [
    { key: "name", label: "PRODUCTO" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "CATEGORÍA" },
    { key: "baseUnit", label: "UNIDAD BASE" },
    { key: "stockLevels", label: "NIVELES DE STOCK" },
    { key: "suppliers", label: "PROVEEDORES" },
    { key: "status", label: "ESTADO" },
    { key: "actions", label: "ACCIONES" }
  ]

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4">
      {/* Header y controles - Ultra Responsive */}
      <div className="w-full grid grid-cols-1 sm:flex sm:flex-row gap-2 sm:items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />}
            className="w-full"
            size="sm"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          {(isAdmin || isGerente) && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
              onPress={handleCreateProduct}
              className="w-full sm:w-auto"
              size="sm"
            >
              <span className="text-xs sm:text-sm">Nuevo Producto</span>
            </Button>
          )}
        </div>
      </div>

      {/* Vista Desktop - Tabla de productos */}
      <Card className="w-full border border-gray-200 shadow-sm hidden lg:block">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de productos"
            classNames={{
              wrapper: "min-h-[400px]",
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
              items={products}
              isLoading={loading}
              loadingContent={<Spinner label="Cargando productos..." />}
              emptyContent="No se encontraron productos"
            >
              {(item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{item.sku}</span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getCategoryColor(item.category) as any}
                    >
                      {item.category}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {item.units.base.name} ({item.units.base.code})
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Mín: {item.stockLevels.minimum} {item.stockLevels.unit}</p>
                      <p className="text-gray-500">
                        Reorden: {item.stockLevels.reorderPoint} {item.stockLevels.unit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{item.suppliers.length} proveedor(es)</p>
                      {item.suppliers.length > 0 && (
                        <p className="text-gray-500">
                          Preferido: {item.suppliers.find(s => s.isPreferred)?.supplierName || 'N/A'}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={item.isActive ? 'success' : 'danger'}
                    >
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewProduct(item)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      {(isAdmin || isGerente) && (
                        <>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEditProduct(item)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteProduct(item)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Paginación Desktop */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-gray-100">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Vista Mobile - Cards */}
      <div className="w-full lg:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner label="Cargando productos..." />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {products.map((item) => (
              <Card key={item._id} className="w-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={item.isActive ? 'success' : 'danger'}
                    >
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-1.5 bg-gray-50 rounded text-xs">
                      <p className="text-xs text-gray-500 truncate">SKU</p>
                      <p className="font-mono font-medium text-xs truncate">{item.sku}</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded text-xs">
                      <p className="text-xs text-gray-500 truncate">Categoría</p>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getCategoryColor(item.category) as any}
                      >
                        {item.category}
                      </Chip>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-1.5 bg-gray-50 rounded text-xs">
                      <p className="text-xs text-gray-500 truncate">Unidad Base</p>
                      <p className="truncate">{item.units.base.name} ({item.units.base.code})</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded text-xs">
                      <p className="text-xs text-gray-500 truncate">Stock Mínimo</p>
                      <p className="truncate">{item.stockLevels.minimum} {item.stockLevels.unit}</p>
                    </div>
                  </div>
                  
                  <div className="p-1.5 bg-gray-50 rounded text-xs mb-3">
                    <p className="text-xs text-gray-500 truncate">Proveedores</p>
                    <p className="truncate">
                      {item.suppliers.length} proveedor(es)
                      {item.suppliers.length > 0 && `, preferido: ${item.suppliers.find(s => s.isPreferred)?.supplierName || 'N/A'}`}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => handleViewProduct(item)}
                      className="col-span-1"
                      startContent={<EyeIcon className="w-3 h-3 flex-shrink-0" />}
                    >
                      <span className="text-xs truncate">Ver</span>
                    </Button>
                    
                    {(isAdmin || isGerente) && (
                      <>
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => handleEditProduct(item)}
                          className="col-span-1"
                          startContent={<PencilIcon className="w-3 h-3 flex-shrink-0" />}
                        >
                          <span className="text-xs truncate">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDeleteProduct(item)}
                          className="col-span-1"
                          isIconOnly
                        >
                          <TrashIcon className="w-3 h-3 flex-shrink-0" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
        
        {/* Paginación Mobile */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Modal de producto */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={onProductModalClose}
          product={selectedProduct as any}
          mode={modalMode}
          onSuccess={fetchProducts}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
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
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrashIcon className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
          </ModalHeader>
          <ModalBody className="px-6">
            <div className="space-y-3">
              <p className="text-gray-900">
                ¿Estás seguro de que deseas eliminar el producto{' '}
                <strong className="text-red-600">{selectedProduct?.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Esta acción no se puede deshacer y eliminará todos los datos relacionados.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onDeleteModalClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmDelete}
                size="sm"
                startContent={<TrashIcon className="w-4 h-4" />}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar Producto
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}