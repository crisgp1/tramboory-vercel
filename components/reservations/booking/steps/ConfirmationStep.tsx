'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Text, Group, Button, Badge, Stack, Center, Image } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import { FormData } from '../types';

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

interface EventTheme {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  packages: {
    name: string;
    pieces: number;
    price: number;
  }[];
  themes: string[];
}

interface ConfirmationStepProps {
  reservationId: string | null;
  formData: FormData;
}

export default function ConfirmationStep({ 
  reservationId,
  formData
}: ConfirmationStepProps) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<EventTheme | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchThemeData = async () => {
      if (!formData.eventThemeId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/event-themes/${formData.eventThemeId}`);
        if (response.ok) {
          const theme = await response.json();
          setSelectedTheme(theme);
        }
      } catch (error) {
        console.error('Error fetching theme data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemeData();
  }, [formData.eventThemeId]);

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Card shadow="sm" p="xl" radius="md" withBorder>
        <Center mb="xl">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
            >
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="h-10 w-10 text-green-600" />
              </div>
            </motion.div>
          </div>
        </Center>

        <Text size="xl" fw={700} ta="center" mb="md">
          ¡Reservación Confirmada!
        </Text>
        
        <Text size="sm" c="dimmed" ta="center" mb="xl">
          Tu reservación ha sido creada exitosamente. Recibirás un correo con los detalles.
        </Text>

        {reservationId && (
          <Card shadow="xs" p="md" radius="sm" bg="gray.0" mb="xl">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Número de reservación:</Text>
                <Badge size="lg" variant="light">
                  #{reservationId.slice(-6).toUpperCase()}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Cumpleañero:</Text>
                <Text size="sm" fw={500}>{formData.childName}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Fecha del evento:</Text>
                <Text size="sm" fw={500}>
                  {formData.eventDate?.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Selected Theme Display */}
        {selectedTheme && selectedTheme.imageUrl && (
          <Card shadow="xs" p="md" radius="sm" mb="xl">
            <Text size="sm" fw={600} mb="sm" ta="center" c="purple">
              Temática Seleccionada
            </Text>
            <Center mb="sm">
              <Image
                src={selectedTheme.imageUrl}
                alt={selectedTheme.name}
                w={200}
                h={150}
                radius="md"
                fit="cover"
                fallbackSrc="/api/placeholder/200/150"
              />
            </Center>
            <Text size="sm" fw={500} ta="center" mb="xs">
              {selectedTheme.name}
            </Text>
            {selectedTheme.description && (
              <Text size="xs" c="dimmed" ta="center">
                {selectedTheme.description}
              </Text>
            )}
          </Card>
        )}

        <Group justify="center" gap="md">
          <Button
            variant="outline"
            onClick={() => router.push('/reservaciones')}
          >
            Ver mis reservaciones
          </Button>
          <Button
            onClick={() => router.push('/')}
          >
            Volver al inicio
          </Button>
        </Group>
      </Card>
    </motion.div>
  );
}