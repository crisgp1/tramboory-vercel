'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Text, Group, Button, RadioGroup, Radio, Stack, Divider, Badge, Space } from '@mantine/core';
import { 
  ArrowLeftIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { StepProps } from '../types';
import { calculatePricing, formatCurrency } from '../utils/calculations';
import TermsAndConditions from '../components/TermsAndConditions';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

interface PaymentStepProps extends StepProps {
  packages: any[];
  foodOptions: any[];
  eventThemes: any[];
  extraServices: any[];
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
  discountAmount: number;
  setDiscountAmount: (amount: number) => void;
  user: any;
  isLoading: boolean;
}

export default function PaymentStep({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  packages,
  foodOptions,
  eventThemes,
  extraServices,
  isLoading
}: PaymentStepProps) {
  const pricing = calculatePricing(formData, packages, foodOptions, eventThemes, extraServices);
  
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
            <CreditCardIcon className="h-6 w-6 text-blue-500" />
            <Text size="lg" fw={600}>Método de Pago</Text>
          </Group>
          
          <Text c="dimmed" size="sm" mb="xl">
            Selecciona cómo realizarás el pago
          </Text>

          <Card shadow="xs" p="md" radius="sm" mb="xl">
            <Text size="sm" fw={500} mb="md">Resumen del pedido</Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Paquete base:</Text>
                <Text size="sm" fw={500}>{formatCurrency(pricing.basePrice)}</Text>
              </Group>
              {pricing.foodPrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Alimentos:</Text>
                  <Text size="sm" fw={500}>{formatCurrency(pricing.foodPrice)}</Text>
                </Group>
              )}
              {pricing.themePrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Temática:</Text>
                  <Text size="sm" fw={500}>{formatCurrency(pricing.themePrice)}</Text>
                </Group>
              )}
              {pricing.extrasPrice > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Extras:</Text>
                  <Text size="sm" fw={500}>{formatCurrency(pricing.extrasPrice)}</Text>
                </Group>
              )}
              
              <Divider my="xs" />
              
              <Group justify="space-between">
                <Text fw={600}>Total:</Text>
                <Text size="lg" fw={700} c="blue">
                  {formatCurrency(pricing.total)}
                </Text>
              </Group>
            </Stack>
          </Card>

          <RadioGroup
            value={formData.paymentMethod}
            onChange={(value) => onUpdateFormData({ paymentMethod: value as any })}
            label="Método de pago"
            required
          >
            <Stack mt="md">
              <Radio
                value="transfer"
                label={
                  <Group gap="xs">
                    <DocumentTextIcon className="h-5 w-5" />
                    <div>
                      <Text size="sm" fw={500}>Transferencia bancaria</Text>
                      <Text size="xs" c="dimmed">Recibirás los datos bancarios por correo</Text>
                    </div>
                  </Group>
                }
              />
              <Radio
                value="cash"
                label={
                  <Group gap="xs">
                    <BanknotesIcon className="h-5 w-5" />
                    <div>
                      <Text size="sm" fw={500}>Efectivo</Text>
                      <Text size="xs" c="dimmed">Paga en el local</Text>
                    </div>
                  </Group>
                }
              />
              <Radio
                value="card"
                label={
                  <Group gap="xs">
                    <CreditCardIcon className="h-5 w-5" />
                    <div>
                      <Text size="sm" fw={500}>Tarjeta de crédito/débito</Text>
                      <Text size="xs" c="dimmed">Paga con tarjeta en el local</Text>
                    </div>
                  </Group>
                }
              />
            </Stack>
          </RadioGroup>

          <Space h="xl" />

          <TermsAndConditions
            accepted={formData.termsAccepted}
            onAcceptanceChange={(accepted) => onUpdateFormData({ termsAccepted: accepted })}
          />

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
              loading={isLoading}
              disabled={!formData.paymentMethod || !formData.termsAccepted}
            >
              Confirmar reservación
            </Button>
          </Group>
        </Card>
      </form>
    </motion.div>
  );
}