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
import { useContactSettings } from '@/hooks/useContactSettings';

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
  const { getBankingInfo, formatCLABE, getCashDiscount, calculateCashDiscount, settings, loading } = useContactSettings();
  const bankingInfo = getBankingInfo();
  const cashDiscount = getCashDiscount();
  
  
  
  // Update form data with cash discount settings when cash discount is available
  const updatedFormData = {
    ...formData,
    cashDiscountSettings: cashDiscount || undefined
  };
  
  const pricing = calculatePricing(updatedFormData, packages, foodOptions, eventThemes, extraServices);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass the updated form data with discount settings
    onUpdateFormData({ cashDiscountSettings: cashDiscount || undefined });
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
              
              {pricing.cashDiscountAmount && pricing.cashDiscountAmount > 0 && (
                <Group justify="space-between">
                  <Text size="sm" c="green">Descuento en efectivo:</Text>
                  <Text size="sm" fw={500} c="green">-{formatCurrency(pricing.cashDiscountAmount)}</Text>
                </Group>
              )}
              
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

          {/* Banking Information Display */}
          {formData.paymentMethod === 'transfer' && settings?.bankingInfo?.enabled && (
            <Card shadow="xs" p="md" radius="sm" mt="md" className="bg-blue-50 border-blue-200">
              <Text size="sm" fw={600} mb="md" className="text-blue-800">
                Información para Transferencia Bancaria
              </Text>
              {bankingInfo ? (
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Banco:</Text>
                    <Text size="sm">{bankingInfo.bankName}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Titular:</Text>
                    <Text size="sm">{bankingInfo.accountHolder}</Text>
                  </Group>
                  {bankingInfo.clabe && (
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>CLABE:</Text>
                      <Text size="sm" fw={600} className="font-mono text-blue-600">
                        {formatCLABE(bankingInfo.clabe)}
                      </Text>
                    </Group>
                  )}
                  {bankingInfo.accountNumber && (
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>Cuenta:</Text>
                      <Text size="sm" fw={600} className="font-mono">
                        {bankingInfo.accountNumber}
                      </Text>
                    </Group>
                  )}
                  {bankingInfo.paymentAddress && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" fw={500}>Dirección:</Text>
                      <Text size="sm" className="text-right">{bankingInfo.paymentAddress}</Text>
                    </Group>
                  )}
                  {bankingInfo.paymentInstructions && (
                    <Card shadow="xs" p="sm" radius="xs" className="bg-blue-100 mt-2">
                      <Text size="xs" className="text-blue-700">
                        <strong>Instrucciones:</strong> {bankingInfo.paymentInstructions}
                      </Text>
                    </Card>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  Los datos bancarios se enviarán por correo electrónico después de confirmar tu reservación.
                </Text>
              )}
            </Card>
          )}

          {/* Cash Discount Information */}
          {formData.paymentMethod === 'cash' && cashDiscount && (
            <Card shadow="xs" p="md" radius="sm" mt="md" className="bg-green-50 border-green-200">
              <Text size="sm" fw={600} mb="sm" className="text-green-800">
                💰 ¡Descuento por Pago en Efectivo!
              </Text>
              <Text size="sm" className="text-green-700">
                {cashDiscount.description} - {cashDiscount.percentage}% de descuento
              </Text>
              <Text size="xs" className="text-green-600 mt-1">
                * {cashDiscount.appliesTo === 'remaining' 
                    ? 'Aplica solo al pago restante en el día del evento'
                    : 'Aplica al total de la reservación'}
              </Text>
            </Card>
          )}

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