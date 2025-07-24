"use client"

import React, { useState, useEffect } from "react"
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CheckIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

interface TransferItem {
  productId: string
  productName: string
  productSku: string
  batchNumber?: string
  quantity: number
  unit: string
  availableQuantity: number
}

interface StockTransfer {
  _id?: string
  transferId?: string
  fromLocation: string
  toLocation: string
  status: 'DRAFT' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  items: TransferItem[]
  notes?: string
  requestedBy: string
  requestedDate: string
  estimatedDelivery?: string
  createdAt?: string
  updatedAt?: string
}

interface StockTransferModalProps {
  isOpen: boolean
  onClose: () => void
  transfer?: StockTransfer | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

const AVAILABLE_LOCATIONS = [
  { id: 'almacen', name: 'Almacén Principal' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'salon', name: 'Salón' },
  { id: 'bodega', name: 'Bodega' },
  { id: 'recepcion', name: 'Recepción' }
]

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'gray', bgColor: 'bg-gray-100/80', textColor: 'text-gray-800' },
  PENDING: { label: 'Pendiente', color: 'yellow', bgColor: 'bg-yellow-100/80', textColor: 'text-yellow-800' },
  IN_TRANSIT: { label: 'En Tránsito', color: 'blue', bgColor: 'bg-blue-100/80', textColor: 'text-blue-800' },
  COMPLETED: { label: 'Completada', color: 'green', bgColor: 'bg-green-100/80', textColor: 'text-green-800' },
  CANCELLED: { label: 'Cancelada', color: 'red', bgColor: 'bg-red-100/80', textColor: 'text-red-800' }
}

export default function StockTransferModal({
  isOpen,
  onClose,
  transfer,
  mode,
  onSuccess
}: StockTransferModalProps) {
  const [formData, setFormData] = useState<StockTransfer>({
    fromLocation: '',
    toLocation: '',
    status: 'DRAFT',
    items: [],
    notes: '',
    requestedBy: '',
    requestedDate: new Date().toISOString().split('T')[0],
    estimatedDelivery: ''
  })

  const [loading, setLoading] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const isReadOnly = mode === 'view'
  const statusInfo = statusConfig[formData.status]

  useEffect(() => {
    if (transfer && (mode === 'edit' || mode === 'view')) {
      setFormData(transfer)
    } else {
      setFormData({
        fromLocation: '',
        toLocation: '',
        status: 'DRAFT',
        items: [],
        notes: '',
        requestedBy: '',
        requestedDate: new Date().toISOString().split('T')[0],
        estimatedDelivery: ''
      })
    }
  }, [transfer, mode, isOpen])

  useEffect(() => {
    if (isOpen && formData.fromLocation) {
      fetchAvailableProducts()
    }
  }, [isOpen, formData.fromLocation])

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch(`/api/inventory/stock?location=${formData.fromLocation}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableProducts(data.stockItems || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddItem = () => {
    const newItem: TransferItem = {
      productId: '',
      productName: '',
      productSku: '',
      quantity: 0,
      unit: '',
      availableQuantity: 0
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Update product info if productId changes
          if (field === 'productId') {
            const selectedProduct = availableProducts.find(p => p.product.id === value)
            if (selectedProduct) {
              updatedItem.productName = selectedProduct.product.name
              updatedItem.productSku = selectedProduct.product.sku
              updatedItem.unit = selectedProduct.unit
              updatedItem.availableQuantity = selectedProduct.available_quantity
            }
          }
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleSubmit = async () => {
    if (!formData.fromLocation || !formData.toLocation || formData.items.length === 0) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (formData.fromLocation === formData.toLocation) {
      toast.error('Las ubicaciones de origen y destino deben ser diferentes')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/stock/transfer'
        : `/api/inventory/stock/transfer/${transfer?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al procesar la transferencia')
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (mode === 'create') return 'Nueva Transferencia de Stock'
    if (mode === 'edit') return 'Editar Transferencia'
    return 'Detalles de Transferencia'
  }

  const getSubtitle = () => {
    if (transfer && mode !== 'create') {
      return `${transfer.transferId || transfer._id} • ${statusInfo.label}`
    }
    return undefined
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={TruckIcon}
      size="lg"
      footer={
        <ModalFooter>
          <div>
            {!isReadOnly && (!formData.fromLocation || !formData.toLocation || formData.items.length === 0) && (
              <p className="text-red-600 text-sm">Completa todos los campos requeridos</p>
            )}
          </div>
          
          <ModalActions>
            <ModalButton
              onClick={onClose}
              variant="secondary"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </ModalButton>
            
            {!isReadOnly && (
              <ModalButton
                onClick={handleSubmit}
                disabled={loading || !formData.fromLocation || !formData.toLocation || formData.items.length === 0}
                loading={loading}
                variant="primary"
              >
                {mode === 'create' ? 'Crear Transferencia' : 'Actualizar Transferencia'}
              </ModalButton>
            )}
          </ModalActions>
        </ModalFooter>
      }
    >
      {/* Success Message */}
      {showSuccess && (
        <div className="glass-card p-4 bg-green-50/80 border border-green-200/50 mb-6">
          <div className="flex items-center">
            <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 font-medium">
              Transferencia procesada exitosamente
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Configuración de Ubicaciones */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Configuración de Transferencia</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Ubicación de Origen *
              </label>
              <select
                value={formData.fromLocation}
                onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                disabled={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              >
                <option value="">Seleccionar origen</option>
                {AVAILABLE_LOCATIONS.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowRightIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Ubicación de Destino *
              </label>
              <select
                value={formData.toLocation}
                onChange={(e) => handleInputChange('toLocation', e.target.value)}
                disabled={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              >
                <option value="">Seleccionar destino</option>
                {AVAILABLE_LOCATIONS.filter(loc => loc.id !== formData.fromLocation).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode !== 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={isReadOnly}
                  className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                    isReadOnly ? 'opacity-60' : ''
                  }`}
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Entrega Estimada
                </label>
                <input
                  type="date"
                  value={formData.estimatedDelivery || ''}
                  onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full px-4 py-3 text-slate-800 ${
                    isReadOnly ? 'opacity-60' : ''
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Productos a Transferir */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Productos a Transferir</h4>
            </div>
            
            {!isReadOnly && formData.fromLocation && (
              <ModalButton
                onClick={handleAddItem}
                size="sm"
                variant="primary"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar Producto
              </ModalButton>
            )}
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="glass-card p-4 border border-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Producto
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      disabled={isReadOnly}
                      className={`glass-input w-full px-3 py-2 text-slate-800 appearance-none cursor-pointer ${
                        isReadOnly ? 'opacity-60' : ''
                      }`}
                    >
                      <option value="">Seleccionar producto</option>
                      {availableProducts.map((stockItem) => (
                        <option key={stockItem.product.id} value={stockItem.product.id}>
                          {stockItem.product.name} - Disponible: {stockItem.available_quantity} {stockItem.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.availableQuantity}
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full px-3 py-2 text-slate-800 ${
                        isReadOnly ? 'opacity-60' : ''
                      }`}
                    />
                    {item.availableQuantity > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Disponible: {item.availableQuantity} {item.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      readOnly
                      className="glass-input w-full px-3 py-2 text-slate-800 opacity-60"
                    />
                  </div>

                  <div className="flex items-end">
                    {!isReadOnly && (
                      <ModalButton
                        onClick={() => handleRemoveItem(index)}
                        variant="danger"
                        size="sm"
                        className="w-full"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </ModalButton>
                    )}
                  </div>
                </div>

                {item.quantity > item.availableQuantity && item.availableQuantity > 0 && (
                  <div className="mt-3 flex items-center text-red-600 text-sm">
                    <ExclamationCircleIcon className="w-4 h-4 mr-2" />
                    La cantidad excede el stock disponible
                  </div>
                )}
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                {isReadOnly ? 'No hay productos en esta transferencia' : 'Selecciona una ubicación de origen y agrega productos'}
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BuildingStorefrontIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información Adicional</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Solicitado por
              </label>
              <input
                type="text"
                value={formData.requestedBy}
                onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
                placeholder="Nombre de quien solicita"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Fecha de Solicitud
              </label>
              <input
                type="date"
                value={formData.requestedDate}
                onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Notas
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
                placeholder="Notas adicionales sobre la transferencia..."
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}