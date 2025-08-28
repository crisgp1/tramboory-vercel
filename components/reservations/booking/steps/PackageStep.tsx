'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  SimpleGrid,
  NumberInput,
  Modal,
  List,
  ThemeIcon,
  Stack,
  Skeleton,
  Alert
} from '@mantine/core';
import { 
  SparklesIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { StepProps, PackageOption } from '../types';
import { formatCurrency, isWeekend, getDayRangeLabel } from '../utils/calculations';

interface PackageStepProps extends StepProps {
  packages: PackageOption[];
  isLoading: boolean;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function PackageStep({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  packages,
  isLoading
}: PackageStepProps) {
  const [selectedPackageModal, setSelectedPackageModal] = useState<PackageOption | null>(null);
  
  const selectedPackage = packages.find(p => p._id === formData.packageId);
  const totalGuests = (parseInt(formData.adultCount) || 0) + (parseInt(formData.kidsCount) || 0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPackage && totalGuests < selectedPackage.maxGuests) {
      const missingGuests = selectedPackage.maxGuests - totalGuests;
      const confirmMessage = `Has seleccionado ${totalGuests} invitados de ${selectedPackage.maxGuests} disponibles.\n\n` +
                           `Faltan ${missingGuests} invitados para completar la capacidad.\n\n` +
                           `¿Deseas continuar con ${totalGuests} invitados?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    onNext();
  };

  const getPackagePrice = (pkg: PackageOption) => {
    console.log('📦 Package data:', pkg);
    
    if (!formData.eventDate) {
      const price = (pkg as any).pricing?.weekday || (pkg as any).basePrice || 0;
      console.log('📅 No date, returning default price:', price);
      return price;
    }
    
    const weekend = isWeekend(formData.eventDate);
    console.log('🗓️ Is weekend:', weekend, 'Date:', formData.eventDate);
    
    // Don't filter by availability flags for now - show all packages
    const price = weekend 
      ? ((pkg as any).pricing?.weekend || (pkg as any).basePrice || 0)
      : ((pkg as any).pricing?.weekday || (pkg as any).basePrice || 0);
      
    console.log('💰 Calculated price:', price);
    return price;
  };

  return (
    <>
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
              <Text size="lg" fw={600}>Selecciona tu Paquete</Text>
            </Group>
            
            <Text c="dimmed" size="sm" mb="xl">
              Elige el paquete que mejor se adapte a tu celebración
            </Text>

            {isLoading ? (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={180} radius="md" />
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {packages.map((pkg) => {
                  const price = getPackagePrice(pkg);
                  const isSelected = formData.packageId === pkg._id;
                  const isAvailable = true; // Always available for now - will fix pricing first
                  
                  console.log(`🎯 Package ${pkg.name}: price=${price}, available=${isAvailable}, selected=${isSelected}`);
                  
                  return (
                    <Card
                      key={pkg._id}
                      shadow="sm"
                      p="lg"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                        cursor: 'pointer',
                        opacity: 1
                      }}
                      onClick={() => onUpdateFormData({ packageId: pkg._id })}
                    >
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Text fw={600} size="lg">{pkg.name}</Text>
                          {pkg.popular && (
                            <Badge color="pink" variant="light" size="sm">
                              Popular
                            </Badge>
                          )}
                        </div>
                        {isSelected && (
                          <ThemeIcon color="blue" size="lg" radius="xl">
                            <CheckIconSolid className="h-5 w-5" />
                          </ThemeIcon>
                        )}
                      </Group>
                      
                      <Text size="sm" c="dimmed" mb="md">
                        {pkg.description}
                      </Text>
                      
                      <Group gap="xs" mb="md">
                        <UserGroupIcon className="h-4 w-4 text-gray-500" />
                        <Text size="sm">Hasta {pkg.maxGuests} invitados</Text>
                      </Group>
                      
                      <Group justify="space-between" align="flex-end">
                        <div>
                          <Text size="xl" fw={700} c="blue">
                            {formatCurrency(price)}
                          </Text>
                          {formData.eventDate && (
                            <Text size="xs" c="dimmed">
                              {getDayRangeLabel(formData.eventDate)}
                            </Text>
                          )}
                        </div>
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPackageModal(pkg);
                          }}
                        >
                          Ver detalles
                        </Button>
                      </Group>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}

            {selectedPackage && (
              <Card mt="xl" p="md" radius="sm" bg="gray.0">
                <Text size="sm" fw={500} mb="md">Número de invitados</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <NumberInput
                    label="Adultos"
                    value={formData.adultCount}
                    onChange={(value) => onUpdateFormData({ adultCount: value?.toString() || '' })}
                    min={0}
                    max={selectedPackage.maxGuests}
                    required
                  />
                  <NumberInput
                    label="Niños"
                    value={formData.kidsCount}
                    onChange={(value) => onUpdateFormData({ kidsCount: value?.toString() || '' })}
                    min={0}
                    max={selectedPackage.maxGuests}
                    required
                  />
                </SimpleGrid>
                
                {totalGuests > 0 && (
                  <Alert 
                    mt="md" 
                    color={totalGuests > selectedPackage.maxGuests ? 'red' : 'blue'}
                    icon={<InformationCircleIcon className="h-5 w-5" />}
                  >
                    Total: {totalGuests} de {selectedPackage.maxGuests} invitados
                    {totalGuests > selectedPackage.maxGuests && ' (Excede la capacidad)'}
                  </Alert>
                )}
              </Card>
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
                disabled={!formData.packageId || totalGuests === 0 || (selectedPackage && totalGuests > selectedPackage.maxGuests)}
              >
                Continuar
              </Button>
            </Group>
          </Card>
        </form>
      </motion.div>

      <Modal
        opened={!!selectedPackageModal}
        onClose={() => setSelectedPackageModal(null)}
        title={selectedPackageModal?.name}
        size="md"
      >
        {selectedPackageModal && (
          <Stack>
            <Text>{selectedPackageModal.description}</Text>
            {selectedPackageModal.features && (
              <>
                <Text fw={500}>Características incluidas:</Text>
                <List
                  spacing="xs"
                  icon={
                    <ThemeIcon color="teal" size={20} radius="xl">
                      <CheckIcon className="h-3 w-3" />
                    </ThemeIcon>
                  }
                >
                  {selectedPackageModal.features.map((feature, index) => (
                    <List.Item key={index}>
                      <Text size="sm">{feature}</Text>
                    </List.Item>
                  ))}
                </List>
              </>
            )}
            <Group>
              {selectedPackageModal.duration && (
                <Badge size="lg">Duración: {selectedPackageModal.duration} horas</Badge>
              )}
              <Badge size="lg">Capacidad: {selectedPackageModal.maxGuests} personas</Badge>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}