import { useState } from 'react'
import { notifications } from '@mantine/notifications'

interface UploadResult {
  success: boolean
  url?: string
  type?: 'image' | 'video'
  filename?: string
  size?: number
  mimeType?: string
  error?: string
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    if (!file) {
      notifications.show({
        title: 'Error',
        message: 'No se seleccionó ningún archivo',
        color: 'red'
      })
      return null
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('media', file)

      // Simular progreso durante la carga
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/admin/hero/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result: UploadResult = await response.json()

      if (result.success) {
        notifications.show({
          title: 'Éxito',
          message: `${result.type === 'video' ? 'Video' : 'Imagen'} subida correctamente`,
          color: 'green'
        })
        return result
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Error al subir el archivo',
          color: 'red'
        })
        return null
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      notifications.show({
        title: 'Error',
        message: 'Error de conexión al subir el archivo',
        color: 'red'
      })
      return null
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
    const allValidTypes = [...validImageTypes, ...validVideoTypes]
    
    if (!allValidTypes.includes(file.type)) {
      notifications.show({
        title: 'Tipo de archivo inválido',
        message: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y videos (MP4, WebM, MOV, AVI)',
        color: 'red'
      })
      return false
    }

    // Validar tamaño
    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    const maxSize = validVideoTypes.includes(file.type) ? maxVideoSize : maxImageSize
    const maxSizeText = validVideoTypes.includes(file.type) ? '100MB' : '10MB'
    
    if (file.size > maxSize) {
      notifications.show({
        title: 'Archivo demasiado grande',
        message: `El archivo excede el tamaño máximo de ${maxSizeText}`,
        color: 'red'
      })
      return false
    }

    return true
  }

  return {
    uploadFile,
    validateFile,
    uploading,
    progress
  }
}