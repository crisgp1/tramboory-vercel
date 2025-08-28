'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TextInput,
  Select,
  Card,
  Text,
  Space,
  SimpleGrid,
  Badge,
  Group,
  Button
} from '@mantine/core';
import { 
  UserGroupIcon,
  CakeIcon,
  SparklesIcon,
  ArrowRightIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { StepProps } from '../types';

const ageOptions = Array.from({ length: 18 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1} año${i > 0 ? 's' : ''}`
}));

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function BasicInfoStep({ 
  formData, 
  onUpdateFormData, 
  onNext 
}: StepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Group mb="md">
            <SparklesIcon className="h-6 w-6 text-blue-500" />
            <Text size="lg" fw={600}>Información Básica</Text>
          </Group>
          
          <Text c="dimmed" size="sm" mb="xl">
            Comencemos con los datos del cumpleañero
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Nombre del niño(a)"
              placeholder="Ej: María"
              value={formData.childName}
              onChange={(e) => onUpdateFormData({ childName: e.target.value })}
              required
              leftSection={<CakeIcon className="h-4 w-4" />}
            />

            <Select
              label="Edad"
              placeholder="Selecciona la edad"
              value={formData.childAge}
              onChange={(value) => onUpdateFormData({ childAge: value || '' })}
              data={ageOptions}
              required
              leftSection={<UserGroupIcon className="h-4 w-4" />}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 1 }} spacing="md" mt="md">
            <TextInput
              label="Teléfono de contacto"
              placeholder="Ej: 55 1234 5678"
              value={formData.customerPhone}
              onChange={(e) => onUpdateFormData({ customerPhone: e.target.value })}
              required
              leftSection={<PhoneIcon className="h-4 w-4" />}
            />
          </SimpleGrid>

          <Space h="xl" />

          <Group justify="flex-end">
            <Button
              type="submit"
              size="md"
              rightSection={<ArrowRightIcon className="h-4 w-4" />}
            >
              Continuar
            </Button>
          </Group>
        </Card>
      </form>
    </motion.div>
  );
}