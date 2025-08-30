'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button, TextInput, Textarea, Switch, Group, Text, Tabs, Stack, ActionIcon, Divider, Select } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPhone, IconMail, IconMapPin, IconClock, IconTrash, IconPlus, IconBrandWhatsapp, IconBrandInstagram, IconBrandFacebook, IconDeviceFloppy, IconCreditCard, IconDiscount } from '@tabler/icons-react'

interface ContactSettings {
  _id?: string
  businessName: string
  tagline: string
  phones: { number: string; label: string; isPrimary: boolean }[]
  emails: { email: string; label: string; isPrimary: boolean }[]
  whatsapp: {
    number: string
    message: string
    enabled: boolean
  }
  address: {
    street: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    references: string[]
  }
  schedules: {
    day: string
    isOpen: boolean
    openTime: string
    closeTime: string
    notes?: string
  }[]
  socialMedia: {
    facebook?: string
    instagram?: string
    tiktok?: string
    youtube?: string
  }
  maps: {
    googleMaps: string
    waze: string
    embedUrl?: string
  }
  bankingInfo?: {
    bankName: string
    accountHolder: string
    clabe: string
    accountNumber?: string
    paymentAddress: string
    paymentInstructions: string
    enabled: boolean
  }
  discountSettings?: {
    cashDiscount: {
      enabled: boolean
      percentage: number
      description: string
      appliesTo: string
    }
  }
}

const DAYS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
]

export function ContactSettingsManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<ContactSettings>({
    initialValues: {
      businessName: 'Tramboory',
      tagline: 'El mejor salón de fiestas infantiles en Zapopan',
      phones: [{ number: '', label: 'Principal', isPrimary: true }],
      emails: [{ email: '', label: 'General', isPrimary: true }],
      whatsapp: {
        number: '',
        message: 'Hola! Me gustaría información sobre los servicios de Tramboory para organizar una fiesta.',
        enabled: true
      },
      address: {
        street: '',
        neighborhood: '',
        city: 'Zapopan',
        state: 'Jalisco',
        zipCode: '',
        references: []
      },
      schedules: DAYS.map(day => ({
        day: day.value,
        isOpen: day.value !== 'sunday',
        openTime: '09:00',
        closeTime: day.value === 'saturday' ? '17:00' : '19:00',
        notes: day.value === 'sunday' ? 'Solo eventos programados' : ''
      })),
      socialMedia: {
        facebook: '',
        instagram: '',
        tiktok: '',
        youtube: ''
      },
      maps: {
        googleMaps: '',
        waze: '',
        embedUrl: ''
      },
      bankingInfo: {
        bankName: 'BBVA México',
        accountHolder: 'Tramboory S.A. de C.V.',
        clabe: '',
        accountNumber: '',
        paymentAddress: '',
        paymentInstructions: 'Realiza tu transferencia y envía el comprobante por WhatsApp para confirmar tu reservación.',
        enabled: true
      },
      discountSettings: {
        cashDiscount: {
          enabled: false,
          percentage: 0,
          description: 'Descuento por pago en efectivo',
          appliesTo: 'remaining'
        }
      }
    }
  })

  // Cargar configuración actual
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/contact-settings')
        if (response.ok) {
          const data = await response.json()
          form.setValues(data)
        }
      } catch (error) {
        console.error('Error loading contact settings:', error)
        notifications.show({
          title: 'Error',
          message: 'No se pudo cargar la configuración',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Guardar configuración
  const handleSave = async (values: ContactSettings) => {
    setSaving(true)
    try {
      const response = await fetch('/api/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: 'Configuración guardada correctamente',
          color: 'green',
        })
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error saving contact settings:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar la configuración',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Contacto</h2>
          <p className="text-gray-600">Administra la información de contacto que se muestra en el sitio web</p>
        </div>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={() => form.onSubmit(handleSave)()}
          loading={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Guardar Cambios
        </Button>
      </div>

      <form onSubmit={form.onSubmit(handleSave)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <Tabs.List>
            <Tabs.Tab value="general" leftSection={<IconPhone size={16} />}>
              General
            </Tabs.Tab>
            <Tabs.Tab value="whatsapp" leftSection={<IconBrandWhatsapp size={16} />}>
              WhatsApp
            </Tabs.Tab>
            <Tabs.Tab value="address" leftSection={<IconMapPin size={16} />}>
              Ubicación
            </Tabs.Tab>
            <Tabs.Tab value="schedule" leftSection={<IconClock size={16} />}>
              Horarios
            </Tabs.Tab>
            <Tabs.Tab value="social" leftSection={<IconBrandInstagram size={16} />}>
              Redes Sociales
            </Tabs.Tab>
            <Tabs.Tab value="banking" leftSection={<IconCreditCard size={16} />}>
              Información Bancaria
            </Tabs.Tab>
            <Tabs.Tab value="discounts" leftSection={<IconDiscount size={16} />}>
              Descuentos
            </Tabs.Tab>
          </Tabs.List>

          {/* Información General */}
          <Tabs.Panel value="general" className="pt-6">
            <Stack gap="md">
              <TextInput
                label="Nombre del Negocio"
                placeholder="Tramboory"
                {...form.getInputProps('businessName')}
                required
              />
              
              <Textarea
                label="Descripción/Tagline"
                placeholder="El mejor salón de fiestas infantiles en Zapopan"
                {...form.getInputProps('tagline')}
                minRows={2}
              />

              <Divider label="Teléfonos" />
              {form.values.phones.map((phone, index) => (
                <Group key={index} align="flex-end">
                  <TextInput
                    label="Número"
                    placeholder="33 1234 5678"
                    style={{ flex: 1 }}
                    {...form.getInputProps(`phones.${index}.number`)}
                  />
                  <TextInput
                    label="Etiqueta"
                    placeholder="Principal"
                    w={120}
                    {...form.getInputProps(`phones.${index}.label`)}
                  />
                  <Switch
                    label="Principal"
                    {...form.getInputProps(`phones.${index}.isPrimary`, { type: 'checkbox' })}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => {
                      const phones = [...form.values.phones]
                      phones.splice(index, 1)
                      form.setFieldValue('phones', phones)
                    }}
                    disabled={form.values.phones.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  form.setFieldValue('phones', [
                    ...form.values.phones,
                    { number: '', label: 'Secundario', isPrimary: false }
                  ])
                }}
              >
                Agregar Teléfono
              </Button>

              <Divider label="Correos Electrónicos" />
              {form.values.emails.map((email, index) => (
                <Group key={index} align="flex-end">
                  <TextInput
                    label="Email"
                    placeholder="contacto@tramboory.com"
                    style={{ flex: 1 }}
                    {...form.getInputProps(`emails.${index}.email`)}
                  />
                  <TextInput
                    label="Etiqueta"
                    placeholder="General"
                    w={120}
                    {...form.getInputProps(`emails.${index}.label`)}
                  />
                  <Switch
                    label="Principal"
                    {...form.getInputProps(`emails.${index}.isPrimary`, { type: 'checkbox' })}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => {
                      const emails = [...form.values.emails]
                      emails.splice(index, 1)
                      form.setFieldValue('emails', emails)
                    }}
                    disabled={form.values.emails.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  form.setFieldValue('emails', [
                    ...form.values.emails,
                    { email: '', label: 'Secundario', isPrimary: false }
                  ])
                }}
              >
                Agregar Email
              </Button>
            </Stack>
          </Tabs.Panel>

          {/* WhatsApp */}
          <Tabs.Panel value="whatsapp" className="pt-6">
            <Stack gap="md">
              <Switch
                label="Habilitar WhatsApp"
                description="Mostrar botón de WhatsApp en el sitio web"
                {...form.getInputProps('whatsapp.enabled', { type: 'checkbox' })}
              />
              
              <TextInput
                label="Número de WhatsApp"
                placeholder="523312345678"
                description="Incluir código de país (52 para México)"
                {...form.getInputProps('whatsapp.number')}
                disabled={!form.values.whatsapp.enabled}
              />
              
              <Textarea
                label="Mensaje Predeterminado"
                placeholder="Hola! Me gustaría información sobre los servicios de Tramboory..."
                description="Mensaje que aparecerá automáticamente cuando alguien inicie una conversación"
                minRows={3}
                {...form.getInputProps('whatsapp.message')}
                disabled={!form.values.whatsapp.enabled}
              />
            </Stack>
          </Tabs.Panel>

          {/* Dirección */}
          <Tabs.Panel value="address" className="pt-6">
            <Stack gap="md">
              <TextInput
                label="Calle y Número"
                placeholder="P.º Solares 1639"
                {...form.getInputProps('address.street')}
                required
              />
              
              <Group grow>
                <TextInput
                  label="Colonia/Fraccionamiento"
                  placeholder="Solares Residencial"
                  {...form.getInputProps('address.neighborhood')}
                />
                <TextInput
                  label="Código Postal"
                  placeholder="45019"
                  {...form.getInputProps('address.zipCode')}
                />
              </Group>
              
              <Group grow>
                <TextInput
                  label="Ciudad"
                  placeholder="Zapopan"
                  {...form.getInputProps('address.city')}
                />
                <TextInput
                  label="Estado"
                  placeholder="Jalisco"
                  {...form.getInputProps('address.state')}
                />
              </Group>

              <Textarea
                label="Referencias"
                placeholder="Una referencia por línea"
                description="Cada línea será una referencia separada"
                minRows={3}
                value={form.values.address.references.join('\n')}
                onChange={(e) => {
                  const references = e.target.value.split('\n').filter(ref => ref.trim())
                  form.setFieldValue('address.references', references)
                }}
              />

              <Divider label="Enlaces de Mapas" />
              
              <TextInput
                label="Enlace de Google Maps"
                placeholder="https://maps.app.goo.gl/..."
                {...form.getInputProps('maps.googleMaps')}
              />
              
              <TextInput
                label="Enlace de Waze"
                placeholder="https://waze.com/ul?q=..."
                {...form.getInputProps('maps.waze')}
              />
            </Stack>
          </Tabs.Panel>

          {/* Horarios */}
          <Tabs.Panel value="schedule" className="pt-6">
            <Stack gap="md">
              {form.values.schedules.map((schedule, index) => {
                const dayLabel = DAYS.find(d => d.value === schedule.day)?.label || schedule.day
                return (
                  <Group key={schedule.day} align="flex-start" className="p-4 border border-gray-200 rounded-lg">
                    <div className="min-w-[100px]">
                      <Text fw={500}>{dayLabel}</Text>
                    </div>
                    
                    <Switch
                      label="Abierto"
                      {...form.getInputProps(`schedules.${index}.isOpen`, { type: 'checkbox' })}
                    />
                    
                    {schedule.isOpen && (
                      <>
                        <TextInput
                          label="Apertura"
                          type="time"
                          w={120}
                          {...form.getInputProps(`schedules.${index}.openTime`)}
                        />
                        <TextInput
                          label="Cierre"
                          type="time"
                          w={120}
                          {...form.getInputProps(`schedules.${index}.closeTime`)}
                        />
                      </>
                    )}
                    
                    <TextInput
                      label="Notas"
                      placeholder="Solo eventos programados"
                      style={{ flex: 1 }}
                      {...form.getInputProps(`schedules.${index}.notes`)}
                    />
                  </Group>
                )
              })}
            </Stack>
          </Tabs.Panel>

          {/* Redes Sociales */}
          <Tabs.Panel value="social" className="pt-6">
            <Stack gap="md">
              <TextInput
                label="Instagram"
                placeholder="https://instagram.com/tramboory"
                leftSection={<IconBrandInstagram size={16} />}
                {...form.getInputProps('socialMedia.instagram')}
              />
              
              <TextInput
                label="Facebook"
                placeholder="https://facebook.com/tramboory"
                leftSection={<IconBrandFacebook size={16} />}
                {...form.getInputProps('socialMedia.facebook')}
              />
              
              <TextInput
                label="TikTok"
                placeholder="https://tiktok.com/@tramboory"
                {...form.getInputProps('socialMedia.tiktok')}
              />
              
              <TextInput
                label="YouTube"
                placeholder="https://youtube.com/@tramboory"
                {...form.getInputProps('socialMedia.youtube')}
              />
            </Stack>
          </Tabs.Panel>

          {/* Información Bancaria */}
          <Tabs.Panel value="banking" className="pt-6">
            <Stack gap="md">
              <Switch
                label="Habilitar información bancaria"
                description="Mostrar datos bancarios cuando se seleccione transferencia"
                {...form.getInputProps('bankingInfo.enabled', { type: 'checkbox' })}
              />
              
              {form.values.bankingInfo?.enabled && (
                <>
                  <TextInput
                    label="Nombre del Banco"
                    placeholder="BBVA México"
                    {...form.getInputProps('bankingInfo.bankName')}
                    maxLength={100}
                    description="Solo letras, números, espacios y caracteres especiales básicos"
                    required
                    onInput={(e) => {
                      // Permitir solo letras, números, espacios y algunos caracteres especiales
                      const value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,]/g, '');
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.bankName', value);
                    }}
                  />
                  
                  <TextInput
                    label="Titular de la Cuenta"
                    placeholder="Tramboory S.A. de C.V."
                    {...form.getInputProps('bankingInfo.accountHolder')}
                    maxLength={150}
                    description="Nombre completo del titular según documentos oficiales"
                    required
                    onInput={(e) => {
                      // Permitir solo letras, espacios y algunos caracteres especiales para nombres de empresas
                      const value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\,\&]/g, '');
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.accountHolder', value);
                    }}
                  />
                  
                  <TextInput
                    label="CLABE Interbancaria"
                    placeholder="012345678901234567"
                    {...form.getInputProps('bankingInfo.clabe')}
                    maxLength={18}
                    minLength={18}
                    description="Exactamente 18 dígitos (solo números)"
                    pattern="[0-9]{18}"
                    required
                    onInput={(e) => {
                      // Solo permitir números y exactamente 18 dígitos
                      const value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 18);
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.clabe', value);
                    }}
                    error={
                      form.values.bankingInfo?.clabe && 
                      (form.values.bankingInfo.clabe.length !== 18 || !/^[0-9]{18}$/.test(form.values.bankingInfo.clabe))
                        ? 'La CLABE debe tener exactamente 18 dígitos'
                        : null
                    }
                  />
                  
                  <TextInput
                    label="Número de Cuenta (opcional)"
                    placeholder="1234567890"
                    {...form.getInputProps('bankingInfo.accountNumber')}
                    maxLength={20}
                    description="Número de cuenta tradicional (solo números, máximo 20 dígitos)"
                    onInput={(e) => {
                      // Solo permitir números
                      const value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 20);
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.accountNumber', value);
                    }}
                  />
                  
                  <TextInput
                    label="Dirección de Pago"
                    placeholder="Sucursal Centro, Zapopan, Jalisco"
                    {...form.getInputProps('bankingInfo.paymentAddress')}
                    maxLength={200}
                    description="Dirección completa de la sucursal o ubicación de pago"
                    onInput={(e) => {
                      // Permitir caracteres para direcciones
                      const value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,\#]/g, '').slice(0, 200);
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.paymentAddress', value);
                    }}
                  />
                  
                  <Textarea
                    label="Instrucciones de Pago"
                    placeholder="Realiza tu transferencia y envía el comprobante por WhatsApp..."
                    {...form.getInputProps('bankingInfo.paymentInstructions')}
                    minRows={3}
                    maxRows={6}
                    maxLength={500}
                    description="Instrucciones detalladas para el cliente (máximo 500 caracteres)"
                    onInput={(e) => {
                      // Limitar longitud pero permitir todos los caracteres para instrucciones
                      const value = e.currentTarget.value.slice(0, 500);
                      e.currentTarget.value = value;
                      form.setFieldValue('bankingInfo.paymentInstructions', value);
                    }}
                  />
                </>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Configuración de Descuentos */}
          <Tabs.Panel value="discounts" className="pt-6">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Configura los descuentos disponibles para diferentes métodos de pago
              </Text>
              
              <Divider label="Descuento por Pago en Efectivo" />
              
              <Switch
                label="Habilitar descuento en efectivo"
                description="Aplicar descuento cuando el cliente paga en efectivo"
                {...form.getInputProps('discountSettings.cashDiscount.enabled', { type: 'checkbox' })}
              />
              
              {form.values.discountSettings?.cashDiscount.enabled && (
                <>
                  <TextInput
                    label="Porcentaje de Descuento"
                    placeholder="5"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    rightSection={<Text size="sm">%</Text>}
                    {...form.getInputProps('discountSettings.cashDiscount.percentage')}
                    description="Entre 0 y 100% (se permiten decimales)"
                    required
                    onInput={(e) => {
                      // Validar rango y formato decimal
                      let value = parseFloat(e.currentTarget.value);
                      if (isNaN(value)) value = 0;
                      if (value < 0) value = 0;
                      if (value > 100) value = 100;
                      
                      // Redondear a 2 decimales
                      value = Math.round(value * 100) / 100;
                      
                      e.currentTarget.value = value.toString();
                      form.setFieldValue('discountSettings.cashDiscount.percentage', value);
                    }}
                    error={
                      form.values.discountSettings?.cashDiscount.percentage !== undefined &&
                      (form.values.discountSettings.cashDiscount.percentage < 0 || 
                       form.values.discountSettings.cashDiscount.percentage > 100)
                        ? 'El porcentaje debe estar entre 0 y 100'
                        : null
                    }
                  />
                  
                  <TextInput
                    label="Descripción del Descuento"
                    placeholder="Descuento por pago en efectivo"
                    {...form.getInputProps('discountSettings.cashDiscount.description')}
                    maxLength={100}
                    description="Texto que se mostrará al cliente (máximo 100 caracteres)"
                    required
                    onInput={(e) => {
                      // Limpiar caracteres especiales problemáticos pero permitir tildes y básicos
                      const value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.\,\%]/g, '').slice(0, 100);
                      e.currentTarget.value = value;
                      form.setFieldValue('discountSettings.cashDiscount.description', value);
                    }}
                  />
                  
                  <Select
                    label="Se Aplica A"
                    placeholder="Selecciona cuándo aplicar el descuento"
                    data={[
                      { value: 'remaining', label: 'Solo al pago restante' },
                      { value: 'total', label: 'Al total completo' }
                    ]}
                    {...form.getInputProps('discountSettings.cashDiscount.appliesTo')}
                    description="El descuento al pago restante se aplica solo cuando se paga el resto en efectivo, no al anticipo"
                    required
                  />
                </>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </form>
    </div>
  )
}