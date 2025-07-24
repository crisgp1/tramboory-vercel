"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react'
import toast from "react-hot-toast"
import InitiateMovementModal from "@/components/inventory/stock/InitiateMovementModal"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  base_unit?: string
  units?: {
    base?: {
      code: string
      name: string
    }
  }
}

interface ProductsWithoutMovementsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ProductsWithoutMovementsModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ProductsWithoutMovementsModalProps) {
  const [productsWithoutMovements, setProductsWithoutMovements] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProductsWithoutMovements()
    }
  }, [isOpen])

  const fetchProductsWithoutMovements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/products?withoutMovements=true')
      if (response.ok) {
        const data = await response.json()
        setProductsWithoutMovements(data.products || [])
      } else {
        toast.error("Error al cargar productos sin movimientos")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al cargar productos sin movimientos")
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateMovement = (product: Product) => {
    setSelectedProduct(product)
    setIsInitiateModalOpen(true)
  }

  const handleMovementSuccess = () => {
    // Refrescar la lista de productos sin movimientos
    fetchProductsWithoutMovements()
    // Llamar al callback de éxito si se proporciona
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleClose = () => {
    setProductsWithoutMovements([])
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{
        background: 'rgba(248, 250, 252, 0.85)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        transform: 'none',
        zoom: 1
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Productos sin Movimientos de Inventario
              </h3>
              <p className="text-sm text-gray-600">
                {productsWithoutMovements.length} productos encontrados
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-gray-600">Cargando productos...</span>
              </div>
            </div>
          ) : productsWithoutMovements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Excelente!
              </h3>
              <p className="text-gray-600">
                Todos tus productos tienen movimientos de inventario registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-800">
                      Productos que requieren configuración inicial
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Estos productos no tienen movimientos de inventario registrados. 
                      Haz clic en "Iniciar Movimientos" para configurar el stock inicial.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="bg-white border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div>PRODUCTO</div>
                    <div>SKU</div>
                    <div>CATEGORÍA</div>
                    <div>UNIDAD BASE</div>
                    <div>ACCIONES</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {productsWithoutMovements.map((product) => (
                    <div key={product._id} className="grid grid-cols-5 gap-4 px-6 py-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.sku}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{product.category}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          {product.units?.base?.name || product.base_unit || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => handleInitiateMovement(product)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Iniciar Movimientos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div></div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              
              {productsWithoutMovements.length > 0 && (
                <button
                  onClick={fetchProductsWithoutMovements}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar Lista
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Use createPortal to render the modal outside the current DOM tree
  return (
    <>
      {typeof document !== 'undefined' 
        ? createPortal(modalContent, document.body)
        : null}

      {/* Modal para iniciar movimiento */}
      {selectedProduct && (
        <InitiateMovementModal
          isOpen={isInitiateModalOpen}
          onClose={() => setIsInitiateModalOpen(false)}
          product={selectedProduct as any}
          onSuccess={handleMovementSuccess}
        />
      )}
    </>
  )
}