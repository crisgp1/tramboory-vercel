"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus,
  Edit3,
  Eye,
  Trash2,
  Package,
  RotateCcw,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react'
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Grid,
  Alert,
  List,
  Center,
  Loader
} from "@mantine/core"
import { useRole } from "@/hooks/useRole"
import ProductModal from "./ProductModal"
import { PRODUCT_CATEGORIES } from "@/types/inventory"
import { DataTable, StatusChip, PrimaryButton, SecondaryButton, DangerButton } from "@/components/shared/ui"
import { SearchInput } from "@/components/shared/forms"

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

export default function ProductManager() {
  const { role, isAdmin, isGerente } = useRole()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [deletionAnalysis, setDeletionAnalysis] = useState<any>(null)
  const [deletionLoading, setDeletionLoading] = useState(false)
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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
        if (data.success) {
          setProducts(data.products || [])
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
        } else {
          console.error('API Error:', data.error)
          setProducts([])
        }
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
    setIsProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    setIsProductModalOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('view')
    setIsProductModalOpen(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    setSelectedProduct(product)
    setDeletionAnalysis(null)
    setDeletionLoading(true)
    
    try {
      // Check deletion eligibility using our new API endpoint
      const response = await fetch(`/api/inventory/products/${product.id}/check-deletion`)
      if (response.ok) {
        const analysis = await response.json()
        setDeletionAnalysis(analysis)
      } else {
        console.error('Error checking deletion eligibility')
        setDeletionAnalysis({
          canDelete: false,
          canDeactivate: true,
          blockers: ['Error al verificar dependencias'],
          analysis: {
            recommendation: 'Error en la verificación. Contacte al administrador.'
          }
        })
      }
    } catch (error) {
      console.error('Error checking deletion eligibility:', error)
      setDeletionAnalysis({
        canDelete: false,
        canDeactivate: true,
        blockers: ['Error de conexión'],
        analysis: {
          recommendation: 'Error de conexión. Verifique su conexión e intente nuevamente.'
        }
      })
    } finally {
      setDeletionLoading(false)
      setIsDeleteModalOpen(true)
    }
  }

  const confirmDelete = async (forceHardDelete: boolean = false) => {
    if (!selectedProduct) return
    setDeletionLoading(true)

    try {
      const url = forceHardDelete ? 
        `/api/inventory/products/${selectedProduct.id}?force=true` :
        `/api/inventory/products/${selectedProduct.id}`
        
      const response = await fetch(url, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        // Show success message based on deletion type
        console.log(result.type === 'HARD_DELETE' ? 
          'Producto eliminado físicamente' : 
          'Producto desactivado (eliminación lógica)')
        fetchProducts()
        setIsDeleteModalOpen(false)
      } else {
        // Show error with details
        console.error('Deletion failed:', result.error)
        if (result.blockers) {
          console.error('Blockers:', result.blockers)
        }
        // You could show a toast notification here with the error details
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setDeletionLoading(false)
    }
  }

  const handleReactivateProduct = async (product: Product) => {
    try {
      const response = await fetch(`/api/inventory/products/${product.id}/reactivate`, {
        method: 'POST'
      })

      if (response.ok) {
        console.log('Producto reactivado exitosamente')
        fetchProducts()
      } else {
        const result = await response.json()
        console.error('Error reactivating product:', result.error)
      }
    } catch (error) {
      console.error('Error reactivating product:', error)
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
    {
      key: "name",
      label: "Producto",
      render: (value: any, item: Product) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          {item.description && (
            <p className="text-sm text-slate-500 truncate max-w-xs">
              {item.description}
            </p>
          )}
        </div>
      )
    },
    {
      key: "sku",
      label: "SKU",
      render: (value: any, item: Product) => (
        <span className="font-mono text-sm">{item.sku}</span>
      )
    },
    {
      key: "category",
      label: "Categoría",
      render: (value: any, item: Product) => (
        <StatusChip status={item.category.toLowerCase().replace(' ', '_')} />
      )
    },
    {
      key: "base_unit",
      label: "Unidad Base"
    },
    {
      key: "stockLevels",
      label: "Niveles de Stock",
      render: (value: any, item: Product) => (
        <div className="text-sm">
          <p>Mín: {item.stock_minimum} {item.stock_unit}</p>
          <p className="text-slate-500">
            Reorden: {item.stock_reorder_point} {item.stock_unit}
          </p>
        </div>
      )
    },
    {
      key: "status",
      label: "Estado",
      render: (value: any, item: Product) => (
        <StatusChip status={item.is_active ? 'active' : 'inactive'} />
      )
    }
  ]

  const actions = [
    {
      label: "Ver detalles",
      icon: Eye,
      variant: 'secondary' as const,
      onClick: (item: Product) => handleViewProduct(item)
    },
    ...(isAdmin || isGerente ? [
      {
        label: "Editar",
        icon: Edit3,
        variant: 'primary' as const,
        onClick: (item: Product) => handleEditProduct(item),
        show: (item: Product) => item.is_active
      },
      {
        label: "Eliminar",
        icon: Trash2,
        variant: 'danger' as const,
        onClick: (item: Product) => handleDeleteProduct(item),
        show: (item: Product) => item.is_active
      },
      {
        label: "Reactivar",
        icon: RotateCcw,
        variant: 'primary' as const,
        onClick: (item: Product) => handleReactivateProduct(item),
        show: (item: Product) => !item.is_active
      }
    ] : [])
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header y controles */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar productos por nombre o SKU..."
              value={searchTerm}
              onSearch={setSearchTerm}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            {(isAdmin || isGerente) && (
              <PrimaryButton
                onClick={handleCreateProduct}
                icon={Plus}
                size="md"
              >
                Nuevo Producto
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        actions={actions}
        emptyMessage="No se encontraron productos"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />


      {/* Modal de producto */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={selectedProduct as any}
          mode={modalMode}
          onSuccess={fetchProducts}
        />
      )}

      {/* Modal de gestión de eliminación - Mantine */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          <Group>
            <AlertTriangle size={24} color="orange" />
            <Text size="lg" fw={600}>Análisis de Eliminación de Producto</Text>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          <div>
            <Text fw={500}>
              Producto: <Text span c="blue">{selectedProduct?.name}</Text>
            </Text>
            <Text size="sm" c="dimmed">
              SKU: {selectedProduct?.sku || 'N/A'}
            </Text>
          </div>

          {deletionLoading ? (
            <Center py="xl">
              <Group>
                <Loader size="md" />
                <Text c="dimmed">Analizando dependencias...</Text>
              </Group>
            </Center>
          ) : deletionAnalysis ? (
            <Stack gap="md">
              {/* Status Cards */}
              <Grid>
                <Grid.Col span={6}>
                  <Paper
                    p="sm"
                    withBorder
                    bg={deletionAnalysis.canDeactivate ? 'green.0' : 'red.0'}
                  >
                    <Text size="sm" fw={500}>Eliminación Lógica</Text>
                    <Text
                      size="xs"
                      c={deletionAnalysis.canDeactivate ? 'green' : 'red'}
                    >
                      {deletionAnalysis.canDeactivate ? '✓ Disponible' : '✗ Bloqueada'}
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Paper
                    p="sm"
                    withBorder
                    bg={deletionAnalysis.canDelete ? 'green.0' : 'red.0'}
                  >
                    <Text size="sm" fw={500}>Eliminación Física</Text>
                    <Text
                      size="xs"
                      c={deletionAnalysis.canDelete ? 'green' : 'red'}
                    >
                      {deletionAnalysis.canDelete ? '✓ Disponible' : '✗ Bloqueada'}
                    </Text>
                  </Paper>
                </Grid.Col>
              </Grid>

              {/* Blockers */}
              {deletionAnalysis.blockers && deletionAnalysis.blockers.length > 0 && (
                <Alert icon={<AlertTriangle size={16} />} color="yellow">
                  <Text size="sm" fw={500} mb="xs">
                    ⚠️ Dependencias Encontradas:
                  </Text>
                  <List size="sm">
                    {deletionAnalysis.blockers.map((blocker: string, index: number) => (
                      <List.Item key={index}>{blocker}</List.Item>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Recommendation */}
              <Alert icon={<Text>💡</Text>} color="blue">
                <Text size="sm" fw={500} mb="xs">
                  Recomendación:
                </Text>
                <Text size="sm">
                  {deletionAnalysis.analysis?.recommendation ||
                   (deletionAnalysis.canDelete
                     ? 'Puede eliminarse físicamente sin afectar la integridad de datos.'
                     : 'Use eliminación lógica (desactivar) para preservar el historial.')}
                </Text>
              </Alert>

              {/* Industry Standard Note */}
              <Paper bg="gray.0" p="sm" withBorder>
                <Text size="xs" c="dimmed">
                  <Text span fw={500}>Estándar Industrial:</Text> {deletionAnalysis.analysis?.industry_standard ||
                  'SAP, Odoo y NetSuite recomiendan eliminación lógica para productos con historial.'}
                </Text>
              </Paper>
            </Stack>
          ) : null}

          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletionLoading}
            >
              Cancelar
            </Button>
            
            {deletionAnalysis?.canDeactivate && (
              <Button
                color="yellow"
                onClick={() => confirmDelete(false)}
                disabled={deletionLoading}
                loading={deletionLoading}
                leftSection={<Trash2 size={16} />}
              >
                Desactivar (Recomendado)
              </Button>
            )}
            
            {deletionAnalysis?.canDelete && (
              <Button
                color="red"
                onClick={() => confirmDelete(true)}
                disabled={deletionLoading}
                loading={deletionLoading}
                leftSection={<Trash2 size={16} />}
              >
                Eliminar Físicamente
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}