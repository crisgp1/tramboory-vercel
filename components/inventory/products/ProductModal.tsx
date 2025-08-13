"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  Tabs,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  Card,
  Badge,
  MultiSelect
} from "@mantine/core"
import {
  IconPackage,
  IconTag,
  IconSettings,
  IconFileText,
  IconBuilding,
  IconDeviceFloppy,
  IconPlus,
  IconEdit,
  IconEye,
  IconAlertTriangle,
  IconCheck
} from "@tabler/icons-react"
import toast from "react-hot-toast"

// Types
interface Product {
  id?: string
  product_id?: string
  name: string
  sku?: string
  category: string
  description?: string
  barcode?: string
  base_unit: string
  stock_minimum: number
  stock_reorder_point: number
  stock_unit: string
  last_cost?: number
  average_cost?: number
  is_active: boolean
  is_perishable: boolean
  requires_batch: boolean
  expiry_has_expiry?: boolean
  expiry_shelf_life_days?: number
  expiry_warning_days?: number
  spec_weight?: number
  spec_length?: number
  spec_width?: number
  spec_height?: number
  spec_dimensions_unit?: string
  spec_color?: string
  spec_brand?: string
  spec_model?: string
  images?: string[]
  tags?: string[]
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

interface ValidationErrors {
  [key: string]: string
}

// Constants
const PRODUCT_CATEGORIES = [
  "Alimentación",
  "Bebidas",
  "Electrónicos",
  "Ropa",
  "Hogar",
  "Salud y Belleza",
  "Deportes",
  "Libros",
  "Juguetes",
  "Automóvil"
]

const COMMON_UNITS = {
  VOLUME: {
    LITER: { code: 'L', name: 'Litros', category: 'Volumen' },
    MILLILITER: { code: 'ml', name: 'Mililitros', category: 'Volumen' },
    GALLON: { code: 'gal', name: 'Galones', category: 'Volumen' }
  },
  WEIGHT: {
    KILOGRAM: { code: 'kg', name: 'Kilogramos', category: 'Peso' },
    GRAM: { code: 'g', name: 'Gramos', category: 'Peso' },
    POUND: { code: 'lb', name: 'Libras', category: 'Peso' }
  },
  PIECE: {
    UNIT: { code: 'unit', name: 'Unidades', category: 'Pieza' },
    PAIR: { code: 'pair', name: 'Pares', category: 'Pieza' },
    DOZEN: { code: 'dozen', name: 'Docenas', category: 'Pieza' }
  }
}

// Utility function to generate SKU
const generateSKU = (name: string, category: string): string => {
  const categoryPrefix = category.substring(0, 3).toUpperCase()
  const namePrefix = name.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  return `${categoryPrefix}${namePrefix}${timestamp}`
}

// Validation function
const validateForm = (data: Product): ValidationErrors => {
  const errors: ValidationErrors = {}
  
  if (!data.name.trim()) errors.name = "El nombre es requerido"
  if (!data.sku?.trim()) errors.sku = "El SKU es requerido"
  if (!data.category) errors.category = "La categoría es requerida"
  if (!data.base_unit) errors.base_unit = "La unidad base es requerida"
  if (data.stock_minimum < 0) errors.stock_minimum = "El stock mínimo no puede ser negativo"
  if (data.stock_reorder_point < data.stock_minimum) {
    errors.stock_reorder_point = "El punto de reorden debe ser mayor o igual al stock mínimo"
  }
  
  return errors
}

export default function ProductModal({ isOpen, onClose, product, mode, onSuccess }: ProductModalProps) {
  // State
  const [activeTab, setActiveTab] = useState('basic')
  const [categories] = useState<string[]>(PRODUCT_CATEGORIES)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  const [formData, setFormData] = useState<Product>({
    name: '',
    sku: '',
    category: '',
    description: '',
    barcode: '',
    base_unit: 'unit',
    stock_minimum: 0,
    stock_reorder_point: 0,
    stock_unit: 'unit',
    last_cost: 0,
    average_cost: 0,
    is_active: true,
    is_perishable: false,
    requires_batch: true,
    expiry_has_expiry: false,
    expiry_warning_days: 7,
    spec_weight: 0,
    spec_color: '',
    spec_brand: '',
    spec_model: '',
    images: [],
    tags: []
  })

  // Computed values
  const isReadOnly = mode === 'view'
  const allUnits = useMemo(() => [
    ...Object.values(COMMON_UNITS.VOLUME),
    ...Object.values(COMMON_UNITS.WEIGHT),
    ...Object.values(COMMON_UNITS.PIECE)
  ], [])

  // Effects
  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setFormData(product)
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        description: '',
        barcode: '',
        base_unit: 'unit',
        stock_minimum: 0,
        stock_reorder_point: 0,
        stock_unit: 'unit',
        last_cost: 0,
        average_cost: 0,
        is_active: true,
        is_perishable: false,
        requires_batch: true,
        expiry_has_expiry: false,
        expiry_warning_days: 7,
        spec_weight: 0,
        spec_color: '',
        spec_brand: '',
        spec_model: '',
        images: [],
        tags: []
      })
    }
    setActiveTab('basic')
    setErrors({})
  }, [product, mode, isOpen])

  // Handlers
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleGenerateSKU = () => {
    if (formData.name && formData.category) {
      const newSKU = generateSKU(formData.name, formData.category)
      handleInputChange('sku', newSKU)
    } else {
      toast.error('Ingresa nombre y categoría primero')
    }
  }

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Por favor corrige los errores antes de continuar')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/products'
        : `/api/inventory/products/${product?.id || product?.product_id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Producto ${mode === 'create' ? 'creado' : 'actualizado'} exitosamente`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar el producto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const unitOptions = allUnits.map(unit => ({
    value: unit.code,
    label: `${unit.name} (${unit.code})`
  }))

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 
             mode === 'edit' ? 'Editar Producto' : 'Detalles del Producto'}
      size="xl"
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
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
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'basic')}>
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconPackage size={16} />}>
            Información Básica
          </Tabs.Tab>
          <Tabs.Tab value="inventory" leftSection={<IconTag size={16} />}>
            Inventario
          </Tabs.Tab>
          <Tabs.Tab value="specifications" leftSection={<IconSettings size={16} />}>
            Especificaciones
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="lg">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 8 }}>
                <TextInput
                  label="Nombre del Producto *"
                  placeholder="Nombre del producto"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isReadOnly}
                  error={errors.name}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <TextInput
                    label="SKU *"
                    placeholder="SKU"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    disabled={isReadOnly}
                    error={errors.sku}
                    style={{ flex: 1 }}
                  />
                  {!isReadOnly && (
                    <Button
                      variant="light"
                      size="sm"
                      onClick={handleGenerateSKU}
                      mt="xl"
                    >
                      Generar
                    </Button>
                  )}
                </Group>
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Categoría *"
                  placeholder="Selecciona una categoría"
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value)}
                  disabled={isReadOnly}
                  error={errors.category}
                  data={categories}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Código de Barras"
                  placeholder="Código de barras"
                  value={formData.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Descripción"
              placeholder="Descripción del producto"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isReadOnly}
              minRows={3}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Switch
                  label="Producto Activo"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.currentTarget.checked)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Switch
                  label="Es Perecedero"
                  checked={formData.is_perishable}
                  onChange={(e) => handleInputChange('is_perishable', e.currentTarget.checked)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Switch
                  label="Requiere Lotes"
                  checked={formData.requires_batch}
                  onChange={(e) => handleInputChange('requires_batch', e.currentTarget.checked)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="inventory" pt="lg">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Unidad Base *"
                  placeholder="Selecciona una unidad"
                  value={formData.base_unit}
                  onChange={(value) => handleInputChange('base_unit', value)}
                  disabled={isReadOnly}
                  error={errors.base_unit}
                  data={unitOptions}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Unidad de Stock"
                  placeholder="Selecciona una unidad"
                  value={formData.stock_unit}
                  onChange={(value) => handleInputChange('stock_unit', value)}
                  disabled={isReadOnly}
                  data={unitOptions}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label="Stock Mínimo"
                  placeholder="0"
                  value={formData.stock_minimum}
                  onChange={(value) => handleInputChange('stock_minimum', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  error={errors.stock_minimum}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label="Punto de Reorden"
                  placeholder="0"
                  value={formData.stock_reorder_point}
                  onChange={(value) => handleInputChange('stock_reorder_point', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  error={errors.stock_reorder_point}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label="Días de Advertencia"
                  placeholder="7"
                  value={formData.expiry_warning_days}
                  onChange={(value) => handleInputChange('expiry_warning_days', typeof value === 'number' ? value : 7)}
                  disabled={isReadOnly}
                  min={1}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Último Costo"
                  placeholder="0.00"
                  value={formData.last_cost}
                  onChange={(value) => handleInputChange('last_cost', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  prefix="$"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Costo Promedio"
                  placeholder="0.00"
                  value={formData.average_cost}
                  onChange={(value) => handleInputChange('average_cost', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  prefix="$"
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="specifications" pt="lg">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <TextInput
                  label="Marca"
                  placeholder="Marca del producto"
                  value={formData.spec_brand || ''}
                  onChange={(e) => handleInputChange('spec_brand', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <TextInput
                  label="Modelo"
                  placeholder="Modelo del producto"
                  value={formData.spec_model || ''}
                  onChange={(e) => handleInputChange('spec_model', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <TextInput
                  label="Color"
                  placeholder="Color del producto"
                  value={formData.spec_color || ''}
                  onChange={(e) => handleInputChange('spec_color', e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Peso (kg)"
                  placeholder="0"
                  value={formData.spec_weight}
                  onChange={(value) => handleInputChange('spec_weight', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Largo (cm)"
                  placeholder="0"
                  value={formData.spec_length}
                  onChange={(value) => handleInputChange('spec_length', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Ancho (cm)"
                  placeholder="0"
                  value={formData.spec_width}
                  onChange={(value) => handleInputChange('spec_width', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Alto (cm)"
                  placeholder="0"
                  value={formData.spec_height}
                  onChange={(value) => handleInputChange('spec_height', typeof value === 'number' ? value : 0)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {!isReadOnly && (
        <Group justify="flex-end" mt="lg">
          <Button
            variant="light"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </Button>
        </Group>
      )}
    </Modal>
  )
}