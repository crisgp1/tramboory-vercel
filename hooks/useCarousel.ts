import { useState, useEffect } from 'react';
import { CarouselCard } from '@/types/carousel';

export function useCarousel() {
  const [cards, setCards] = useState<CarouselCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/carousel');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar las tarjetas del carousel');
      }
      
      setCards(data.data || []);
    } catch (err) {
      console.error('Error fetching carousel cards:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Usar datos por defecto en caso de error
      setCards([
        {
          id: '1',
          title: 'Fiestas Épicas',
          emoji: '🎉',
          description: 'Creamos aventuras increíbles donde tu peque es la estrella. ¡Cada fiesta es única y súper divertida!',
          icon: 'GiPartyPopper',
          backgroundMedia: { type: 'gradient' },
          gradientColors: 'from-pink-500 to-purple-600',
          isActive: true,
          order: 1
        },
        {
          id: '2',
          title: 'Zona Segura',
          emoji: '🛡️',
          description: 'Mientras los niños saltan y juegan como locos, tú te relajas sabiendo que todo está bajo control.',
          icon: 'FiShield',
          backgroundMedia: { type: 'gradient' },
          gradientColors: 'from-blue-500 to-cyan-600',
          isActive: true,
          order: 2
        },
        {
          id: '3',
          title: 'Todo Listo',
          emoji: '🎈',
          description: 'Ponemos la decoración, la comida rica y la diversión. ¡Tú solo trae las ganas de festejar!',
          icon: 'GiBalloons',
          backgroundMedia: { type: 'gradient' },
          gradientColors: 'from-yellow-500 to-orange-600',
          isActive: true,
          order: 3
        },
        {
          id: '4',
          title: 'Fotos Geniales',
          emoji: '📸',
          description: 'Capturamos todas las risas y travesuras para que revivas estos momentos cuando quieras.',
          icon: 'FiCamera',
          backgroundMedia: { type: 'gradient' },
          gradientColors: 'from-green-500 to-teal-600',
          isActive: true,
          order: 4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    error,
    refetch: fetchCards
  };
}