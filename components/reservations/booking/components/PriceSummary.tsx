'use client';

import React from 'react';
import { Card, Text, Group, Divider, Badge, Stack, ThemeIcon } from '@mantine/core';
import { 
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
  ShoppingCartIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { FormData, PackageOption, FoodOption, EventTheme, ExtraService } from '../types';
import { calculatePricing, formatCurrency, getDayRangeLabel } from '../utils/calculations';

interface PriceSummaryProps {
  formData: FormData;
  packages: PackageOption[];
  foodOptions: FoodOption[];
  eventThemes: EventTheme[];
  extraServices: ExtraService[];
}

export default function PriceSummary({
  formData,
  packages,
  foodOptions,
  eventThemes,
  extraServices
}: PriceSummaryProps) {
  const selectedPackage = packages.find(p => p._id === formData.packageId);
  const selectedFood = foodOptions.find(f => f._id === formData.foodOptionId);
  const selectedTheme = eventThemes.find(t => t._id === formData.eventThemeId);
  
  const pricing = calculatePricing(formData, packages, foodOptions, eventThemes, extraServices);
  
  const totalGuests = (parseInt(formData.adultCount) || 0) + (parseInt(formData.kidsCount) || 0);
  
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <Card shadow="md" p="lg" radius="md" withBorder style={{ position: 'sticky', top: '20px' }}>
      <Group mb="md">
        <ThemeIcon color="blue" size="lg" radius="xl">
          <ShoppingCartIcon className="h-5 w-5" />
        </ThemeIcon>
        <div>
          <Text size="lg" fw={700}>Resumen de Reservación</Text>
          <Text size="sm" c="dimmed">Tu selección actual</Text>
        </div>
      </Group>

      <Stack gap="md">
        {/* Información básica */}
        {formData.childName && (
          <div>
            <Group gap="xs" mb="xs">
              <UserGroupIcon className="h-4 w-4 text-blue-500" />
              <Text size="sm" fw={500}>Cumpleañero</Text>
            </Group>
            <Text size="sm" pl="md">{formData.childName} ({formData.childAge} años)</Text>
            {totalGuests > 0 && (
              <Text size="sm" pl="md" c="dimmed">
                {formData.adultCount} adultos, {formData.kidsCount} niños
              </Text>
            )}
          </div>
        )}

        {/* Fecha y hora */}
        {formData.eventDate && (
          <div>
            <Group gap="xs" mb="xs">
              <CalendarDaysIcon className="h-4 w-4 text-green-500" />
              <Text size="sm" fw={500}>Fecha del evento</Text>
            </Group>
            <Text size="sm" pl="md">{formatDate(formData.eventDate)}</Text>
            {formData.eventTime && (
              <Group gap="xs" pl="md">
                <ClockIcon className="h-3 w-3 text-gray-500" />
                <Text size="sm" c="dimmed">{formatTime(formData.eventTime)}</Text>
              </Group>
            )}
          </div>
        )}

        {/* Paquete seleccionado */}
        {selectedPackage && (
          <div>
            <Group gap="xs" mb="xs">
              <SparklesIcon className="h-4 w-4 text-purple-500" />
              <Text size="sm" fw={500}>Paquete</Text>
            </Group>
            <Text size="sm" pl="md">{selectedPackage.name}</Text>
            <Group gap="xs" pl="md">
              <Text size="sm" c="dimmed">
                {formData.eventDate && getDayRangeLabel(formData.eventDate)}
              </Text>
              <Badge size="sm" variant="light">
                {formatCurrency(pricing.basePrice)}
              </Badge>
            </Group>
          </div>
        )}

        {/* Opciones de comida */}
        {selectedFood && (
          <div>
            <Group gap="xs" mb="xs">
              <div className="h-4 w-4 flex items-center justify-center">🍽️</div>
              <Text size="sm" fw={500}>Alimentos</Text>
            </Group>
            <Text size="sm" pl="md">{selectedFood.name}</Text>
            {formData.selectedDrink && (
              <Text size="xs" pl="md" c="dimmed">
                Bebida: {formData.selectedDrink === 'agua-fresca' && 'Agua Fresca (Horchata)'}
                {formData.selectedDrink === 'refresco-refill' && 'Refresco Refill (Coca-Cola, Sprite, Fanta)'}
              </Text>
            )}
            {pricing.foodPrice > 0 && (
              <Badge size="sm" variant="light" color="orange" ml="md">
                {formatCurrency(pricing.foodPrice)}
              </Badge>
            )}
          </div>
        )}

        {/* Tema seleccionado */}
        {selectedTheme && formData.selectedThemePackage && (
          <div>
            <Group gap="xs" mb="xs">
              <div className="h-4 w-4 flex items-center justify-center">🎨</div>
              <Text size="sm" fw={500}>Tema</Text>
            </Group>
            <Text size="sm" pl="md">{selectedTheme.name}</Text>
            <Text size="xs" pl="md" c="dimmed">{formData.selectedThemePackage}</Text>
            {pricing.themePrice > 0 && (
              <Badge size="sm" variant="light" color="pink" ml="md">
                {formatCurrency(pricing.themePrice)}
              </Badge>
            )}
          </div>
        )}

        {/* Servicios adicionales */}
        {formData.selectedExtraServices && (
          <div>
            <Group gap="xs" mb="xs">
              <div className="h-4 w-4 flex items-center justify-center">✨</div>
              <Text size="sm" fw={500}>Extras</Text>
            </Group>
            {pricing.extrasPrice > 0 && (
              <Badge size="sm" variant="light" color="cyan" ml="md">
                {formatCurrency(pricing.extrasPrice)}
              </Badge>
            )}
          </div>
        )}

        {/* Upgrades de comida */}
        {formData.selectedFoodUpgrades.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">Mejoras de menú</Text>
            {formData.selectedFoodUpgrades.map((upgrade, index) => (
              <Group key={index} gap="xs" pl="md">
                <Text size="xs" c="dimmed">{upgrade.fromDish} → {upgrade.toDish}</Text>
                <Badge size="xs" variant="light" color="yellow">
                  +{formatCurrency(upgrade.additionalPrice)}
                </Badge>
              </Group>
            ))}
          </div>
        )}

        <Divider />

        {/* Total */}
        <div>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Subtotal:</Text>
            <Text size="sm">{formatCurrency(pricing.subtotal)}</Text>
          </Group>
          
          {pricing.discount > 0 && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Descuento:</Text>
              <Text size="sm" c="red">-{formatCurrency(pricing.discount)}</Text>
            </Group>
          )}
          
          <Divider my="xs" />
          
          <Group justify="space-between">
            <Text size="lg" fw={700}>Total:</Text>
            <Text size="xl" fw={700} c="blue">
              {formatCurrency(pricing.total)}
            </Text>
          </Group>
        </div>

        {/* Método de pago */}
        {formData.paymentMethod && (
          <div>
            <Group gap="xs" mb="xs">
              <CreditCardIcon className="h-4 w-4 text-gray-500" />
              <Text size="sm" fw={500}>Método de pago</Text>
            </Group>
            <Text size="sm" pl="md" c="dimmed">
              {formData.paymentMethod === 'transfer' && 'Transferencia bancaria'}
              {formData.paymentMethod === 'cash' && 'Efectivo'}
              {formData.paymentMethod === 'card' && 'Tarjeta'}
            </Text>
          </div>
        )}

        {/* Comentarios especiales */}
        {formData.specialComments && (
          <div>
            <Text size="sm" fw={500} mb="xs">Comentarios especiales</Text>
            <Text size="xs" c="dimmed" pl="md">
              {formData.specialComments}
            </Text>
          </div>
        )}
      </Stack>
    </Card>
  );
}