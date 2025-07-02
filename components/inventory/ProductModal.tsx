"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
  Card,
  CardBody,
  Chip,
  Divider
} from "@heroui/react"
import {
  DocumentTextIcon,
  TagIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { PRODUCT_CATEGORIES, COMMON_UNITS } from "@/types/inventory"
import toast from "react-hot-toast"

interface Product {
  _id?: string
  productId?: string
  name: string
  sku: string
  category: string
  description?: string
  barcode?: string
  baseUnit: string
  units: {
    base: {
      code: string
      name: string
      category: string
    }
    alternatives: Array<{
      code: string
      name: string
      category: string
      conversionFactor: number
      conversionType: string
      containedUnit?: string
    }>
  }
  pricing?: {
    tieredPricing: Array<{
      minQuantity: number
      maxQuantity: number
      unit: string
      pricePerUnit: number
      type: 'retail' | 'wholesale' | 'bulk'
    }>
    lastCost?: number
    averageCost?: number
  }
  stockLevels: {
    minimum: number
    reorderPoint: number
    unit: string
  }
  suppliers: Array<{
    supplierId: string
    supplierName: string
    isPreferred: boolean
    lastPurchasePrice?: number
    leadTimeDays?: number
  }>
  expiryInfo?: {
    hasExpiry: boolean
    shelfLifeDays?: number
    warningDays: number
  }
  specifications?: {
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
      unit: string
    }
    color?: string
    brand?: string
    model?: string
  }
  images?: string[]
  tags?: string[]
  isActive: boolean
  isPerishable: boolean
  requiresBatch: boolean
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

export default function ProductModal({ isOpen, onClose, product, mode, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    sku: '',
    category: '',
    description: '',
    barcode: '',
    baseUnit: 'unit',
    units: {
      base: {
        code: 'unit',
        name: 'Unidad',
        category: 'piece'
      },
      alternatives: []
    },
    pricing: {
      tieredPricing: [],
      lastCost: 0,
      averageCost: 0
    },
    stockLevels: {
      minimum: 0,
      reorderPoint: 0,
      unit: 'unit'
    },
    suppliers: [],
    expiryInfo: {
      hasExpiry: false,
      warningDays: 7
    },
    specifications: {
      weight: 0,
      color: '',
      brand: '',
      model: ''
    },
    images: [],
    tags: [],
    isActive: true,
    isPerishable: false,
    requiresBatch: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setFormData(product)
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        sku: '',
        category: '',
        description: '',
        barcode: '',
        baseUnit: 'unit',
        units: {
          base: {
            code: 'unit',
            name: 'Unidad',
            category: 'piece'
          },
          alternatives: []
        },
        pricing: {
          tieredPricing: [],
          lastCost: 0,
          averageCost: 0
        },
        stockLevels: {
          minimum: 0,
          reorderPoint: 0,
          unit: 'unit'
        },
        suppliers: [],
        expiryInfo: {
          hasExpiry: false,
          warningDays: 7
        },
        specifications: {
          weight: 0,
          color: '',
          brand: '',
          model: ''
        },
        images: [],
        tags: [],
        isActive: true,
        isPerishable: false,
        requiresBatch: true
      })
    }
  }, [product, mode, isOpen])

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.name || !formData.sku || !formData.category) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    if (!formData.units.base.code || !formData.units.base.name || !formData.units.base.category) {
      toast.error("Por favor selecciona una unidad base válida")
      return
    }

    if (!formData.stockLevels.unit) {
      toast.error("La unidad de stock es requerida")
      return
    }

    // Validar que el punto de reorden sea mayor o igual al mínimo
    if (formData.stockLevels.reorderPoint < formData.stockLevels.minimum) {
      toast.error("El punto de reorden debe ser mayor o igual al stock mínimo")
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create'
        ? '/api/inventory/products'
        : `/api/inventory/products/${product?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(
          mode === 'create'
            ? "Producto creado exitosamente"
            : "Producto actualizado exitosamente"
        )
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        toast.error(error.error || error.message || "Error al guardar el producto")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof Product] as any,
        [field]: value
      }
    }))
  }

  const handleBaseUnitChange = (unitCode: string) => {
    const allUnits = [
      ...Object.values(COMMON_UNITS.VOLUME),
      ...Object.values(COMMON_UNITS.WEIGHT),
      ...Object.values(COMMON_UNITS.PIECE)
    ]
    
    const selectedUnit = allUnits.find(unit => unit.code === unitCode)
    if (selectedUnit) {
      setFormData(prev => ({
        ...prev,
        baseUnit: selectedUnit.code,
        units: {
          ...prev.units,
          base: {
            code: selectedUnit.code,
            name: selectedUnit.name,
            category: selectedUnit.category
          }
        },
        stockLevels: {
          ...prev.stockLevels,
          unit: selectedUnit.code
        }
      }))
    }
  }

  const generateSKU = () => {
    const categoryPrefix = formData.category.substring(0, 3).toUpperCase()
    const namePrefix = formData.name.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    const sku = `${categoryPrefix}${namePrefix}${timestamp}`
    handleInputChange('sku', sku)
  }

  const allUnits = [
    ...Object.values(COMMON_UNITS.VOLUME),
    ...Object.values(COMMON_UNITS.WEIGHT),
    ...Object.values(COMMON_UNITS.PIECE)
  ]

  const isReadOnly = mode === 'view'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[95vh] my-2",
        wrapper: "z-[1001] items-center justify-center p-2 sm:p-4 overflow-y-auto",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-0 overflow-y-auto max-h-[calc(95vh-140px)]",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CubeIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {mode === 'create' && 'Crear Nuevo Producto'}
                  {mode === 'edit' && 'Editar Producto'}
                  {mode === 'view' && 'Detalles del Producto'}
                </h3>
                {product && mode !== 'create' && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600 truncate">{product.name}</span>
                    <Chip size="sm" variant="flat" color="primary">
                      {product.sku}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={product.isActive ? "success" : "danger"}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Chip>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {mode === 'view' && (
                <Chip
                  variant="flat"
                  color="default"
                  size="sm"
                  startContent={<EyeIcon className="w-3 h-3" />}
                >
                  Solo lectura
                </Chip>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="p-4 sm:p-6">
          {/* Layout responsivo con CSS Grid para desktop y Flexbox para móvil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Información básica - Ocupa 2 columnas en XL */}
            <Card className="border border-gray-200 lg:col-span-2 xl:col-span-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Información Básica</h4>
                </div>
                
                {/* Grid interno responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto *
                    </label>
                    <Input
                      placeholder="Ej: Cerveza Corona 355ml"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      startContent={<CubeIcon className="w-4 h-4 text-gray-400" />}
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU *
                      </label>
                      <Input
                        placeholder="Código único del producto"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
                        variant="flat"
                        isReadOnly={isReadOnly}
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                        }}
                      />
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-end">
                        <Button
                          variant="flat"
                          onPress={generateSKU}
                          size="sm"
                          startContent={<CogIcon className="w-4 h-4" />}
                          className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-0 w-full sm:w-auto"
                        >
                          Generar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <Select
                      placeholder="Selecciona una categoría"
                      selectedKeys={formData.category ? [formData.category] : []}
                      onSelectionChange={(keys) => handleInputChange('category', Array.from(keys)[0])}
                      variant="flat"
                      isDisabled={isReadOnly}
                      classNames={{
                        trigger: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <Textarea
                      placeholder="Descripción detallada del producto..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      minRows={2}
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => handleInputChange('isActive', value)}
                      isDisabled={isReadOnly}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Producto Activo
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Unidades - Columna lateral en XL */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ScaleIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Unidades</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad Base *
                    </label>
                    <Select
                      placeholder="Selecciona la unidad base"
                      selectedKeys={formData.units.base.code ? [formData.units.base.code] : []}
                      onSelectionChange={(keys) => handleBaseUnitChange(Array.from(keys)[0] as string)}
                      variant="flat"
                      isDisabled={isReadOnly}
                      classNames={{
                        trigger: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {allUnits.map((unit) => (
                        <SelectItem key={unit.code}>
                          <div className="flex flex-col">
                            <span className="font-medium">{unit.name}</span>
                            <span className="text-xs text-gray-500">({unit.code}) - {unit.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {formData.units.base.code && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Unidad Seleccionada</div>
                      <div className="text-sm font-medium text-gray-900">{formData.units.base.name}</div>
                      <div className="text-xs text-gray-500">Código: {formData.units.base.code}</div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Niveles de Stock - Ocupa toda la fila en LG */}
            <Card className="border border-gray-200 lg:col-span-2 xl:col-span-3">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Niveles de Stock</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo *
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.stockLevels.minimum.toString()}
                      onChange={(e) => handleNestedInputChange('stockLevels', 'minimum', parseFloat(e.target.value) || 0)}
                      endContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">
                            {formData.units.base.code}
                          </span>
                        </div>
                      }
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Punto de Reorden *
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.stockLevels.reorderPoint.toString()}
                      onChange={(e) => handleNestedInputChange('stockLevels', 'reorderPoint', parseFloat(e.target.value) || 0)}
                      endContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">
                            {formData.units.base.code}
                          </span>
                        </div>
                      }
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Configuración Adicional</div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <Switch
                            isSelected={formData.isPerishable}
                            onValueChange={(value) => handleInputChange('isPerishable', value)}
                            isDisabled={isReadOnly}
                            size="sm"
                          />
                          <span className="text-xs text-gray-700">Perecedero</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            isSelected={formData.requiresBatch}
                            onValueChange={(value) => handleInputChange('requiresBatch', value)}
                            isDisabled={isReadOnly}
                            size="sm"
                          />
                          <span className="text-xs text-gray-700">Requiere Lote</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-between items-center w-full">
            <div className="flex gap-3">
              {/* Espacio para botones adicionales si es necesario */}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="light"
                onPress={onClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                {isReadOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              
              {!isReadOnly && (
                <Button
                  onPress={handleSubmit}
                  isLoading={loading}
                  isDisabled={
                    !formData.name ||
                    !formData.sku ||
                    !formData.category ||
                    !formData.units.base.code
                  }
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  startContent={!loading && (mode === 'create' ? <PlusIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />)}
                >
                  {loading ? (mode === 'create' ? 'Creando...' : 'Actualizando...') : (mode === 'create' ? 'Crear Producto' : 'Actualizar Producto')}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}