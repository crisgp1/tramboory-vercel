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

      {/* Modal de gestión de eliminación - Glassmorphism */}
      {isDeleteModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            transform: 'none',
            zoom: 1
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Análisis de Eliminación de Producto
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletionLoading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium">
                  Producto: <span className="text-blue-600">{selectedProduct?.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  SKU: {selectedProduct?.sku || 'N/A'}
                </p>
              </div>

              {deletionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="text-gray-600">Analizando dependencias...</span>
                  </div>
                </div>
              ) : deletionAnalysis ? (
                <div className="space-y-4">
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border ${
                      deletionAnalysis.canDeactivate 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-900">Eliminación Lógica</p>
                      <p className={`text-xs ${
                        deletionAnalysis.canDeactivate 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {deletionAnalysis.canDeactivate ? '✓ Disponible' : '✗ Bloqueada'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      deletionAnalysis.canDelete 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-900">Eliminación Física</p>
                      <p className={`text-xs ${
                        deletionAnalysis.canDelete 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {deletionAnalysis.canDelete ? '✓ Disponible' : '✗ Bloqueada'}
                      </p>
                    </div>
                  </div>

                  {/* Blockers */}
                  {deletionAnalysis.blockers && deletionAnalysis.blockers.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">
                        ⚠️ Dependencias Encontradas:
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {deletionAnalysis.blockers.map((blocker: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {blocker}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      💡 Recomendación:
                    </h4>
                    <p className="text-sm text-blue-700">
                      {deletionAnalysis.analysis?.recommendation || 
                       (deletionAnalysis.canDelete 
                         ? 'Puede eliminarse físicamente sin afectar la integridad de datos.'
                         : 'Use eliminación lógica (desactivar) para preservar el historial.')}
                    </p>
                  </div>

                  {/* Industry Standard Note */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">
                      <strong>Estándar Industrial:</strong> {deletionAnalysis.analysis?.industry_standard || 
                      'SAP, Odoo y NetSuite recomiendan eliminación lógica para productos con historial.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end gap-3">
                <SecondaryButton
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deletionLoading}
                >
                  Cancelar
                </SecondaryButton>
                
                {deletionAnalysis?.canDeactivate && (
                  <SecondaryButton
                    onClick={() => confirmDelete(false)}
                    disabled={deletionLoading}
                    loading={deletionLoading}
                    icon={Trash2}
                    className="bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
                  >
                    Desactivar (Recomendado)
                  </SecondaryButton>
                )}
                
                {deletionAnalysis?.canDelete && (
                  <DangerButton
                    onClick={() => confirmDelete(true)}
                    disabled={deletionLoading}
                    loading={deletionLoading}
                    icon={Trash2}
                  >
                    Eliminar Físicamente
                  </DangerButton>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}