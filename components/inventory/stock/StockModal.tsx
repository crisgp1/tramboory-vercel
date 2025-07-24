"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import {
  ArrowsUpDownIcon,
  CubeIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  TagIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowTrendingDownIcon,
  CheckIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

// Types and Enums
enum MovementType {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE = 'AJUSTE',
  MERMA = 'MERMA'
}

interface StockItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  location_id: string
  available_quantity: number
  reserved_quantity: number
  quarantine_quantity: number
  unit: string
}

interface StockModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
  onSuccess: () => void
}

interface MovementData {
  productId: string
  locationId: string
  type: MovementType
  quantity: number
  unit: string
  reason: string
  notes?: string
  batchId?: string
  costPerUnit?: number
  expiryDate?: string
}

interface ValidationErrors {
  [key: string]: string
}

// Movement type configurations
const movementTypeConfig = {
  [MovementType.ENTRADA]: {
    label: "Entrada",
    description: "Agregar stock al inventario",
    icon: PlusIcon,
    color: "green",
    bgColor: "bg-green-50/80",
    borderColor: "border-green-200/50",
    textColor: "text-green-700"
  },
  [MovementType.SALIDA]: {
    label: "Salida",
    description: "Retirar stock del inventario",
    icon: MinusIcon,
    color: "red",
    bgColor: "bg-red-50/80",
    borderColor: "border-red-200/50",
    textColor: "text-red-700"
  },
  [MovementType.TRANSFERENCIA]: {
    label: "Transferencia",
    description: "Mover entre ubicaciones",
    icon: ArrowPathIcon,
    color: "blue",
    bgColor: "bg-blue-50/80",
    borderColor: "border-blue-200/50",
    textColor: "text-blue-700"
  },
  [MovementType.AJUSTE]: {
    label: "Ajuste",
    description: "Corrección de inventario",
    icon: CogIcon,
    color: "yellow",
    bgColor: "bg-yellow-50/80",
    borderColor: "border-yellow-200/50",
    textColor: "text-yellow-700"
  },
  [MovementType.MERMA]: {
    label: "Merma",
    description: "Pérdida o deterioro",
    icon: ArrowTrendingDownIcon,
    color: "orange",
    bgColor: "bg-orange-50/80",
    borderColor: "border-orange-200/50",
    textColor: "text-orange-700"
  }
}

const commonReasons = {
  [MovementType.ENTRADA]: [
    "Compra a proveedor",
    "Devolución de cliente",
    "Producción interna",
    "Transferencia desde otra ubicación"
  ],
  [MovementType.SALIDA]: [
    "Venta a cliente",
    "Uso en evento",
    "Transferencia a otra ubicación",
    "Muestra o degustación"
  ],
  [MovementType.AJUSTE]: [
    "Corrección de inventario",
    "Conteo físico",
    "Error de sistema",
    "Reconciliación"
  ],
  [MovementType.MERMA]: [
    "Producto vencido",
    "Daño durante transporte",
    "Deterioro por almacenamiento",
    "Rotura o derrame"
  ],
  [MovementType.TRANSFERENCIA]: [
    "Reubicación interna",
    "Optimización de espacio",
    "Reorganización de almacén"
  ]
}

// Validation function
const validateMovement = (data: Partial<MovementData>): ValidationErrors => {
  const errors: ValidationErrors = {}
  
  if (!data.type) errors.type = "Selecciona un tipo de movimiento"
  if (!data.quantity || data.quantity <= 0) errors.quantity = "La cantidad debe ser mayor a 0"
  if (!data.reason) errors.reason = "Selecciona una razón para el movimiento"
  
  return errors
}

export default function StockModalGlass({ isOpen, onClose, stockItem, onSuccess }: StockModalProps) {
  // State
  const [movementType, setMovementType] = useState<MovementType | ''>('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [batchId, setBatchId] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)

  // Computed values
  const selectedMovementConfig = movementType ? movementTypeConfig[movementType] : null
  const availableReasons = movementType ? commonReasons[movementType] || [] : []
  
  const resultingStock = useMemo(() => {
    if (!quantity || !movementType) return null
    
    const quantityNum = parseFloat(quantity)
    const currentStock = stockItem.available_quantity
    
    switch (movementType) {
      case MovementType.ENTRADA:
        return currentStock + quantityNum
      case MovementType.SALIDA:
      case MovementType.MERMA:
        return currentStock - quantityNum
      case MovementType.AJUSTE:
        return quantityNum // For adjustments, quantity represents the final amount
      default:
        return currentStock
    }
  }, [quantity, movementType, stockItem.available_quantity])

  // Effects
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setMovementType('')
      setQuantity('')
      setReason('')
      setNotes('')
      setBatchId('')
      setCostPerUnit('')
      setExpiryDate('')
      setErrors({})
      setShowSuccess(false)
    }
  }, [isOpen])

  // Event handlers
  const handleInputChange = useCallback((field: string, value: any) => {
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Update the specific field
    switch (field) {
      case 'movementType':
        setMovementType(value)
        setReason('') // Reset reason when type changes
        break
      case 'quantity':
        setQuantity(value)
        break
      case 'reason':
        setReason(value)
        break
      case 'notes':
        setNotes(value)
        break
      case 'batchId':
        setBatchId(value)
        break
      case 'costPerUnit':
        setCostPerUnit(value)
        break
      case 'expiryDate':
        setExpiryDate(value)
        break
    }
  }, [errors])

  const handleSubmit = useCallback(async () => {
    const movementData: Partial<MovementData> = {
      productId: stockItem.product.id,
      locationId: stockItem.location_id,
      type: movementType as MovementType,
      quantity: parseFloat(quantity),
      unit: stockItem.unit,
      reason,
      notes: notes || undefined,
      batchId: batchId || undefined,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
    }

    const validationErrors = validateMovement(movementData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movementData)
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || error.message || "Error al registrar el movimiento" })
      }
    } catch (error) {
      setErrors({ submit: "Error al procesar la solicitud" })
    } finally {
      setLoading(false)
    }
  }, [stockItem, movementType, quantity, reason, notes, batchId, costPerUnit, expiryDate, onSuccess, onClose])

  const getTitle = () => 'Ajustar Stock'
  const getSubtitle = () => `${stockItem.product?.name} • SKU: ${stockItem.product?.sku}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={ArrowsUpDownIcon}
      size="lg"
      footer={
        <ModalFooter>
          <div>
            {Object.keys(errors).length > 0 && !errors.submit && (
              <p className="text-red-600 text-sm">Por favor corrige los errores antes de continuar</p>
            )}
          </div>
          
          <ModalActions>
            <ModalButton
              onClick={onClose}
              disabled={loading}
              variant="secondary"
            >
              Cancelar
            </ModalButton>
            
            <ModalButton
              onClick={handleSubmit}
              disabled={loading || !movementType || !quantity || !reason}
              loading={loading}
              variant="primary"
            >
              Registrar Movimiento
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
              Movimiento de inventario registrado exitosamente
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="glass-card p-4 bg-red-50/80 border border-red-200/50 mb-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        
        {/* Current Stock */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Stock Actual</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-stat p-4 text-center">
              <span className="text-slate-600 block text-sm font-medium mb-2">Disponible</span>
              <p className="font-bold text-green-600 text-lg">{stockItem.available_quantity}</p>
              <span className="text-sm text-slate-500">{stockItem.unit}</span>
            </div>
            <div className="glass-stat p-4 text-center">
              <span className="text-slate-600 block text-sm font-medium mb-2">Reservado</span>
              <p className="font-bold text-orange-600 text-lg">{stockItem.reserved_quantity}</p>
              <span className="text-sm text-slate-500">{stockItem.unit}</span>
            </div>
            <div className="glass-stat p-4 text-center">
              <span className="text-slate-600 block text-sm font-medium mb-2">Ubicación</span>
              <p className="font-semibold text-slate-800">{stockItem.location_id}</p>
              <span className="text-sm text-slate-500">Almacén</span>
            </div>
          </div>
        </div>

        {/* Movement Configuration */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Configuración del Movimiento</h4>
          </div>
          
          <div className="space-y-6">
            {/* Movement Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Tipo de Movimiento *
              </label>
              <select
                value={movementType}
                onChange={(e) => handleInputChange('movementType', e.target.value)}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                  errors.type ? 'border-red-300' : ''
                }`}
              >
                <option value="">Seleccionar tipo de movimiento</option>
                {Object.entries(movementTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
            </div>

            {/* Quantity and Reason */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Cantidad *
                </label>
                <div className="relative">
                  <HashtagIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={`glass-input w-full pl-12 pr-16 py-3 text-slate-800 placeholder-slate-500 ${
                      errors.quantity ? 'border-red-300' : ''
                    }`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-medium">
                    {stockItem.unit}
                  </span>
                </div>
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Razón *
                </label>
                <select
                  value={reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  disabled={!movementType}
                  className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                    !movementType ? 'opacity-60' : ''
                  } ${errors.reason ? 'border-red-300' : ''}`}
                >
                  <option value="">
                    {!movementType ? "Primero selecciona un tipo" : "Seleccionar razón"}
                  </option>
                  {availableReasons.map((reasonOption) => (
                    <option key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </option>
                  ))}
                </select>
                {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Notas Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none"
                placeholder="Notas adicionales sobre el movimiento..."
              />
            </div>
          </div>
        </div>

        {/* Movement Info */}
        {(selectedMovementConfig || resultingStock !== null) && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Información del Movimiento</h4>
            </div>
            
            <div className="space-y-4">
              {/* Selected Movement Type */}
              {selectedMovementConfig && (
                <div className={`glass-card ${selectedMovementConfig.bgColor} ${selectedMovementConfig.borderColor} border p-4`}>
                  <div className="text-sm text-slate-600 mb-2 font-medium">Tipo Seleccionado</div>
                  <div className={`flex items-center gap-3 ${selectedMovementConfig.textColor}`}>
                    <selectedMovementConfig.icon className="w-5 h-5" />
                    <span className="font-semibold">{selectedMovementConfig.label}</span>
                  </div>
                </div>
              )}

              {/* Resulting Stock */}
              {resultingStock !== null && (
                <div className="glass-card bg-blue-50/80 border border-blue-200/50 p-4">
                  <div className="text-sm text-blue-600 mb-2 font-medium">Stock Resultante</div>
                  <div className={`font-semibold text-lg ${resultingStock < 0 ? 'text-red-700' : 'text-blue-800'}`}>
                    {resultingStock} {stockItem.unit}
                  </div>
                  {resultingStock < 0 && (
                    <div className="text-sm text-red-600 mt-2 font-medium">
                      ⚠️ Stock insuficiente
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Fields for Inbound Movements */}
        {movementType === MovementType.ENTRADA && (
          <div className="glass-card bg-blue-50/80 border border-blue-200/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-800">Información de Entrada</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  ID del Lote
                </label>
                <div className="relative">
                  <TagIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => handleInputChange('batchId', e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              
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
                    onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Fecha de Caducidad
                </label>
                <div className="relative">
                  <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3 text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}