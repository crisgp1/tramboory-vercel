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
  Divider,
  Tabs,
  Tab
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
  const [activeTab, setActiveTab] = useState('basic')
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
      setActiveTab('basic')
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
      setActiveTab('basic')
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
      size="2xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-0 overflow-y-auto max-h-[calc(90vh-140px)]",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {mode === 'create' && 'Crear Nuevo Producto'}
                  {mode === 'edit' && 'Editar Producto'}
                  {mode === 'view' && 'Detalles del Producto'}
                </h3>
                {product && mode !== 'create' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      color={product.isActive ? "success" : "danger"}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Chip>
                    <span className="text-sm text-gray-500">
                      SKU: {product.sku}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'view' && (
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<EyeIcon className="w-4 h-4" />}
                  className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-0"
                >
                  Solo lectura
                </Button>
              )}
            </div>
          </div>
        </ModalHeader>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex px-6">
            {[
              { key: 'basic', label: 'Información Básica', icon: DocumentTextIcon },
              { key: 'stock', label: 'Stock', icon: BuildingStorefrontIcon },
              { key: 'config', label: 'Configuración', icon: CogIcon }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <ModalBody className="p-6 overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Nombre del Producto *"
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          placeholder="SKU *"
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
                            className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-0"
                          >
                            Generar SKU
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Select
                        placeholder="Categoría *"
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

                    <div>
                      <Textarea
                        placeholder="Descripción detallada del producto..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        minRows={3}
                        variant="flat"
                        isReadOnly={isReadOnly}
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
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
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-6">
              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Unidades</h4>
                  <div className="space-y-4">
                    <div>
                      <Select
                        placeholder="Unidad Base *"
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

              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Niveles de Stock</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Stock Mínimo *"
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
                      <Input
                        type="number"
                        placeholder="Punto de Reorden *"
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
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <Card className="border border-gray-200 shadow-none">
                <CardBody className="p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuración del Producto</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        isSelected={formData.isPerishable}
                        onValueChange={(value) => handleInputChange('isPerishable', value)}
                        isDisabled={isReadOnly}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Producto Perecedero
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        isSelected={formData.requiresBatch}
                        onValueChange={(value) => handleInputChange('requiresBatch', value)}
                        isDisabled={isReadOnly}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requiere Manejo por Lotes
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
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
                  color="primary"
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