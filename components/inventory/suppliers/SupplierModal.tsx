"use client"

import React, { useState, useEffect } from "react"
import {
  BuildingOffice2Icon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  StarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from "react-hot-toast"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

interface Supplier {
  _id?: string
  name: string
  code: string
  description?: string
  userId?: string
  contactInfo: {
    email: string
    phone: string
    address: string
    contactPerson?: string
  }
  paymentTerms: {
    creditDays: number
    paymentMethod?: string
    currency: string
    discountTerms?: string
  }
  rating: {
    quality: number
    delivery: number
    service: number
    price: number
  }
  isActive: boolean
  totalOrders?: number
  totalSpent?: number
  lastOrderDate?: string
  createdAt?: string
  penaltyData?: {
    totalPoints: number
    activePenalties: number
    lastPenaltyDate?: string
  }
}

interface ProviderUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

export default function SupplierModal({ isOpen, onClose, supplier, mode, onSuccess }: SupplierModalProps) {
  const [formData, setFormData] = useState<Supplier>({
    name: '',
    code: '',
    description: '',
    userId: '',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      contactPerson: ''
    },
    paymentTerms: {
      creditDays: 30,
      paymentMethod: 'cash',
      currency: 'MXN',
      discountTerms: ''
    },
    rating: {
      quality: 5,
      delivery: 5,
      service: 5,
      price: 5
    },
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [providerUsers, setProviderUsers] = useState<ProviderUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (supplier && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        description: supplier.description || '',
        userId: supplier.userId || '',
        contactInfo: {
          email: supplier.contactInfo?.email || '',
          phone: supplier.contactInfo?.phone || '',
          address: supplier.contactInfo?.address || '',
          contactPerson: supplier.contactInfo?.contactPerson || ''
        },
        paymentTerms: {
          creditDays: supplier.paymentTerms?.creditDays || 30,
          paymentMethod: supplier.paymentTerms?.paymentMethod || 'cash',
          currency: supplier.paymentTerms?.currency || 'MXN',
          discountTerms: supplier.paymentTerms?.discountTerms || ''
        },
        rating: {
          quality: supplier.rating?.quality || 5,
          delivery: supplier.rating?.delivery || 5,
          service: supplier.rating?.service || 5,
          price: supplier.rating?.price || 5
        },
        isActive: supplier.isActive !== undefined ? supplier.isActive : true
      })
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        userId: '',
        contactInfo: {
          email: '',
          phone: '',
          address: '',
          contactPerson: ''
        },
        paymentTerms: {
          creditDays: 30,
          paymentMethod: 'cash',
          currency: 'MXN',
          discountTerms: ''
        },
        rating: {
          quality: 5,
          delivery: 5,
          service: 5,
          price: 5
        },
        isActive: true
      })
    }
  }, [supplier, mode, isOpen])

  useEffect(() => {
    if (isOpen && mode !== 'view') {
      fetchProviderUsers()
    }
  }, [isOpen, mode])

  const fetchProviderUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users/providers')
      if (response.ok) {
        const data = await response.json()
        setProviderUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching provider users:', error)
      toast.error('Error al cargar usuarios proveedores')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.contactInfo?.email) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/suppliers'
        : `/api/inventory/suppliers/${supplier?._id}`
      
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
            ? "Proveedor creado exitosamente" 
            : "Proveedor actualizado exitosamente"
        )
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        toast.error(error.error || error.message || "Error al guardar el proveedor")
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
        ...(prev[parent as keyof Supplier] as any) || {},
        [field]: value
      }
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  const getOverallRating = () => {
    if (!formData.rating) return 0
    const { quality, delivery, service, price } = formData.rating
    return Math.round(((quality + delivery + service + price) / 4) * 100) / 100
  }

  const isReadOnly = mode === 'view'

  const getTitle = () => {
    if (mode === 'create') return 'Crear Nuevo Proveedor'
    if (mode === 'edit') return 'Editar Proveedor'
    return 'Detalles del Proveedor'
  }

  const getSubtitle = () => {
    if (supplier && mode !== 'create') {
      return `ID: ${supplier._id?.slice(-6).toUpperCase()} • ${supplier.isActive ? 'Activo' : 'Inactivo'}`
    }
    return undefined
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={BuildingOffice2Icon}
      size="lg"
      footer={
        <ModalFooter>
          <div></div>
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
                disabled={loading || !formData.name || !formData.code || !formData.contactInfo?.email}
                loading={loading}
                variant="primary"
              >
                {mode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
              </ModalButton>
            )}
          </ModalActions>
        </ModalFooter>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Información básica */}
        <div className="glass-card p-6 lg:col-span-1 xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información Básica</h4>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <div className="relative">
                <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  placeholder="Nombre del Proveedor *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  placeholder="Código del Proveedor *"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Proveedor Activo
              </label>
            </div>

            <div className="sm:col-span-2">
              <textarea
                placeholder="Descripción del proveedor..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none ${isReadOnly ? 'opacity-60' : ''}`}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <select
                  value={formData.userId || ''}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  disabled={isReadOnly || loadingUsers}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 appearance-none cursor-pointer ${isReadOnly || loadingUsers ? 'opacity-60' : ''}`}
                >
                  <option value="">Seleccionar usuario proveedor (opcional)</option>
                  {providerUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.email}
                    </option>
                  ))}
                </select>
              </div>
              {!isReadOnly && (
                <p className="text-xs text-slate-500 mt-2">
                  Vincula este proveedor con un usuario existente para darle acceso al portal
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Calificación General */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <StarIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Calificación</h4>
          </div>
            
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-slate-800 mb-2">
              {getOverallRating()}
            </div>
            <div className="text-sm text-slate-600 mb-3">de 5.0</div>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarSolidIcon
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(getOverallRating()) ? 'text-yellow-400' : 'text-slate-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'quality', label: 'Calidad' },
              { key: 'delivery', label: 'Entrega' },
              { key: 'service', label: 'Servicio' },
              { key: 'price', label: 'Precio' }
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">{label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => !isReadOnly && handleNestedInputChange('rating', key, star)}
                      disabled={isReadOnly}
                      className={`${!isReadOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                      {star <= (formData.rating?.[key as keyof typeof formData.rating] || 0) ? (
                        <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="glass-card p-6 lg:col-span-2 xl:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información de Contacto</h4>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="email"
                  placeholder="contacto@proveedor.com"
                  value={formData.contactInfo?.email || ''}
                  onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teléfono
              </label>
              <div className="relative">
                <PhoneIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={formData.contactInfo?.phone || ''}
                  onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Persona de Contacto
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  placeholder="Nombre del contacto principal"
                  value={formData.contactInfo?.contactPerson || ''}
                  onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dirección
              </label>
              <textarea
                placeholder="Dirección completa del proveedor..."
                value={formData.contactInfo?.address || ''}
                onChange={(e) => handleNestedInputChange('contactInfo', 'address', e.target.value)}
                rows={1}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none ${isReadOnly ? 'opacity-60' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Términos de pago */}
        <div className="glass-card p-6 lg:col-span-2 xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Términos de Pago</h4>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Días de Crédito
              </label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="number"
                  placeholder="30"
                  value={formData.paymentTerms.creditDays.toString()}
                  onChange={(e) => handleNestedInputChange('paymentTerms', 'creditDays', parseInt(e.target.value) || 0)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-16 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
                <span className="text-slate-400 text-sm absolute right-3 top-1/2 transform -translate-y-1/2">días</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.paymentTerms.paymentMethod}
                onChange={(e) => handleNestedInputChange('paymentTerms', 'paymentMethod', e.target.value)}
                disabled={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${isReadOnly ? 'opacity-60' : ''}`}
              >
                <option value="cash">Efectivo</option>
                <option value="credit">Crédito</option>
                <option value="transfer">Transferencia</option>
                <option value="check">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Moneda
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  placeholder="MXN"
                  value={formData.paymentTerms.currency}
                  onChange={(e) => handleNestedInputChange('paymentTerms', 'currency', e.target.value)}
                  readOnly={isReadOnly}
                  className={`glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Términos de Descuento
              </label>
              <input
                type="text"
                placeholder="Ej: 2% por pago anticipado"
                value={formData.paymentTerms.discountTerms || ''}
                onChange={(e) => handleNestedInputChange('paymentTerms', 'discountTerms', e.target.value)}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 ${isReadOnly ? 'opacity-60' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Estadísticas (solo en modo view) */}
        {mode === 'view' && supplier && (
          <>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-800">Estadísticas</h4>
              </div>
                
              <div className="space-y-4">
                <div className="glass-stat p-4">
                  <span className="text-slate-600 block text-sm mb-2 font-medium">Total de Órdenes</span>
                  <p className="font-bold text-blue-600 text-xl">{supplier.totalOrders || 0}</p>
                </div>
                <div className="glass-stat p-4">
                  <span className="text-slate-600 block text-sm mb-2 font-medium">Total Gastado</span>
                  <p className="font-bold text-green-600 text-xl">{formatCurrency(supplier.totalSpent || 0)}</p>
                </div>
                <div className="glass-stat p-4">
                  <span className="text-slate-600 block text-sm mb-2 font-medium">Última Orden</span>
                  <p className="font-semibold text-slate-800">
                    {supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : 'Sin órdenes'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Información de Penalizaciones */}
            {supplier.penaltyData && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800">Penalizaciones</h4>
                </div>
                  
                <div className="space-y-4">
                  <div className={`glass-stat p-4 ${
                    supplier.penaltyData.totalPoints > 50 ? 'bg-red-50/80' :
                    supplier.penaltyData.totalPoints > 30 ? 'bg-orange-50/80' :
                    supplier.penaltyData.totalPoints > 0 ? 'bg-yellow-50/80' :
                    'bg-green-50/80'
                  }`}>
                    <span className="text-slate-600 block text-sm mb-2 font-medium">Puntos Totales</span>
                    <p className={`font-bold text-xl ${
                      supplier.penaltyData.totalPoints > 50 ? 'text-red-600' :
                      supplier.penaltyData.totalPoints > 30 ? 'text-orange-600' :
                      supplier.penaltyData.totalPoints > 0 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {supplier.penaltyData.totalPoints} pts
                    </p>
                  </div>
                  
                  <div className="glass-stat p-4">
                    <span className="text-slate-600 block text-sm mb-2 font-medium">Penalizaciones Activas</span>
                    <p className="font-bold text-slate-800 text-xl">{supplier.penaltyData.activePenalties}</p>
                  </div>
                  
                  {supplier.penaltyData.lastPenaltyDate && (
                    <div className="glass-stat p-4">
                      <span className="text-slate-600 block text-sm mb-2 font-medium">Última Penalización</span>
                      <p className="font-semibold text-slate-800">
                        {formatDate(supplier.penaltyData.lastPenaltyDate)}
                      </p>
                    </div>
                  )}
                  
                  <div className={`text-center py-3 px-4 rounded-xl text-sm font-medium ${
                    supplier.penaltyData.totalPoints > 50 ? 'bg-red-100/80 text-red-800' :
                    supplier.penaltyData.totalPoints > 30 ? 'bg-orange-100/80 text-orange-800' :
                    supplier.penaltyData.totalPoints > 0 ? 'bg-yellow-100/80 text-yellow-800' :
                    'bg-green-100/80 text-green-800'
                  }`}>
                    {supplier.penaltyData.totalPoints > 50 ? 'Riesgo Alto' :
                     supplier.penaltyData.totalPoints > 30 ? 'Riesgo Medio' :
                     supplier.penaltyData.totalPoints > 0 ? 'Riesgo Bajo' :
                     'Sin Riesgo'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}