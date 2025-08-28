'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Text, Group, Button } from '@mantine/core';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { StepProps } from '../types';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

interface ExtrasStepProps extends StepProps {
  eventThemes: any[];
  extraServices: any[];
}

export default function ExtrasStep({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  eventThemes,
  extraServices
}: ExtrasStepProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Card shadow="sm" p="xl" radius="md" withBorder>
        <Group mb="md">
          <Text size="lg" fw={600}>Servicios Adicionales</Text>
        </Group>
        
        <Text c="dimmed" size="sm" mb="xl">
          Personaliza tu evento con temas y servicios adicionales
        </Text>

        <Group justify="space-between" mt="xl">
          <Button
            variant="subtle"
            leftSection={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={onBack}
          >
            Atrás
          </Button>
          <Button
            rightSection={<ArrowRightIcon className="h-4 w-4" />}
            onClick={onNext}
          >
            Continuar
          </Button>
        </Group>
      </Card>
    </motion.div>
  );
}