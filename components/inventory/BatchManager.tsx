"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Button,
  TextInput,
  Select,
  Textarea,
  Modal,
  Table,
  Badge,
  Loader,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  Card,
  Grid,
  Center,
  ThemeIcon
} from "@mantine/core"
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconCalendar,
  IconArchive,
  IconGrid3x3,
  IconList
} from "@tabler/icons-react"
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
  const [submitting, setSubmitting] = useState(false)

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

    setSubmitting(true)
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
      setSubmitting(false)
    }
  }

  const isReadOnly = mode === 'view'

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Lote' : 
             mode === 'edit' ? 'Editar Lote' : 'Detalles del Lote'}
      size="xl"
      closeOnEscape={!submitting}
      closeOnClickOutside={!submitting}
    >
      <Stack gap="lg">
        {/* Información básica */}
        <Stack gap="sm">
          <Text fw={500} size="sm">Información Básica</Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Número de Lote *"
                placeholder="Ej: LOT-2024-001"
                value={formData.batchNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                disabled={isReadOnly}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Producto *"
                placeholder={products.length === 0 ? "Cargando productos..." : "Selecciona un producto"}
                value={formData.productId || ''}
                onChange={(value) => {
                  if (value) handleProductChange(value)
                }}
                disabled={isReadOnly || products.length === 0}
                data={products
                  .filter(product => product._id && product.name && product.sku)
                  .map(product => ({
                    value: product._id,
                    label: `${product.name} (${product.sku})`
                  })) || []
                }
              />
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Cantidad y ubicación */}
        <Stack gap="sm">
          <Text fw={500} size="sm">Cantidad y Ubicación</Text>
          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Cantidad *"
                type="number"
                placeholder="0"
                value={formData.quantity?.toString() || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                disabled={isReadOnly}
                min={0}
                step={0.01}
                rightSection={formData.unit && (
                  <Text size="sm" c="dimmed">{formData.unit}</Text>
                )}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Ubicación *"
                placeholder="Ej: Almacén A-1"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                disabled={isReadOnly}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Estado"
                placeholder="Selecciona estado"
                value={formData.status || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                disabled={isReadOnly}
                data={[
                  { value: 'active', label: 'Activo' },
                  { value: 'quarantine', label: 'Cuarentena' },
                  { value: 'reserved', label: 'Reservado' },
                  { value: 'expired', label: 'Vencido' },
                  { value: 'consumed', label: 'Consumido' }
                ]}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Fechas */}
        <Stack gap="sm">
          <Text fw={500} size="sm">Fechas Importantes</Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Fecha de Fabricación"
                type="date"
                value={formData.manufacturingDate ? formData.manufacturingDate.split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  manufacturingDate: e.target.value ? e.target.value + 'T00:00:00.000Z' : undefined
                }))}
                disabled={isReadOnly}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Fecha de Vencimiento"
                type="date"
                value={formData.expirationDate ? formData.expirationDate.split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expirationDate: e.target.value ? e.target.value + 'T00:00:00.000Z' : undefined
                }))}
                disabled={isReadOnly}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Notas */}
        <Stack gap="sm">
          <Text fw={500} size="sm">Notas Adicionales</Text>
          <Textarea
            placeholder="Información adicional sobre el lote..."
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            disabled={isReadOnly}
            minRows={4}
          />
        </Stack>
        
        {/* Actions */}
        {!isReadOnly && (
          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
            >
              {mode === 'create' ? 'Crear Lote' : 'Guardar Cambios'}
            </Button>
          </Group>
        )}
      </Stack>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'expired': return 'red'
      case 'quarantine': return 'yellow'
      case 'reserved': return 'blue'
      case 'consumed': return 'gray'
      default: return 'gray'
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
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" radius="md" color="gray">
              <IconArchive size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Gestión de Lotes</Title>
              <Text size="sm" c="dimmed">Administra y controla todos los lotes de inventario</Text>
            </Stack>
          </Group>
          <Button onClick={handleCreate} leftSection={<IconPlus size={16} />}>
            Nuevo Lote
          </Button>
        </Group>
        
        <Group mt="md">
          <TextInput
            placeholder="Buscar por lote, producto o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1 }}
          />
          
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || 'all')}
            data={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activo' },
              { value: 'quarantine', label: 'Cuarentena' },
              { value: 'reserved', label: 'Reservado' },
              { value: 'expired', label: 'Vencido' },
              { value: 'consumed', label: 'Consumido' }
            ]}
            w={160}
          />
          
          <Select
            value={expirationFilter}
            onChange={(value) => setExpirationFilter(value || 'all')}
            data={[
              { value: 'all', label: 'Todos los vencimientos' },
              { value: 'expired', label: 'Vencidos' },
              { value: 'critical', label: 'Críticos (≤7 días)' },
              { value: 'warning', label: 'Próximos (≤30 días)' },
              { value: 'good', label: 'Buenos (>30 días)' }
            ]}
            w={180}
          />
        </Group>
      </Paper>

      {/* Content */}
      <Card withBorder>
        {loading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed">Cargando lotes...</Text>
            </Stack>
          </Center>
        ) : filteredBatches.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <ThemeIcon size="xl" radius="md" color="gray" variant="light">
                <IconArchive size={32} />
              </ThemeIcon>
              <Title order={4}>No se encontraron lotes</Title>
              <Text c="dimmed" ta="center">
                {searchTerm || statusFilter !== 'all' || expirationFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando tu primer lote de inventario'
                }
              </Text>
              {!searchTerm && statusFilter === 'all' && expirationFilter === 'all' && (
                <Button onClick={handleCreate} leftSection={<IconPlus size={16} />}>
                  Crear Primer Lote
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <ScrollArea>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>LOTE</Table.Th>
                  <Table.Th>PRODUCTO</Table.Th>
                  <Table.Th>CANTIDAD</Table.Th>
                  <Table.Th>UBICACIÓN</Table.Th>
                  <Table.Th>VENCIMIENTO</Table.Th>
                  <Table.Th>ESTADO</Table.Th>
                  <Table.Th>ACCIONES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredBatches.map((batch) => {
                  const daysToExpiration = batch.expirationDate ? getDaysToExpiration(batch.expirationDate) : null
                  const expirationStatus = batch.expirationDate ? getExpirationStatus(batch.expirationDate) : null

                  return (
                    <Table.Tr key={batch._id}>
                      <Table.Td>
                        <Group gap="sm">
                          <ThemeIcon size="sm" radius="md" color="gray" variant="light">
                            <IconArchive size={16} />
                          </ThemeIcon>
                          <Stack gap={0}>
                            <Text fw={600}>{batch.batchNumber}</Text>
                            <Text size="xs" c="dimmed">{batch.productSku}</Text>
                          </Stack>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text>{batch.productName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text>{batch.quantity} {batch.unit}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text>{batch.location}</Text>
                      </Table.Td>
                      <Table.Td>
                        {batch.expirationDate ? (
                          <Stack gap={0}>
                            <Text size="sm">
                              {new Date(batch.expirationDate).toLocaleDateString('es-MX')}
                            </Text>
                            {daysToExpiration !== null && (
                              <Text size="xs" c={
                                expirationStatus === 'expired' ? 'red' :
                                expirationStatus === 'critical' ? 'orange' :
                                expirationStatus === 'warning' ? 'yellow' : 'green'
                              }>
                                {daysToExpiration < 0 
                                  ? `Vencido hace ${Math.abs(daysToExpiration)} días`
                                  : daysToExpiration === 0
                                  ? 'Vence hoy'
                                  : `${daysToExpiration} días restantes`
                                }
                              </Text>
                            )}
                          </Stack>
                        ) : (
                          <Text c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(batch.status)}
                          variant="light"
                          size="sm"
                        >
                          {getStatusLabel(batch.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="blue"
                            onClick={() => handleView(batch)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="gray"
                            onClick={() => handleEdit(batch)}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(batch)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Modal */}
      <BatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batch={selectedBatch}
        mode={modalMode}
        onSuccess={fetchBatches}
      />
    </Stack>
  )
}