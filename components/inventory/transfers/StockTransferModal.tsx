"use client"

import React, { useState, useEffect } from "react"
import {
  IconPlus,
  IconTrash,
  IconArrowRight,
  IconTruck,
  IconShoppingBag,
  IconCheck,
  IconExclamationCircle
} from "@tabler/icons-react"
import toast from "react-hot-toast"
import { Modal, Stack, Card, TextInput, Textarea, Select, Button, Group, Text, Title, NumberInput, Alert } from '@mantine/core'

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
      opened={isOpen}
      onClose={onClose}
      title={
        <Stack gap="xs">
          <Title order={3}>{getTitle()}</Title>
          {getSubtitle() && <Text c="dimmed" size="sm">{getSubtitle()}</Text>}
        </Stack>
      }
      size="xl"
      styles={{
        content: {
          maxHeight: '95vh',
          overflow: 'hidden'
        },
        body: {
          maxHeight: 'calc(95vh - 120px)',
          overflow: 'auto',
          padding: '1rem'
        }
      }}
    >
      {/* Success Message */}
      {showSuccess && (
        <Alert 
          icon={<IconCheck size={16} />} 
          title="¡Éxito!" 
          color="green"
          mb="lg"
        >
          Transferencia procesada exitosamente
        </Alert>
      )}

      <Stack gap="lg">
        
        {/* Configuración de Ubicaciones */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconShoppingBag size={20} />
              Configuración de Transferencia
            </Group>
          </Title>

          <Group grow align="flex-end">
            <Select
              label="Ubicación de Origen"
              placeholder="Seleccionar origen"
              value={formData.fromLocation}
              onChange={(value) => handleInputChange('fromLocation', value)}
              disabled={isReadOnly}
              data={AVAILABLE_LOCATIONS.map((location) => ({
                value: location.id,
                label: location.name
              }))}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'center', alignSelf: 'flex-end', paddingBottom: '8px' }}>
              <div style={{ width: 48, height: 48, backgroundColor: '#e8f5e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconArrowRight size={24} color="#4ade80" />
              </div>
            </div>

            <Select
              label="Ubicación de Destino"
              placeholder="Seleccionar destino"
              value={formData.toLocation}
              onChange={(value) => handleInputChange('toLocation', value)}
              disabled={isReadOnly}
              data={AVAILABLE_LOCATIONS.filter(loc => loc.id !== formData.fromLocation).map((location) => ({
                value: location.id,
                label: location.name
              }))}
              required
            />
          </Group>

          {mode !== 'create' && (
            <Group grow align="flex-start" mt="md">
              <Select
                label="Estado"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                disabled={isReadOnly}
                data={Object.entries(statusConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label
                }))}
              />

              <TextInput
                type="date"
                label="Entrega Estimada"
                value={formData.estimatedDelivery || ''}
                onChange={(e) => handleInputChange('estimatedDelivery', e.currentTarget.value)}
                readOnly={isReadOnly}
              />
            </Group>
          )}
        </Card>

        {/* Productos a Transferir */}
        <Card withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Title order={4}>
              <Group gap="xs">
                <IconTruck size={20} />
                Productos a Transferir
              </Group>
            </Title>
            
            {!isReadOnly && formData.fromLocation && (
              <Button
                onClick={handleAddItem}
                size="sm"
                leftSection={<IconPlus size={16} />}
              >
                Agregar Producto
              </Button>
            )}
          </Group>

          <Stack gap="md">
            {formData.items.map((item, index) => (
              <Card key={index} withBorder p="md">
                <Group grow align="flex-end">
                  <Select
                    label="Producto"
                    value={item.productId}
                    onChange={(value) => handleItemChange(index, 'productId', value || '')}
                    disabled={isReadOnly}
                    data={availableProducts.map((stockItem) => ({
                      value: stockItem.product.id,
                      label: `${stockItem.product.name} - Disponible: ${stockItem.available_quantity} ${stockItem.unit}`
                    }))}
                    placeholder="Seleccionar producto"
                    style={{ flex: 2 }}
                  />

                  <NumberInput
                    label="Cantidad"
                    min={0}
                    max={item.availableQuantity}
                    step={0.01}
                    value={item.quantity}
                    onChange={(value) => handleItemChange(index, 'quantity', value || 0)}
                    readOnly={isReadOnly}
                    description={item.availableQuantity > 0 ? `Disponible: ${item.availableQuantity} ${item.unit}` : undefined}
                  />

                  <TextInput
                    label="Unidad"
                    value={item.unit}
                    readOnly
                  />

                  {!isReadOnly && (
                    <Button
                      onClick={() => handleRemoveItem(index)}
                      color="red"
                      size="sm"
                      style={{ alignSelf: 'flex-end' }}
                    >
                      <IconTrash size={16} />
                    </Button>
                  )}
                </Group>

                {item.quantity > item.availableQuantity && item.availableQuantity > 0 && (
                  <Alert icon={<IconExclamationCircle size={16} />} color="red" mt="sm">
                    La cantidad excede el stock disponible
                  </Alert>
                )}
              </Card>
            ))}

            {formData.items.length === 0 && (
              <Text ta="center" py="xl" c="dimmed">
                {isReadOnly ? 'No hay productos en esta transferencia' : 'Selecciona una ubicación de origen y agrega productos'}
              </Text>
            )}
          </Stack>
        </Card>

        {/* Notas */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconShoppingBag size={20} />
              Información Adicional
            </Group>
          </Title>

          <Group grow align="flex-start" mb="md">
            <TextInput
              label="Solicitado por"
              value={formData.requestedBy}
              onChange={(e) => handleInputChange('requestedBy', e.currentTarget.value)}
              readOnly={isReadOnly}
              placeholder="Nombre de quien solicita"
            />

            <TextInput
              type="date"
              label="Fecha de Solicitud"
              value={formData.requestedDate}
              onChange={(e) => handleInputChange('requestedDate', e.currentTarget.value)}
              readOnly={isReadOnly}
            />
          </Group>

          <Textarea
            label="Notas"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.currentTarget.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Notas adicionales sobre la transferencia..."
          />
        </Card>

        {/* Footer Buttons */}
        <Group justify="space-between" pt="lg">
          <div>
            {!isReadOnly && (!formData.fromLocation || !formData.toLocation || formData.items.length === 0) && (
              <Text c="red" size="sm">Completa todos los campos requeridos</Text>
            )}
          </div>
          
          <Group>
            <Button
              variant="default"
              onClick={onClose}
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.fromLocation || !formData.toLocation || formData.items.length === 0}
                loading={loading}
              >
                {mode === 'create' ? 'Crear Transferencia' : 'Actualizar Transferencia'}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}