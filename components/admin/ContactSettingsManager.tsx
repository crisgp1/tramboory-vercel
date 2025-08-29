'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button, TextInput, Textarea, Switch, Group, Text, Tabs, Stack, ActionIcon, Divider, Select } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPhone, IconMail, IconMapPin, IconClock, IconTrash, IconPlus, IconBrandWhatsapp, IconBrandInstagram, IconBrandFacebook, IconDeviceFloppy } from '@tabler/icons-react'

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
        </Tabs>
      </form>
    </div>
  )
}