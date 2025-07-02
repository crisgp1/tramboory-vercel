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
  TrashIcon
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
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          {(isAdmin || isGerente) && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={handleCreateProduct}
            >
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <Card className="border border-gray-200">
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
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4">
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

      {/* Modal de producto */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={onProductModalClose}
          product={selectedProduct}
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