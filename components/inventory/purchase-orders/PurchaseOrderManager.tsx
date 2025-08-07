"use client"

import React, { useState, useEffect } from "react"
import {
  Plus,
  Edit3,
  Eye,
  Trash2,
  Check,
  X,
  FileText,
  Truck,
  Download,
  ChevronDown
} from 'lucide-react'
import { useRole } from "@/hooks/useRole"
import PurchaseOrderModal from "./PurchaseOrderModal"
import { DataTable, StatusChip, PrimaryButton, SecondaryButton, DangerButton } from "@/components/shared/ui"
import { SearchInput } from "@/components/shared/forms"
import toast from "react-hot-toast"

interface PurchaseOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  notes?: string
}

interface PurchaseOrder {
  id: string
  purchase_order_id: string
  supplier_id: string
  supplier_name: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  tax_rate: number
  total: number
  currency: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  delivery_location: string
  payment_method: 'cash' | 'credit' | 'transfer' | 'check'
  payment_credit_days: number
  payment_due_date?: string
  notes?: string
  approved_by?: string
  approved_at?: string
  ordered_by?: string
  ordered_at?: string
  received_by?: string
  received_at?: string
  cancelled_by?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export default function PurchaseOrderManager() {
  const { isAdmin, isGerente } = useRole()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const itemsPerPage = 10

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter, supplierFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Construir URL con parámetros de consulta
      const searchParams = new URLSearchParams()
      searchParams.append('page', currentPage.toString())
      searchParams.append('limit', itemsPerPage.toString())
      
      if (searchTerm) {
        searchParams.append('search', searchTerm)
      }
      
      if (statusFilter !== 'all') {
        searchParams.append('status', statusFilter)
      }
      
      if (supplierFilter !== 'all') {
        searchParams.append('supplierId', supplierFilter)
      }
      
      const response = await fetch(`/api/inventory/purchase-orders?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener órdenes de compra')
      }
      
      const data = await response.json()
      
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Error al cargar las órdenes de compra')
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = () => {
    setSelectedOrder(null)
    setModalMode('create')
    setIsOrderModalOpen(true)
  }

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setModalMode('edit')
    setIsOrderModalOpen(true)
  }

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setModalMode('view')
    setIsOrderModalOpen(true)
  }

  const handleDeleteOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsDeleteModalOpen(true)
  }

  const handleStatusChange = async (orderId: string, newStatus: PurchaseOrder['status']) => {
    try {
      // Mapear el estado a la acción correspondiente
      const statusToAction = {
        'APPROVED': 'approve',
        'ORDERED': 'order',
        'RECEIVED': 'receive',
        'CANCELLED': 'cancel'
      }

      const action = statusToAction[newStatus as keyof typeof statusToAction]
      if (!action) {
        throw new Error('Acción no válida para el estado')
      }

      const response = await fetch(`/api/inventory/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: newStatus === 'CANCELLED' ? 'Cancelada desde el dashboard' : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el estado de la orden')
      }

      toast.success('Estado de la orden actualizado correctamente')
      await fetchOrders() // Recargar la lista
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Error al actualizar el estado de la orden')
    }
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

  const getStatusColor = (status: PurchaseOrder['status']) => {
    const colors = {
      'DRAFT': 'default',
      'PENDING': 'warning',
      'APPROVED': 'primary',
      'ORDERED': 'secondary',
      'RECEIVED': 'success',
      'CANCELLED': 'danger'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status: PurchaseOrder['status']) => {
    const labels = {
      'DRAFT': 'Borrador',
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobada',
      'ORDERED': 'Enviada',
      'RECEIVED': 'Recibida',
      'CANCELLED': 'Cancelada'
    }
    return labels[status] || status
  }

  const canPerformAction = (action: string, order: PurchaseOrder) => {
    switch (action) {
      case "edit":
        return ['DRAFT', 'PENDING'].includes(order.status)
      case "approve":
        return order.status === 'PENDING'
      case "order":
        return order.status === 'APPROVED'
      case "receive":
        return order.status === 'ORDERED'
      case "cancel":
        return !['RECEIVED', 'CANCELLED'].includes(order.status)
      case "delete":
        return order.status === 'DRAFT'
      default:
        return false
    }
  }

  const columns = [
    {
      key: "id",
      label: "ID Orden",
      render: (value: any, order: PurchaseOrder) => (
        <span className="font-mono text-sm font-medium">
          {order.purchase_order_id || 'N/A'}
        </span>
      )
    },
    {
      key: "supplier",
      label: "Proveedor",
      render: (value: any, order: PurchaseOrder) => (
        <div>
          <p className="font-medium text-gray-900">{(order as any).supplierName || (order as any).supplier_name || 'N/A'}</p>
          <p className="text-sm text-gray-500">{(order as any).deliveryLocation || (order as any).delivery_location || 'N/A'}</p>
        </div>
      )
    },
    {
      key: "status",
      label: "Estado",
      render: (value: any, order: PurchaseOrder) => (
        <StatusChip status={order.status.toLowerCase()} />
      )
    },
    {
      key: "items",
      label: "Items",
      render: (value: any, order: PurchaseOrder) => (
        <span className="text-sm font-medium">
          {order.items?.length || 0}
        </span>
      )
    },
    {
      key: "total",
      label: "Total",
      render: (value: any, order: PurchaseOrder) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.total)}
        </span>
      )
    },
    {
      key: "delivery",
      label: "Entrega",
      render: (value: any, order: PurchaseOrder) => (
        (order as any).expectedDeliveryDate || (order as any).expected_delivery_date ? (
          <div className="text-sm">
            <p className="text-gray-900">{formatDate((order as any).expectedDeliveryDate || (order as any).expected_delivery_date)}</p>
            {((order as any).actualDeliveryDate || (order as any).actual_delivery_date) && (
              <p className="text-green-600">Recibida: {formatDate((order as any).actualDeliveryDate || (order as any).actual_delivery_date)}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No definida</span>
        )
      )
    },
    {
      key: "created",
      label: "Creada",
      render: (value: any, order: PurchaseOrder) => (
        <span className="text-sm text-gray-600">
          {formatDate((order as any).createdAt || order.created_at)}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: "Ver detalles",
      icon: Eye,
      variant: 'secondary' as const,
      onClick: (order: PurchaseOrder) => handleViewOrder(order)
    },
    ...(isAdmin || isGerente ? [
      {
        label: "Editar",
        icon: Edit3,
        variant: 'primary' as const,
        onClick: (order: PurchaseOrder) => handleEditOrder(order),
        show: (order: PurchaseOrder) => canPerformAction("edit", order)
      },
      {
        label: "Aprobar",
        icon: Check,
        variant: 'primary' as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order.id, 'APPROVED'),
        show: (order: PurchaseOrder) => canPerformAction("approve", order)
      },
      {
        label: "Enviar orden",
        icon: Download,
        variant: 'secondary' as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order.id, 'ORDERED'),
        show: (order: PurchaseOrder) => canPerformAction("order", order)
      },
      {
        label: "Marcar recibida",
        icon: Truck,
        variant: 'primary' as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order.id, 'RECEIVED'),
        show: (order: PurchaseOrder) => canPerformAction("receive", order)
      },
      {
        label: "Cancelar",
        icon: X,
        variant: 'danger' as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order.id, 'CANCELLED'),
        show: (order: PurchaseOrder) => canPerformAction("cancel", order)
      },
      {
        label: "Eliminar",
        icon: Trash2,
        variant: 'danger' as const,
        onClick: (order: PurchaseOrder) => handleDeleteOrder(order),
        show: (order: PurchaseOrder) => canPerformAction("delete", order)
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
              placeholder="Buscar órdenes por ID, proveedor..."
              value={searchTerm}
              onSearch={setSearchTerm}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input min-w-[120px] px-4 py-3 pr-8 text-sm appearance-none cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="DRAFT">Borrador</option>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobada</option>
                <option value="ORDERED">Enviada</option>
                <option value="RECEIVED">Recibida</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {(isAdmin || isGerente) && (
              <PrimaryButton
                onClick={handleCreateOrder}
                icon={Plus}
                size="md"
              >
                Nueva Orden
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        actions={actions}
        emptyMessage="No se encontraron órdenes de compra"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modales */}
      {isOrderModalOpen && (
        <PurchaseOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          purchaseOrder={selectedOrder}
          mode={modalMode}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  )
}