import { useState, useEffect } from 'react'
import { HeroContent } from '@/types/hero'

export function useHeroContent() {
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHeroContent()
  }, [])

  const fetchHeroContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hero/active')
      const data = await response.json()
      
      if (data.success) {
        // Mapear _id a id para compatibilidad
        const hero = data.data ? {
          ...data.data,
          id: data.data._id || data.data.id
        } : null
        setHeroContent(hero)
        setError(null)
      } else {
        setError(data.error || 'Error al cargar el contenido del hero')
      }
    } catch (err) {
      setError('Error de conexión al cargar el contenido del hero')
      console.error('Error fetching hero content:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateHeroContent = async (newContent: Partial<HeroContent>) => {
    try {
      const response = await fetch('/api/hero/active', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newContent)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setHeroContent(data.data)
        return true
      } else {
        setError(data.error || 'Error al actualizar el contenido del hero')
        return false
      }
    } catch (err) {
      setError('Error de conexión al actualizar el contenido del hero')
      return false
    }
  }

  return {
    heroContent,
    loading,
    error,
    updateHeroContent,
    refetch: fetchHeroContent
  }
}