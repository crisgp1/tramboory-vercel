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
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
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
// import PurchaseOrderModal from "./PurchaseOrderModal"
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
  const { role, isAdmin, isGerente } = useRole()
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
  const { isOpen: isActionModalOpen, onOpen: onActionModalOpen, onClose: onActionModalClose } = useDisclosure()

  const [actionType, setActionType] = useState<'approve' | 'order' | 'receive' | 'cancel'>('approve')

  const itemsPerPage = 10

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter, supplierFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(supplierFilter !== 'all' && { supplier: supplierFilter })
      })

      const response = await fetch(`/api/inventory/purchase-orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      toast.error('Error al cargar las órdenes de compra')
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
    if (!canPerformAction(order, 'edit')) {
      toast.error('Esta orden no puede ser modificada')
      return
    }
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
    if (order.status !== 'DRAFT') {
      toast.error('Solo se pueden eliminar órdenes en borrador')
      return
    }
    setSelectedOrder(order)
    onDeleteModalOpen()
  }

  const handleOrderAction = (order: PurchaseOrder, action: 'approve' | 'order' | 'receive' | 'cancel') => {
    setSelectedOrder(order)
    setActionType(action)
    onActionModalOpen()
  }

  const confirmDelete = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${selectedOrder._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Orden eliminada exitosamente")
        fetchOrders()
        onDeleteModalClose()
      } else {
        toast.error("Error al eliminar la orden")
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error("Error al eliminar la orden")
    }
  }

  const confirmAction = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${selectedOrder._id}/${actionType}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(actionType === 'cancel' && { reason: 'Cancelado desde la interfaz' })
        })
      })

      if (response.ok) {
        const actionLabels = {
          approve: 'aprobada',
          order: 'enviada',
          receive: 'recibida',
          cancel: 'cancelada'
        }
        toast.success(`Orden ${actionLabels[actionType]} exitosamente`)
        fetchOrders()
        onActionModalClose()
      } else {
        toast.error(`Error al ${actionType === 'approve' ? 'aprobar' : actionType === 'order' ? 'enviar' : actionType === 'receive' ? 'recibir' : 'cancelar'} la orden`)
      }
    } catch (error) {
      console.error(`Error ${actionType} order:`, error)
      toast.error("Error al procesar la acción")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'default',
      'PENDING': 'warning',
      'APPROVED': 'primary',
      'ORDERED': 'secondary',
      'RECEIVED': 'success',
      'CANCELLED': 'danger'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobada',
      'ORDERED': 'Enviada',
      'RECEIVED': 'Recibida',
      'CANCELLED': 'Cancelada'
    }
    return labels[status] || status
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

  const exportOrder = async (orderId: string, format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${orderId}/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orden-compra-${orderId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting order:', error)
      toast.error('Error al exportar la orden')
    }
  }

  const canPerformAction = (order: PurchaseOrder, action: string) => {
    switch (action) {
      case 'edit':
        return ['DRAFT', 'PENDING'].includes(order.status)
      case 'approve':
        return order.status === 'PENDING' && (isAdmin || isGerente)
      case 'order':
        return order.status === 'APPROVED' && (isAdmin || isGerente)
      case 'receive':
        return order.status === 'ORDERED'
      case 'cancel':
        return !['RECEIVED', 'CANCELLED'].includes(order.status)
      default:
        return false
    }
  }

  const columns = [
    { key: "id", label: "ID ORDEN" },
    { key: "supplier", label: "PROVEEDOR" },
    { key: "status", label: "ESTADO" },
    { key: "items", label: "ITEMS" },
    { key: "total", label: "TOTAL" },
    { key: "delivery", label: "ENTREGA" },
    { key: "created", label: "CREADA" },
    { key: "actions", label: "ACCIONES" }
  ]

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar órdenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            placeholder="Estado"
            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || 'all')}
            className="min-w-[120px]"
            size="sm"
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
            >
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de órdenes */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de órdenes de compra"
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
              items={orders}
              isLoading={loading}
              loadingContent={<Spinner label="Cargando órdenes..." />}
              emptyContent="No se encontraron órdenes de compra"
            >
              {(item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm font-medium">{item.purchaseOrderId}</p>
                      <p className="text-xs text-gray-500">#{item._id.slice(-6)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{item.supplierName}</p>
                      <p className="text-sm text-gray-500">{item.deliveryLocation}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(item.status) as any}
                    >
                      {getStatusLabel(item.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{item.items.length} productos</p>
                      <p className="text-gray-500">
                        {item.items.reduce((sum, i) => sum + i.quantity, 0)} unidades
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                      <p className="text-gray-500">+ {formatCurrency(item.tax)} IVA</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.expectedDeliveryDate ? (
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatDate(item.expectedDeliveryDate)}
                        </p>
                        {item.actualDeliveryDate && (
                          <p className="text-green-600 flex items-center gap-1">
                            <CheckIcon className="w-3 h-3" />
                            {formatDate(item.actualDeliveryDate)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin fecha</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(item.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewOrder(item)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Acciones de orden">
                          {canPerformAction(item, 'edit') ? (
                            <DropdownItem
                              key="edit"
                              startContent={<PencilIcon className="w-4 h-4" />}
                              onPress={() => handleEditOrder(item)}
                            >
                              Editar
                            </DropdownItem>
                          ) : null}
                          
                          {canPerformAction(item, 'approve') ? (
                            <DropdownItem
                              key="approve"
                              startContent={<CheckIcon className="w-4 h-4" />}
                              onPress={() => handleOrderAction(item, 'approve')}
                              className="text-green-600"
                            >
                              Aprobar
                            </DropdownItem>
                          ) : null}
                          
                          {canPerformAction(item, 'order') ? (
                            <DropdownItem
                              key="order"
                              startContent={<TruckIcon className="w-4 h-4" />}
                              onPress={() => handleOrderAction(item, 'order')}
                              className="text-blue-600"
                            >
                              Enviar
                            </DropdownItem>
                          ) : null}
                          
                          {canPerformAction(item, 'receive') ? (
                            <DropdownItem
                              key="receive"
                              startContent={<DocumentTextIcon className="w-4 h-4" />}
                              onPress={() => handleOrderAction(item, 'receive')}
                              className="text-purple-600"
                            >
                              Recibir
                            </DropdownItem>
                          ) : null}
                          
                          <DropdownItem
                            key="export-pdf"
                            startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                            onPress={() => exportOrder(item._id, 'pdf')}
                          >
                            Exportar PDF
                          </DropdownItem>
                          
                          {canPerformAction(item, 'cancel') ? (
                            <DropdownItem
                              key="cancel"
                              startContent={<XMarkIcon className="w-4 h-4" />}
                              onPress={() => handleOrderAction(item, 'cancel')}
                              className="text-danger"
                            >
                              Cancelar
                            </DropdownItem>
                          ) : null}
                          
                          {item.status === 'DRAFT' && (isAdmin || isGerente) ? (
                            <DropdownItem
                              key="delete"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDeleteOrder(item)}
                              className="text-danger"
                            >
                              Eliminar
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
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

      {/* Modal de orden */}
      {isOrderModalOpen && (
        <Modal
          isOpen={isOrderModalOpen}
          onClose={onOrderModalClose}
          size="5xl"
          backdrop="opaque"
          placement="center"
        >
          <ModalContent>
            <ModalHeader>
              <h3 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Nueva Orden de Compra' :
                 modalMode === 'edit' ? 'Editar Orden' : 'Ver Orden'}
              </h3>
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-600">
                Modal de orden de compra - Implementación pendiente
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onOrderModalClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        backdrop="opaque"
        placement="center"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrashIcon className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-gray-900">
                ¿Estás seguro de que deseas eliminar la orden{' '}
                <strong className="text-red-600">{selectedOrder?.purchaseOrderId}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onDeleteModalClose}
              >
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmDelete}
                startContent={<TrashIcon className="w-4 h-4" />}
              >
                Eliminar
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de acción */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={onActionModalClose}
        backdrop="opaque"
        placement="center"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                actionType === 'approve' ? 'bg-green-100' :
                actionType === 'order' ? 'bg-blue-100' :
                actionType === 'receive' ? 'bg-purple-100' :
                'bg-red-100'
              }`}>
                {actionType === 'approve' && <CheckIcon className="w-4 h-4 text-green-600" />}
                {actionType === 'order' && <TruckIcon className="w-4 h-4 text-blue-600" />}
                {actionType === 'receive' && <DocumentTextIcon className="w-4 h-4 text-purple-600" />}
                {actionType === 'cancel' && <XMarkIcon className="w-4 h-4 text-red-600" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' && 'Aprobar Orden'}
                {actionType === 'order' && 'Enviar Orden'}
                {actionType === 'receive' && 'Recibir Orden'}
                {actionType === 'cancel' && 'Cancelar Orden'}
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-900">
              ¿Estás seguro de que deseas {' '}
              {actionType === 'approve' && 'aprobar'}
              {actionType === 'order' && 'enviar'}
              {actionType === 'receive' && 'marcar como recibida'}
              {actionType === 'cancel' && 'cancelar'}
              {' '} la orden <strong>{selectedOrder?.purchaseOrderId}</strong>?
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onActionModalClose}
              >
                Cancelar
              </Button>
              <Button
                color={actionType === 'cancel' ? 'danger' : 'primary'}
                onPress={confirmAction}
              >
                {actionType === 'approve' && 'Aprobar'}
                {actionType === 'order' && 'Enviar'}
                {actionType === 'receive' && 'Recibir'}
                {actionType === 'cancel' && 'Cancelar'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}