'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  TextInput,
  Textarea,
  Modal,
  Table,
  Badge,
  Loader,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  ScrollArea,
  Select,
  MultiSelect,
  FileInput,
  Divider
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconCalendar,
  IconPencil,
  IconTrash,
  IconEye,
  IconClock,
  IconSend,
  IconUpload,
  IconX
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface ScheduledPost {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: string;
  publishedDate?: string;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  author: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  platform: 'website' | 'social' | 'newsletter' | 'all';
  socialMediaSettings?: {
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
  publishAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostFormData {
  title: string;
  content: string;
  imageUrl: string;
  scheduledDate: Date | null;
  tags: string[];
  priority: string;
  platform: string;
  socialMediaSettings: {
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
}

export default function PostScheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    imageUrl: '',
    scheduledDate: null,
    tags: [],
    priority: 'medium',
    platform: 'website',
    socialMediaSettings: {
      instagram: false,
      facebook: false,
      tiktok: false
    }
  });

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' }
  ];

  const platformOptions = [
    { value: 'website', label: 'Sitio Web' },
    { value: 'social', label: 'Redes Sociales' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'all', label: 'Todas las Plataformas' }
  ];

  const availableTags = [
    'promoción',
    'evento',
    'fiesta',
    'descuento',
    'nuevo',
    'celebración',
    'cumpleaños',
    'infantil',
    'especial'
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/posts');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      } else {
        notifications.show({ title: 'Error', message: 'Error al cargar las publicaciones', color: 'red' });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      notifications.show({ title: 'Error', message: 'Error al cargar las publicaciones', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.scheduledDate) {
      notifications.show({
        title: 'Error',
        message: 'Por favor completa todos los campos requeridos',
        color: 'red'
      });
      return;
    }

    setSubmitting(true);
    try {
      const method = editingPost ? 'PUT' : 'POST';
      const url = editingPost ? `/api/admin/posts?id=${editingPost._id}` : '/api/admin/posts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ 
          title: 'Éxito', 
          message: data.message || 'Publicación guardada correctamente', 
          color: 'green' 
        });
        fetchPosts();
        resetForm();
        close();
      } else {
        notifications.show({ title: 'Error', message: data.error, color: 'red' });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      notifications.show({ title: 'Error', message: 'Error al guardar la publicación', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || '',
      scheduledDate: new Date(post.scheduledDate),
      tags: post.tags,
      priority: post.priority,
      platform: post.platform,
      socialMediaSettings: post.socialMediaSettings || {
        instagram: false,
        facebook: false,
        tiktok: false
      }
    });
    open();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación programada?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({ title: 'Éxito', message: 'Publicación eliminada correctamente', color: 'green' });
        fetchPosts();
      } else {
        notifications.show({ title: 'Error', message: data.error, color: 'red' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      notifications.show({ title: 'Error', message: 'Error al eliminar la publicación', color: 'red' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      scheduledDate: null,
      tags: [],
      priority: 'medium',
      platform: 'website',
      socialMediaSettings: {
        instagram: false,
        facebook: false,
        tiktok: false
      }
    });
    setEditingPost(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'blue', label: 'Programada' },
      published: { color: 'green', label: 'Publicada' },
      cancelled: { color: 'gray', label: 'Cancelada' },
      failed: { color: 'red', label: 'Fallida' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge color={config.color} variant="light" size="sm">
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'gray', label: 'Baja' },
      medium: { color: 'blue', label: 'Media' },
      high: { color: 'red', label: 'Alta' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge color={config.color} variant="light" size="xs">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="md">
          <div 
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--mantine-color-purple-6)',
              borderRadius: 'var(--mantine-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconCalendar size={24} color="white" />
          </div>
          <Stack gap={0}>
            <Title order={2}>Programador de Publicaciones</Title>
            <Text size="sm" c="dimmed">
              Programa publicaciones para que aparezcan automáticamente en fechas específicas
            </Text>
          </Stack>
        </Group>
        
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            resetForm();
            open();
          }}
          size="md"
        >
          Nueva Publicación
        </Button>
      </Group>

      {/* Posts Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text>Cargando publicaciones programadas...</Text>
          </Stack>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Título</Table.Th>
                  <Table.Th>Programada para</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Prioridad</Table.Th>
                  <Table.Th>Plataforma</Table.Th>
                  <Table.Th>Etiquetas</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {posts.map((post) => (
                  <Table.Tr key={post._id}>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500} size="sm" lineClamp={2}>
                          {post.title}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {post.content}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {formatDate(post.scheduledDate)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {getStatusBadge(post.status)}
                    </Table.Td>
                    <Table.Td>
                      {getPriorityBadge(post.priority)}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" tt="capitalize">
                        {post.platform === 'all' ? 'Todas' : post.platform}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} size="xs" variant="light">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Text size="xs" c="dimmed">
                            +{post.tags.length - 2}
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="gray"
                          onClick={() => handleEdit(post)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          color="red"
                          onClick={() => handleDelete(post._id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        size="xl"
        title={editingPost ? 'Editar publicación programada' : 'Nueva publicación programada'}
        closeOnEscape={!submitting}
        closeOnClickOutside={!submitting}
      >
        <Stack gap="md">
          <TextInput
            label="Título *"
            placeholder="Título de la publicación"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          
          <Textarea
            label="Contenido *"
            placeholder="Contenido de la publicación..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            minRows={4}
            maxRows={8}
            required
          />

          <TextInput
            label="URL de Imagen (opcional)"
            placeholder="https://example.com/image.jpg"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          />

          <DateTimePicker
            label="Fecha y Hora de Publicación *"
            placeholder="Selecciona cuándo publicar"
            value={formData.scheduledDate}
            onChange={(date) => setFormData(prev => ({ ...prev, scheduledDate: date ? new Date(date) : null }))}
            minDate={new Date()}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)' }}>
            <Select
              label="Prioridad"
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ ...prev, priority: value || 'medium' }))}
              data={priorityOptions}
            />
            
            <Select
              label="Plataforma"
              value={formData.platform}
              onChange={(value) => setFormData(prev => ({ ...prev, platform: value || 'website' }))}
              data={platformOptions}
            />
          </div>

          <MultiSelect
            label="Etiquetas"
            placeholder="Selecciona etiquetas relevantes"
            data={availableTags}
            value={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            searchable
          />

          {formData.platform === 'social' || formData.platform === 'all' && (
            <>
              <Divider label="Configuración de Redes Sociales" />
              <Group>
                <Switch
                  label="Instagram"
                  checked={formData.socialMediaSettings.instagram}
                  onChange={(event) => 
                    setFormData(prev => ({
                      ...prev,
                      socialMediaSettings: {
                        ...prev.socialMediaSettings,
                        instagram: event.currentTarget.checked
                      }
                    }))
                  }
                />
                <Switch
                  label="Facebook"
                  checked={formData.socialMediaSettings.facebook}
                  onChange={(event) => 
                    setFormData(prev => ({
                      ...prev,
                      socialMediaSettings: {
                        ...prev.socialMediaSettings,
                        facebook: event.currentTarget.checked
                      }
                    }))
                  }
                />
                <Switch
                  label="TikTok"
                  checked={formData.socialMediaSettings.tiktok}
                  onChange={(event) => 
                    setFormData(prev => ({
                      ...prev,
                      socialMediaSettings: {
                        ...prev.socialMediaSettings,
                        tiktok: event.currentTarget.checked
                      }
                    }))
                  }
                />
              </Group>
            </>
          )}

          <Group justify="flex-end" mt="lg">
            <Button
              variant="subtle"
              onClick={() => {
                resetForm();
                close();
              }}
            >
              Cancelar
            </Button>
            <Button
              loading={submitting}
              onClick={handleSubmit}
              leftSection={<IconSend size={16} />}
            >
              {editingPost ? 'Actualizar' : 'Programar'} Publicación
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}