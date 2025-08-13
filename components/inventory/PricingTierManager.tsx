"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Button,
  TextInput,
  Textarea,
  Select,
  Modal,
  Table,
  Badge,
  Loader,
  Switch,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  Card,
  Grid,
  Center,
  ThemeIcon,
  NumberInput
} from "@mantine/core"
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconCurrencyDollar,
  IconTag,
  IconChartBar,
  IconEye
} from "@tabler/icons-react"
import toast from "react-hot-toast"

interface PricingTier {
  _id?: string
  name: string
  description?: string
  minQuantity: number
  maxQuantity?: number
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  isActive: boolean
  priority: number
}

interface ProductPricing {
  _id?: string
  productId: string
  productName: string
  productSku: string
  basePrice: number
  currency: string
  tiers: PricingTier[]
  effectiveFrom?: string
  effectiveTo?: string
}

interface Product {
  _id: string
  name: string
  sku: string
  basePrice: number
  currency: string
}

interface PricingTierModalProps {
  isOpen: boolean
  onClose: () => void
  tier?: PricingTier | null
  mode: 'create' | 'edit'
  onSuccess: (tier: PricingTier) => void
  existingTiers: PricingTier[]
}

function PricingTierModal({ 
  isOpen, 
  onClose, 
  tier, 
  mode, 
  onSuccess, 
  existingTiers 
}: PricingTierModalProps) {
  const [formData, setFormData] = useState<PricingTier>({
    name: '',
    minQuantity: 1,
    discountType: 'percentage',
    discountValue: 0,
    isActive: true,
    priority: 1
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (tier && mode === 'edit') {
        setFormData(tier)
      } else {
        resetForm()
      }
    }
  }, [isOpen, tier, mode])

  const resetForm = () => {
    const nextPriority = Math.max(...existingTiers.map(t => t.priority), 0) + 1
    setFormData({
      name: '',
      minQuantity: 1,
      discountType: 'percentage',
      discountValue: 0,
      isActive: true,
      priority: nextPriority
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    
    if (formData.minQuantity <= 0) {
      toast.error('La cantidad mínima debe ser mayor a 0')
      return
    }
    
    if (formData.discountValue <= 0) {
      toast.error('El descuento debe ser mayor a 0')
      return
    }
    
    if (formData.discountType === 'percentage' && formData.discountValue >= 100) {
      toast.error('El descuento porcentual debe ser menor a 100%')
      return
    }
    
    // Validar que no haya solapamiento de rangos
    const hasOverlap = existingTiers.some(existingTier => {
      if (tier && existingTier._id === tier._id) return false // Excluir el tier actual en edición
      
      const existingMin = existingTier.minQuantity
      const existingMax = existingTier.maxQuantity || Infinity
      const newMin = formData.minQuantity
      const newMax = formData.maxQuantity || Infinity
      
      return (newMin >= existingMin && newMin <= existingMax) ||
             (newMax >= existingMin && newMax <= existingMax) ||
             (newMin <= existingMin && newMax >= existingMax)
    })
    
    if (hasOverlap) {
      toast.error('Los rangos de cantidad no pueden solaparse')
      return
    }

    setSubmitting(true)
    try {
      onSuccess(formData)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Nivel de Precios' : 'Editar Nivel de Precios'}
      size="lg"
      closeOnEscape={!submitting}
      closeOnClickOutside={!submitting}
    >
      <Stack gap="md">
        <TextInput
          label="Nombre del Nivel *"
          placeholder="Ej: Mayorista, Distribuidor"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        
        <Textarea
          label="Descripción"
          placeholder="Descripción opcional del nivel"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          minRows={2}
        />
        
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Cantidad Mínima *"
              placeholder="1"
              value={formData.minQuantity}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                minQuantity: typeof value === 'number' ? value : 1
              }))}
              min={1}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Cantidad Máxima"
              placeholder="Opcional"
              value={formData.maxQuantity || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                maxQuantity: typeof value === 'number' ? value : undefined
              }))}
              min={formData.minQuantity + 1}
            />
          </Grid.Col>
        </Grid>
        
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Tipo de Descuento"
              value={formData.discountType}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                discountType: value as 'percentage' | 'fixed_amount'
              }))}
              data={[
                { value: 'percentage', label: 'Porcentaje (%)' },
                { value: 'fixed_amount', label: 'Monto Fijo ($)' }
              ]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Valor del Descuento *"
              placeholder="0"
              value={formData.discountValue}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                discountValue: typeof value === 'number' ? value : 0
              }))}
              min={0.01}
              step={0.01}
              rightSection={
                <Text size="sm" c="dimmed">
                  {formData.discountType === 'percentage' ? '%' : '$'}
                </Text>
              }
            />
          </Grid.Col>
        </Grid>
        
        <NumberInput
          label="Prioridad"
          description="Orden de aplicación (menor número = mayor prioridad)"
          value={formData.priority}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            priority: typeof value === 'number' ? value : 1
          }))}
          min={1}
        />
        
        <Group gap="sm" mt="sm">
          <Switch
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
            size="sm"
          />
          <Text size="sm">Nivel activo</Text>
        </Group>
        
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
            {mode === 'create' ? 'Crear Nivel' : 'Guardar Cambios'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default function PricingTierManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [productPricing, setProductPricing] = useState<ProductPricing | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchProductPricing(selectedProduct)
    } else {
      setProductPricing(null)
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchProductPricing = async (productId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/products/${productId}/pricing`)
      if (response.ok) {
        const data = await response.json()
        setProductPricing(data.pricing)
      } else if (response.status === 404) {
        // No hay pricing configurado, crear estructura básica
        const product = products.find(p => p._id === productId)
        if (product) {
          setProductPricing({
            productId: product._id,
            productName: product.name,
            productSku: product.sku,
            basePrice: product.basePrice,
            currency: product.currency || 'MXN',
            tiers: []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching product pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTier = () => {
    setSelectedTier(null)
    setModalMode('create')
    open()
  }

  const handleEditTier = (tier: PricingTier) => {
    setSelectedTier(tier)
    setModalMode('edit')
    open()
  }

  const handleDeleteTier = (tier: PricingTier) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este nivel de precios?')) return

    if (productPricing) {
      const updatedTiers = productPricing.tiers.filter(t => t._id !== tier._id)
      setProductPricing({
        ...productPricing,
        tiers: updatedTiers
      })
      savePricing(updatedTiers)
    }
  }

  const handleTierSuccess = (tier: PricingTier) => {
    if (!productPricing) return

    let updatedTiers: PricingTier[]
    
    if (modalMode === 'create') {
      updatedTiers = [...productPricing.tiers, { ...tier, _id: Date.now().toString() }]
    } else {
      updatedTiers = productPricing.tiers.map(t => 
        t._id === selectedTier?._id ? tier : t
      )
    }
    
    // Ordenar por prioridad
    updatedTiers.sort((a, b) => a.priority - b.priority)
    
    setProductPricing({
      ...productPricing,
      tiers: updatedTiers
    })
    
    savePricing(updatedTiers)
  }

  const savePricing = async (tiers: PricingTier[]) => {
    if (!productPricing) return

    try {
      const response = await fetch(`/api/inventory/products/${productPricing.productId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productPricing,
          tiers
        })
      })

      if (response.ok) {
        toast.success('Precios actualizados exitosamente')
      } else {
        toast.error('Error al guardar los precios')
      }
    } catch (error) {
      console.error('Error saving pricing:', error)
      toast.error('Error al guardar los precios')
    }
  }

  const calculateDiscountedPrice = (basePrice: number, tier: PricingTier) => {
    if (tier.discountType === 'percentage') {
      return basePrice * (1 - tier.discountValue / 100)
    } else {
      return Math.max(0, basePrice - tier.discountValue)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const getQuantityRange = (tier: PricingTier) => {
    if (tier.maxQuantity) {
      return `${tier.minQuantity} - ${tier.maxQuantity}`
    }
    return `${tier.minQuantity}+`
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" radius="md" color="blue">
              <IconTag size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Gestión de Precios Escalonados</Title>
              <Text size="sm" c="dimmed">Configura precios por volumen para productos</Text>
            </Stack>
          </Group>
        </Group>
      </Paper>

      {/* Product Selection */}
      <Paper p="md" withBorder>
        <Group>
          <Select
            placeholder="Elige un producto para configurar precios"
            value={selectedProduct}
            onChange={(value) => setSelectedProduct(value || '')}
            data={products
              .filter(product => product._id && product.name && product.sku)
              .map(product => ({
                value: product._id,
                label: `${product.name} (${product.sku}) - ${formatCurrency(product.basePrice || 0)}`
              }))}
            style={{ flexGrow: 1 }}
          />
          
          {selectedProduct && (
            <Button
              onClick={handleCreateTier}
              leftSection={<IconPlus size={16} />}
            >
              Nuevo Nivel
            </Button>
          )}
        </Group>
      </Paper>

      {/* Product Pricing */}
      {productPricing && (
        <Card withBorder>
          <Card.Section p="lg" withBorder>
            <Group justify="space-between">
              <Group gap="md">
                <ThemeIcon size="md" radius="md" color="blue" variant="light">
                  <IconCurrencyDollar size={20} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text fw={600}>{productPricing.productName}</Text>
                  <Text size="sm" c="dimmed">
                    SKU: {productPricing.productSku} | 
                    Precio Base: {formatCurrency(productPricing.basePrice, productPricing.currency)}
                  </Text>
                </Stack>
              </Group>
              <Badge
                size="lg"
                leftSection={<IconChartBar size={16} />}
                color="blue"
                variant="light"
              >
                {productPricing.tiers.length} niveles
              </Badge>
            </Group>
          </Card.Section>
          
          <Card.Section p="lg">
            {loading ? (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <Loader size="lg" />
                  <Text c="dimmed">Cargando niveles...</Text>
                </Stack>
              </Center>
            ) : productPricing.tiers.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <ThemeIcon size="xl" radius="md" color="gray" variant="light">
                    <IconCurrencyDollar size={32} />
                  </ThemeIcon>
                  <Title order={4}>No hay niveles de precios configurados</Title>
                  <Button
                    onClick={handleCreateTier}
                    leftSection={<IconPlus size={16} />}
                    variant="light"
                  >
                    Crear primer nivel
                  </Button>
                </Stack>
              </Center>
            ) : (
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>NIVEL</Table.Th>
                      <Table.Th>CANTIDAD</Table.Th>
                      <Table.Th>DESCUENTO</Table.Th>
                      <Table.Th>PRECIO FINAL</Table.Th>
                      <Table.Th>AHORRO</Table.Th>
                      <Table.Th>ESTADO</Table.Th>
                      <Table.Th>ACCIONES</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {productPricing.tiers.map((tier) => {
                      const discountedPrice = calculateDiscountedPrice(productPricing.basePrice, tier)
                      const savings = productPricing.basePrice - discountedPrice
                      const savingsPercentage = (savings / productPricing.basePrice) * 100

                      return (
                        <Table.Tr key={tier._id}>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text fw={600}>{tier.name}</Text>
                              {tier.description && (
                                <Text size="sm" c="dimmed">{tier.description}</Text>
                              )}
                              <Text size="xs" c="dimmed">Prioridad: {tier.priority}</Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="gray" size="sm">
                              {getQuantityRange(tier)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500} c="red">
                              {tier.discountType === 'percentage' 
                                ? `${tier.discountValue}%`
                                : formatCurrency(tier.discountValue, productPricing.currency)
                              }
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={700} c="green">
                              {formatCurrency(discountedPrice, productPricing.currency)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text fw={500} c="green">
                                {formatCurrency(savings, productPricing.currency)}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({savingsPercentage.toFixed(1)}%)
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={tier.isActive ? 'green' : 'gray'}
                              variant="light"
                              size="sm"
                            >
                              {tier.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                size="sm"
                                color="blue"
                                onClick={() => handleEditTier(tier)}
                              >
                                <IconPencil size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                size="sm"
                                color="red"
                                onClick={() => handleDeleteTier(tier)}
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
          </Card.Section>
        </Card>
      )}

      {/* Modal */}
      <PricingTierModal
        isOpen={opened}
        onClose={close}
        tier={selectedTier}
        mode={modalMode}
        onSuccess={handleTierSuccess}
        existingTiers={productPricing?.tiers || []}
      />
    </Stack>
  )
}