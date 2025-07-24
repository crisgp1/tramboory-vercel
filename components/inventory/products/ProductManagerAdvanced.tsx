"use client"

import React, { useState, useEffect } from "react"
import { 
  Input,
  Button,
  useDisclosure,
  Spinner,
  Pagination
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  CubeIcon,
  FunnelIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import { 
  NordicTable, 
  NordicStatusChip,
  NordicButton,
  nordicTokens 
} from "@/components/ui/nordic"
import ProductModalEnhanced from "./ProductModalEnhanced"
import toast from "react-hot-toast"

interface Product {
  id: string
  product_id: string
  name: string
  sku?: string
  category: string
  description?: string
  base_unit: string
  stock_minimum: number
  stock_reorder_point: number
  stock_unit: string
  last_cost?: number
  average_cost?: number
  is_active: boolean
  is_perishable: boolean
  requires_batch: boolean
  images?: string[]
  tags?: string[]
  created_at: string
  updated_at: string
}

interface ProductManagerProps {
  searchQuery?: string
}

export default function ProductManagerNordic({ searchQuery = "" }: ProductManagerProps) {
  const { role, isAdmin, isGerente } = useRole()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [localSearch, setLocalSearch] = useState("")

  const canEdit = isAdmin || isGerente
  const itemsPerPage = 10

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(localSearch && { search: localSearch })
      })
      
      const response = await fetch(`/api/inventory/products?${params}`)
      if (!response.ok) {
        throw new Error('Error al cargar productos')
      }
      
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
        setTotalPages(Math.ceil(data.total / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchQuery])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        fetchProducts()
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [localSearch])

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('view')
    onOpen()
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    onOpen()
  }

  const handleCreate = () => {
    setSelectedProduct(null)
    setModalMode('create')
    onOpen()
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/products/${product.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }
      
      toast.success('Producto eliminado exitosamente')
      fetchProducts()
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  const columns = [
    { key: 'name', label: 'Producto' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Categoría' },
    { key: 'base_unit', label: 'Unidad' },
    { key: 'stock_minimum', label: 'Stock Min.' },
    { key: 'last_cost', label: 'Último Costo' },
    { key: 'is_active', label: 'Estado' }
  ]

  const actions = [
    {
      key: 'view',
      label: 'Ver detalles',
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: handleView,
      variant: 'ghost' as const
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: <PencilIcon className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'ghost' as const,
      isVisible: () => canEdit
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: handleDelete,
      variant: 'danger' as const,
      isVisible: () => canEdit
    }
  ]

  const renderCell = (item: Product, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10
              bg-[${nordicTokens.colors.background.tertiary}]
              rounded-[${nordicTokens.radius.md}]
              flex items-center justify-center
            `}>
              <CubeIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className={`
                font-[${nordicTokens.typography.fontWeight.medium}]
                text-[${nordicTokens.colors.text.primary}]
                text-[${nordicTokens.typography.fontSize.sm}]
              `}>
                {item.name}
              </p>
              {item.description && (
                <p className={`
                  text-[${nordicTokens.colors.text.tertiary}]
                  text-[${nordicTokens.typography.fontSize.xs}]
                  truncate
                  max-w-[200px]
                `}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        )
      case 'sku':
        return (
          <span className={`
            font-[${nordicTokens.typography.fontFamily.mono}]
            text-[${nordicTokens.typography.fontSize.xs}]
            bg-[${nordicTokens.colors.background.secondary}]
            px-2 py-1
            rounded-[${nordicTokens.radius.sm}]
          `}>
            {item.sku || '-'}
          </span>
        )
      case 'category':
        return (
          <span className={`
            text-[${nordicTokens.colors.text.secondary}]
            text-[${nordicTokens.typography.fontSize.sm}]
          `}>
            {item.category}
          </span>
        )
      case 'base_unit':
        return (
          <span className={`
            text-[${nordicTokens.colors.text.secondary}]
            text-[${nordicTokens.typography.fontSize.sm}]
          `}>
            {item.base_unit}
          </span>
        )
      case 'stock_minimum':
        return (
          <span className={`
            text-[${nordicTokens.colors.text.primary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontWeight.medium}]
          `}>
            {item.stock_minimum}
          </span>
        )
      case 'last_cost':
        return (
          <span className={`
            text-[${nordicTokens.colors.text.primary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontWeight.medium}]
          `}>
            {formatCurrency(item.last_cost)}
          </span>
        )
      case 'is_active':
        return (
          <NordicStatusChip
            status={item.is_active ? 'active' : 'inactive'}
            label={item.is_active ? 'Activo' : 'Inactivo'}
            variant={item.is_active ? 'success' : 'default'}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar productos..."
            value={localSearch}
            onValueChange={setLocalSearch}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-80"
            classNames={{
              inputWrapper: `
                bg-[${nordicTokens.colors.background.primary}]
                border border-[${nordicTokens.colors.border.primary}]
                rounded-[${nordicTokens.radius.md}]
                hover:border-[${nordicTokens.colors.text.secondary}]
                focus-within:border-[${nordicTokens.colors.border.focus}]
                h-10
              `,
              input: `
                text-[${nordicTokens.colors.text.primary}]
                placeholder:text-[${nordicTokens.colors.text.tertiary}]
              `
            }}
          />
          <NordicButton variant="ghost" size="sm">
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtros
          </NordicButton>
        </div>

        {canEdit && (
          <NordicButton 
            variant="primary" 
            size="md"
            onPress={handleCreate}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Producto
          </NordicButton>
        )}
      </div>

      {/* Products Table */}
      <NordicTable
        columns={columns}
        data={products}
        renderCell={renderCell}
        actions={actions}
        loading={loading}
        emptyMessage="No se encontraron productos"
        pagination={{
          total: totalPages * itemsPerPage,
          current: currentPage,
          onChange: setCurrentPage,
          pageSize: itemsPerPage
        }}
      />

      {/* Product Modal */}
      <ProductModalEnhanced
        isOpen={isOpen}
        onClose={onClose}
        product={selectedProduct}
        mode={modalMode}
        onSuccess={fetchProducts}
      />
    </div>
  )
}