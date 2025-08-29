'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Text, 
  Group, 
  Button, 
  Select,
  Badge,
  Stack,
  Alert,
  ThemeIcon,
  Image,
  Box,
  Modal,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CubeIcon,
  InformationCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { StepProps, FoodOption } from '../types';

interface FoodOptionsStepProps extends StepProps {
  foodOptions: FoodOption[];
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

export default function FoodOptionsStepV2({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  foodOptions
}: FoodOptionsStepProps) {
  const [selectedFoodId, setSelectedFoodId] = useState(formData.foodOptionId || '');
  const [selectedUpgrades, setSelectedUpgrades] = useState<any[]>(formData.selectedFoodUpgrades || []);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [upgradeModalOpened, setUpgradeModalOpened] = useState(false);
  const [selectedDishForUpgrade, setSelectedDishForUpgrade] = useState<{
    dish: string;
    category: 'adult' | 'kids';
    availableUpgrades: any[];
    currentSelections: any[];
  } | null>(null);

  const handleFoodSelect = (foodId: string) => {
    setSelectedFoodId(foodId);
    setSelectedUpgrades([]);
    onUpdateFormData({ 
      foodOptionId: foodId,
      selectedFoodUpgrades: []
    });
  };

  const calculateUpgradesPrice = () => {
    return selectedUpgrades.reduce((total, upgrade) => 
      total + ((upgrade.additionalPrice || 0) * (upgrade.quantity || 1)), 0
    );
  };

  const openUpgradeModal = (dish: string, category: 'adult' | 'kids') => {
    const selectedFood = foodOptions.find(f => f._id === selectedFoodId);
    if (!selectedFood) return;

    const availableUpgrades = category === 'adult' 
      ? (selectedFood.upgrades?.adult || []).filter(u => u.fromDish === dish)
      : (selectedFood.upgrades?.kids || []).filter(u => u.fromDish === dish);

    const currentSelections = selectedUpgrades.filter(u => 
      u.category === category && u.fromDish === dish
    );

    setSelectedDishForUpgrade({
      dish,
      category,
      availableUpgrades,
      currentSelections
    });
    setUpgradeModalOpened(true);
  };

  const handleUpgradeSelection = (upgrade: any) => {
    if (!selectedDishForUpgrade) return;

    // Remove any existing upgrade for this dish
    const filteredUpgrades = selectedUpgrades.filter(u => 
      !(u.category === selectedDishForUpgrade.category && 
        u.fromDish === selectedDishForUpgrade.dish)
    );

    // Add new upgrade if selected (applies to all adults)
    const newUpgrades = upgrade 
      ? [...filteredUpgrades, { 
          ...upgrade, 
          category: selectedDishForUpgrade.category,
          quantity: parseInt(formData.adultCount || '1') // Para todos los adultos
        }]
      : filteredUpgrades;

    setSelectedUpgrades(newUpgrades);
    onUpdateFormData({ selectedFoodUpgrades: newUpgrades });
    setUpgradeModalOpened(false); // Cerrar modal después de seleccionar
  };

  const getUpgradeCount = (dish: string, category: 'adult' | 'kids') => {
    const upgrade = selectedUpgrades.find(u => 
      u.category === category && u.fromDish === dish
    );
    return upgrade ? upgrade.quantity || 1 : 0;
  };

  const getUpgradeForDish = (dish: string, category: 'adult' | 'kids') => {
    return selectedUpgrades.find(u => 
      u.category === category && u.fromDish === dish
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Group mb="md">
            <CubeIcon className="h-6 w-6 text-orange-500" />
            <Text size="lg" fw={600}>Opciones de Alimentos y Bebidas</Text>
          </Group>
          
          <Text c="dimmed" size="sm" mb="xl">
            Selecciona el paquete de alimentos para tu evento
          </Text>

          {/* Lista de opciones de comida */}
          <Stack gap="md" mb="xl">
            {foodOptions.length === 0 ? (
              <Alert 
                icon={<InformationCircleIcon className="h-5 w-5" />}
                color="blue"
              >
                No hay opciones de alimentos disponibles actualmente.
              </Alert>
            ) : (
              <Stack gap="sm">
                {/* Opción "Sin alimentos" */}
                <Card
                  shadow="xs"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: selectedFoodId === '' ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-gray-3)',
                    borderWidth: selectedFoodId === '' ? '2px' : '1px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: selectedFoodId === '' ? 'var(--mantine-color-gray-0)' : 'white',
                    '&:hover': {
                      backgroundColor: selectedFoodId === '' ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-0)'
                    }
                  }}
                  onClick={() => handleFoodSelect('')}
                >
                  <Group justify="space-between" align="center">
                    {/* Left section - Icon + Content */}
                    <Group gap="md" align="center">
                      <ThemeIcon size="lg" color="gray" variant="light" radius="md">
                        <CubeIcon className="h-5 w-5" />
                      </ThemeIcon>
                      
                      <div>
                        <Text fw={600} size="md">Sin alimentos</Text>
                        <Text size="sm" c="dimmed">Solo evento básico sin servicio de comida</Text>
                        <Badge size="sm" color="gray" variant="dot" mt="xs">Básico</Badge>
                      </div>
                    </Group>
                    
                    {/* Right section - Price + Check */}
                    <Group gap="md" align="center">
                      <Badge size="lg" color="gray" variant="filled" fw={700}>$0</Badge>
                      {selectedFoodId === '' && (
                        <ThemeIcon color="green" size="lg" radius="xl" variant="filled">
                          <CheckIcon className="h-4 w-4" />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Group>
                </Card>

                {foodOptions.map((food) => (
                  <Card
                    key={food._id}
                    shadow="xs"
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: selectedFoodId === food._id ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-gray-3)',
                      borderWidth: selectedFoodId === food._id ? '2px' : '1px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: selectedFoodId === food._id ? 'var(--mantine-color-orange-0)' : 'white',
                      '&:hover': {
                        backgroundColor: selectedFoodId === food._id ? 'var(--mantine-color-orange-1)' : 'var(--mantine-color-gray-0)'
                      }
                    }}
                  >
                    {/* Header clickeable */}
                    <Group 
                      justify="space-between" 
                      align="center"
                      onClick={() => handleFoodSelect(food._id)}
                      mb={selectedFoodId === food._id ? "md" : 0}
                    >
                      {/* Left section - Image + Content */}
                      <Group gap="md" align="center">
                        <Box style={{ 
                          width: '60px', 
                          height: '60px', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderRadius: '8px'
                        }}>
                          {food.mainImage ? (
                            <Image
                              src={food.mainImage}
                              alt={food.name}
                              width={60}
                              height={60}
                              radius="md"
                              style={{ 
                                objectFit: 'cover', 
                                width: '60px', 
                                height: '60px',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <ThemeIcon size="xl" color="orange" variant="light" radius="md">
                              <CubeIcon className="h-6 w-6" />
                            </ThemeIcon>
                          )}
                        </Box>
                        
                        <div style={{ flex: 1 }}>
                          <Text fw={600} size="lg">{food.name}</Text>
                          {food.description && (
                            <Text size="sm" c="dimmed" lineClamp={2} mb="xs">{food.description}</Text>
                          )}
                          
                          {/* Badges informativos */}
                          <Group gap="xs">
                            {(food.dishes?.adult?.length || 0) > 0 && (
                              <Badge size="sm" color="blue" variant="light">
                                {food.dishes?.adult?.length} platillos adultos
                              </Badge>
                            )}
                            {(food.dishes?.kids?.length || 0) > 0 && (
                              <Badge size="sm" color="green" variant="light">
                                {food.dishes?.kids?.length} platillos niños  
                              </Badge>
                            )}
                            <Badge size="sm" color="orange" variant="dot">
                              {food.category === 'main' ? 'Principal' : 
                               food.category === 'appetizer' ? 'Entrada' :
                               food.category === 'dessert' ? 'Postre' : 'Bebida'}
                            </Badge>
                          </Group>
                        </div>
                      </Group>
                      
                      {/* Right section - Price + Check */}
                      <Group gap="md" align="center">
                        <Badge size="xl" color="orange" variant="filled" fw={700} style={{ fontSize: '16px' }}>
                          ${food.basePrice}
                        </Badge>
                        {selectedFoodId === food._id && (
                          <ThemeIcon color="green" size="lg" radius="xl" variant="filled">
                            <CheckIcon className="h-4 w-4" />
                          </ThemeIcon>
                        )}
                      </Group>
                    </Group>

                  {/* Contenido expandible ultra-compacto */}
                  {selectedFoodId === food._id && (
                    <>
                      <Divider my="xs" color="orange.2" />
                      
                      {/* Contenido expandible en formato compacto */}
                      <Stack gap="xs" p="xs" style={{ backgroundColor: 'var(--mantine-color-orange-0)', borderRadius: '6px', marginTop: '8px' }}>
                        
                        {/* Información de platillos incluidos */}
                        <Group justify="space-between" align="center">
                          <Group gap="xs" align="center">
                            <Text size="xs" fw={600} c="orange.7">Incluye:</Text>
                            {(food.dishes?.adult?.length || 0) > 0 && (
                              <Badge size="xs" color="blue" variant="light">
                                {food.dishes?.adult?.length} adultos
                              </Badge>
                            )}
                            {(food.dishes?.kids?.length || 0) > 0 && (
                              <Badge size="xs" color="green" variant="light">
                                {food.dishes?.kids?.length} niños
                              </Badge>
                            )}
                          </Group>
                          
                          {/* Indicador de upgrades disponibles */}
                          {((food.upgrades?.adult?.length || 0) > 0 || (food.upgrades?.kids?.length || 0) > 0) && (
                            <Badge size="xs" color="purple" variant="dot">
                              {((food.upgrades?.adult?.length || 0) + (food.upgrades?.kids?.length || 0))} upgrades
                            </Badge>
                          )}
                        </Group>

                        {/* Selección de bebida integrada */}
                        <Group gap="xs" align="center">
                          <Text size="xs" fw={600} c="orange.7" style={{ minWidth: '45px' }}>Bebida:</Text>
                          <Select
                            placeholder="Selecciona..."
                            data={drinkOptions}
                            value={formData.selectedDrink}
                            onChange={(value) => onUpdateFormData({ selectedDrink: value || '' })}
                            size="xs"
                            clearable
                            style={{ flex: 1 }}
                            styles={{
                              input: { fontSize: '11px', minHeight: '24px', height: '24px' },
                              wrapper: { flex: 1 }
                            }}
                          />
                        </Group>

                        {/* Platillos para adultos con botones de upgrade */}
                        {(food.dishes?.adult?.length || 0) > 0 && (
                          <Box>
                            <Text size="xs" fw={600} c="blue.7" mb="xs">Platillos para Adultos:</Text>
                            <Stack gap="xs">
                              {(food.dishes?.adult || []).map((dish, index) => {
                                const hasUpgrades = (food.upgrades?.adult || []).some(u => u.fromDish === dish);
                                const currentUpgrade = getUpgradeForDish(dish, 'adult');
                                
                                return (
                                  <Group key={index} justify="space-between" align="center" p="xs" 
                                         style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: '4px' }}>
                                    <Group gap="xs" align="center">
                                      <Text size="xs" c="blue.7" lineClamp={1}>
                                        • {currentUpgrade ? currentUpgrade.toDish : dish}
                                      </Text>
                                      {currentUpgrade && (
                                        <Badge size="xs" color="purple" variant="filled">
                                          +${currentUpgrade.additionalPrice} x{currentUpgrade.quantity}
                                        </Badge>
                                      )}
                                      {!currentUpgrade && (
                                        <Badge size="xs" color="blue" variant="light">
                                          Incluido
                                        </Badge>
                                      )}
                                    </Group>
                                    {hasUpgrades && (
                                      <Button
                                        size="xs"
                                        variant="light"
                                        color="purple"
                                        onClick={() => openUpgradeModal(dish, 'adult')}
                                        style={{ fontSize: '10px', height: '24px' }}
                                      >
                                        {currentUpgrade ? 'Cambiar' : 'Upgrade'}
                                      </Button>
                                    )}
                                  </Group>
                                );
                              })}
                            </Stack>
                          </Box>
                        )}

                        {/* Platillos para niños con botones de upgrade */}
                        {(food.dishes?.kids?.length || 0) > 0 && (
                          <Box>
                            <Text size="xs" fw={600} c="green.7" mb="xs">Platillos para Niños:</Text>
                            <Stack gap="xs">
                              {(food.dishes?.kids || []).map((dish, index) => {
                                const hasUpgrades = (food.upgrades?.kids || []).some(u => u.fromDish === dish);
                                const upgradeCount = getUpgradeCount(dish, 'kids');
                                
                                return (
                                  <Group key={index} justify="space-between" align="center" p="xs"
                                         style={{ backgroundColor: 'var(--mantine-color-green-0)', borderRadius: '4px' }}>
                                    <Group gap="xs" align="center">
                                      <Text size="xs" c="green.7" lineClamp={1}>• {dish}</Text>
                                      {upgradeCount > 0 && (
                                        <Badge size="xs" color="purple" variant="filled">
                                          {upgradeCount} upgrade{upgradeCount > 1 ? 's' : ''}
                                        </Badge>
                                      )}
                                    </Group>
                                    {hasUpgrades && (
                                      <Button
                                        size="xs"
                                        variant="light"
                                        color="purple"
                                        onClick={() => openUpgradeModal(dish, 'kids')}
                                        style={{ fontSize: '10px', height: '24px' }}
                                      >
                                        {upgradeCount > 0 ? 'Editar' : 'Cambiar'}
                                      </Button>
                                    )}
                                  </Group>
                                );
                              })}
                            </Stack>
                          </Box>
                        )}


                        {/* Resumen de selecciones (si hay upgrades seleccionados) */}
                        {selectedUpgrades.length > 0 && (
                          <Group justify="space-between" p="xs" 
                                style={{ backgroundColor: 'var(--mantine-color-purple-1)', borderRadius: '4px', border: '1px solid var(--mantine-color-purple-3)' }}>
                            <Text size="xs" fw={600} c="purple.7">
                              {selectedUpgrades.length} upgrade{selectedUpgrades.length > 1 ? 's' : ''} seleccionado{selectedUpgrades.length > 1 ? 's' : ''}
                            </Text>
                            <Badge color="purple" size="sm" variant="filled" fw={700}>
                              +${calculateUpgradesPrice()}
                            </Badge>
                          </Group>
                        )}
                      </Stack>
                    </>
                  )}
                </Card>
              ))}
              </Stack>
            )}
          </Stack>

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
        title="Vista previa del platillo"
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

      {/* Modal para upgrades de platillos */}
      <Modal
        opened={upgradeModalOpened}
        onClose={() => setUpgradeModalOpened(false)}
        title={selectedDishForUpgrade ? `Cambiar platillo para adultos` : 'Upgrade de Platillo'}
        size="sm"
        centered
      >
        {selectedDishForUpgrade && (
          <Stack gap="md">
            <Box>
              <Text size="sm" fw={600} c="orange.7" mb="xs">
                Platillo actual: <Text span c="dimmed">{selectedDishForUpgrade.dish}</Text>
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Este cambio aplicará para todos los {formData.adultCount} adultos
              </Text>
            </Box>

            <Stack gap="xs">
              {/* Opción original (sin upgrade) */}
              <Button
                variant={selectedDishForUpgrade.currentSelections.length === 0 ? "filled" : "light"}
                color={selectedDishForUpgrade.currentSelections.length === 0 ? "blue" : "gray"}
                size="sm"
                onClick={() => handleUpgradeSelection(null)}
                fullWidth
                justify="space-between"
              >
                <Group gap="sm">
                  <Text>{selectedDishForUpgrade.dish}</Text>
                  <Badge size="xs" color="blue" variant="light">Incluido</Badge>
                </Group>
              </Button>
              
              {/* Opciones de upgrade */}
              {selectedDishForUpgrade.availableUpgrades.map((upgrade, upgradeIndex) => {
                const isSelected = selectedDishForUpgrade.currentSelections.some(s => s.toDish === upgrade.toDish);
                const totalPrice = upgrade.additionalPrice * parseInt(formData.adultCount || '1');
                
                return (
                  <Button
                    key={upgradeIndex}
                    variant={isSelected ? "filled" : "light"}
                    color={isSelected ? "purple" : "gray"}
                    size="sm"
                    onClick={() => handleUpgradeSelection(upgrade)}
                    fullWidth
                    justify="space-between"
                    leftSection={upgrade.image && (
                      <Box style={{ 
                        width: '40px', 
                        height: '40px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: '6px',
                        flexShrink: 0
                      }}>
                        <Image
                          src={upgrade.image}
                          alt={upgrade.toDish}
                          width={40}
                          height={40}
                          radius="sm"
                          style={{ 
                            objectFit: 'cover', 
                            width: '40px', 
                            height: '40px' 
                          }}
                        />
                      </Box>
                    )}
                  >
                    <Group gap="sm">
                      <Text>{upgrade.toDish}</Text>
                      <Badge size="xs" color="purple" variant="light">
                        +${totalPrice} total
                      </Badge>
                    </Group>
                  </Button>
                );
              })}
            </Stack>

            <Text size="xs" c="dimmed" ta="center" mt="sm">
              El precio se multiplica por {formData.adultCount} adulto{parseInt(formData.adultCount || '1') > 1 ? 's' : ''}
            </Text>
          </Stack>
        )}
      </Modal>
    </>
  );
}