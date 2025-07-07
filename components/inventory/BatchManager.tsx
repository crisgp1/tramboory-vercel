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
  DropdownItem,
  Spinner
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
import NordicTable from "@/components/ui/NordicTable"

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
      scrollBehavior="inside"
      backdrop="opaque"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto"
      }}
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
                placeholder="Número de Lote *"
                value={formData.batchNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                isDisabled={isReadOnly}
                variant="flat"
                classNames={{
                  input: "text-gray-900",
                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                }}
              />
              
              <Select
                placeholder="Selecciona un producto *"
                selectedKeys={formData.productId ? [formData.productId] : []}
                onSelectionChange={(keys) => handleProductChange(Array.from(keys)[0] as string)}
                isDisabled={isReadOnly}
                variant="flat"
                classNames={{
                  trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                  value: "text-gray-900",
                  listboxWrapper: "bg-white",
                  popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                }}
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
                placeholder="Cantidad *"
                value={formData.quantity?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                isDisabled={isReadOnly}
                min="0"
                step="0.01"
                endContent={formData.unit}
                variant="flat"
                classNames={{
                  input: "text-gray-900",
                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                }}
              />
              
              <Input
                placeholder="Ubicación *"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                isDisabled={isReadOnly}
                variant="flat"
                classNames={{
                  input: "text-gray-900",
                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                }}
              />
              
              <Select
                placeholder="Selecciona estado"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                isDisabled={isReadOnly}
                variant="flat"
                classNames={{
                  trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                  value: "text-gray-900",
                  listboxWrapper: "bg-white",
                  popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                }}
              >
                <SelectItem key="active">Activo</SelectItem>
                <SelectItem key="quarantine">Cuarentena</SelectItem>
                <SelectItem key="reserved">Reservado</SelectItem>
                <SelectItem key="expired">Vencido</SelectItem>
                <SelectItem key="consumed">Consumido</SelectItem>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fabricación
                </label>
                <DateInput
                  value={formData.manufacturingDate ? parseDate(formData.manufacturingDate.split('T')[0]) : null}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    manufacturingDate: date?.toString()
                  }))}
                  isDisabled={isReadOnly}
                  variant="flat"
                  classNames={{
                    input: "text-gray-900",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <DateInput
                  value={formData.expirationDate ? parseDate(formData.expirationDate.split('T')[0]) : null}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    expirationDate: date?.toString()
                  }))}
                  isDisabled={isReadOnly}
                  variant="flat"
                  classNames={{
                    input: "text-gray-900",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                  }}
                />
              </div>
            </div>
            
            <Textarea
              placeholder="Notas adicionales del lote..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              isDisabled={isReadOnly}
              maxRows={3}
              variant="flat"
              classNames={{
                input: "text-gray-900",
                inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
              }}
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

  const columns = [
    { key: "batch", label: "Lote" },
    { key: "product", label: "Producto" },
    { key: "quantity", label: "Cantidad", width: "w-24", align: "right" as const },
    { key: "location", label: "Ubicación", width: "w-32" },
    { key: "status", label: "Estado", width: "w-28", align: "center" as const },
    { key: "expiration", label: "Vencimiento", width: "w-36" }
  ]

  const actions = [
    {
      key: "view",
      label: "Ver detalles",
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: handleView
    },
    {
      key: "edit",
      label: "Editar",
      icon: <PencilIcon className="w-4 h-4" />,
      color: "primary" as const,
      onClick: handleEdit
    },
    {
      key: "delete",
      label: "Eliminar",
      icon: <TrashIcon className="w-4 h-4" />,
      color: "danger" as const,
      onClick: handleDelete
    }
  ]

  const renderCell = (batch: Batch, columnKey: string) => {
    switch (columnKey) {
      case "batch": {
        return (
          <div>
            <p className="font-medium text-gray-900">{batch.batchNumber}</p>
            <p className="text-sm text-gray-500 font-mono">{batch.productSku}</p>
          </div>
        )
      }
      case "product": {
        return (
          <div>
            <p className="font-medium text-gray-900">{batch.productName}</p>
            <p className="text-sm text-gray-500">{batch.supplier?.name || 'N/A'}</p>
          </div>
        )
      }
      case "quantity": {
        return (
          <span className="font-semibold text-gray-900">
            {batch.quantity} {batch.unit}
          </span>
        )
      }
      case "location": {
        return (
          <span className="text-sm text-gray-900">{batch.location}</span>
        )
      }
      case "status": {
        return (
          <Chip
            size="sm"
            variant="flat"
            color={getStatusColor(batch.status) as any}
            className="font-medium"
          >
            {getStatusLabel(batch.status)}
          </Chip>
        )
      }
      case "expiration": {
        if (!batch.expirationDate) {
          return <span className="text-gray-400">Sin fecha</span>
        }
        
        const daysToExpiration = getDaysToExpiration(batch.expirationDate)
        const expirationStatus = getExpirationStatus(batch.expirationDate)
        
        return (
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-900">
                {new Date(batch.expirationDate).toLocaleDateString('es-MX')}
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
            {(expirationStatus === 'expired' || expirationStatus === 'critical') && (
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            )}
          </div>
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
            placeholder="Buscar por lote, producto o SKU..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
            variant="flat"
            classNames={{
              input: "text-gray-900",
              inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            placeholder="Estado"
            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
            onSelectionChange={(keys: any) => setStatusFilter(Array.from(keys)[0] as string || 'all')}
            className="min-w-[140px]"
            variant="flat"
            classNames={{
              trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
              value: "text-gray-900",
              listboxWrapper: "bg-white",
              popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
            }}
          >
            <SelectItem key="all">Todos</SelectItem>
            <SelectItem key="active">Activo</SelectItem>
            <SelectItem key="quarantine">Cuarentena</SelectItem>
            <SelectItem key="reserved">Reservado</SelectItem>
            <SelectItem key="expired">Vencido</SelectItem>
            <SelectItem key="consumed">Consumido</SelectItem>
          </Select>
          
          <Select
            placeholder="Vencimiento"
            selectedKeys={expirationFilter !== 'all' ? [expirationFilter] : []}
            onSelectionChange={(keys: any) => setExpirationFilter(Array.from(keys)[0] as string || 'all')}
            className="min-w-[140px]"
            variant="flat"
            classNames={{
              trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
              value: "text-gray-900",
              listboxWrapper: "bg-white",
              popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
            }}
          >
            <SelectItem key="all">Todos</SelectItem>
            <SelectItem key="expired">Vencidos</SelectItem>
            <SelectItem key="critical">Críticos (≤7 días)</SelectItem>
            <SelectItem key="warning">Próximos (≤30 días)</SelectItem>
            <SelectItem key="good">Buenos ({'>'}30 días)</SelectItem>
          </Select>

          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleCreate}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Vista Desktop - Tabla Nordic */}
      <div className="hidden lg:block">
        <NordicTable
          columns={columns}
          data={filteredBatches}
          renderCell={renderCell}
          actions={actions}
          loading={loading}
          emptyMessage="No se encontraron lotes"
        />
      </div>

      {/* Vista Mobile - Cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner label="Cargando lotes..." />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron lotes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBatches.map((batch) => {
              const daysToExpiration = batch.expirationDate ? getDaysToExpiration(batch.expirationDate) : null
              const expirationStatus = batch.expirationDate ? getExpirationStatus(batch.expirationDate) : null
              
              return (
                <Card key={batch._id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                        <p className="font-mono text-sm text-gray-500">{batch.productSku}</p>
                        <p className="text-sm text-gray-600">{batch.productName}</p>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(batch.status) as any}
                      >
                        {getStatusLabel(batch.status)}
                      </Chip>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</p>
                        <p className="font-semibold">{batch.quantity} {batch.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
                        <p className="text-sm">{batch.location}</p>
                      </div>
                    </div>

                    {batch.expirationDate && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Vencimiento</p>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm">{new Date(batch.expirationDate).toLocaleDateString('es-MX')}</p>
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
                          {(expirationStatus === 'expired' || expirationStatus === 'critical') && (
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleView(batch)}
                        startContent={<EyeIcon className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleEdit(batch)}
                        startContent={<PencilIcon className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(batch)}
                        isIconOnly
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

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