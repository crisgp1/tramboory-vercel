'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, TextInput, Textarea, Select, FileInput, Switch, Modal, Grid, Card, Badge, ActionIcon, Group, Text, Image } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconPhoto, IconVideo, IconEye, IconEyeOff } from '@tabler/icons-react'

interface GalleryItem {
  _id?: string
  title: string
  description: string
  type: 'image' | 'video'
  src: string
  alt: string
  category: 'superheroes' | 'princesas' | 'tematica' | 'deportes' | 'cumpleanos' | 'otros'
  aspectRatio: 'portrait' | 'landscape' | 'square'
  featured: boolean
  active: boolean
  order: number
}

const categoryOptions = [
  { value: 'superheroes', label: 'Superhéroes' },
  { value: 'princesas', label: 'Princesas' },
  { value: 'tematica', label: 'Temática' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'otros', label: 'Otros' },
]

const aspectRatioOptions = [
  { value: 'landscape', label: 'Horizontal' },
  { value: 'portrait', label: 'Vertical' },
  { value: 'square', label: 'Cuadrado' },
]

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<GalleryItem>({
    initialValues: {
      title: '',
      description: '',
      type: 'image',
      src: '',
      alt: '',
      category: 'otros',
      aspectRatio: 'landscape',
      featured: false,
      active: true,
      order: 0,
    },
    validate: {
      title: (value) => (!value ? 'El título es requerido' : null),
      description: (value) => (!value ? 'La descripción es requerida' : null),
      src: (value) => (!value ? 'La imagen/video es requerida' : null),
      alt: (value) => (!value ? 'El texto alternativo es requerido' : null),
    },
  })

  // Cargar items
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gallery')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los items',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Manejar subida de archivos
  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al subir el archivo')
      }

      const data = await response.json()
      
      form.setFieldValue('src', data.url)
      form.setFieldValue('type', file.type.startsWith('video') ? 'video' : 'image')
      
      notifications.show({
        title: 'Éxito',
        message: 'Archivo subido correctamente',
        color: 'green',
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo subir el archivo',
        color: 'red',
      })
    } finally {
      setUploading(false)
    }
  }

  // Guardar item
  const handleSave = async (values: GalleryItem) => {
    try {
      const url = editingItem ? `/api/gallery/${editingItem._id}` : '/api/gallery'
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: editingItem ? 'Item actualizado' : 'Item creado',
          color: 'green',
        })
        
        setModalOpened(false)
        setEditingItem(null)
        form.reset()
        fetchItems()
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar el item',
        color: 'red',
      })
    }
  }

  // Eliminar item
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: 'Item eliminado',
          color: 'green',
        })
        fetchItems()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el item',
        color: 'red',
      })
    }
  }

  // Abrir modal para editar
  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item)
    form.setValues(item)
    setModalOpened(true)
  }

  // Abrir modal para crear
  const openCreateModal = () => {
    setEditingItem(null)
    form.reset()
    setModalOpened(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Galería</h2>
          <p className="text-gray-600">Administra las fotos y videos de la galería</p>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Agregar Item
        </Button>
      </div>

      {/* Grid de items */}
      <Grid>
        {loading ? (
          <div className="col-span-full text-center py-8">
            <Text>Cargando items...</Text>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Text color="dimmed">No hay items en la galería</Text>
          </div>
        ) : (
          items.map((item) => (
            <Grid.Col key={item._id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  {item.type === 'video' ? (
                    <video
                      src={item.src}
                      className="w-full h-48 object-cover"
                      muted
                    />
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.alt}
                      height={192}
                      fit="cover"
                    />
                  )}
                </Card.Section>

                <div className="mt-3 space-y-2">
                  <Group justify="space-between">
                    <Text fw={500} size="sm" truncate>
                      {item.title}
                    </Text>
                    <Badge
                      color={item.type === 'video' ? 'blue' : 'green'}
                      variant="light"
                      size="xs"
                    >
                      {item.type === 'video' ? <IconVideo size={12} /> : <IconPhoto size={12} />}
                    </Badge>
                  </Group>

                  <Text size="xs" color="dimmed" lineClamp={2}>
                    {item.description}
                  </Text>

                  <Group justify="space-between">
                    <Badge variant="light" size="xs">
                      {categoryOptions.find(c => c.value === item.category)?.label}
                    </Badge>
                    
                    <Group gap="xs">
                      {item.featured && (
                        <Badge color="yellow" variant="light" size="xs">
                          Destacado
                        </Badge>
                      )}
                      <ActionIcon
                        variant="light"
                        color={item.active ? 'green' : 'gray'}
                        size="sm"
                      >
                        {item.active ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Group justify="space-between" mt="md">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => openEditModal(item)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => item._id && handleDelete(item._id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </div>
              </Card>
            </Grid.Col>
          ))
        )}
      </Grid>

      {/* Modal para crear/editar */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false)
          setEditingItem(null)
          form.reset()
        }}
        title={editingItem ? 'Editar Item' : 'Crear Nuevo Item'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSave)} className="space-y-4">
          <TextInput
            label="Título"
            placeholder="Título del item"
            {...form.getInputProps('title')}
            required
          />

          <Textarea
            label="Descripción"
            placeholder="Descripción del item"
            {...form.getInputProps('description')}
            minRows={3}
            required
          />

          <FileInput
            label="Imagen/Video"
            placeholder="Selecciona un archivo"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            loading={uploading}
          />

          {form.values.src && (
            <div className="mt-4">
              <Text size="sm" mb="xs">Vista previa:</Text>
              {form.values.type === 'video' ? (
                <video
                  src={form.values.src}
                  className="w-full h-48 object-cover rounded"
                  controls
                />
              ) : (
                <Image
                  src={form.values.src}
                  alt="Preview"
                  height={192}
                  fit="cover"
                  radius="sm"
                />
              )}
            </div>
          )}

          <TextInput
            label="Texto alternativo"
            placeholder="Descripción para accesibilidad"
            {...form.getInputProps('alt')}
            required
          />

          <Select
            label="Categoría"
            data={categoryOptions}
            {...form.getInputProps('category')}
            required
          />

          <Select
            label="Proporción"
            data={aspectRatioOptions}
            {...form.getInputProps('aspectRatio')}
          />

          <Switch
            label="Destacado"
            {...form.getInputProps('featured', { type: 'checkbox' })}
          />

          <Switch
            label="Activo"
            {...form.getInputProps('active', { type: 'checkbox' })}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                setModalOpened(false)
                setEditingItem(null)
                form.reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </form>
      </Modal>
    </div>
  )
}