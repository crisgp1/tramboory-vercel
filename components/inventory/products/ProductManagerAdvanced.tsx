"use client"

import React, { useState, useEffect } from "react"
import { 
  TextInput,
  Button,
  Loader,
  Pagination,
  Modal,
  Group,
  Stack,
  Badge,
  Card,
  Title,
  Text,
  ActionIcon,
  Menu
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconSearch,
  IconPlus,
  IconPencil,
  IconEye,
  IconTrash,
  IconCube,
  IconFilter
} from "@tabler/icons-react"
import { useRole } from "@/hooks/useRole"
import { 
  NordicTable, 
  NordicStatusChip,
  NordicButton,
  nordicTokens 
} from "@/components/ui/nordic"
import ProductModal from "./ProductModal"
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
  const [opened, { open, close }] = useDisclosure(false)
  
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
    open()
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    open()
  }

  const handleCreate = () => {
    setSelectedProduct(null)
    setModalMode('create')
    open()
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
      icon: <IconEye size={16} />,
      onClick: handleView,
      variant: 'ghost' as const
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: <IconPencil size={16} />,
      onClick: handleEdit,
      variant: 'ghost' as const,
      isVisible: () => canEdit
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: <IconTrash size={16} />,
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
              <IconCube size={20} className="text-gray-600" />
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
    <Card>
      <Stack spacing="md">
        {/* Header Actions */}
        <Group position="apart">
          <Group>
            <TextInput
              placeholder="Buscar productos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.currentTarget.value)}
              icon={<IconSearch size={16} />}
              style={{ width: 320 }}
            />
            <Button variant="light" leftIcon={<IconFilter size={16} />}>
              Filtros
            </Button>
          </Group>

          {canEdit && (
            <Button
              onClick={handleCreate}
              leftIcon={<IconPlus size={16} />}
            >
              Nuevo Producto
            </Button>
          )}
        </Group>

        {/* Products Table */}
        {loading ? (
          <Group position="center" style={{ padding: 40 }}>
            <Loader />
          </Group>
        ) : (
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
        )}

        {/* Product Modal */}
        <ProductModal
          isOpen={opened}
          onClose={close}
          product={selectedProduct as any}
          mode={modalMode}
          onSuccess={fetchProducts}
        />
      </Stack>
    </Card>
  )
}