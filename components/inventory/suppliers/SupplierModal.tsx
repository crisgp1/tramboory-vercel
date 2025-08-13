"use client"

import React, { useState, useEffect } from "react"
import {
  IconBuilding,
  IconUser,
  IconMail,
  IconPhone,
  IconCurrencyDollar,
  IconCalendar,
  IconStar,
  IconAlertTriangle
} from '@tabler/icons-react'
import toast from "react-hot-toast"
import { Modal, Stack, Card, TextInput, Textarea, Select, Checkbox, Button, Group, Text, Title, NumberInput } from '@mantine/core'

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
      opened={isOpen}
      onClose={onClose}
      title={
        <Stack gap="xs">
          <Title order={3}>{getTitle()}</Title>
          {getSubtitle() && <Text c="dimmed" size="sm">{getSubtitle()}</Text>}
        </Stack>
      }
      size="xl"
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
      <Stack gap="lg">
        
        {/* Información básica */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconUser size={20} />
              Información Básica
            </Group>
          </Title>
            
          <Stack gap="md">
            <TextInput
              label="Nombre del Proveedor"
              placeholder="Nombre del Proveedor *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.currentTarget.value)}
              readOnly={isReadOnly}
              leftSection={<IconBuilding size={16} />}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
              <TextInput
                label="Código del Proveedor"
                placeholder="Código del Proveedor *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.currentTarget.value)}
                readOnly={isReadOnly}
                leftSection={<IconBuilding size={16} />}
                required
              />

              <Checkbox
                label="Proveedor Activo"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.currentTarget.checked)}
                disabled={isReadOnly}
                style={{ alignSelf: 'flex-end' }}
              />
            </div>

            <Textarea
              label="Descripción"
              placeholder="Descripción del proveedor..."
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.currentTarget.value)}
              rows={2}
              readOnly={isReadOnly}
            />

            <Select
              label="Usuario Proveedor (Opcional)"
              placeholder="Seleccionar usuario proveedor (opcional)"
              value={formData.userId || ''}
              onChange={(value) => handleInputChange('userId', value)}
              disabled={isReadOnly || loadingUsers}
              data={providerUsers.map((user) => ({
                value: user.id,
                label: `${user.fullName} - ${user.email}`
              }))}
              leftSection={<IconUser size={16} />}
            />
            {!isReadOnly && (
              <Text size="xs" c="dimmed">
                Vincula este proveedor con un usuario existente para darle acceso al portal
              </Text>
            )}
          </Stack>
        </Card>

        {/* Calificación General */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconStar size={20} />
              Calificación
            </Group>
          </Title>
            
          <Stack align="center" mb="lg">
            <Text size="xl" fw={700}>
              {getOverallRating()}
            </Text>
            <Text size="sm" c="dimmed">de 5.0</Text>
            <Group gap="xs">
              {[1, 2, 3, 4, 5].map((star) => (
                <IconStar
                  key={star}
                  size={16}
                  style={{
                    color: star <= Math.round(getOverallRating()) ? '#ffc107' : '#e9ecef',
                    fill: star <= Math.round(getOverallRating()) ? '#ffc107' : 'none'
                  }}
                />
              ))}
            </Group>
          </Stack>

          <Stack gap="md">
            {[
              { key: 'quality', label: 'Calidad' },
              { key: 'delivery', label: 'Entrega' },
              { key: 'service', label: 'Servicio' },
              { key: 'price', label: 'Precio' }
            ].map(({ key, label }) => (
              <Group key={key} justify="space-between">
                <Text size="sm" fw={500}>{label}</Text>
                <Group gap="xs">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="transparent"
                      size="xs"
                      p={0}
                      onClick={() => !isReadOnly && handleNestedInputChange('rating', key, star)}
                      disabled={isReadOnly}
                      style={{ cursor: !isReadOnly ? 'pointer' : 'default' }}
                    >
                      <IconStar
                        size={14}
                        style={{
                          color: star <= (formData.rating?.[key as keyof typeof formData.rating] || 0) ? '#ffc107' : '#e9ecef',
                          fill: star <= (formData.rating?.[key as keyof typeof formData.rating] || 0) ? '#ffc107' : 'none'
                        }}
                      />
                    </Button>
                  ))}
                </Group>
              </Group>
            ))}
          </Stack>
        </Card>

        {/* Información de contacto */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconMail size={20} />
              Información de Contacto
            </Group>
          </Title>
            
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
            <TextInput
              label="Email"
              type="email"
              placeholder="contacto@proveedor.com"
              value={formData.contactInfo?.email || ''}
              onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.currentTarget.value)}
              readOnly={isReadOnly}
              leftSection={<IconMail size={16} />}
              required
            />
            
            <TextInput
              label="Teléfono"
              type="tel"
              placeholder="+52 55 1234 5678"
              value={formData.contactInfo?.phone || ''}
              onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.currentTarget.value)}
              readOnly={isReadOnly}
              leftSection={<IconPhone size={16} />}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
            <TextInput
              label="Persona de Contacto"
              placeholder="Nombre del contacto principal"
              value={formData.contactInfo?.contactPerson || ''}
              onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', e.currentTarget.value)}
              readOnly={isReadOnly}
              leftSection={<IconUser size={16} />}
            />
          </div>

          <Textarea
            label="Dirección"
            placeholder="Dirección completa del proveedor..."
            value={formData.contactInfo?.address || ''}
            onChange={(e) => handleNestedInputChange('contactInfo', 'address', e.currentTarget.value)}
            rows={2}
            readOnly={isReadOnly}
          />
        </Card>

        {/* Términos de pago */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconCurrencyDollar size={20} />
              Términos de Pago
            </Group>
          </Title>
            
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
            <NumberInput
              label="Días de Crédito"
              placeholder="30"
              value={formData.paymentTerms.creditDays}
              onChange={(value) => handleNestedInputChange('paymentTerms', 'creditDays', value || 0)}
              readOnly={isReadOnly}
              leftSection={<IconCalendar size={16} />}
              suffix=" días"
            />
            
            <Select
              label="Método de Pago"
              value={formData.paymentTerms.paymentMethod}
              onChange={(value) => handleNestedInputChange('paymentTerms', 'paymentMethod', value)}
              disabled={isReadOnly}
              data={[
                { value: 'cash', label: 'Efectivo' },
                { value: 'credit', label: 'Crédito' },
                { value: 'transfer', label: 'Transferencia' },
                { value: 'check', label: 'Cheque' }
              ]}
            />

            <TextInput
              label="Moneda"
              placeholder="MXN"
              value={formData.paymentTerms.currency}
              onChange={(e) => handleNestedInputChange('paymentTerms', 'currency', e.currentTarget.value)}
              readOnly={isReadOnly}
              leftSection={<IconCurrencyDollar size={16} />}
            />
          </div>

          <TextInput
            label="Términos de Descuento"
            placeholder="Ej: 2% por pago anticipado"
            value={formData.paymentTerms.discountTerms || ''}
            onChange={(e) => handleNestedInputChange('paymentTerms', 'discountTerms', e.currentTarget.value)}
            readOnly={isReadOnly}
          />
        </Card>

        {/* Estadísticas (solo en modo view) */}
        {mode === 'view' && supplier && (
          <>
            <Card withBorder p="lg">
              <Title order={4} mb="md">
                <Group gap="xs">
                  <IconStar size={20} />
                  Estadísticas
                </Group>
              </Title>
                
              <Stack gap="md">
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">Total de Órdenes</Text>
                  <Text size="xl" fw={700} c="blue">{supplier.totalOrders || 0}</Text>
                </Card>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">Total Gastado</Text>
                  <Text size="xl" fw={700} c="green">{formatCurrency(supplier.totalSpent || 0)}</Text>
                </Card>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">Última Orden</Text>
                  <Text fw={600}>
                    {supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : 'Sin órdenes'}
                  </Text>
                </Card>
              </Stack>
            </Card>
            
            {/* Información de Penalizaciones */}
            {supplier.penaltyData && (
              <Card withBorder p="lg">
                <Title order={4} mb="md">
                  <Group gap="xs">
                    <IconAlertTriangle size={20} />
                    Penalizaciones
                  </Group>
                </Title>
                  
                <Stack gap="md">
                  <Card withBorder p="md" 
                    style={{
                      backgroundColor: 
                        supplier.penaltyData.totalPoints > 50 ? '#fef2f2' :
                        supplier.penaltyData.totalPoints > 30 ? '#fff7ed' :
                        supplier.penaltyData.totalPoints > 0 ? '#fefce8' :
                        '#f0fdf4'
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs">Puntos Totales</Text>
                    <Text size="xl" fw={700} c={
                      supplier.penaltyData.totalPoints > 50 ? 'red' :
                      supplier.penaltyData.totalPoints > 30 ? 'orange' :
                      supplier.penaltyData.totalPoints > 0 ? 'yellow' :
                      'green'
                    }>
                      {supplier.penaltyData.totalPoints} pts
                    </Text>
                  </Card>
                  
                  <Card withBorder p="md">
                    <Text size="sm" c="dimmed" mb="xs">Penalizaciones Activas</Text>
                    <Text size="xl" fw={700}>{supplier.penaltyData.activePenalties}</Text>
                  </Card>
                  
                  {supplier.penaltyData.lastPenaltyDate && (
                    <Card withBorder p="md">
                      <Text size="sm" c="dimmed" mb="xs">Última Penalización</Text>
                      <Text fw={600}>
                        {formatDate(supplier.penaltyData.lastPenaltyDate)}
                      </Text>
                    </Card>
                  )}
                  
                  <Card withBorder p="md" ta="center" 
                    style={{
                      backgroundColor: 
                        supplier.penaltyData.totalPoints > 50 ? '#fef2f2' :
                        supplier.penaltyData.totalPoints > 30 ? '#fff7ed' :
                        supplier.penaltyData.totalPoints > 0 ? '#fefce8' :
                        '#f0fdf4'
                    }}
                  >
                    <Text fw={500} c={
                      supplier.penaltyData.totalPoints > 50 ? 'red' :
                      supplier.penaltyData.totalPoints > 30 ? 'orange' :
                      supplier.penaltyData.totalPoints > 0 ? 'yellow' :
                      'green'
                    }>
                      {supplier.penaltyData.totalPoints > 50 ? 'Riesgo Alto' :
                       supplier.penaltyData.totalPoints > 30 ? 'Riesgo Medio' :
                       supplier.penaltyData.totalPoints > 0 ? 'Riesgo Bajo' :
                       'Sin Riesgo'}
                    </Text>
                  </Card>
                </Stack>
              </Card>
            )}
          </>
        )}

        {/* Footer Buttons */}
        <Group justify="space-between" pt="lg">
          <div></div>
          
          <Group>
            <Button
              variant="default"
              onClick={onClose}
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.code || !formData.contactInfo?.email}
                loading={loading}
              >
                {mode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}