"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Package,
  Tag,
  Settings,
  FileText,
  Building,
  Save,
  Plus,
  Edit3,
  Eye,
  AlertCircle,
  Check
} from 'lucide-react'
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

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

export default function ProductModalGlass({ isOpen, onClose, product, mode, onSuccess }: ProductModalProps) {
  // State
  const [activeTab, setActiveTab] = useState('basic')
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  
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
      setActiveTab('basic')
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
      setActiveTab('basic')
    }
    setErrors({})
    setShowSuccess(false)
  }, [product, mode, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  // Event handlers
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const response = await fetch('/api/inventory/categories')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.categories.length > 0) {
          setCategories(data.categories)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const handleBaseUnitChange = useCallback((unitCode: string) => {
    const selectedUnit = allUnits.find(unit => unit.code === unitCode)
    if (selectedUnit) {
      setFormData(prev => ({
        ...prev,
        base_unit: selectedUnit.code,
        stock_unit: selectedUnit.code
      }))
    }
  }, [allUnits])

  const handleGenerateSKU = useCallback(() => {
    if (formData.name && formData.category) {
      const sku = generateSKU(formData.name, formData.category)
      handleInputChange('sku', sku)
    }
  }, [formData.name, formData.category, handleInputChange])

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create'
        ? '/api/inventory/products'
        : `/api/inventory/products/${product?.id}`
      
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
        setErrors({ submit: error.error || error.message || "Error al guardar el producto" })
      }
    } catch (error) {
      setErrors({ submit: "Error al procesar la solicitud" })
    } finally {
      setLoading(false)
    }
  }, [formData, mode, product?.id, onSuccess, onClose])

  const tabs = [
    { key: 'basic', label: 'Información Básica', icon: FileText },
    { key: 'stock', label: 'Stock', icon: Building },
    { key: 'config', label: 'Configuración', icon: Settings }
  ]

  const getTitle = () => {
    if (mode === 'create') return 'Crear Nuevo Producto'
    if (mode === 'edit') return 'Editar Producto'
    return 'Detalles del Producto'
  }

  const getSubtitle = () => {
    if (product && mode !== 'create') {
      return `SKU: ${product.sku} • ${product.is_active ? 'Activo' : 'Inactivo'}`
    }
    return undefined
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={Package}
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
              variant="secondary"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </ModalButton>
            
            {!isReadOnly && (
              <ModalButton
                onClick={handleSubmit}
                disabled={loading || Object.keys(validateForm(formData)).length > 0}
                loading={loading}
                variant="primary"
              >
                {mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
              </ModalButton>
            )}
          </ModalActions>
        </ModalFooter>
      }
    >
      {/* Success Message */}
      {showSuccess && (
        <div className="glass-card p-4 mb-6 bg-green-50/80 border border-green-200/50">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 font-medium">
              {mode === 'create' ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="glass-card p-4 mb-6 bg-red-50/80 border border-red-200/50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 p-1 glass-card">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-1 ${
                activeTab === tab.key
                  ? 'glass-tab active text-blue-700'
                  : 'glass-tab text-slate-600 hover:text-slate-800'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Producto *
                </label>
                <div className="relative">
                  <Package className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    readOnly={isReadOnly}
                    className={`glass-input w-full pl-11 pr-4 py-3 text-slate-800 placeholder-slate-500 ${
                      isReadOnly ? 'opacity-60' : ''
                    } ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Ingrese el nombre del producto"
                  />
                </div>
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SKU *
                  </label>
                  <div className="relative">
                    <Tag className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full pl-11 pr-4 py-3 text-slate-800 placeholder-slate-500 ${
                        isReadOnly ? 'opacity-60' : ''
                      } ${errors.sku ? 'border-red-300' : ''}`}
                      placeholder="SKU del producto"
                    />
                  </div>
                  {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
                </div>
                
                {!isReadOnly && (
                  <div className="flex items-end">
                    <ModalButton
                      onClick={handleGenerateSKU}
                      disabled={!formData.name || !formData.category}
                      variant="secondary"
                      className="w-full"
                    >
                      <Settings className="w-4 h-4" />
                      Generar SKU
                    </ModalButton>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={isReadOnly || loadingCategories}
                  className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                    isReadOnly ? 'opacity-60' : ''
                  } ${errors.category ? 'border-red-300' : ''}`}
                >
                  <option value="">
                    {loadingCategories ? "Cargando categorías..." : "Seleccione una categoría"}
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  readOnly={isReadOnly}
                  rows={3}
                  className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none ${
                    isReadOnly ? 'opacity-60' : ''
                  }`}
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Producto Activo
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h4 className="text-lg font-medium text-slate-800 mb-4">Unidades</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unidad Base *
                </label>
                <select
                  value={formData.base_unit}
                  onChange={(e) => handleBaseUnitChange(e.target.value)}
                  disabled={isReadOnly}
                  className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                    isReadOnly ? 'opacity-60' : ''
                  } ${errors.base_unit ? 'border-red-300' : ''}`}
                >
                  <option value="">Seleccione una unidad</option>
                  {allUnits.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.name} ({unit.code}) - {unit.category}
                    </option>
                  ))}
                </select>
                {errors.base_unit && <p className="text-red-600 text-sm mt-1">{errors.base_unit}</p>}
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="text-lg font-medium text-slate-800 mb-4">Niveles de Stock</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Stock Mínimo *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_minimum}
                      onChange={(e) => handleInputChange('stock_minimum', parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full px-4 py-3 pr-16 text-slate-800 placeholder-slate-500 ${
                        isReadOnly ? 'opacity-60' : ''
                      } ${errors.stock_minimum ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                      {formData.base_unit}
                    </span>
                  </div>
                  {errors.stock_minimum && <p className="text-red-600 text-sm mt-1">{errors.stock_minimum}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Punto de Reorden *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_reorder_point}
                      onChange={(e) => handleInputChange('stock_reorder_point', parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full px-4 py-3 pr-16 text-slate-800 placeholder-slate-500 ${
                        isReadOnly ? 'opacity-60' : ''
                      } ${errors.stock_reorder_point ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                      {formData.base_unit}
                    </span>
                  </div>
                  {errors.stock_reorder_point && <p className="text-red-600 text-sm mt-1">{errors.stock_reorder_point}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h4 className="text-lg font-medium text-slate-800 mb-4">Configuración del Producto</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_perishable"
                    checked={formData.is_perishable}
                    onChange={(e) => handleInputChange('is_perishable', e.target.checked)}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_perishable" className="text-sm font-medium text-slate-700">
                    Producto Perecedero
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requires_batch"
                    checked={formData.requires_batch}
                    onChange={(e) => handleInputChange('requires_batch', e.target.checked)}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requires_batch" className="text-sm font-medium text-slate-700">
                    Requiere Manejo por Lotes
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}