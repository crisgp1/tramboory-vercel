"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
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
  Spinner
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  DocumentArrowDownIcon
} from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import PurchaseOrderModal from "./PurchaseOrderModal"
import NordicTable from "@/components/ui/NordicTable"
import toast from "react-hot-toast"

interface PurchaseOrderItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  notes?: string
}

interface PurchaseOrder {
  _id: string
  purchaseOrderId: string
  supplierId: string
  supplierName: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  deliveryLocation: string
  paymentTerms: {
    method: 'cash' | 'credit' | 'transfer' | 'check'
    creditDays: number
    dueDate?: string
  }
  notes?: string
  approvedBy?: string
  approvedAt?: string
  orderedBy?: string
  orderedAt?: string
  receivedBy?: string
  receivedAt?: string
  cancelledBy?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
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
  
  const { isOpen: isOrderModalOpen, onOpen: onOrderModalOpen, onClose: onOrderModalClose } = useDisclosure()
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure()
  
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
    onOrderModalOpen()
  }

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setModalMode('edit')
    onOrderModalOpen()
  }

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setModalMode('view')
    onOrderModalOpen()
  }

  const handleDeleteOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    onDeleteModalOpen()
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
    { key: "id", label: "ID Orden", width: "w-32" },
    { key: "supplier", label: "Proveedor" },
    { key: "status", label: "Estado", width: "w-28", align: "center" as const },
    { key: "items", label: "Items", width: "w-20", align: "center" as const },
    { key: "total", label: "Total", width: "w-24", align: "right" as const },
    { key: "delivery", label: "Entrega", width: "w-32" },
    { key: "created", label: "Creada", width: "w-32" }
  ]

  const actions = [
    {
      key: "view",
      label: "Ver detalles",
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: handleViewOrder
    },
    ...(isAdmin || isGerente ? [
      {
        key: "edit",
        label: "Editar",
        icon: <PencilIcon className="w-4 h-4" />,
        color: "primary" as const,
        onClick: handleEditOrder,
        isVisible: (order: PurchaseOrder) => canPerformAction("edit", order)
      },
      {
        key: "approve",
        label: "Aprobar",
        icon: <CheckIcon className="w-4 h-4" />,
        color: "primary" as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order._id, 'APPROVED'),
        isVisible: (order: PurchaseOrder) => canPerformAction("approve", order)
      },
      {
        key: "order",
        label: "Enviar orden",
        icon: <DocumentArrowDownIcon className="w-4 h-4" />,
        onClick: (order: PurchaseOrder) => handleStatusChange(order._id, 'ORDERED'),
        isVisible: (order: PurchaseOrder) => canPerformAction("order", order)
      },
      {
        key: "receive",
        label: "Marcar recibida",
        icon: <TruckIcon className="w-4 h-4" />,
        color: "primary" as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order._id, 'RECEIVED'),
        isVisible: (order: PurchaseOrder) => canPerformAction("receive", order)
      },
      {
        key: "cancel",
        label: "Cancelar",
        icon: <XMarkIcon className="w-4 h-4" />,
        color: "danger" as const,
        onClick: (order: PurchaseOrder) => handleStatusChange(order._id, 'CANCELLED'),
        isVisible: (order: PurchaseOrder) => canPerformAction("cancel", order)
      },
      {
        key: "delete",
        label: "Eliminar",
        icon: <TrashIcon className="w-4 h-4" />,
        color: "danger" as const,
        onClick: handleDeleteOrder,
        isVisible: (order: PurchaseOrder) => canPerformAction("delete", order)
      }
    ] : [])
  ]

  const renderCell = (order: PurchaseOrder, columnKey: string) => {
    switch (columnKey) {
      case "id": {
        return (
          <span className="font-mono text-sm font-medium">
            {order.purchaseOrderId}
          </span>
        )
      }
      case "supplier": {
        return (
          <div>
            <p className="font-medium text-gray-900">{order.supplierName}</p>
            <p className="text-sm text-gray-500">{order.deliveryLocation}</p>
          </div>
        )
      }
      case "status": {
        return (
          <Chip
            size="sm"
            variant="flat"
            color={getStatusColor(order.status) as any}
            className="font-medium"
          >
            {getStatusLabel(order.status)}
          </Chip>
        )
      }
      case "items": {
        return (
          <span className="text-sm font-medium">
            {order.items.length}
          </span>
        )
      }
      case "total": {
        return (
          <span className="font-semibold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        )
      }
      case "delivery": {
        return order.expectedDeliveryDate ? (
          <div className="text-sm">
            <p className="text-gray-900">{formatDate(order.expectedDeliveryDate)}</p>
            {order.actualDeliveryDate && (
              <p className="text-green-600">Recibida: {formatDate(order.actualDeliveryDate)}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No definida</span>
        )
      }
      case "created": {
        return (
          <span className="text-sm text-gray-600">
            {formatDate(order.createdAt)}
          </span>
        )
      }
      default: {
        return null
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar órdenes..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            placeholder="Estado"
            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
            onSelectionChange={(keys: any) => setStatusFilter(Array.from(keys)[0] as string || 'all')}
            className="min-w-[120px]"
          >
            <SelectItem key="all">Todos</SelectItem>
            <SelectItem key="DRAFT">Borrador</SelectItem>
            <SelectItem key="PENDING">Pendiente</SelectItem>
            <SelectItem key="APPROVED">Aprobada</SelectItem>
            <SelectItem key="ORDERED">Enviada</SelectItem>
            <SelectItem key="RECEIVED">Recibida</SelectItem>
            <SelectItem key="CANCELLED">Cancelada</SelectItem>
          </Select>

          {(isAdmin || isGerente) && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={handleCreateOrder}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Vista Desktop - Tabla Nordic */}
      <div className="hidden lg:block">
        <NordicTable
          columns={columns}
          data={orders}
          renderCell={renderCell}
          actions={actions}
          loading={loading}
          emptyMessage="No se encontraron órdenes de compra"
          pagination={totalPages > 1 ? {
            total: totalPages,
            current: currentPage,
            onChange: setCurrentPage
          } : undefined}
        />
      </div>

      {/* Vista Mobile - Cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner label="Cargando órdenes..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron órdenes de compra</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order._id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-medium">{order.purchaseOrderId}</p>
                      <p className="font-medium text-gray-900">{order.supplierName}</p>
                      <p className="text-sm text-gray-500">{order.deliveryLocation}</p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(order.status) as any}
                    >
                      {getStatusLabel(order.status)}
                    </Chip>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Items</p>
                      <p className="font-medium">{order.items.length} productos</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => handleViewOrder(order)}
                      startContent={<EyeIcon className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Ver
                    </Button>
                    
                    {(isAdmin || isGerente) && canPerformAction("edit", order) && (
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleEditOrder(order)}
                        startContent={<PencilIcon className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {isOrderModalOpen && (
        <PurchaseOrderModal
          isOpen={isOrderModalOpen}
          onClose={onOrderModalClose}
          order={selectedOrder}
          mode={modalMode}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  )
}