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
  Skeleton,
  Image,
  Box,
  AspectRatio,
  Tooltip,
  ScrollArea,
  Modal,
  ActionIcon
} from '@mantine/core';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CubeIcon,
  InformationCircleIcon,
  PhotoIcon,
  EyeIcon,
  XMarkIcon
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [upgradePanelOpen, setUpgradePanelOpen] = useState(false);
  
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
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {foodOptions.map((food) => (
                  <Card
                    key={food._id}
                    shadow="md"
                    p={0}
                    radius="lg"
                    withBorder
                    style={{
                      borderColor: formData.foodOptionId === food._id ? 'var(--mantine-color-orange-5)' : undefined,
                      borderWidth: formData.foodOptionId === food._id ? '2px' : '1px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                    onClick={() => onUpdateFormData({ foodOptionId: food._id })}
                  >
                    {/* Imagen principal */}
                    <Box pos="relative">
                      <AspectRatio ratio={16/9}>
                        <Image
                          src={food.mainImage || food.image || '/api/placeholder/400/225'}
                          alt={food.name}
                          fallbackSrc="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f8f9fa'/%3e%3ctext x='50' y='50' font-size='12' text-anchor='middle' dy='.3em' fill='%236c757d'%3eComida%3c/text%3e%3c/svg%3e"
                          style={{ objectFit: 'cover' }}
                        />
                      </AspectRatio>
                      
                      {/* Badge de selección */}
                      {formData.foodOptionId === food._id && (
                        <Box
                          pos="absolute"
                          top={8}
                          right={8}
                          style={{
                            backgroundColor: 'var(--mantine-color-orange-6)',
                            borderRadius: '50%',
                            padding: '6px',
                            color: 'white'
                          }}
                        >
                          <CubeIcon className="h-4 w-4" />
                        </Box>
                      )}
                      
                      {/* Precio badge */}
                      {food.basePrice > 0 && (
                        <Badge
                          pos="absolute"
                          bottom={8}
                          left={8}
                          size="lg"
                          variant="filled"
                          color="orange"
                          style={{ fontWeight: 700 }}
                        >
                          ${food.basePrice}
                        </Badge>
                      )}
                    </Box>

                    {/* Contenido */}
                    <Stack p="md" gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Text fw={700} size="lg" style={{ lineHeight: 1.3 }}>
                          {food.name}
                        </Text>
                      </Group>
                      
                      {food.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {food.description}
                        </Text>
                      )}
                      
                      {/* Platillos con imágenes en miniatura */}
                      <Stack gap="xs">
                        {food.dishes?.adult && food.dishes.adult.length > 0 && (
                          <Box>
                            <Group gap="xs" mb="xs">
                              <Badge size="sm" color="blue" variant="light">
                                Adultos
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {food.dishes.adult.length} platillo{food.dishes.adult.length !== 1 ? 's' : ''}
                              </Text>
                            </Group>
                            <ScrollArea.Autosize mah={80}>
                              <Group gap="xs">
                                {food.dishes.adult.slice(0, 3).map((dish, index) => (
                                  <Tooltip key={index} label={dish} position="top">
                                    <Box
                                      style={{
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--mantine-color-blue-0)',
                                        padding: '4px 8px',
                                        border: '1px solid var(--mantine-color-blue-2)'
                                      }}
                                    >
                                      <Text size="xs" fw={500} truncate maw={100}>
                                        {dish}
                                      </Text>
                                    </Box>
                                  </Tooltip>
                                ))}
                                {food.dishes.adult.length > 3 && (
                                  <Badge size="xs" color="blue" variant="outline">
                                    +{food.dishes.adult.length - 3} más
                                  </Badge>
                                )}
                              </Group>
                            </ScrollArea.Autosize>
                          </Box>
                        )}
                        
                        {food.dishes?.kids && food.dishes.kids.length > 0 && (
                          <Box>
                            <Group gap="xs" mb="xs">
                              <Badge size="sm" color="green" variant="light">
                                Niños
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {food.dishes.kids.length} platillo{food.dishes.kids.length !== 1 ? 's' : ''}
                              </Text>
                            </Group>
                            <ScrollArea.Autosize mah={80}>
                              <Group gap="xs">
                                {food.dishes.kids.slice(0, 3).map((dish, index) => (
                                  <Tooltip key={index} label={dish} position="top">
                                    <Box
                                      style={{
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--mantine-color-green-0)',
                                        padding: '4px 8px',
                                        border: '1px solid var(--mantine-color-green-2)'
                                      }}
                                    >
                                      <Text size="xs" fw={500} truncate maw={100}>
                                        {dish}
                                      </Text>
                                    </Box>
                                  </Tooltip>
                                ))}
                                {food.dishes.kids.length > 3 && (
                                  <Badge size="xs" color="green" variant="outline">
                                    +{food.dishes.kids.length - 3} más
                                  </Badge>
                                )}
                              </Group>
                            </ScrollArea.Autosize>
                          </Box>
                        )}
                        
                        {/* Upgrades disponibles */}
                        {food.upgrades && (
                          (food.upgrades.adult?.length > 0 || food.upgrades.kids?.length > 0) && (
                            <Box>
                              <Badge size="sm" color="purple" variant="light">
                                Upgrades disponibles
                              </Badge>
                            </Box>
                          )
                        )}
                      </Stack>
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

      {/* Modal para vista previa de imágenes */}
      <Modal
        opened={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Vista previa"
        size="lg"
        centered
      >
        {previewImage && (
          <Image
            src={previewImage}
            alt="Vista previa del platillo"
            style={{ maxWidth: '100%' }}
          />
        )}
      </Modal>
    </motion.div>
  );
}