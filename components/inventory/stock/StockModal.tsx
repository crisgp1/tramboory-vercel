"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Card,
  Alert,
  LoadingOverlay
} from '@mantine/core'
import {
  IconArrowsUpDown,
  IconCube,
  IconHash,
  IconCurrencyDollar,
  IconCalendar,
  IconBuilding,
  IconTag,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconFileText,
  IconSettings,
  IconTrendingDown,
  IconCheck,
  IconAlertCircle,
  IconCalculator
} from '@tabler/icons-react'
import toast from 'react-hot-toast'

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
    icon: IconPlus,
    color: "green",
    bgColor: "bg-green-50/80",
    borderColor: "border-green-200/50",
    textColor: "text-green-700"
  },
  [MovementType.SALIDA]: {
    label: "Salida",
    description: "Retirar stock del inventario",
    icon: IconMinus,
    color: "red",
    bgColor: "bg-red-50/80",
    borderColor: "border-red-200/50",
    textColor: "text-red-700"
  },
  [MovementType.TRANSFERENCIA]: {
    label: "Transferencia",
    description: "Mover entre ubicaciones",
    icon: IconRefresh,
    color: "blue",
    bgColor: "bg-blue-50/80",
    borderColor: "border-blue-200/50",
    textColor: "text-blue-700"
  },
  [MovementType.AJUSTE]: {
    label: "Ajuste",
    description: "Corrección de inventario",
    icon: IconSettings,
    color: "yellow",
    bgColor: "bg-yellow-50/80",
    borderColor: "border-yellow-200/50",
    textColor: "text-yellow-700"
  },
  [MovementType.MERMA]: {
    label: "Merma",
    description: "Pérdida o deterioro",
    icon: IconTrendingDown,
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

// Enhanced validation function with stock calculation
const validateMovement = (data: Partial<MovementData>, currentStock: number, unit: string): ValidationErrors => {
  const errors: ValidationErrors = {}
  
  if (!data.type) errors.movementType = "Selecciona un tipo de movimiento"
  if (!data.quantity || data.quantity <= 0) errors.quantity = "La cantidad debe ser mayor a 0"
  if (!data.reason) errors.reason = "El motivo es requerido"
  
  // Check for negative stock on outbound movements
  if (data.type && data.quantity && currentStock !== undefined) {
    let newStock = currentStock
    
    switch (data.type) {
      case MovementType.ENTRADA:
        newStock = currentStock + data.quantity
        break
      case MovementType.SALIDA:
      case MovementType.MERMA:
        newStock = currentStock - data.quantity
        if (newStock < 0) {
          errors.quantity = `No hay suficiente stock. Disponible: ${currentStock} ${unit}. Resultado sería: ${newStock}`
        }
        break
      case MovementType.AJUSTE:
        newStock = data.quantity // For adjustments, quantity is the final amount
        if (newStock < 0) {
          errors.quantity = `El stock no puede ser negativo. Valor mínimo: 0`
        }
        break
      case MovementType.TRANSFERENCIA:
        newStock = currentStock - data.quantity
        if (newStock < 0) {
          errors.quantity = `No hay suficiente stock para transferir. Disponible: ${currentStock} ${unit}`
        }
        if (!data.notes || !data.notes.trim()) {
          errors.notes = "Para transferencias, especifica la ubicación destino"
        }
        break
    }
  }
  
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

    const validationErrors = validateMovement(movementData, stockItem.available_quantity || 0, stockItem.unit || '')
    
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
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconArrowsUpDown size={20} />
          <Stack gap={2}>
            <Title order={4}>Ajustar Stock</Title>
            <Text size="sm" c="dimmed">{stockItem.product?.name} • SKU: {stockItem.product?.sku}</Text>
          </Stack>
        </Group>
      }
      size="lg"
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
      styles={{
        content: {
          maxHeight: '90vh',
          overflow: 'hidden'
        },
        body: {
          maxHeight: 'calc(90vh - 120px)',
          overflow: 'auto',
          padding: '1rem'
        }
      }}
    >
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      
      <Stack gap="lg">
        {/* Success Message */}
        {showSuccess && (
          <Alert
            icon={<IconCheck size={16} />}
            title="Éxito"
            color="green"
          >
            Movimiento de inventario registrado exitosamente
          </Alert>
        )}

        {/* Error Message */}
        {errors.submit && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
          >
            {errors.submit}
          </Alert>
        )}

        {/* Footer with Actions */}
        <Group justify="space-between">
          <Stack gap={0}>
            {Object.keys(errors).length > 0 && !errors.submit && (
              <Text size="sm" c="red">Por favor corrige los errores antes de continuar</Text>
            )}
          </Stack>
          
          <Group>
            <Button
              variant="light"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading || !movementType || !quantity || !reason || (resultingStock !== null && resultingStock < 0)}
              loading={loading}
              color={resultingStock !== null && resultingStock < 0 ? 'red' : 'blue'}
            >
              {resultingStock !== null && resultingStock < 0 ? 'Stock Insuficiente' : 'Registrar Movimiento'}
            </Button>
          </Group>
        </Group>

        {/* Stock Adjustment Form */}
        <Stack gap="md">
          {/* Current Stock Info */}
          <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Stack gap="xs">
              <Text fw={500} size="sm">Stock Actual</Text>
              <Group>
                <Text size="sm" c="dimmed">Disponible:</Text>
                <Text fw={600}>{stockItem.available_quantity || 0} {stockItem.unit}</Text>
                <Text size="sm" c="dimmed">•</Text>
                <Text size="sm" c="dimmed">Reservado:</Text>
                <Text fw={600}>{stockItem.reserved_quantity || 0} {stockItem.unit}</Text>
              </Group>
            </Stack>
          </Card>

          {/* Stock Calculator - Show when type and quantity are selected */}
          {movementType && quantity && resultingStock !== null && (
            <Card 
              withBorder 
              p="md" 
              style={{ 
                backgroundColor: resultingStock < 0 ? 'var(--mantine-color-red-0)' : 'var(--mantine-color-green-0)',
                borderColor: resultingStock < 0 ? 'var(--mantine-color-red-3)' : 'var(--mantine-color-green-3)'
              }}
            >
              <Stack gap="xs">
                <Group>
                  <IconCalculator size={16} />
                  <Text fw={500} size="sm">Cálculo de Stock</Text>
                </Group>
                <Group>
                  <Text size="sm">{stockItem.available_quantity || 0}</Text>
                  <Text size="sm" c="dimmed">
                    {movementType === MovementType.ENTRADA ? '+' :
                     movementType === MovementType.AJUSTE ? '=' : '-'}
                  </Text>
                  <Text size="sm">{parseFloat(quantity) || 0}</Text>
                  <Text size="sm" c="dimmed">=</Text>
                  <Text
                    fw={600}
                    size="sm"
                    c={resultingStock < 0 ? 'red' : 'green'}
                  >
                    {resultingStock} {stockItem.unit}
                  </Text>
                </Group>
                {resultingStock < 0 && (
                  <Text size="xs" c="red">
                    ⚠️ El stock no puede ser negativo
                  </Text>
                )}
              </Stack>
            </Card>
          )}

          {/* Movement Type */}
          <Select
            label="Tipo de Movimiento"
            placeholder="Selecciona el tipo de movimiento"
            value={movementType}
            onChange={(value) => setMovementType(value as MovementType)}
            data={[
              { value: MovementType.ENTRADA, label: 'Entrada de Stock' },
              { value: MovementType.SALIDA, label: 'Salida de Stock' },
              { value: MovementType.AJUSTE, label: 'Ajuste de Inventario' },
              { value: MovementType.MERMA, label: 'Merma' },
              { value: MovementType.TRANSFERENCIA, label: 'Transferencia' }
            ]}
            required
            error={errors.movementType}
            leftSection={<IconArrowsUpDown size={16} />}
          />

          {/* Quantity */}
          <NumberInput
            label="Cantidad"
            placeholder="Ingresa la cantidad"
            value={quantity ? parseFloat(quantity) : ''}
            onChange={(value) => {
              const newQuantity = value?.toString() || ''
              setQuantity(newQuantity)
              // Clear quantity errors when user types
              if (errors.quantity) {
                setErrors(prev => ({ ...prev, quantity: '' }))
              }
            }}
            min={0}
            decimalScale={2}
            step={0.01}
            required
            error={errors.quantity}
            rightSection={<Text size="sm" c="dimmed">{stockItem.unit}</Text>}
            leftSection={<IconHash size={16} />}
            description={movementType && quantity && resultingStock !== null ? 
              `Resultado: ${resultingStock} ${stockItem.unit}` : undefined
            }
          />

          {/* Reason */}
          <TextInput
            label="Motivo"
            placeholder="Describe el motivo del movimiento"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            required
            error={errors.reason}
            leftSection={<IconFileText size={16} />}
          />

          {/* Additional fields for specific movement types */}
          {(movementType === MovementType.ENTRADA || movementType === MovementType.AJUSTE) && (
            <>
              {/* Batch ID for entries */}
              <TextInput
                label="ID de Lote (Opcional)"
                placeholder="Ingresa el ID del lote"
                value={batchId}
                onChange={(e) => setBatchId(e.currentTarget.value)}
                leftSection={<IconTag size={16} />}
              />

              {/* Cost per unit */}
              <NumberInput
                label="Costo por Unidad (Opcional)"
                placeholder="0.00"
                value={costPerUnit ? parseFloat(costPerUnit) : ''}
                onChange={(value) => setCostPerUnit(value?.toString() || '')}
                min={0}
                decimalScale={2}
                step={0.01}
                leftSection={<IconCurrencyDollar size={16} />}
                rightSection={<Text size="sm" c="dimmed">MXN</Text>}
              />

              {/* Expiry Date */}
              <TextInput
                label="Fecha de Vencimiento (Opcional)"
                placeholder="YYYY-MM-DD"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.currentTarget.value)}
                type="date"
                leftSection={<IconCalendar size={16} />}
              />
            </>
          )}

          {/* Notes */}
          <Textarea
            label="Notas Adicionales (Opcional)"
            placeholder="Información adicional sobre el movimiento..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            minRows={2}
            maxRows={4}
            leftSection={<IconFileText size={16} />}
          />
        </Stack>

      </Stack>
    </Modal>
  )
}
