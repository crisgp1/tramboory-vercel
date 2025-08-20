"use client"

import React, { useState } from "react"
import {
  IconMapPin,
  IconPlus,
  IconHash,
  IconCurrencyDollar,
  IconCalendar,
  IconTag,
  IconAlertTriangle,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import toast from "react-hot-toast"
import { Modal, Stack, Card, TextInput, Textarea, Select, Button, Group, Text, Title, NumberInput, Alert } from '@mantine/core'

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

export default function InitiateMovementModal({ isOpen, onClose, product, onSuccess }: InitiateMovementModalProps) {
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
      opened={isOpen}
      onClose={handleClose}
      title={
        <Stack gap="xs">
          <Title order={3}>{getTitle()}</Title>
          <Text c="dimmed" size="sm">{getSubtitle()}</Text>
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
          Stock inicializado exitosamente
        </Alert>
      )}

      <Stack gap="lg">
        
        {/* Información del Producto */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconTag size={20} />
              Información del Producto
            </Group>
          </Title>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Producto</Text>
              <Text fw={600}>{product?.name}</Text>
            </Card>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">SKU</Text>
              <Text fw={600}>{product?.sku}</Text>
            </Card>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Categoría</Text>
              <Text fw={600}>{product?.category}</Text>
            </Card>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Unidad Base</Text>
              <Text fw={600}>{product?.base_unit}</Text>
            </Card>
          </div>
        </Card>

        {/* Configuración del Stock */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconPlus size={20} />
              Configuración del Stock Inicial
            </Group>
          </Title>

          <Stack gap="md">
            {/* Ubicación y Cantidad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <Select
                label="Ubicación"
                placeholder="Selecciona una ubicación"
                value={selectedLocation}
                onChange={(value) => setSelectedLocation(value || '')}
                data={AVAILABLE_LOCATIONS.map((location) => ({
                  value: location.id,
                  label: location.name
                }))}
                leftSection={<IconMapPin size={16} />}
                required
              />

              <NumberInput
                label="Cantidad Inicial"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={quantity ? parseFloat(quantity) : ''}
                onChange={(value) => setQuantity(value?.toString() || '')}
                leftSection={<IconHash size={16} />}
                suffix={` ${product?.base_unit}`}
                required
              />
            </div>

            {/* Razón */}
            <TextInput
              label="Razón"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              placeholder="Razón del movimiento"
            />

            {/* Notas */}
            <Textarea
              label="Notas Adicionales"
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              rows={3}
              placeholder="Notas adicionales sobre el stock inicial..."
            />
          </Stack>
        </Card>

        {/* Información Adicional */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconTag size={20} />
              Información Adicional (Opcional)
            </Group>
          </Title>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <NumberInput
              label="Costo por Unidad"
              placeholder="0.00"
              min={0}
              step={0.01}
              value={costPerUnit ? parseFloat(costPerUnit) : ''}
              onChange={(value) => setCostPerUnit(value?.toString() || '')}
              leftSection={<IconCurrencyDollar size={16} />}
            />

            <TextInput
              label="ID del Lote"
              value={batchId}
              onChange={(e) => setBatchId(e.currentTarget.value)}
              placeholder="Lote opcional"
              leftSection={<IconTag size={16} />}
            />

            <TextInput
              type="date"
              label="Fecha de Vencimiento"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.currentTarget.value)}
              leftSection={<IconCalendar size={16} />}
            />
          </div>
        </Card>

        {/* Resumen */}
        {selectedLocation && quantity && (
          <Card withBorder p="lg" style={{ backgroundColor: '#eff6ff' }}>
            <Title order={4} mb="md" c="blue">
              <Group gap="xs">
                <IconCheck size={20} />
                Resumen
              </Group>
            </Title>
            
            <Stack gap="xs" c="blue.7">
              <Text>
                <Text component="span" fw={500}>Se iniciará stock de:</Text> {quantity} {product?.base_unit}
              </Text>
              <Text>
                <Text component="span" fw={500}>Producto:</Text> {product?.name}
              </Text>
              <Text>
                <Text component="span" fw={500}>Ubicación:</Text> {AVAILABLE_LOCATIONS.find(l => l.id === selectedLocation)?.name}
              </Text>
            </Stack>
          </Card>
        )}

        {/* Footer Buttons */}
        <Group justify="flex-end" gap="sm" pt="lg" style={{ flexWrap: 'wrap' }}>
          <Button
            variant="default"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedLocation || !quantity}
            loading={loading}
          >
            Inicializar Stock
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}