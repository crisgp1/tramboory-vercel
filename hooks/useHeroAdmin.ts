import { useState, useEffect } from 'react'
import { HeroContent } from '@/types/hero'
import { notifications } from '@mantine/notifications'

export function useHeroAdmin() {
  const [heroes, setHeroes] = useState<HeroContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHeroes()
  }, [])

  const fetchHeroes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/hero')
      const data = await response.json()
      
      if (data.success) {
        // Mapear _id a id para compatibilidad
        const mappedHeroes = data.data.map((hero: any) => ({
          ...hero,
          id: hero._id || hero.id
        }))
        setHeroes(mappedHeroes)
        setError(null)
      } else {
        setError(data.error || 'Error al cargar los heroes')
      }
    } catch (err) {
      setError('Error de conexión al cargar los heroes')
      console.error('Error fetching heroes:', err)
    } finally {
      setLoading(false)
    }
  }

  const createHero = async (heroData: Partial<HeroContent>): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(heroData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchHeroes() // Recargar la lista
        notifications.show({
          title: 'Éxito',
          message: 'Hero creado correctamente',
          color: 'green'
        })
        return true
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Error al crear el hero',
          color: 'red'
        })
        return false
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error de conexión al crear el hero',
        color: 'red'
      })
      return false
    }
  }

  const updateHero = async (id: string, heroData: Partial<HeroContent>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/hero/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(heroData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchHeroes() // Recargar la lista
        notifications.show({
          title: 'Éxito',
          message: 'Hero actualizado correctamente',
          color: 'green'
        })
        return true
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Error al actualizar el hero',
          color: 'red'
        })
        return false
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error de conexión al actualizar el hero',
        color: 'red'
      })
      return false
    }
  }

  const deleteHero = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/hero/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchHeroes() // Recargar la lista
        notifications.show({
          title: 'Éxito',
          message: 'Hero eliminado correctamente',
          color: 'green'
        })
        return true
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Error al eliminar el hero',
          color: 'red'
        })
        return false
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error de conexión al eliminar el hero',
        color: 'red'
      })
      return false
    }
  }

  const activateHero = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/hero/${id}/activate`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchHeroes() // Recargar la lista
        notifications.show({
          title: 'Éxito',
          message: 'Hero activado correctamente',
          color: 'green'
        })
        return true
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Error al activar el hero',
          color: 'red'
        })
        return false
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error de conexión al activar el hero',
        color: 'red'
      })
      return false
    }
  }

  return {
    heroes,
    loading,
    error,
    fetchHeroes,
    createHero,
    updateHero,
    deleteHero,
    activateHero
  }
}