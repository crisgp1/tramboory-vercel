"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  DateInput,
  Textarea,
  Divider,
  Progress,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react"
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  ClockIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline"
import { parseDate } from "@internationalized/date"
import toast from "react-hot-toast"

interface Batch {
  _id?: string
  batchNumber: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unit: string
  expirationDate?: string
  manufacturingDate?: string
  supplier: {
    id: string
    name: string
  }
  location: string
  status: 'active' | 'expired' | 'quarantine' | 'reserved' | 'consumed'
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface Product {
  _id: string
  name: string
  sku: string
  units: {
    base: {
      code: string
      name: string
    }
  }
  trackBatches: boolean
  shelfLife?: number // días
}

interface BatchModalProps {
  isOpen: boolean
  onClose: () => void
  batch?: Batch | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

function BatchModal({ isOpen, onClose, batch, mode, onSuccess }: BatchModalProps) {
  const [formData, setFormData] = useState<Partial<Batch>>({
    batchNumber: '',
    productId: '',
    quantity: 0,
    location: 'Almacén Principal',
    status: 'active'
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      if (batch && mode !== 'create') {
        setFormData(batch)
      } else {
        resetForm()
      }
    }
  }, [isOpen, batch, mode])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products?trackBatches=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      batchNumber: '',
      productId: '',
      quantity: 0,
      location: 'Almacén Principal',
      status: 'active'
    })
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        productName: product.name,
        productSku: product.sku,
        unit: product.units.base.code
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.batchNumber || !formData.productId || !formData.quantity) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/batches'
        : `/api/inventory/batches/${batch?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Lote ${mode === 'create' ? 'creado' : 'actualizado'} exitosamente`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar el lote')
      }
    } catch (error) {
      console.error('Error saving batch:', error)
      toast.error('Error al guardar el lote')
    } finally {
      setLoading(false)
    }
  }

  const isReadOnly = mode === 'view'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      backdrop="opaque"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <ArchiveBoxIcon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {mode === 'create' ? 'Nuevo Lote' : 
               mode === 'edit' ? 'Editar Lote' : 'Ver Lote'}
            </h3>
            {batch?.batchNumber && (
              <p className="text-sm text-gray-600">Lote: {batch.batchNumber}</p>
            )}
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Lote"
                placeholder="Ej: LOT-2024-001"
                value={formData.batchNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                isDisabled={isReadOnly}
                isRequired
              />
              
              <Select
                label="Producto"
                placeholder="Selecciona un producto"
                selectedKeys={formData.productId ? [formData.productId] : []}
                onSelectionChange={(keys) => handleProductChange(Array.from(keys)[0] as string)}
                isDisabled={isReadOnly}
                isRequired
              >
                {products.map((product) => (
                  <SelectItem key={product._id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                label="Cantidad"
                value={formData.quantity?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                isDisabled={isReadOnly}
                isRequired
                min="0"
                step="0.01"
                endContent={formData.unit}
              />
              
              <Input
                label="Ubicación"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                isDisabled={isReadOnly}
                isRequired
              />
              
              <Select
                label="Estado"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                isDisabled={isReadOnly}
              >
                <SelectItem key="active">Activo</SelectItem>
                <SelectItem key="quarantine">Cuarentena</SelectItem>
                <SelectItem key="reserved">Reservado</SelectItem>
                <SelectItem key="expired">Vencido</SelectItem>
                <SelectItem key="consumed">Consumido</SelectItem>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="Fecha de Fabricación"
                value={formData.manufacturingDate ? parseDate(formData.manufacturingDate.split('T')[0]) : null}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  manufacturingDate: date?.toString()
                }))}
                isDisabled={isReadOnly}
              />
              
              <DateInput
                label="Fecha de Vencimiento"
                value={formData.expirationDate ? parseDate(formData.expirationDate.split('T')[0]) : null}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  expirationDate: date?.toString()
                }))}
                isDisabled={isReadOnly}
              />
            </div>
            
            <Textarea
              label="Notas"
              placeholder="Notas adicionales del lote..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              isDisabled={isReadOnly}
              maxRows={3}
            />
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
            >
              {mode === 'create' ? 'Crear Lote' : 'Guardar Cambios'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function BatchManager() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expirationFilter, setExpirationFilter] = useState<string>('all')
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/batches')
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      } else {
        toast.error('Error al cargar los lotes')
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Error al cargar los lotes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedBatch(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleView = (batch: Batch) => {
    setSelectedBatch(batch)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleDelete = async (batch: Batch) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este lote?')) return

    try {
      const response = await fetch(`/api/inventory/batches/${batch._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Lote eliminado exitosamente')
        fetchBatches()
      } else {
        toast.error('Error al eliminar el lote')
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Error al eliminar el lote')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'danger'
      case 'quarantine': return 'warning'
      case 'reserved': return 'primary'
      case 'consumed': return 'default'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'expired': return 'Vencido'
      case 'quarantine': return 'Cuarentena'
      case 'reserved': return 'Reservado'
      case 'consumed': return 'Consumido'
      default: return status
    }
  }

  const getDaysToExpiration = (expirationDate: string) => {
    if (!expirationDate) return null
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpirationStatus = (expirationDate: string) => {
    const days = getDaysToExpiration(expirationDate)
    if (days === null) return null
    if (days < 0) return 'expired'
    if (days <= 7) return 'critical'
    if (days <= 30) return 'warning'
    return 'good'
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.productSku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    
    let matchesExpiration = true
    if (expirationFilter !== 'all' && batch.expirationDate) {
      const expirationStatus = getExpirationStatus(batch.expirationDate)
      matchesExpiration = expirationStatus === expirationFilter
    }
    
    return matchesSearch && matchesStatus && matchesExpiration
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
          <p className="text-gray-600">Administra los lotes de productos con seguimiento de fechas de vencimiento</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreate}
        >
          Nuevo Lote
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por lote, producto o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              className="flex-1"
            />
            
            <Select
              placeholder="Estado"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all">Todos los estados</SelectItem>
              <SelectItem key="active">Activo</SelectItem>
              <SelectItem key="quarantine">Cuarentena</SelectItem>
              <SelectItem key="reserved">Reservado</SelectItem>
              <SelectItem key="expired">Vencido</SelectItem>
              <SelectItem key="consumed">Consumido</SelectItem>
            </Select>
            
            <Select
              placeholder="Vencimiento"
              selectedKeys={[expirationFilter]}
              onSelectionChange={(keys) => setExpirationFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all">Todos</SelectItem>
              <SelectItem key="expired">Vencidos</SelectItem>
              <SelectItem key="critical">Críticos (≤7 días)</SelectItem>
              <SelectItem key="warning">Próximos (≤30 días)</SelectItem>
              <SelectItem key="good">Buenos ({'>'}30 días)</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Tabla de lotes">
            <TableHeader>
              <TableColumn>LOTE</TableColumn>
              <TableColumn>PRODUCTO</TableColumn>
              <TableColumn>CANTIDAD</TableColumn>
              <TableColumn>UBICACIÓN</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>VENCIMIENTO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              emptyContent="No se encontraron lotes"
            >
              {filteredBatches.map((batch) => {
                const daysToExpiration = batch.expirationDate ? getDaysToExpiration(batch.expirationDate) : null
                const expirationStatus = batch.expirationDate ? getExpirationStatus(batch.expirationDate) : null
                
                return (
                  <TableRow key={batch._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{batch.batchNumber}</p>
                        <p className="text-sm text-gray-500">{batch.productSku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{batch.productName}</p>
                    </TableCell>
                    <TableCell>
                      <p>{batch.quantity} {batch.unit}</p>
                    </TableCell>
                    <TableCell>
                      <p>{batch.location}</p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getStatusColor(batch.status)}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusLabel(batch.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {batch.expirationDate ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm">
                              {new Date(batch.expirationDate).toLocaleDateString()}
                            </p>
                            {daysToExpiration !== null && (
                              <p className={`text-xs ${
                                expirationStatus === 'expired' ? 'text-red-600' :
                                expirationStatus === 'critical' ? 'text-orange-600' :
                                expirationStatus === 'warning' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {daysToExpiration < 0 
                                  ? `Vencido hace ${Math.abs(daysToExpiration)} días`
                                  : daysToExpiration === 0
                                  ? 'Vence hoy'
                                  : `${daysToExpiration} días`
                                }
                              </p>
                            )}
                          </div>
                          {expirationStatus === 'expired' || expirationStatus === 'critical' ? (
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin fecha</span>
                      )}
                    </TableCell>
                    <TableCell>
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
                        <DropdownMenu>
                          <DropdownItem
                            key="view"
                            startContent={<EyeIcon className="w-4 h-4" />}
                            onPress={() => handleView(batch)}
                          >
                            Ver
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => handleEdit(batch)}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => handleDelete(batch)}
                          >
                            Eliminar
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal */}
      <BatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batch={selectedBatch}
        mode={modalMode}
        onSuccess={fetchBatches}
      />
    </div>
  )
}