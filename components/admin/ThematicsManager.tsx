'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Stack,
  Group,
  Card,
  Title,
  Text,
  Image,
  ActionIcon,
  Paper,
  Grid,
  Badge,
  Loader,
  Center,
  Box,
  Tabs,
  SimpleGrid,
  Alert,
  FileButton,
  rem
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUpload,
  IconPhoto,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconX,
  IconAlertCircle,
  IconBrandUnsplash
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Thematic, ThematicImage } from '@/types/thematic'

export default function ThematicsManager() {
  const [thematics, setThematics] = useState<Thematic[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingThematic, setEditingThematic] = useState<Thematic | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewThematic, setPreviewThematic] = useState<Thematic | null>(null)

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      slug: '',
      coverImage: {
        url: '',
        alt: ''
      },
      images: [] as ThematicImage[],
      isActive: true,
      order: 0
    },
    validate: {
      title: (value) => (!value ? 'El título es requerido' : null),
      description: (value) => (!value ? 'La descripción es requerida' : null),
      coverImage: {
        url: (value) => (!value ? 'La imagen de portada es requerida' : null)
      }
    }
  })

  useEffect(() => {
    fetchThematics()
  }, [])

  const fetchThematics = async () => {
    try {
      const response = await fetch('/api/admin/thematics')
      if (response.ok) {
        const data = await response.json()
        setThematics(data)
      }
    } catch (error) {
      console.error('Error fetching thematics:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las temáticas',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const url = editingThematic
        ? `/api/admin/thematics/${editingThematic._id}`
        : '/api/admin/thematics'
      
      const method = editingThematic ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: editingThematic 
            ? 'Temática actualizada correctamente'
            : 'Temática creada correctamente',
          color: 'green'
        })
        
        setModalOpened(false)
        setEditingThematic(null)
        form.reset()
        fetchThematics()
      } else {
        throw new Error('Error al guardar la temática')
      }
    } catch (error) {
      console.error('Error saving thematic:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar la temática',
        color: 'red'
      })
    }
  }

  const handleEdit = (thematic: Thematic) => {
    setEditingThematic(thematic)
    form.setValues({
      title: thematic.title,
      description: thematic.description,
      slug: thematic.slug,
      coverImage: thematic.coverImage,
      images: thematic.images || [],
      isActive: thematic.isActive,
      order: thematic.order
    })
    setModalOpened(true)
  }

  const handleDelete = (thematic: Thematic) => {
    modals.openConfirmModal({
      title: 'Eliminar temática',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar la temática "{thematic.title}"?
          Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/thematics/${thematic._id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            notifications.show({
              title: 'Éxito',
              message: 'Temática eliminada correctamente',
              color: 'green'
            })
            fetchThematics()
          } else {
            throw new Error('Error al eliminar')
          }
        } catch (error) {
          console.error('Error deleting thematic:', error)
          notifications.show({
            title: 'Error',
            message: 'No se pudo eliminar la temática',
            color: 'red'
          })
        }
      }
    })
  }

  const handleImageUpload = async (file: File | null, type: 'cover' | 'gallery') => {
    if (!file) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        
        if (type === 'cover') {
          form.setFieldValue('coverImage.url', data.url)
        } else {
          const newImage: ThematicImage = {
            url: data.url,
            alt: '',
            order: form.values.images.length
          }
          form.setFieldValue('images', [...form.values.images, newImage])
        }
        
        notifications.show({
          title: 'Éxito',
          message: 'Imagen cargada correctamente',
          color: 'green'
        })
      } else {
        throw new Error('Error al cargar la imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar la imagen',
        color: 'red'
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    const newImages = form.values.images.filter((_, i) => i !== index)
    form.setFieldValue('images', newImages)
  }

  const reorderGalleryImages = (result: any) => {
    if (!result.destination) return

    const items = Array.from(form.values.images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Actualizar el orden
    const reorderedImages = items.map((img, index) => ({
      ...img,
      order: index
    }))

    form.setFieldValue('images', reorderedImages)
  }

  const toggleActive = async (thematic: Thematic) => {
    try {
      const response = await fetch(`/api/admin/thematics/${thematic._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...thematic, isActive: !thematic.isActive })
      })

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: `Temática ${!thematic.isActive ? 'activada' : 'desactivada'}`,
          color: 'green'
        })
        fetchThematics()
      }
    } catch (error) {
      console.error('Error toggling thematic:', error)
      notifications.show({
        title: 'Error',
        message: 'No se pudo cambiar el estado',
        color: 'red'
      })
    }
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Gestión de Temáticas</Title>
          <Button
            leftSection={<IconPlus size={20} />}
            onClick={() => {
              setEditingThematic(null)
              form.reset()
              setModalOpened(true)
            }}
          >
            Nueva Temática
          </Button>
        </Group>

        {thematics.length === 0 ? (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <IconPhoto size={48} style={{ opacity: 0.5 }} />
                <Text c="dimmed">No hay temáticas creadas</Text>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => setModalOpened(true)}
                >
                  Crear primera temática
                </Button>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Grid>
            {thematics.map((thematic) => (
              <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} key={thematic._id}>
                <Card shadow="sm" radius="md" withBorder h="100%">
                  <Card.Section>
                    <div style={{ position: 'relative', height: 200 }}>
                      <Image
                        src={thematic.coverImage.url}
                        alt={thematic.coverImage.alt || thematic.title}
                        h={200}
                        fit="cover"
                      />
                      <Badge
                        color={thematic.isActive ? 'green' : 'gray'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10
                        }}
                      >
                        {thematic.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Title order={4}>{thematic.title}</Title>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {thematic.description}
                    </Text>
                    
                    <Group gap="xs">
                      <Badge variant="light">
                        {thematic.images?.length || 0} imágenes
                      </Badge>
                      <Badge variant="light" color="blue">
                        Orden: {thematic.order}
                      </Badge>
                    </Group>

                    <Group gap="xs" mt="auto">
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={16} />}
                        onClick={() => setPreviewThematic(thematic)}
                        style={{ flex: 1 }}
                      >
                        Vista previa
                      </Button>
                      <ActionIcon
                        variant="light"
                        color={thematic.isActive ? 'gray' : 'green'}
                        onClick={() => toggleActive(thematic)}
                        size="md"
                      >
                        {thematic.isActive ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        onClick={() => handleEdit(thematic)}
                        size="md"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(thematic)}
                        size="md"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Modal de creación/edición */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false)
          setEditingThematic(null)
          form.reset()
        }}
        title={editingThematic ? 'Editar Temática' : 'Nueva Temática'}
        size="xl"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Tabs defaultValue="info">
            <Tabs.List>
              <Tabs.Tab value="info" leftSection={<IconAlertCircle size={16} />}>
                Información
              </Tabs.Tab>
              <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
                Imágenes
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="md">
              <Stack gap="md">
                <TextInput
                  label="Título"
                  placeholder="Ej: Temática de Superhéroes"
                  required
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label="Descripción"
                  placeholder="Describe la temática..."
                  required
                  rows={3}
                  {...form.getInputProps('description')}
                />

                <TextInput
                  label="Slug (URL)"
                  placeholder="tematica-superheroes"
                  description="Se genera automáticamente del título si lo dejas vacío"
                  {...form.getInputProps('slug')}
                />

                <Group grow>
                  <NumberInput
                    label="Orden"
                    placeholder="0"
                    min={0}
                    {...form.getInputProps('order')}
                  />
                  
                  <Switch
                    label="Activa"
                    description="La temática será visible en el sitio público"
                    checked={form.values.isActive}
                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                  />
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="images" pt="md">
              <Stack gap="md">
                {/* Imagen de portada */}
                <div>
                  <Text fw={500} size="sm" mb="xs">
                    Imagen de portada *
                  </Text>
                  
                  {form.values.coverImage.url ? (
                    <Box pos="relative">
                      <Image
                        src={form.values.coverImage.url}
                        alt={form.values.coverImage.alt || 'Portada'}
                        h={200}
                        fit="cover"
                        radius="md"
                      />
                      <ActionIcon
                        color="red"
                        variant="filled"
                        pos="absolute"
                        top={10}
                        right={10}
                        onClick={() => form.setFieldValue('coverImage.url', '')}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Box>
                  ) : (
                    <FileButton
                      accept="image/*"
                      onChange={(file) => handleImageUpload(file, 'cover')}
                    >
                      {(props) => (
                        <Button
                          {...props}
                          variant="light"
                          leftSection={<IconUpload size={16} />}
                          loading={uploadingImage}
                          fullWidth
                        >
                          Cargar imagen de portada
                        </Button>
                      )}
                    </FileButton>
                  )}
                  
                  {form.values.coverImage.url && (
                    <TextInput
                      mt="xs"
                      placeholder="Texto alternativo (alt)"
                      {...form.getInputProps('coverImage.alt')}
                    />
                  )}
                </div>

                {/* Galería de imágenes */}
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500} size="sm">
                      Galería de imágenes ({form.values.images.length})
                    </Text>
                    <FileButton
                      accept="image/*"
                      onChange={(file) => handleImageUpload(file, 'gallery')}
                    >
                      {(props) => (
                        <Button
                          {...props}
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          loading={uploadingImage}
                        >
                          Agregar imagen
                        </Button>
                      )}
                    </FileButton>
                  </Group>

                  {form.values.images.length > 0 ? (
                    <DragDropContext onDragEnd={reorderGalleryImages}>
                      <Droppable droppableId="gallery">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef}>
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                              {form.values.images.map((image, index) => (
                                <Draggable
                                  key={`image-${index}`}
                                  draggableId={`image-${index}`}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.5 : 1
                                      }}
                                    >
                                      <Paper
                                        radius="md"
                                        withBorder
                                        pos="relative"
                                        style={{ overflow: 'hidden' }}
                                      >
                                        <ActionIcon
                                          {...provided.dragHandleProps}
                                          variant="subtle"
                                          pos="absolute"
                                          top={5}
                                          left={5}
                                          style={{ zIndex: 1, cursor: 'grab' }}
                                        >
                                          <IconGripVertical size={16} />
                                        </ActionIcon>
                                        
                                        <ActionIcon
                                          color="red"
                                          variant="filled"
                                          size="sm"
                                          pos="absolute"
                                          top={5}
                                          right={5}
                                          style={{ zIndex: 1 }}
                                          onClick={() => removeGalleryImage(index)}
                                        >
                                          <IconX size={14} />
                                        </ActionIcon>
                                        
                                        <Image
                                          src={image.url}
                                          alt={image.alt || `Imagen ${index + 1}`}
                                          h={120}
                                          fit="cover"
                                        />
                                      </Paper>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </SimpleGrid>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  ) : (
                    <Alert color="blue" variant="light">
                      No hay imágenes en la galería. Agrega imágenes para mostrar en la temática.
                    </Alert>
                  )}
                </div>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="subtle"
              onClick={() => {
                setModalOpened(false)
                setEditingThematic(null)
                form.reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingThematic ? 'Actualizar' : 'Crear'} Temática
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Modal de vista previa */}
      <Modal
        opened={!!previewThematic}
        onClose={() => setPreviewThematic(null)}
        title={`Vista previa: ${previewThematic?.title}`}
        size="xl"
      >
        {previewThematic && (
          <Stack gap="md">
            <Image
              src={previewThematic.coverImage.url}
              alt={previewThematic.coverImage.alt || previewThematic.title}
              h={300}
              fit="cover"
              radius="md"
            />
            
            <div>
              <Title order={3}>{previewThematic.title}</Title>
              <Text mt="xs" c="dimmed">
                {previewThematic.description}
              </Text>
            </div>

            {previewThematic.images && previewThematic.images.length > 0 && (
              <div>
                <Text fw={500} mb="xs">Galería</Text>
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                  {previewThematic.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image.url}
                      alt={image.alt || `Imagen ${index + 1}`}
                      h={150}
                      fit="cover"
                      radius="md"
                    />
                  ))}
                </SimpleGrid>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </>
  )
}