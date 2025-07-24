"use client"

import React, { useState } from "react"
import {
  MapPinIcon,
  PlusIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  base_unit: string
}

interface InitiateMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  onSuccess: () => void
}

const AVAILABLE_LOCATIONS = [
  { id: 'almacen', name: 'Almacén Principal' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'salon', name: 'Salón' },
  { id: 'bodega', name: 'Bodega' },
  { id: 'recepcion', name: 'Recepción' }
]

export default function InitiateMovementModalGlass({ isOpen, onClose, product, onSuccess }: InitiateMovementModalProps) {
  const [selectedLocation, setSelectedLocation] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("Stock inicial")
  const [notes, setNotes] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [batchId, setBatchId] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!selectedLocation || !quantity) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    const quantityNum = parseFloat(quantity)
    if (quantityNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inventory/stock/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          locationId: selectedLocation,
          quantity: quantityNum,
          unit: product.base_unit,
          reason,
          notes: notes || undefined,
          costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
          batchId: batchId || undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
        })
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
          resetForm()
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al inicializar el stock")
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedLocation("")
    setQuantity("")
    setReason("Stock inicial")
    setNotes("")
    setCostPerUnit("")
    setBatchId("")
    setExpiryDate("")
    setShowSuccess(false)
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const getTitle = () => 'Inicializar Stock'
  const getSubtitle = () => `${product?.name} • SKU: ${product?.sku}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={PlusIcon}
      size="lg"
      footer={
        <ModalFooter>
          <div></div>
          
          <ModalActions>
            <ModalButton
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
            >
              Cancelar
            </ModalButton>
            
            <ModalButton
              onClick={handleSubmit}
              disabled={loading || !selectedLocation || !quantity}
              loading={loading}
              variant="primary"
            >
              Inicializar Stock
            </ModalButton>
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
              Stock inicializado exitosamente
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Información del Producto */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información del Producto</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-stat p-4">
              <span className="text-slate-600 block text-sm mb-1 font-medium">Producto</span>
              <p className="font-semibold text-slate-800">{product?.name}</p>
            </div>
            <div className="glass-stat p-4">
              <span className="text-slate-600 block text-sm mb-1 font-medium">SKU</span>
              <p className="font-semibold text-slate-800">{product?.sku}</p>
            </div>
            <div className="glass-stat p-4">
              <span className="text-slate-600 block text-sm mb-1 font-medium">Categoría</span>
              <p className="font-semibold text-slate-800">{product?.category}</p>
            </div>
            <div className="glass-stat p-4">
              <span className="text-slate-600 block text-sm mb-1 font-medium">Unidad Base</span>
              <p className="font-semibold text-slate-800">{product?.base_unit}</p>
            </div>
          </div>
        </div>

        {/* Configuración del Stock */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Configuración del Stock Inicial</h4>
          </div>

          <div className="space-y-6">
            {/* Ubicación y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ubicación *
                </label>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona una ubicación</option>
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Cantidad Inicial *
                </label>
                <div className="relative">
                  <HashtagIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass-input w-full pl-12 pr-16 py-3 text-slate-800 placeholder-slate-500"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-medium">
                    {product?.base_unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Razón */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Razón
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500"
                placeholder="Razón del movimiento"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Notas Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none"
                placeholder="Notas adicionales sobre el stock inicial..."
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TagIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información Adicional (Opcional)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Costo por Unidad
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                ID del Lote
              </label>
              <div className="relative">
                <TagIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500"
                  placeholder="Lote opcional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Fecha de Vencimiento
              </label>
              <div className="relative">
                <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {selectedLocation && quantity && (
          <div className="glass-card bg-blue-50/80 border border-blue-200/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-800">Resumen</h4>
            </div>
            
            <div className="text-blue-700">
              <p className="mb-2">
                <span className="font-medium">Se iniciará stock de:</span> {quantity} {product?.base_unit}
              </p>
              <p className="mb-2">
                <span className="font-medium">Producto:</span> {product?.name}
              </p>
              <p>
                <span className="font-medium">Ubicación:</span> {AVAILABLE_LOCATIONS.find(l => l.id === selectedLocation)?.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}