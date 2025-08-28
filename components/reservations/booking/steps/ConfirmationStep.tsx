'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Text, Group, Button, Badge, Stack, Center } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import { FormData } from '../types';

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

interface ConfirmationStepProps {
  reservationId: string | null;
  formData: FormData;
}

export default function ConfirmationStep({ 
  reservationId,
  formData
}: ConfirmationStepProps) {
  const router = useRouter();

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