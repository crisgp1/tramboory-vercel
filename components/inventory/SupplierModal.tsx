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
  Textarea,
  Switch,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Avatar
} from "@heroui/react"
import {
  BuildingOffice2Icon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  StarIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from "react-hot-toast"

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
  // Campos de penalizaciones
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
      setFormData(supplier)
    } else {
      // Reset form for create mode
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
    if (!formData.name || !formData.code || !formData.contactInfo.email) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/suppliers'
        : `/api/inventory/suppliers/${supplier?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      console.log('🔄 SupplierModal submit:', {
        mode,
        url,
        method,
        supplierId: supplier?._id,
        isUserFormat: supplier?._id?.startsWith('user_')
      })

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
        ...prev[parent as keyof Supplier] as any,
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

  const renderStars = (category: 'quality' | 'delivery' | 'service' | 'price', rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && handleNestedInputChange('rating', category, star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            {star <= rating ? (
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
      </div>
    )
  }

  const getOverallRating = () => {
    const { quality, delivery, service, price } = formData.rating
    return Math.round(((quality + delivery + service + price) / 4) * 100) / 100
  }

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
                <BuildingOffice2Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {mode === 'create' && 'Crear Nuevo Proveedor'}
                  {mode === 'edit' && 'Editar Proveedor'}
                  {mode === 'view' && 'Detalles del Proveedor'}
                </h3>
                {supplier && mode !== 'create' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      color={supplier.isActive ? "success" : "danger"}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {supplier.isActive ? "Activo" : "Inactivo"}
                    </Chip>
                    <span className="text-sm text-gray-500">
                      ID: {supplier._id?.slice(-6).toUpperCase()}
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

        <ModalBody className="p-4 sm:p-6">
          {/* Layout responsivo con CSS Grid para desktop y Flexbox para móvil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Información básica - Ocupa 2 columnas en XL */}
            <Card className="border border-gray-200 lg:col-span-1 xl:col-span-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Información Básica</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Nombre del Proveedor *"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      startContent={<BuildingOffice2Icon className="w-4 h-4 text-gray-400" />}
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
                      placeholder="Código del Proveedor *"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      startContent={<BuildingOffice2Icon className="w-4 h-4 text-gray-400" />}
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
                      Proveedor Activo
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <Textarea
                      placeholder="Descripción del proveedor..."
                      value={formData.description || ''}
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

                  {/* Selección de Usuario Proveedor */}
                  <div className="sm:col-span-2">
                    <Select
                      placeholder="Seleccionar usuario proveedor (opcional)"
                      selectedKeys={formData.userId ? [formData.userId] : []}
                      onSelectionChange={(keys) => {
                        const userId = Array.from(keys)[0] as string
                        handleInputChange('userId', userId || '')
                      }}
                      variant="flat"
                      isDisabled={isReadOnly || loadingUsers}
                      startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                      classNames={{
                        trigger: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-gray-900'}`,
                        value: "text-gray-900",
                        popoverContent: "bg-white border border-gray-200"
                      }}
                    >
                      {providerUsers.map((user) => (
                        <SelectItem
                          key={user.id}
                          startContent={
                            <Avatar
                              src={user.imageUrl}
                              name={user.fullName}
                              size="sm"
                              className="w-6 h-6"
                            />
                          }
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.fullName}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                    {!isReadOnly && (
                      <p className="text-xs text-gray-500 mt-1">
                        Vincula este proveedor con un usuario existente para darle acceso al portal
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Calificación General - Panel lateral */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <StarIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Calificación</h4>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {getOverallRating()}
                  </div>
                  <div className="text-sm text-gray-600">de 5.0</div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(getOverallRating()) ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Calidad</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !isReadOnly && handleNestedInputChange('rating', 'quality', star)}
                          disabled={isReadOnly}
                          className={`${!isReadOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                          {star <= formData.rating.quality ? (
                            <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Entrega</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !isReadOnly && handleNestedInputChange('rating', 'delivery', star)}
                          disabled={isReadOnly}
                          className={`${!isReadOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                          {star <= formData.rating.delivery ? (
                            <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Servicio</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !isReadOnly && handleNestedInputChange('rating', 'service', star)}
                          disabled={isReadOnly}
                          className={`${!isReadOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                          {star <= formData.rating.service ? (
                            <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Precio</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !isReadOnly && handleNestedInputChange('rating', 'price', star)}
                          disabled={isReadOnly}
                          className={`${!isReadOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                          {star <= formData.rating.price ? (
                            <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Información de contacto - Ocupa toda la fila */}
            <Card className="border border-gray-200 lg:col-span-2 xl:col-span-3">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Información de Contacto</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="contacto@proveedor.com"
                      value={formData.contactInfo.email}
                      onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.target.value)}
                      startContent={<EnvelopeIcon className="w-4 h-4 text-gray-400" />}
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
                      Teléfono
                    </label>
                    <Input
                      placeholder="+52 55 1234 5678"
                      value={formData.contactInfo.phone}
                      onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.target.value)}
                      startContent={<PhoneIcon className="w-4 h-4 text-gray-400" />}
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
                      Persona de Contacto
                    </label>
                    <Input
                      placeholder="Nombre del contacto principal"
                      value={formData.contactInfo.contactPerson || ''}
                      onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', e.target.value)}
                      startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <Textarea
                      placeholder="Dirección completa del proveedor..."
                      value={formData.contactInfo.address}
                      onChange={(e) => handleNestedInputChange('contactInfo', 'address', e.target.value)}
                      minRows={1}
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

            {/* Términos de pago - Ocupa 2 columnas */}
            <Card className="border border-gray-200 lg:col-span-2 xl:col-span-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Términos de Pago</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Crédito
                    </label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.paymentTerms.creditDays.toString()}
                      onChange={(e) => handleNestedInputChange('paymentTerms', 'creditDays', parseInt(e.target.value) || 0)}
                      startContent={<CalendarDaysIcon className="w-4 h-4 text-gray-400" />}
                      endContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">días</span>
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
                      Método de Pago
                    </label>
                    <select
                      value={formData.paymentTerms.paymentMethod}
                      onChange={(e) => handleNestedInputChange('paymentTerms', 'paymentMethod', e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 rounded-lg border-0 ${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-gray-900'} text-gray-900`}
                    >
                      <option value="cash">Efectivo</option>
                      <option value="credit">Crédito</option>
                      <option value="transfer">Transferencia</option>
                      <option value="check">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <Input
                      placeholder="MXN"
                      value={formData.paymentTerms.currency}
                      onChange={(e) => handleNestedInputChange('paymentTerms', 'currency', e.target.value)}
                      startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                      variant="flat"
                      isReadOnly={isReadOnly}
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Términos de Descuento
                    </label>
                    <Input
                      placeholder="Ej: 2% por pago anticipado"
                      value={formData.paymentTerms.discountTerms || ''}
                      onChange={(e) => handleNestedInputChange('paymentTerms', 'discountTerms', e.target.value)}
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

            {/* Estadísticas (solo en modo view) */}
            {mode === 'view' && supplier && (
              <>
                <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <StarIcon className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Estadísticas</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block text-xs mb-1">Total de Órdenes</span>
                        <p className="font-bold text-blue-600 text-lg">{supplier.totalOrders || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block text-xs mb-1">Total Gastado</span>
                        <p className="font-bold text-green-600 text-lg">{formatCurrency(supplier.totalSpent || 0)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block text-xs mb-1">Última Orden</span>
                        <p className="font-medium text-gray-900 text-sm">
                          {supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : 'Sin órdenes'}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                {/* Información de Penalizaciones */}
                {supplier.penaltyData && (
                  <Card className="border border-gray-200">
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                        <h4 className="font-medium text-gray-900">Penalizaciones</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg border ${
                          supplier.penaltyData.totalPoints > 50 ? 'bg-red-50 border-red-200' :
                          supplier.penaltyData.totalPoints > 30 ? 'bg-orange-50 border-orange-200' :
                          supplier.penaltyData.totalPoints > 0 ? 'bg-yellow-50 border-yellow-200' :
                          'bg-green-50 border-green-200'
                        }`}>
                          <span className="text-gray-600 block text-xs mb-1">Puntos Totales</span>
                          <p className={`font-bold text-lg ${
                            supplier.penaltyData.totalPoints > 50 ? 'text-red-600' :
                            supplier.penaltyData.totalPoints > 30 ? 'text-orange-600' :
                            supplier.penaltyData.totalPoints > 0 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {supplier.penaltyData.totalPoints} pts
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-600 block text-xs mb-1">Penalizaciones Activas</span>
                          <p className="font-bold text-gray-900">{supplier.penaltyData.activePenalties}</p>
                        </div>
                        
                        {supplier.penaltyData.lastPenaltyDate && (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="text-gray-600 block text-xs mb-1">Última Penalización</span>
                            <p className="font-medium text-gray-900 text-sm">
                              {formatDate(supplier.penaltyData.lastPenaltyDate)}
                            </p>
                          </div>
                        )}
                        
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            supplier.penaltyData.totalPoints > 50 ? 'danger' :
                            supplier.penaltyData.totalPoints > 30 ? 'warning' :
                            supplier.penaltyData.totalPoints > 0 ? 'default' :
                            'success'
                          }
                          className="w-full text-center"
                        >
                          {supplier.penaltyData.totalPoints > 50 ? 'Riesgo Alto' :
                           supplier.penaltyData.totalPoints > 30 ? 'Riesgo Medio' :
                           supplier.penaltyData.totalPoints > 0 ? 'Riesgo Bajo' :
                           'Sin Riesgo'}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
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
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={loading}
                  isDisabled={!formData.name || !formData.code || !formData.contactInfo.email}
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  startContent={!loading && (mode === 'create' ? <PlusIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />)}
                >
                  {loading ? (mode === 'create' ? 'Creando...' : 'Actualizando...') : (mode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor')}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}