"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus,
  Edit3,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react'
import { useRole } from "@/hooks/useRole"
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
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  images?: string[]
  tags?: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

interface PendingProductsManagerProps {
  onRefresh?: () => void
}

export default function PendingProductsManager({ onRefresh }: PendingProductsManagerProps) {
  const { role, isAdmin, isGerente } = useRole()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  const itemsPerPage = 10

  useEffect(() => {
    fetchPendingProducts()
  }, [currentPage, searchTerm])

  const fetchPendingProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        approvalStatus: 'pending',
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
      console.error('Error fetching pending products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    // TODO: Implementar modal de detalles si es necesario
  }

  const handleApproveProduct = (product: Product) => {
    setSelectedProduct(product)
    setApprovalAction('approve')
    setRejectionReason("")
    setIsApprovalModalOpen(true)
  }

  const handleRejectProduct = (product: Product) => {
    setSelectedProduct(product)
    setApprovalAction('reject')
    setRejectionReason("")
    setIsApprovalModalOpen(true)
  }

  const submitApproval = async () => {
    if (!selectedProduct) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/inventory/products/${selectedProduct.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: approvalAction,
          rejection_reason: approvalAction === 'reject' ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchPendingProducts()
        setIsApprovalModalOpen(false)
        if (onRefresh) onRefresh()
      } else {
        const error = await response.json()
        console.error('Error:', error.error)
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    } finally {
      setActionLoading(false)
    }
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
          <p className="text-xs text-slate-400 mt-1">
            Por: {item.created_by || 'N/A'}
          </p>
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
      key: "pricing",
      label: "Precios",
      render: (value: any, item: Product) => (
        <div className="text-sm">
          <p>Costo: {formatCurrency(item.last_cost || 0)}</p>
          <p className="text-slate-500">
            Stock mín: {item.stock_minimum} {item.stock_unit}
          </p>
        </div>
      )
    },
    {
      key: "created_at",
      label: "Solicitado",
      render: (value: any, item: Product) => (
        <div className="text-sm">
          <p>{new Date(item.created_at).toLocaleDateString()}</p>
          <p className="text-slate-500 flex items-center gap-1">
            <Clock size={12} />
            Pendiente
          </p>
        </div>
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
        label: "Aprobar",
        icon: CheckCircle,
        variant: 'primary' as const,
        onClick: (item: Product) => handleApproveProduct(item),
        className: "bg-green-600 text-white hover:bg-green-700 border-green-600"
      },
      {
        label: "Rechazar",
        icon: XCircle,
        variant: 'danger' as const,
        onClick: (item: Product) => handleRejectProduct(item)
      }
    ] : [])
  ]

  if (!isAdmin && !isGerente) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No tienes permisos para gestionar aprobaciones de productos.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Productos Pendientes de Aprobación
            </h3>
            <p className="text-slate-600 text-sm">
              Revisa y aprueba productos enviados por proveedores
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1">
              <Clock size={14} />
              {products.length} pendientes
            </div>
          </div>
        </div>

        <div className="mt-4">
          <SearchInput
            placeholder="Buscar productos pendientes por nombre o SKU..."
            value={searchTerm}
            onSearch={setSearchTerm}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        actions={actions}
        emptyMessage="No hay productos pendientes de aprobación"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de aprobación/rechazo */}
      {isApprovalModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${
              approvalAction === 'approve' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-red-50 to-rose-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  approvalAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {approvalAction === 'approve' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {approvalAction === 'approve' ? 'Aprobar Producto' : 'Rechazar Producto'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                disabled={actionLoading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-900 font-medium">
                    Producto: <span className="text-blue-600">{selectedProduct?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    SKU: {selectedProduct?.sku || 'N/A'} | Categoría: {selectedProduct?.category}
                  </p>
                </div>

                {approvalAction === 'approve' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      ✓ Aprobar Producto
                    </h4>
                    <p className="text-sm text-green-700">
                      Al aprobar este producto, estará disponible en el sistema y el proveedor podrá gestionarlo completamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        ✗ Rechazar Producto
                      </h4>
                      <p className="text-sm text-red-700">
                        Al rechazar este producto, no estará disponible en el sistema y se notificará al proveedor.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo del rechazo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explica por qué se rechaza el producto..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end gap-3">
                <SecondaryButton
                  onClick={() => setIsApprovalModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </SecondaryButton>
                
                {approvalAction === 'approve' ? (
                  <PrimaryButton
                    onClick={submitApproval}
                    disabled={actionLoading}
                    loading={actionLoading}
                    icon={CheckCircle}
                    className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                  >
                    {actionLoading ? 'Aprobando...' : 'Aprobar Producto'}
                  </PrimaryButton>
                ) : (
                  <DangerButton
                    onClick={submitApproval}
                    disabled={actionLoading || !rejectionReason.trim()}
                    loading={actionLoading}
                    icon={XCircle}
                  >
                    {actionLoading ? 'Rechazando...' : 'Rechazar Producto'}
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