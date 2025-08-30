'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  FileInput,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Image,
  Alert,
  Center,
  Badge,
  Divider
} from '@mantine/core';
import {
  IconUpload,
  IconPhoto,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface FaviconInfo {
  currentFavicon: string;
  lastUpdated?: string;
  size?: string;
}

export default function FaviconManager() {
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentFavicon, setCurrentFavicon] = useState<FaviconInfo>({
    currentFavicon: '/favicon.ico'
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load current favicon info on component mount
    fetchCurrentFavicon();
  }, []);

  useEffect(() => {
    if (faviconFile) {
      // Create preview URL for the selected file
      const url = URL.createObjectURL(faviconFile);
      setPreviewUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [faviconFile]);

  const fetchCurrentFavicon = async () => {
    try {
      // In a real implementation, you might fetch favicon metadata from an API
      // For now, we'll just show the default favicon info
      const faviconInfo: FaviconInfo = {
        currentFavicon: '/favicon.ico',
        lastUpdated: new Date().toISOString(),
        size: 'Múltiples tamaños'
      };
      setCurrentFavicon(faviconInfo);
    } catch (error) {
      console.error('Error fetching favicon info:', error);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setFaviconFile(file);
    
    if (file) {
      // Validate file type and size
      const validTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/icon', 'image/png', 'image/jpeg', 'image/gif'];
      const maxSize = 1024 * 1024; // 1MB
      
      if (!validTypes.some(type => file.type === type || file.name.toLowerCase().endsWith('.ico'))) {
        notifications.show({
          title: 'Tipo de archivo no válido',
          message: 'Por favor selecciona un archivo .ico, .png, .jpg o .gif',
          color: 'red',
        });
        setFaviconFile(null);
        return;
      }
      
      if (file.size > maxSize) {
        notifications.show({
          title: 'Archivo muy grande',
          message: 'El archivo debe ser menor a 1MB',
          color: 'red',
        });
        setFaviconFile(null);
        return;
      }
    }
  };

  const handleUpload = async () => {
    if (!faviconFile) {
      notifications.show({
        title: 'Error',
        message: 'Por favor selecciona un archivo',
        color: 'red',
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('favicon', faviconFile);
      
      // In a real implementation, you would upload to your storage service
      // and update the favicon in the public directory
      const response = await fetch('/api/admin/favicon', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        notifications.show({
          title: 'Éxito',
          message: 'Favicon actualizado correctamente. Los cambios pueden tardar unos minutos en aparecer.',
          color: 'green',
        });
        
        // Update current favicon info
        setCurrentFavicon({
          currentFavicon: result.faviconUrl || '/favicon.ico',
          lastUpdated: new Date().toISOString(),
          size: 'Actualizado'
        });
        
        setFaviconFile(null);
        setPreviewUrl(null);
        
        // Refresh the page to show the new favicon
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Error al subir el archivo');
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar el favicon. Inténtalo de nuevo.',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetToDefault = async () => {
    if (!confirm('¿Restaurar el favicon predeterminado de Tramboory?')) {
      return;
    }

    try {
      setUploading(true);
      
      const response = await fetch('/api/admin/favicon', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: 'Favicon restaurado al predeterminado',
          color: 'green',
        });
        
        setCurrentFavicon({
          currentFavicon: '/favicon.ico',
          lastUpdated: new Date().toISOString(),
          size: 'Predeterminado'
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al restaurar el favicon',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
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
              backgroundColor: 'var(--mantine-color-indigo-6)',
              borderRadius: 'var(--mantine-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconPhoto size={24} color="white" />
          </div>
          <Stack gap={0}>
            <Title order={2}>Gestión de Favicon</Title>
            <Text size="sm" c="dimmed">
              Personaliza el icono que aparece en la pestaña del navegador
            </Text>
          </Stack>
        </Group>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-lg)' }}>
        {/* Current Favicon */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Text fw={600} size="lg">Favicon Actual</Text>
              <Badge color="blue" variant="light">
                Activo
              </Badge>
            </Group>
            
            <Center py="lg">
              <Image
                src={currentFavicon.currentFavicon}
                alt="Favicon actual"
                w={64}
                h={64}
                fit="contain"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e9ecef'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' dy='.3em' fill='%23666'%3EIcon%3C/text%3E%3C/svg%3E"
              />
            </Center>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Tamaño:</Text>
                <Text size="sm">{currentFavicon.size || 'Desconocido'}</Text>
              </Group>
              {currentFavicon.lastUpdated && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Actualizado:</Text>
                  <Text size="sm">
                    {new Date(currentFavicon.lastUpdated).toLocaleDateString('es-MX')}
                  </Text>
                </Group>
              )}
            </Stack>

            <Button
              variant="light"
              color="gray"
              onClick={resetToDefault}
              loading={uploading}
              size="sm"
            >
              Restaurar Predeterminado
            </Button>
          </Stack>
        </Card>

        {/* Upload New Favicon */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600} size="lg">Subir Nuevo Favicon</Text>
            
            <FileInput
              label="Seleccionar archivo"
              placeholder="Haz clic para seleccionar..."
              accept="image/*,.ico"
              value={faviconFile}
              onChange={handleFileSelect}
              leftSection={<IconUpload size={16} />}
            />

            {previewUrl && (
              <>
                <Divider label="Vista previa" />
                <Center py="md">
                  <Stack align="center" gap="sm">
                    <Image
                      src={previewUrl}
                      alt="Vista previa"
                      w={64}
                      h={64}
                      fit="contain"
                    />
                    <Badge size="sm" color="green">Vista previa</Badge>
                  </Stack>
                </Center>
              </>
            )}

            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Text size="sm">
                <strong>Formatos admitidos:</strong> .ico, .png, .jpg, .gif<br />
                <strong>Tamaño recomendado:</strong> 32x32, 64x64 o múltiples tamaños<br />
                <strong>Tamaño máximo:</strong> 1MB
              </Text>
            </Alert>

            <Group justify="flex-end">
              <Button
                onClick={handleUpload}
                loading={uploading}
                disabled={!faviconFile}
                leftSection={<IconCheck size={16} />}
              >
                Actualizar Favicon
              </Button>
            </Group>
          </Stack>
        </Card>
      </div>

      <Alert icon={<IconAlertCircle size={16} />} color="yellow">
        <Text size="sm">
          <strong>Nota:</strong> Los cambios en el favicon pueden tardar algunos minutos en aparecer 
          debido al caché del navegador. Es posible que necesites limpiar el caché o hacer una recarga forzada (Ctrl+F5).
        </Text>
      </Alert>
    </Stack>
  );
}