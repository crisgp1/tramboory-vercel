"use client"

import React, { useState, useEffect } from "react"
import {
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  Tag,
  BarChart3,
  Eye,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'
import toast from "react-hot-toast"
import NordicTable from "@/components/ui/NordicTable"

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
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = () => {
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

    onSuccess(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Nivel de Precios' : 'Editar Nivel de Precios'}
      icon={Tag}
      size="lg"
      footer={
        <ModalFooter>
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
              loading={loading}
              variant="primary"
            >
              {mode === 'create' ? 'Crear Nivel' : 'Guardar Cambios'}
            </ModalButton>
          </ModalActions>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nombre del Nivel *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500"
        />
        
        <input
          type="text"
          placeholder="Descripción opcional del nivel"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Cantidad Mínima *"
            value={formData.minQuantity.toString()}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              minQuantity: parseInt(e.target.value) || 1
            }))}
            min="1"
            className="glass-input px-4 py-3 text-slate-800 placeholder-slate-500"
          />
          
          <input
            type="number"
            placeholder="Cantidad Máxima (opcional)"
            value={formData.maxQuantity?.toString() || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              maxQuantity: e.target.value ? parseInt(e.target.value) : undefined
            }))}
            min={formData.minQuantity + 1}
            className="glass-input px-4 py-3 text-slate-800 placeholder-slate-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <select
              value={formData.discountType}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                discountType: e.target.value as 'percentage' | 'fixed_amount'
              }))}
              className="glass-input w-full px-4 py-3 pr-8 text-slate-800 appearance-none cursor-pointer"
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed_amount">Monto Fijo ($)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
          
          <div className="relative">
            <input
              type="number"
              placeholder="Valor del Descuento *"
              value={formData.discountValue.toString()}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                discountValue: parseFloat(e.target.value) || 0
              }))}
              min="0.01"
              step="0.01"
              className="glass-input px-4 py-3 pr-12 text-slate-800 placeholder-slate-500"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              {formData.discountType === 'percentage' ? '%' : '$'}
            </span>
          </div>
        </div>
        
        <div>
          <input
            type="number"
            placeholder="Prioridad"
            value={formData.priority.toString()}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              priority: parseInt(e.target.value) || 1
            }))}
            min="1"
            className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500"
          />
          <p className="text-xs text-slate-500 mt-1">Orden de aplicación (menor número = mayor prioridad)</p>
        </div>
      </div>
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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    setIsModalOpen(true)
  }

  const handleEditTier = (tier: PricingTier) => {
    setSelectedTier(tier)
    setModalMode('edit')
    setIsModalOpen(true)
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

  const columns = [
    { key: "tier", label: "Nivel" },
    { key: "quantity", label: "Cantidad", width: "w-28", align: "center" as const },
    { key: "discount", label: "Descuento", width: "w-28", align: "center" as const },
    { key: "finalPrice", label: "Precio Final", width: "w-32", align: "right" as const },
    { key: "savings", label: "Ahorro", width: "w-28", align: "right" as const },
    { key: "status", label: "Estado", width: "w-24", align: "center" as const }
  ]

  const actions = [
    {
      key: "edit",
      label: "Editar",
      icon: <Edit3 className="w-4 h-4" />,
      color: "primary" as const,
      onClick: handleEditTier
    },
    {
      key: "delete",
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      color: "danger" as const,
      onClick: handleDeleteTier
    }
  ]

  const renderCell = (tier: PricingTier, columnKey: string) => {
    if (!productPricing) return null
    
    const discountedPrice = calculateDiscountedPrice(productPricing.basePrice, tier)
    const savings = productPricing.basePrice - discountedPrice
    const savingsPercentage = (savings / productPricing.basePrice) * 100

    switch (columnKey) {
      case "tier": {
        return (
          <div>
            <p className="font-medium text-gray-900">{tier.name}</p>
            {tier.description && (
              <p className="text-sm text-gray-500">{tier.description}</p>
            )}
            <p className="text-xs text-gray-400">Prioridad: {tier.priority}</p>
          </div>
        )
      }
      case "quantity": {
        return (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {getQuantityRange(tier)}
          </span>
        )
      }
      case "discount": {
        return (
          <span className="font-medium text-red-600">
            {tier.discountType === 'percentage' 
              ? `${tier.discountValue}%`
              : formatCurrency(tier.discountValue, productPricing.currency)
            }
          </span>
        )
      }
      case "finalPrice": {
        return (
          <span className="font-bold text-green-600">
            {formatCurrency(discountedPrice, productPricing.currency)}
          </span>
        )
      }
      case "savings": {
        return (
          <div>
            <p className="font-medium text-green-600">
              {formatCurrency(savings, productPricing.currency)}
            </p>
            <p className="text-xs text-gray-500">
              ({savingsPercentage.toFixed(1)}%)
            </p>
          </div>
        )
      }
      case "status": {
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            tier.isActive ? 'bg-green-100/80 text-green-800' : 'bg-gray-100/80 text-gray-800'
          }`}>
            {tier.isActive ? 'Activo' : 'Inactivo'}
          </span>
        )
      }
      default: {
        return null
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header glassmorphism */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestión de Precios Escalonados</h2>
            <p className="text-slate-600">Configura precios por volumen para productos</p>
          </div>
        </div>
      </div>

      {/* Product Selection glassmorphism */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="glass-input w-full px-4 py-3 pr-8 text-slate-800 appearance-none cursor-pointer"
            >
              <option value="">Elige un producto para configurar precios</option>
              {products.map((product, index) => (
                <option key={product._id || `product-${index}`} value={product._id}>
                  {product.name} ({product.sku}) - {formatCurrency(product.basePrice)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
          
          {selectedProduct && (
            <button
              onClick={handleCreateTier}
              className="glass-button px-6 py-3 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Nivel
            </button>
          )}
        </div>
      </div>

      {/* Product Pricing glassmorphism */}
      {productPricing && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100/80 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{productPricing.productName}</h3>
                  <p className="text-sm text-gray-600">
                    SKU: {productPricing.productSku} | 
                    Precio Base: {formatCurrency(productPricing.basePrice, productPricing.currency)}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100/80 text-blue-800">
                <BarChart3 className="w-3 h-3" />
                {productPricing.tiers.length} niveles
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Vista Desktop - Tabla Nordic */}
            <div className="hidden lg:block">
              {productPricing.tiers.length > 0 ? (
                <NordicTable
                  columns={columns}
                  data={productPricing.tiers}
                  renderCell={renderCell}
                  actions={actions}
                  loading={loading}
                  emptyMessage="No hay niveles de precios configurados"
                />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay niveles de precios configurados</p>
                  <button
                    onClick={handleCreateTier}
                    className="glass-button-secondary mt-3 px-4 py-2 flex items-center gap-2 text-sm font-medium mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Crear primer nivel
                  </button>
                </div>
              )}
            </div>

            {/* Vista Mobile - Cards */}
            <div className="lg:hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner label="Cargando niveles..." />
                </div>
              ) : productPricing.tiers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay niveles de precios configurados</p>
                  <button
                    onClick={handleCreateTier}
                    className="glass-button-secondary mt-3 px-4 py-2 flex items-center gap-2 text-sm font-medium mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Crear primer nivel
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {productPricing.tiers.map((tier) => {
                    const discountedPrice = calculateDiscountedPrice(productPricing.basePrice, tier)
                    const savings = productPricing.basePrice - discountedPrice
                    const savingsPercentage = (savings / productPricing.basePrice) * 100
                    
                    return (
                      <div key={tier._id} className="glass-card p-4 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-gray-900">{tier.name}</p>
                              {tier.description && (
                                <p className="text-sm text-gray-500">{tier.description}</p>
                              )}
                              <p className="text-xs text-gray-400">Prioridad: {tier.priority}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              tier.isActive ? 'bg-green-100/80 text-green-800' : 'bg-gray-100/80 text-gray-800'
                            }`}>
                              {tier.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</p>
                              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                                {getQuantityRange(tier)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Descuento</p>
                              <p className="font-medium text-red-600">
                                {tier.discountType === 'percentage' 
                                  ? `${tier.discountValue}%`
                                  : formatCurrency(tier.discountValue, productPricing.currency)
                                }
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Final</p>
                              <p className="font-bold text-green-600">
                                {formatCurrency(discountedPrice, productPricing.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Ahorro</p>
                              <div>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(savings, productPricing.currency)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ({savingsPercentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTier(tier)}
                              className="glass-button flex-1 px-3 py-2 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <Edit3 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTier(tier)}
                              className="glass-button-icon p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <PricingTierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tier={selectedTier}
        mode={modalMode}
        onSuccess={handleTierSuccess}
        existingTiers={productPricing?.tiers || []}
      />
    </div>
  )
}