"use client"

import React, { useState } from "react"
import {
  Stack,
  Title,
  Grid,
  Card,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  FileInput,
  Alert,
  Image,
  Divider,
  Progress,
  Loader,
  Group,
  Button,
  Text,
  NumberInput
} from "@mantine/core"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconPhoto,
  IconVideo,
  IconSparkles,
  IconInfoCircle,
  IconUpload,
  IconGripVertical,
  IconCalendar,
  IconClock
} from "@tabler/icons-react"
import { DateTimePicker } from '@mantine/dates';
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { CarouselCard } from "@/types/carousel"
import { useMediaUpload } from "@/hooks/useMediaUpload"
import { useCarouselAdmin } from "@/hooks/useCarouselAdmin"

const iconOptions = [
  { value: 'GiPartyPopper', label: '🎉 Fiesta' },
  { value: 'FiShield', label: '🛡️ Seguridad' },
  { value: 'GiBalloons', label: '🎈 Globos' },
  { value: 'FiCamera', label: '📸 Cámara' },
  { value: 'FiHeart', label: '💖 Corazón' },
  { value: 'FiGift', label: '🎁 Regalo' },
]

const gradientOptions = [
  { value: 'from-pink-500 to-purple-600', label: 'Rosa a Púrpura' },
  { value: 'from-blue-500 to-cyan-600', label: 'Azul a Cian' },
  { value: 'from-yellow-500 to-orange-600', label: 'Amarillo a Naranja' },
  { value: 'from-green-500 to-teal-600', label: 'Verde a Verde Azulado' },
  { value: 'from-red-500 to-pink-600', label: 'Rojo a Rosa' },
  { value: 'from-indigo-500 to-purple-600', label: 'Índigo a Púrpura' },
  { value: 'from-teal-500 to-blue-600', label: 'Verde Azulado a Azul' },
  { value: 'from-orange-500 to-red-600', label: 'Naranja a Rojo' },
]

export default function CarouselManager() {
  const { cards, loading, createCard, updateCard, deleteCard } = useCarouselAdmin()
  const [opened, { open, close }] = useDisclosure(false)
  const [editingCard, setEditingCard] = useState<CarouselCard | null>(null)
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false)
  const [previewCard, setPreviewCard] = useState<CarouselCard | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<File | null>(null)
  const { uploadFile, validateFile, uploading, progress } = useMediaUpload()

  const [formData, setFormData] = useState<Partial<CarouselCard>>({
    title: "",
    description: "",
    icon: "GiPartyPopper",
    emoji: "🎉",
    backgroundMedia: { type: "gradient" },
    gradientColors: "from-pink-500 to-purple-600",
    isActive: true,
    order: 0,
    // Campos de programación
    scheduling: {
      enabled: false,
      publishDate: null,
      expireDate: null,
      autoActivate: false
    }
  })

  const handleEdit = (card: CarouselCard) => {
    setEditingCard(card)
    setUploadedMedia(null)
    setFormData({
      ...card,
      backgroundMedia: {
        ...card.backgroundMedia
      },
      scheduling: card.scheduling || {
        enabled: false,
        publishDate: null,
        expireDate: null,
        autoActivate: false
      }
    })
    open()
  }

  const handleAdd = () => {
    setEditingCard(null)
    setUploadedMedia(null)
    const nextOrder = Math.max(0, ...cards.map(c => c.order || 0)) + 1
    setFormData({
      title: "",
      description: "",
      icon: "GiPartyPopper",
      emoji: "🎉",
      backgroundMedia: { type: "gradient" },
      gradientColors: "from-pink-500 to-purple-600",
      isActive: true,
      order: nextOrder,
      scheduling: {
        enabled: false,
        publishDate: null,
        expireDate: null,
        autoActivate: false
      }
    })
    open()
  }

  const handleMediaUpload = async (file: File | null) => {
    if (!file) return

    if (!validateFile(file)) return

    const result = await uploadFile(file)
    if (result) {
      setFormData(prev => ({
        ...prev,
        backgroundMedia: {
          ...prev.backgroundMedia!,
          type: result.type === 'video' ? 'video' : 'image',
          url: result.url!
        }
      }))
      setUploadedMedia(null)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      notifications.show({
        title: "Error",
        message: "Título y descripción son requeridos",
        color: "red"
      })
      return
    }

    // Si hay un archivo pendiente de subir, subirlo primero
    if (uploadedMedia) {
      await handleMediaUpload(uploadedMedia)
    }

    let success = false

    if (editingCard) {
      // Editar existente
      success = await updateCard(editingCard.id!, formData)
    } else {
      // Crear nuevo
      success = await createCard(formData)
    }

    if (success) {
      setUploadedMedia(null)
      close()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCard(id)
  }

  const handlePreview = (card: CarouselCard) => {
    setPreviewCard(card)
    openPreview()
  }

  if (loading) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Loader size="lg" color="blue" />
        <Text c="dimmed">Cargando tarjetas del carousel...</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Gestión del Carousel</Title>
          <Text c="dimmed" size="sm">
            Administra las tarjetas del carousel infinito con videos y fotos
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
          Nueva Tarjeta
        </Button>
      </Group>

      <Alert icon={<IconInfoCircle />} color="blue" variant="light">
        <Text size="sm">
          El carousel mostrará las tarjetas activas ordenadas por el campo "orden". 
          Puedes subir videos o imágenes como fondo para cada tarjeta.
        </Text>
      </Alert>

      <Grid>
        {cards.map((card) => (
          <Grid.Col key={card.id} span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" radius="md" withBorder>
              <Card.Section>
                {card.backgroundMedia.type === "video" && card.backgroundMedia.url ? (
                  <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                    <video 
                      src={card.backgroundMedia.url} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                    />
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      backgroundColor: "rgba(220,38,38,0.8)", 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      VIDEO
                    </div>
                  </div>
                ) : card.backgroundMedia.type === "image" && card.backgroundMedia.url ? (
                  <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                    <Image 
                      src={card.backgroundMedia.url} 
                      alt="Fondo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      backgroundColor: "rgba(59,130,246,0.8)", 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      IMAGEN
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    height: 120, 
                    background: `linear-gradient(135deg, ${card.gradientColors.includes('from-') ? card.gradientColors.replace('from-', '').replace(' to-', ', ').split('-')[0] + '-500' : '#667eea'}, ${card.gradientColors.includes('to-') ? card.gradientColors.split('to-')[1].replace(' ', '').split('-')[0] + '-600' : '#764ba2'})`,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <Text c="white" fw={500}>GRADIENTE</Text>
                  </div>
                )}
              </Card.Section>

              <Stack gap="sm" p="sm">
                <Group justify="space-between">
                  <div style={{ flex: 1 }}>
                    <Group gap={4}>
                      <Text fw={500} lineClamp={1}>{card.title}</Text>
                      <Text size="lg">{card.emoji}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">Orden: {card.order}</Text>
                  </div>
                  <Stack gap="xs" align="flex-end">
                    {card.isActive ? (
                      <Badge color="green" variant="filled">Activo</Badge>
                    ) : (
                      <Badge color="gray" variant="outline">Inactivo</Badge>
                    )}
                    {card.scheduling?.enabled && (
                      <Badge 
                        color="blue" 
                        variant="light" 
                        leftSection={<IconCalendar size={12} />}
                      >
                        Programada
                      </Badge>
                    )}
                  </Stack>
                </Group>

                <Text size="sm" c="dimmed" lineClamp={2}>
                  {card.description}
                </Text>

                {card.scheduling?.enabled && card.scheduling.publishDate && (
                  <Text size="xs" c="blue" fw={500}>
                    📅 Se activará: {new Date(card.scheduling.publishDate).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                )}

                <Group justify="space-between" mt="sm">
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="blue"
                      onClick={() => handlePreview(card)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="yellow"
                      onClick={() => handleEdit(card)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="red"
                      onClick={() => handleDelete(card.id!)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                  
                  <IconGripVertical size={16} color="gray" />
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Modal de Edición/Creación */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={editingCard ? "Editar Tarjeta" : "Crear Tarjeta"}
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={8}>
              <TextInput
                label="Título"
                placeholder="Ej: Fiestas Épicas"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Emoji"
                placeholder="🎉"
                value={formData.emoji}
                onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Descripción"
            placeholder="Descripción de la tarjeta"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            rows={3}
          />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Icono"
                data={iconOptions}
                value={formData.icon}
                onChange={(value) => setFormData(prev => ({ ...prev, icon: value || "GiPartyPopper" }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Orden"
                placeholder="0"
                value={formData.order}
                onChange={(value) => setFormData(prev => ({ ...prev, order: Number(value) || 0 }))}
                min={0}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Colores del Gradiente"
            data={gradientOptions}
            value={formData.gradientColors}
            onChange={(value) => setFormData(prev => ({ ...prev, gradientColors: value || "from-pink-500 to-purple-600" }))}
          />

          <Divider label="Fondo" />

          <Select
            label="Tipo de Fondo"
            data={[
              { value: "gradient", label: "Gradiente" },
              { value: "image", label: "Imagen" },
              { value: "video", label: "Video" }
            ]}
            value={formData.backgroundMedia?.type}
            onChange={(value) => setFormData(prev => ({ 
              ...prev, 
              backgroundMedia: { ...prev.backgroundMedia!, type: value as any }
            }))}
          />

          {(formData.backgroundMedia?.type === "image" || formData.backgroundMedia?.type === "video") && (
            <Stack gap="sm">
              <FileInput
                label={`Subir ${formData.backgroundMedia.type === 'video' ? 'Video' : 'Imagen'}`}
                placeholder={`Selecciona un archivo de ${formData.backgroundMedia.type === 'video' ? 'video' : 'imagen'}`}
                accept={formData.backgroundMedia.type === 'video' 
                  ? 'video/mp4,video/webm,video/mov,video/avi' 
                  : 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
                }
                leftSection={<IconUpload size={16} />}
                value={uploadedMedia}
                onChange={(file) => {
                  setUploadedMedia(file)
                  if (file) {
                    handleMediaUpload(file)
                  }
                }}
                disabled={uploading}
                clearable
              />
              
              {uploading && (
                <div>
                  <Text size="sm" c="dimmed" mb={4}>Subiendo archivo...</Text>
                  <Progress value={progress} size="sm" color="blue" />
                </div>
              )}
              
              {formData.backgroundMedia?.url && (
                <div>
                  <Text size="sm" fw={500} mb={4}>Vista Previa:</Text>
                  {formData.backgroundMedia.type === 'video' ? (
                    <video 
                      src={formData.backgroundMedia.url} 
                      controls 
                      style={{ width: '100%', maxWidth: 300, height: 'auto', borderRadius: 8 }}
                    />
                  ) : (
                    <Image 
                      src={formData.backgroundMedia.url} 
                      alt="Vista previa" 
                      style={{ maxWidth: 300, height: 'auto' }}
                      radius="md"
                    />
                  )}
                </div>
              )}
            </Stack>
          )}

          <Switch
            label="Tarjeta activa"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
          />

          <Divider label="Programación de Publicación" />

          <Switch
            label="Programar publicación"
            description="Activa esta tarjeta automáticamente en una fecha específica"
            checked={formData.scheduling?.enabled || false}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              scheduling: { 
                ...prev.scheduling, 
                enabled: e.currentTarget?.checked || false,
                publishDate: prev.scheduling?.publishDate || null,
                expireDate: prev.scheduling?.expireDate || null,
                autoActivate: prev.scheduling?.autoActivate || false
              }
            }))}
          />

          {formData.scheduling?.enabled && (
            <Stack gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: 8 }}>
              <Group gap="sm">
                <IconCalendar size={20} color="var(--mantine-color-blue-6)" />
                <Text fw={500} c="blue">Configuración de Programación</Text>
              </Group>

              <Grid>
                <Grid.Col span={6}>
                  <DateTimePicker
                    label="Fecha de publicación"
                    description="Cuándo se activará esta tarjeta automáticamente"
                    placeholder="Selecciona fecha y hora"
                    value={formData.scheduling?.publishDate}
                    onChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      scheduling: { 
                        ...prev.scheduling!, 
                        publishDate: date ? new Date(date) : null
                      }
                    }))}
                    minDate={new Date()}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DateTimePicker
                    label="Fecha de expiración (opcional)"
                    description="Cuándo se desactivará automáticamente"
                    placeholder="Selecciona fecha y hora"
                    value={formData.scheduling?.expireDate}
                    onChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      scheduling: { 
                        ...prev.scheduling!, 
                        expireDate: date ? new Date(date) : null
                      }
                    }))}
                    minDate={formData.scheduling?.publishDate ? new Date(formData.scheduling.publishDate) : new Date()}
                    clearable
                  />
                </Grid.Col>
              </Grid>

              <Switch
                label="Activación automática"
                description="Desactiva otras tarjetas cuando se active esta"
                checked={formData.scheduling?.autoActivate || false}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduling: { 
                    ...prev.scheduling!, 
                    autoActivate: e.currentTarget?.checked || false
                  }
                }))}
              />

              <Alert icon={<IconClock size={16} />} color="blue" variant="light">
                <Text size="sm">
                  Las publicaciones programadas se procesan automáticamente cada hora. 
                  {formData.scheduling?.publishDate && (
                    <><br />Esta tarjeta se activará el <strong>{new Date(formData.scheduling.publishDate).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}</strong></>
                  )}
                </Text>
              </Alert>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadedMedia(null)
                close()
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              loading={uploading}
            >
              {editingCard ? "Actualizar" : "Crear"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de Preview */}
      <Modal 
        opened={previewOpened} 
        onClose={closePreview} 
        title="Vista Previa"
        size="lg"
      >
        {previewCard && (
          <div style={{ 
            minHeight: 300, 
            background: previewCard.backgroundMedia.type === "gradient" 
              ? `linear-gradient(135deg, ${previewCard.gradientColors.replace('from-', '').replace(' to-', ', ').split('-')[0] + '-500'}, ${previewCard.gradientColors.split('to-')[1].replace(' ', '').split('-')[0] + '-600'})`
              : "#f8f9fa",
            borderRadius: 12,
            padding: "2rem",
            color: "white",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            {previewCard.backgroundMedia.type === 'video' && previewCard.backgroundMedia.url && (
              <video
                src={previewCard.backgroundMedia.url}
                autoPlay
                loop
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1
                }}
              />
            )}
            
            {previewCard.backgroundMedia.type === 'image' && previewCard.backgroundMedia.url && (
              <img
                src={previewCard.backgroundMedia.url}
                alt={previewCard.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1
                }}
              />
            )}
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <Title order={2} style={{ fontSize: "2rem", marginBottom: "1rem", textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {previewCard.title} {previewCard.emoji}
              </Title>
              <Text size="lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                {previewCard.description}
              </Text>
            </div>
            
            {(previewCard.backgroundMedia.type === 'video' || previewCard.backgroundMedia.type === 'image') && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
                zIndex: 1
              }} />
            )}
          </div>
        )}
      </Modal>
    </Stack>
  )
}