'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  Text, 
  Group, 
  Button, 
  Select,
  SimpleGrid,
  Badge,
  Stack,
  Alert,
  ThemeIcon,
  Skeleton
} from '@mantine/core';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CubeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StepProps, FoodOption } from '../types';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

interface FoodOptionsStepProps extends StepProps {
  foodOptions: FoodOption[];
  packages: any[];
}

// Opciones de bebidas disponibles
const drinkOptions = [
  { 
    value: 'agua-fresca', 
    label: 'Agua Fresca (Horchata)' 
  },
  { 
    value: 'refresco-refill', 
    label: 'Refresco Refill (Coca-Cola, Sprite, Fanta)' 
  }
];

export default function FoodOptionsStep({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  foodOptions,
  packages
}: FoodOptionsStepProps) {
  const selectedFood = foodOptions.find(f => f._id === formData.foodOptionId);
  
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
            <CubeIcon className="h-6 w-6 text-orange-500" />
            <Text size="lg" fw={600}>Opciones de Alimentos</Text>
          </Group>
          
          <Text c="dimmed" size="sm" mb="xl">
            Selecciona el paquete de alimentos para tu evento (opcional)
          </Text>

          {/* Selección de paquete de alimentos */}
          <Stack gap="md" mb="xl">
            <Text size="md" fw={500}>Paquete de alimentos</Text>
            
            {foodOptions.length === 0 ? (
              <Alert 
                icon={<InformationCircleIcon className="h-5 w-5" />}
                color="blue"
              >
                No hay opciones de alimentos disponibles actualmente.
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {foodOptions.map((food) => (
                  <Card
                    key={food._id}
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: formData.foodOptionId === food._id ? 'var(--mantine-color-orange-5)' : undefined,
                      backgroundColor: formData.foodOptionId === food._id ? 'var(--mantine-color-orange-0)' : undefined,
                      cursor: 'pointer'
                    }}
                    onClick={() => onUpdateFormData({ foodOptionId: food._id })}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>{food.name}</Text>
                      {formData.foodOptionId === food._id && (
                        <ThemeIcon color="orange" size="sm" radius="xl">
                          <CubeIcon className="h-3 w-3" />
                        </ThemeIcon>
                      )}
                    </Group>
                    
                    {food.description && (
                      <Text size="sm" c="dimmed" mb="md">
                        {food.description}
                      </Text>
                    )}
                    
                    <Stack gap="xs">
                      {food.dishes?.adult && food.dishes.adult.length > 0 && (
                        <div>
                          <Text size="sm" fw={500} c="orange">Adultos:</Text>
                          <Text size="xs" c="dimmed">
                            {food.dishes.adult.join(', ')}
                          </Text>
                        </div>
                      )}
                      
                      {food.dishes?.kids && food.dishes.kids.length > 0 && (
                        <div>
                          <Text size="sm" fw={500} c="orange">Niños:</Text>
                          <Text size="xs" c="dimmed">
                            {food.dishes.kids.join(', ')}
                          </Text>
                        </div>
                      )}
                      
                      {food.basePrice > 0 && (
                        <Badge size="lg" variant="light" color="orange">
                          ${food.basePrice}
                        </Badge>
                      )}
                    </Stack>
                  </Card>
                ))}
                
                {/* Opción "Sin alimentos" */}
                <Card
                  shadow="sm"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: formData.foodOptionId === '' ? 'var(--mantine-color-gray-5)' : undefined,
                    backgroundColor: formData.foodOptionId === '' ? 'var(--mantine-color-gray-0)' : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => onUpdateFormData({ foodOptionId: '', selectedDrink: '' })}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={600}>Sin alimentos</Text>
                    {formData.foodOptionId === '' && (
                      <ThemeIcon color="gray" size="sm" radius="xl">
                        <CubeIcon className="h-3 w-3" />
                      </ThemeIcon>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    Solo evento sin servicio de alimentos
                  </Text>
                </Card>
              </SimpleGrid>
            )}
          </Stack>

          {/* Selección de bebida */}
          {formData.foodOptionId && (
            <Stack gap="md" mb="xl">
              <Text size="md" fw={500}>Bebida</Text>
              <Text size="sm" c="dimmed">
                Selecciona la bebida que acompañará los alimentos
              </Text>
              
              <Select
                placeholder="Selecciona una bebida"
                data={drinkOptions}
                value={formData.selectedDrink}
                onChange={(value) => onUpdateFormData({ selectedDrink: value || '' })}
                searchable
                clearable
              />
              
              {formData.selectedDrink && (
                <Alert color="green" icon={<InformationCircleIcon className="h-5 w-5" />}>
                  Bebida seleccionada: {drinkOptions.find(d => d.value === formData.selectedDrink)?.label}
                </Alert>
              )}
            </Stack>
          )}

          <Group justify="space-between" mt="xl">
            <Button
              variant="subtle"
              leftSection={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={onBack}
            >
              Atrás
            </Button>
            <Button
              type="submit"
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