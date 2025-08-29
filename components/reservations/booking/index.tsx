'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, Stepper, Center, Loader, Grid } from '@mantine/core';
import { AnimatePresence } from 'framer-motion';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/es-mx';

// Components
import PriceSummary from './components/PriceSummary';

// Steps
import BasicInfoStep from './steps/BasicInfoStep';
import DateTimeStep from './steps/DateTimeStep';
import PackageStep from './steps/PackageStep';
import FoodOptionsStepV2 from './steps/FoodOptionsStepV2';
import ExtrasStep from './steps/ExtrasStep';
import PaymentStep from './steps/PaymentStep';
import ConfirmationStep from './steps/ConfirmationStep';

// Hooks
import { useReservationForm } from './hooks/useReservationForm';

// Types
import { StepType } from './types';

const stepTitles = {
  basic: 'Información básica',
  datetime: 'Fecha y hora',
  package: 'Paquete',
  food: 'Alimentos',
  extras: 'Extras',
  payment: 'Pago',
  confirmation: 'Confirmación'
};

const steps: StepType[] = ['basic', 'datetime', 'package', 'food', 'extras', 'payment', 'confirmation'];

export default function ReservationBookingForm() {
  const router = useRouter();
  const {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    submitReservation,
    isLoading,
    reservationId,
    packages,
    foodOptions,
    eventThemes,
    extraServices,
    availableSlots,
    blockedDates,
    appliedCoupon,
    setAppliedCoupon,
    discountAmount,
    setDiscountAmount,
    user,
    isUserLoaded
  } = useReservationForm();

  // Check authentication
  useEffect(() => {
    if (isUserLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isUserLoaded, user, router]);

  if (!isUserLoaded || !user) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = async () => {
    if (currentStep === 'payment') {
      // Submit reservation
      const id = await submitReservation();
      if (id) {
        setCurrentStep('confirmation');
      }
    } else {
      goToNextStep();
    }
  };

  const handleBack = () => {
    goToPreviousStep();
  };

  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      onUpdateFormData: updateFormData,
      onNext: handleNext,
      onBack: handleBack,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === steps.length - 1
    };

    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep {...commonProps} />;
      case 'datetime':
        return <DateTimeStep {...commonProps} />;
      case 'package':
        return (
          <PackageStep 
            {...commonProps} 
            packages={packages}
            isLoading={isLoading}
          />
        );
      case 'food':
        return (
          <FoodOptionsStepV2 
            {...commonProps}
            foodOptions={foodOptions}
            packages={packages}
          />
        );
      case 'extras':
        return (
          <ExtrasStep 
            {...commonProps}
            eventThemes={eventThemes}
            extraServices={extraServices}
          />
        );
      case 'payment':
        return (
          <PaymentStep 
            {...commonProps}
            packages={packages}
            foodOptions={foodOptions}
            eventThemes={eventThemes}
            extraServices={extraServices}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            user={user}
            isLoading={isLoading}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationStep 
            reservationId={reservationId}
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DatesProvider settings={{ locale: 'es-mx', firstDayOfWeek: 0 }}>
      <Container size="xl" py="xl">
        {currentStep !== 'confirmation' && (
          <Card shadow="xs" p="md" radius="md" mb="xl">
            <Stepper 
              active={currentStepIndex} 
              size="sm"
            >
              {steps.slice(0, -1).map((step, index) => (
                <Stepper.Step 
                  key={step}
                  label={stepTitles[step]}
                  onClick={() => {
                    if (index < currentStepIndex) {
                      setCurrentStep(step);
                    }
                  }}
                  style={{ cursor: index < currentStepIndex ? 'pointer' : 'default' }}
                />
              ))}
            </Stepper>
          </Card>
        )}

        {currentStep !== 'confirmation' ? (
          <Grid>
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <AnimatePresence mode="wait">
                {renderCurrentStep()}
              </AnimatePresence>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <PriceSummary
                formData={formData}
                packages={packages}
                foodOptions={foodOptions}
                eventThemes={eventThemes}
                extraServices={extraServices}
              />
            </Grid.Col>
          </Grid>
        ) : (
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        )}
      </Container>
    </DatesProvider>
  );
}