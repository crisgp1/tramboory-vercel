import { useState, useEffect } from 'react';
import { CarouselCard } from '@/types/carousel';
import { notifications } from '@mantine/notifications';

export function useCarouselAdmin() {
  const [cards, setCards] = useState<CarouselCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/carousel');
      const data = await response.json();
      
      if (data.success) {
        setCards(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching carousel cards:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las tarjetas del carousel',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData: Partial<CarouselCard>): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();
      
      if (data.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Tarjeta creada correctamente',
          color: 'green'
        });
        await fetchCards(); // Recargar datos
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating carousel card:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al crear la tarjeta',
        color: 'red'
      });
      return false;
    }
  };

  const updateCard = async (id: string, cardData: Partial<CarouselCard>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();
      
      if (data.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Tarjeta actualizada correctamente',
          color: 'green'
        });
        await fetchCards(); // Recargar datos
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating carousel card:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al actualizar la tarjeta',
        color: 'red'
      });
      return false;
    }
  };

  const deleteCard = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        notifications.show({
          title: 'Éxito',
          message: 'Tarjeta eliminada correctamente',
          color: 'green'
        });
        await fetchCards(); // Recargar datos
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting carousel card:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al eliminar la tarjeta',
        color: 'red'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    createCard,
    updateCard,
    deleteCard,
    refetch: fetchCards
  };
}