"use client"

import React, { useState, useEffect } from "react"
import {
  Input,
  Select,
  SelectItem
} from "@heroui/react"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  ListBulletIcon
} from "@heroicons/react/24/outline"
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
  shelfLife?: number
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
      title={mode === 'create' ? 'Nuevo Lote' : 
             mode === 'edit' ? 'Editar Lote' : 'Detalles del Lote'}
      subtitle={batch?.batchNumber ? `#${batch.batchNumber}` : undefined}
      icon={ArchiveBoxIcon}
      size="lg"
      footer={
        <ModalFooter>
          <ModalActions>
            <ModalButton
              onClick={onClose}
              disabled={loading}
              variant="secondary"
            >
              Cancelar
            </ModalButton>
            {!isReadOnly && (
              <ModalButton
                onClick={handleSubmit}
                loading={loading}
                variant="primary"
              >
                {mode === 'create' ? 'Crear Lote' : 'Guardar Cambios'}
              </ModalButton>
            )}
          </ModalActions>
        </ModalFooter>
      }
    >
              <div className="space-y-6">
                {/* Información básica */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center">
                      <ArchiveBoxIcon className="w-3 h-3 text-emerald-600" />
                    </div>
                    Información Básica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Número de Lote *
                      </label>
                      <input
                        type="text"
                        value={formData.batchNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                        disabled={isReadOnly}
                        placeholder="Ej: LOT-2024-001"
                        className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Producto *
                      </label>
                      <select
                        value={formData.productId || ''}
                        onChange={(e) => {
                          const productId = e.target.value
                          if (productId) handleProductChange(productId)
                        }}
                        disabled={isReadOnly}
                        className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${isReadOnly ? 'opacity-60' : ''}`}
                      >
                        <option value="">Selecciona un producto</option>
                        {products.map((product, index) => (
                          <option key={product._id || `product-${index}`} value={product._id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cantidad y ubicación */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      <Squares2X2Icon className="w-3 h-3 text-blue-600" />
                    </div>
                    Cantidad y Ubicación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Cantidad *
                      </label>
                      <Input
                        type="number"
                        value={formData.quantity?.toString() || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        disabled={isReadOnly}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        endContent={
                          formData.unit && (
                            <span className="text-sm text-slate-500 font-medium">
                              {formData.unit}
                            </span>
                          )
                        }
                        classNames={{
                          input: "bg-white/70 backdrop-blur-sm",
                          inputWrapper: "bg-white/70 backdrop-blur-sm border border-white/50 hover:border-blue-300 focus-within:border-blue-500"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Ubicación *
                      </label>
                      <Input
                        value={formData.location || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        disabled={isReadOnly}
                        placeholder="Ej: Almacén A-1"
                        classNames={{
                          input: "bg-white/70 backdrop-blur-sm",
                          inputWrapper: "bg-white/70 backdrop-blur-sm border border-white/50 hover:border-blue-300 focus-within:border-blue-500"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Estado
                      </label>
                      <Select
                        selectedKeys={formData.status ? [formData.status] : []}
                        onSelectionChange={(keys) => {
                          const status = Array.from(keys)[0] as string
                          setFormData(prev => ({ ...prev, status: status as any }))
                        }}
                        disabled={isReadOnly}
                        placeholder="Selecciona estado"
                        classNames={{
                          trigger: "bg-white/70 backdrop-blur-sm border border-white/50 hover:border-blue-300",
                          value: "text-slate-800"
                        }}
                      >
                        <SelectItem key="active">Activo</SelectItem>
                        <SelectItem key="quarantine">Cuarentena</SelectItem>
                        <SelectItem key="reserved">Reservado</SelectItem>
                        <SelectItem key="expired">Vencido</SelectItem>
                        <SelectItem key="consumed">Consumido</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                      <CalendarIcon className="w-3 h-3 text-purple-600" />
                    </div>
                    Fechas Importantes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Fabricación
                      </label>
                      <Input
                        type="date"
                        value={formData.manufacturingDate ? formData.manufacturingDate.split('T')[0] : ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          manufacturingDate: e.target.value ? e.target.value + 'T00:00:00.000Z' : undefined
                        }))}
                        disabled={isReadOnly}
                        classNames={{
                          input: "bg-white/70 backdrop-blur-sm",
                          inputWrapper: "bg-white/70 backdrop-blur-sm border border-white/50 hover:border-purple-300 focus-within:border-purple-500"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Vencimiento
                      </label>
                      <Input
                        type="date"
                        value={formData.expirationDate ? formData.expirationDate.split('T')[0] : ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          expirationDate: e.target.value ? e.target.value + 'T00:00:00.000Z' : undefined
                        }))}
                        disabled={isReadOnly}
                        classNames={{
                          input: "bg-white/70 backdrop-blur-sm",
                          inputWrapper: "bg-white/70 backdrop-blur-sm border border-white/50 hover:border-purple-300 focus-within:border-purple-500"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 rounded flex items-center justify-center">
                      <ListBulletIcon className="w-3 h-3 text-amber-600" />
                    </div>
                    Notas Adicionales
                  </h3>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={isReadOnly}
                    rows={4}
                    placeholder="Información adicional sobre el lote..."
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
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

  const BatchCard = ({ batch }: { batch: Batch }) => {
    const daysToExpiration = batch.expirationDate ? getDaysToExpiration(batch.expirationDate) : null
    const expirationStatus = batch.expirationDate ? getExpirationStatus(batch.expirationDate) : null

    return (
      <div className="glass-card p-6 hover:scale-[1.02] transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                <ArchiveBoxIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{batch.batchNumber}</h3>
                <p className="text-sm text-slate-500 font-mono">{batch.productSku}</p>
              </div>
            </div>
            <p className="text-slate-700 font-medium mb-1">{batch.productName}</p>
            <p className="text-sm text-slate-500">{batch.supplier?.name || 'Sin proveedor'}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              batch.status === 'active' ? 'bg-green-100/80 text-green-800' :
              batch.status === 'expired' ? 'bg-red-100/80 text-red-800' :
              batch.status === 'quarantine' ? 'bg-yellow-100/80 text-yellow-800' :
              batch.status === 'reserved' ? 'bg-blue-100/80 text-blue-800' :
              batch.status === 'consumed' ? 'bg-gray-100/80 text-gray-800' : 'bg-gray-100/80 text-gray-800'
            }`}>
              {getStatusLabel(batch.status)}
            </span>
            
            <div className="flex gap-1">
              <button
                onClick={() => handleView(batch)}
                className="glass-button-icon p-2"
                title="Ver detalles"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(batch)}
                className="glass-button-icon p-2"
                title="Editar"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(batch)}
                className="glass-button-icon p-2 text-red-600 hover:text-red-700"
                title="Eliminar"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-stat p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Cantidad</p>
              <p className="text-lg font-bold text-slate-800">{batch.quantity} {batch.unit}</p>
            </div>
            <div className="glass-stat p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ubicación</p>
              <p className="text-sm font-medium text-slate-700">{batch.location}</p>
            </div>
          </div>

          {batch.expirationDate && (
            <div className="glass-stat p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Vencimiento</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(batch.expirationDate).toLocaleDateString('es-MX')}
                  </p>
                  {daysToExpiration !== null && (
                    <p className={`text-xs font-medium ${
                      expirationStatus === 'expired' ? 'text-red-600' :
                      expirationStatus === 'critical' ? 'text-orange-600' :
                      expirationStatus === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysToExpiration < 0 
                        ? `Vencido hace ${Math.abs(daysToExpiration)} días`
                        : daysToExpiration === 0
                        ? 'Vence hoy'
                        : `${daysToExpiration} días restantes`
                      }
                    </p>
                  )}
                </div>
                {(expirationStatus === 'expired' || expirationStatus === 'critical') && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
            <ArchiveBoxIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Gestión de Lotes
            </h1>
            <p className="text-slate-600 text-sm">Administra y controla todos los lotes de inventario</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
              <input
                type="text"
                placeholder="Buscar por lote, producto o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-11 pr-4 py-3 text-slate-800 placeholder-slate-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input min-w-[140px] px-4 py-3 pr-8 appearance-none cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="quarantine">Cuarentena</option>
                <option value="reserved">Reservado</option>
                <option value="expired">Vencido</option>
                <option value="consumed">Consumido</option>
              </select>
            </div>
            
            <div className="relative">
              <select
                value={expirationFilter}
                onChange={(e) => setExpirationFilter(e.target.value)}
                className="glass-input min-w-[140px] px-4 py-3 pr-8 appearance-none cursor-pointer"
              >
                <option value="all">Todos los vencimientos</option>
                <option value="expired">Vencidos</option>
                <option value="critical">Críticos (≤7 días)</option>
                <option value="warning">Próximos (≤30 días)</option>
                <option value="good">Buenos (&gt;30 días)</option>
              </select>
            </div>

            <button
              onClick={handleCreate}
              className="glass-button px-6 py-3 flex items-center gap-2 font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Nuevo Lote
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-600 text-lg font-medium">Cargando lotes...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ArchiveBoxIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No se encontraron lotes</h3>
            <p className="text-slate-500 mb-6 text-sm">
              {searchTerm || statusFilter !== 'all' || expirationFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer lote de inventario'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && expirationFilter === 'all' && (
              <button
                onClick={handleCreate}
                className="glass-button px-6 py-3 flex items-center gap-2 font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Crear Primer Lote
              </button>
            )}
          </div>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBatches.map((batch) => (
                <BatchCard key={batch._id} batch={batch} />
              ))}
            </div>
            
            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{filteredBatches.length}</p>
                  <p className="text-sm text-slate-600">Total Lotes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredBatches.filter(b => b.status === 'active').length}
                  </p>
                  <p className="text-sm text-slate-600">Activos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredBatches.filter(b => b.expirationDate && getExpirationStatus(b.expirationDate) === 'expired').length}
                  </p>
                  <p className="text-sm text-slate-600">Vencidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredBatches.filter(b => b.expirationDate && getExpirationStatus(b.expirationDate) === 'critical').length}
                  </p>
                  <p className="text-sm text-slate-600">Críticos</p>
                </div>
              </div>
            </div>
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
