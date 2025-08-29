import { useState, useEffect } from 'react'

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

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/contact-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          throw new Error('Failed to fetch contact settings')
        }
      } catch (err) {
        console.error('Error fetching contact settings:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Helper functions para obtener datos específicos
  const getPrimaryPhone = () => {
    if (!settings?.phones?.length) return null
    return settings.phones.find(phone => phone.isPrimary) || settings.phones[0]
  }

  const getPrimaryEmail = () => {
    if (!settings?.emails?.length) return null
    return settings.emails.find(email => email.isPrimary) || settings.emails[0]
  }

  const getFullAddress = () => {
    if (!settings?.address) return ''
    const { street, neighborhood, city, state, zipCode } = settings.address
    return `${street}, ${neighborhood}, ${city}, ${state} ${zipCode}`
  }

  const getFormattedSchedules = () => {
    if (!settings?.schedules?.length) return []
    
    const dayLabels = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }

    return settings.schedules.map(schedule => ({
      ...schedule,
      dayLabel: dayLabels[schedule.day as keyof typeof dayLabels] || schedule.day,
      timeRange: schedule.isOpen 
        ? `${schedule.openTime} - ${schedule.closeTime}`
        : 'Cerrado'
    }))
  }

  const getWhatsAppUrl = (customMessage?: string) => {
    if (!settings?.whatsapp?.enabled || !settings?.whatsapp?.number) return null
    
    const message = customMessage || settings.whatsapp.message
    return `https://wa.me/${settings.whatsapp.number}?text=${encodeURIComponent(message)}`
  }

  return {
    settings,
    loading,
    error,
    // Helper functions
    getPrimaryPhone,
    getPrimaryEmail,
    getFullAddress,
    getFormattedSchedules,
    getWhatsAppUrl
  }
}