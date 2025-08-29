"use client"

import React, { useState, useEffect } from "react"
import {
  Stack,
  Title,
  Paper,
  Group,
  Button,
  Text,
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
  ColorInput,
  Alert,
  Image,
  Divider,
  Progress,
  Loader,
  Slider
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
  IconUpload
} from "@tabler/icons-react"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { HeroContent } from "@/types/hero"
import { useMediaUpload } from "@/hooks/useMediaUpload"
import { useHeroAdmin } from "@/hooks/useHeroAdmin"

export default function HeroManager() {
  const { heroes, loading, createHero, updateHero, deleteHero, activateHero } = useHeroAdmin()
  const [opened, { open, close }] = useDisclosure(false)
  const [editingHero, setEditingHero] = useState<HeroContent | null>(null)
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false)
  const [previewHero, setPreviewHero] = useState<HeroContent | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<File | null>(null)
  const { uploadFile, validateFile, uploading, progress } = useMediaUpload()

  const [formData, setFormData] = useState<Partial<HeroContent>>({
    mainTitle: "",
    brandTitle: "Tramboory",
    subtitle: "",
    primaryButton: { text: "", action: "signup" },
    secondaryButton: { text: "", href: "" },
    backgroundMedia: { type: "gradient", overlayColor: "purple", overlayOpacity: 70 },
    showGlitter: true,
    isActive: false,
    promotion: {
      show: false,
      text: "",
      highlightColor: "yellow"
    }
  })

  const handleEdit = (hero: HeroContent) => {
    setEditingHero(hero)
    setUploadedMedia(null)
    setFormData({
      ...hero,
      backgroundMedia: {
        ...hero.backgroundMedia,
        overlayColor: hero.backgroundMedia?.overlayColor || "purple",
        overlayOpacity: hero.backgroundMedia?.overlayOpacity ?? 70
      },
      promotion: hero.promotion || {
        show: false,
        text: "",
        highlightColor: "yellow"
      }
    })
    open()
  }

  const handleAdd = () => {
    setEditingHero(null)
    setUploadedMedia(null)
    setFormData({
      mainTitle: "",
      brandTitle: "Tramboory",
      subtitle: "",
      primaryButton: { text: "", action: "signup" },
      secondaryButton: { text: "", href: "" },
      backgroundMedia: { type: "gradient", overlayColor: "purple", overlayOpacity: 70 },
      showGlitter: true,
      isActive: false,
      promotion: {
        show: false,
        text: "",
        highlightColor: "yellow"
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
    if (!formData.mainTitle || !formData.subtitle) {
      notifications.show({
        title: "Error",
        message: "Todos los campos requeridos deben estar llenos",
        color: "red"
      })
      return
    }

    // Si hay un archivo pendiente de subir, subirlo primero
    if (uploadedMedia) {
      await handleMediaUpload(uploadedMedia)
    }

    let success = false

    if (editingHero) {
      // Editar existente
      success = await updateHero(editingHero.id!, formData)
    } else {
      // Crear nuevo
      success = await createHero(formData)
    }

    if (success) {
      setUploadedMedia(null)
      close()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteHero(id)
  }

  const handleSetActive = async (id: string) => {
    await activateHero(id)
  }

  const handlePreview = (hero: HeroContent) => {
    setPreviewHero(hero)
    openPreview()
  }

  if (loading) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Loader size="lg" color="blue" />
        <Text c="dimmed">Cargando heroes...</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Gestión de Hero Landing</Title>
          <Text c="dimmed" size="sm">
            Administra el contenido principal de tu página de inicio
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
          Nuevo Hero
        </Button>
      </Group>

      <Alert icon={<IconInfoCircle />} color="blue" variant="light">
        <Text size="sm">
          Solo un hero puede estar activo a la vez. El hero activo será el que se muestre en la página principal.
          Puedes cambiar imágenes, videos, texto y promociones especiales.
        </Text>
      </Alert>

      <Grid>
        {heroes.map((hero) => (
          <Grid.Col key={hero.id} span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" radius="md" withBorder>
              <Card.Section>
                {hero.backgroundMedia.type === "video" && hero.backgroundMedia.url ? (
                  <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                    <video 
                      src={hero.backgroundMedia.url} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                    />
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      backgroundColor: "rgba(0,0,0,0.7)", 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      VIDEO
                    </div>
                  </div>
                ) : hero.backgroundMedia.type === "image" && hero.backgroundMedia.url ? (
                  <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                    <Image 
                      src={hero.backgroundMedia.url} 
                      alt="Fondo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      backgroundColor: "rgba(0,0,0,0.7)", 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      IMAGEN
                    </div>
                  </div>
                ) : hero.backgroundMedia.type === "video" ? (
                  <div style={{ position: "relative", height: 120, backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconVideo size={32} color="gray" />
                    <Text size="xs" c="dimmed" style={{ position: "absolute", bottom: 4, right: 4 }}>
                      SIN VIDEO
                    </Text>
                  </div>
                ) : hero.backgroundMedia.type === "image" ? (
                  <div style={{ position: "relative", height: 120, backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconPhoto size={32} color="gray" />
                    <Text size="xs" c="dimmed" style={{ position: "absolute", bottom: 4, right: 4 }}>
                      SIN IMAGEN
                    </Text>
                  </div>
                ) : (
                  <div style={{ height: 120, background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text c="white" fw={500}>GRADIENTE</Text>
                  </div>
                )}
              </Card.Section>

              <Stack gap="sm" p="sm">
                <Group justify="space-between">
                  <div style={{ flex: 1 }}>
                    <Text fw={500} lineClamp={1}>{hero.mainTitle}</Text>
                    <Text fw={700} size="lg" c="blue" lineClamp={1}>{hero.brandTitle}</Text>
                  </div>
                  {hero.isActive && (
                    <Badge color="green" variant="filled">Activo</Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" lineClamp={2}>
                  {hero.subtitle}
                </Text>

                {hero.promotion?.show && (
                  <Badge color={hero.promotion.highlightColor} variant="light">
                    🎉 {hero.promotion.text}
                  </Badge>
                )}

                <Group justify="space-between" mt="sm">
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="blue"
                      onClick={() => handlePreview(hero)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="yellow"
                      onClick={() => handleEdit(hero)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    {!hero.isActive && (
                      <ActionIcon 
                        variant="light" 
                        color="red"
                        onClick={() => handleDelete(hero.id!)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                  
                  {!hero.isActive && (
                    <Button 
                      size="xs" 
                      variant="light"
                      onClick={() => handleSetActive(hero.id!)}
                    >
                      Activar
                    </Button>
                  )}
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
        title={editingHero ? "Editar Hero" : "Crear Hero"}
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Título Principal"
                placeholder="Ej: Celebra con"
                value={formData.mainTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, mainTitle: e.target.value }))}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Título de Marca"
                placeholder="Tramboory"
                value={formData.brandTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, brandTitle: e.target.value }))}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Subtítulo"
            placeholder="Descripción que aparece debajo del título"
            value={formData.subtitle}
            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
            required
            rows={3}
          />

          <Divider label="Botones de Acción" />

          <Grid>
            <Grid.Col span={8}>
              <TextInput
                label="Texto Botón Primario"
                placeholder="Reserva tu fiesta"
                value={formData.primaryButton?.text}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  primaryButton: { ...prev.primaryButton!, text: e.target.value }
                }))}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Acción"
                data={[
                  { value: "signup", label: "Registro" },
                  { value: "dashboard", label: "Dashboard" },
                  { value: "custom", label: "Personalizado" }
                ]}
                value={formData.primaryButton?.action}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  primaryButton: { ...prev.primaryButton!, action: value as any }
                }))}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={8}>
              <TextInput
                label="Texto Botón Secundario"
                placeholder="Conócenos"
                value={formData.secondaryButton?.text}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  secondaryButton: { ...prev.secondaryButton!, text: e.target.value }
                }))}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Enlace"
                placeholder="/galeria"
                value={formData.secondaryButton?.href}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  secondaryButton: { ...prev.secondaryButton!, href: e.target.value }
                }))}
              />
            </Grid.Col>
          </Grid>

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

          {(formData.backgroundMedia?.type === "image" || formData.backgroundMedia?.type === "video") && (
            <Stack gap="sm">
              <Divider label="Configuración de Overlay" size="sm" />
              
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Color del Overlay"
                    data={[
                      { value: "purple", label: "Púrpura" },
                      { value: "blue", label: "Azul" },
                      { value: "green", label: "Verde" },
                      { value: "orange", label: "Naranja" },
                      { value: "pink", label: "Rosa" },
                      { value: "teal", label: "Verde Azulado" },
                      { value: "red", label: "Rojo" },
                      { value: "indigo", label: "Índigo" }
                    ]}
                    value={formData.backgroundMedia?.overlayColor || "purple"}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      backgroundMedia: { 
                        ...prev.backgroundMedia!, 
                        overlayColor: value as any || "purple"
                      }
                    }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <div>
                    <Text size="sm" fw={500} mb={8}>
                      Opacidad del Overlay ({formData.backgroundMedia?.overlayOpacity || 70}%)
                    </Text>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={formData.backgroundMedia?.overlayOpacity || 70}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        backgroundMedia: { 
                          ...prev.backgroundMedia!, 
                          overlayOpacity: value
                        }
                      }))}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 50, label: '50%' },
                        { value: 100, label: '100%' },
                      ]}
                    />
                  </div>
                </Grid.Col>
              </Grid>
              
              <Text size="xs" c="dimmed">
                El overlay ayuda a mejorar la legibilidad del texto sobre imágenes y videos de fondo
              </Text>
            </Stack>
          )}

          <Switch
            label="Mostrar efecto glitter"
            checked={formData.showGlitter}
            onChange={(e) => setFormData(prev => ({ ...prev, showGlitter: e.currentTarget.checked }))}
          />

          <Divider label="Promoción Especial (Opcional)" />

          <Switch
            label="Mostrar promoción"
            checked={formData.promotion?.show || false}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              promotion: { 
                ...prev.promotion, 
                show: e.currentTarget.checked,
                text: prev.promotion?.text || "",
                highlightColor: prev.promotion?.highlightColor || "yellow"
              }
            }))}
          />

          {formData.promotion?.show && (
            <Grid>
              <Grid.Col span={8}>
                <TextInput
                  label="Texto de promoción"
                  placeholder="¡Oferta especial este mes!"
                  value={formData.promotion?.text || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    promotion: { 
                      ...prev.promotion, 
                      show: prev.promotion?.show || false,
                      text: e.target.value,
                      highlightColor: prev.promotion?.highlightColor || "yellow"
                    }
                  }))}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label="Color"
                  data={[
                    { value: "yellow", label: "Amarillo" },
                    { value: "red", label: "Rojo" },
                    { value: "green", label: "Verde" },
                    { value: "blue", label: "Azul" },
                    { value: "purple", label: "Púrpura" }
                  ]}
                  value={formData.promotion?.highlightColor || "yellow"}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    promotion: { 
                      ...prev.promotion, 
                      show: prev.promotion?.show || false,
                      text: prev.promotion?.text || "",
                      highlightColor: value as any || "yellow"
                    }
                  }))}
                />
              </Grid.Col>
            </Grid>
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
              {editingHero ? "Actualizar" : "Crear"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de Preview */}
      <Modal 
        opened={previewOpened} 
        onClose={closePreview} 
        title="Vista Previa"
        size="xl"
      >
        {previewHero && (
          <div style={{ 
            minHeight: 400, 
            background: previewHero.backgroundMedia.type === "gradient" 
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#f8f9fa",
            borderRadius: 8,
            padding: "2rem",
            color: "white",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative"
          }}>
            {previewHero.showGlitter && (
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <IconSparkles size={20} />
              </div>
            )}
            
            <Title order={1} style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
              {previewHero.mainTitle}
            </Title>
            <Title order={1} style={{ fontSize: "3.5rem", marginBottom: "1rem", color: "#ffd43b" }}>
              {previewHero.brandTitle}
            </Title>
            <Text size="lg" style={{ marginBottom: "2rem", maxWidth: 600, margin: "0 auto 2rem" }}>
              {previewHero.subtitle}
            </Text>
            
            {previewHero.promotion?.show && (
              <Badge 
                color={previewHero.promotion.highlightColor} 
                size="lg" 
                style={{ marginBottom: "1rem" }}
              >
                🎉 {previewHero.promotion.text}
              </Badge>
            )}
            
            <Group justify="center" gap="md">
              <Button size="lg" color="yellow" c="dark">
                {previewHero.primaryButton.text}
              </Button>
              <Button size="lg" variant="outline" c="white">
                {previewHero.secondaryButton.text}
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </Stack>
  )
}