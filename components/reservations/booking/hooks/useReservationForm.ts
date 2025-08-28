import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { FormData, StepType, PackageOption, FoodOption, EventTheme, ExtraService } from '../types';
import { saveFormDataToStorage, loadFormDataFromStorage, clearFormDataFromStorage } from '../utils/storage';
import { validateStep } from '../utils/validation';

const initialFormData: FormData = {
  childName: '',
  childAge: '',
  customerPhone: '',
  adultCount: '',
  kidsCount: '',
  eventDate: null,
  eventTime: '',
  packageId: '',
  foodOptionId: '',
  selectedFoodUpgrades: [],
  selectedDrink: '',
  eventThemeId: '',
  selectedThemePackage: '',
  selectedExtraServices: '',
  specialComments: '',
  paymentMethod: 'transfer',
  couponCode: '',
  termsAccepted: false,
  expandedOptions: {}
};

const steps: StepType[] = ['basic', 'datetime', 'package', 'food', 'extras', 'payment', 'confirmation'];

export function useReservationForm() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  
  // Data from API
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  
  // Coupon related
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFormDataFromStorage();
    if (savedData) {
      setFormData(prev => ({ ...prev, ...savedData }));
    }
  }, []);

  // Save data on changes
  useEffect(() => {
    if (formData !== initialFormData) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  // Fetch initial data
  useEffect(() => {
    fetchPackages();
    fetchFoodOptions();
    fetchEventThemes();
    fetchExtraServices();
    fetchAvailability();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw packages API response:', data);
        console.log('📦 Packages data:', data.data);
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchFoodOptions = async () => {
    try {
      const response = await fetch('/api/admin/food-options');
      if (response.ok) {
        const data = await response.json();
        setFoodOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching food options:', error);
    }
  };

  const fetchEventThemes = async () => {
    try {
      const response = await fetch('/api/admin/event-themes');
      if (response.ok) {
        const data = await response.json();
        setEventThemes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching event themes:', error);
    }
  };

  const fetchExtraServices = async () => {
    try {
      const response = await fetch('/api/admin/extra-services');
      if (response.ok) {
        const data = await response.json();
        setExtraServices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching extra services:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/reservations/availability');
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.availableSlots || {});
        setBlockedDates(data.blockedDates || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const goToNextStep = useCallback(() => {
    const validation = validateStep(currentStep, formData);
    if (!validation.isValid) {
      notifications.show({
        title: 'Error',
        message: validation.errors?.join(', ') || 'Por favor completa todos los campos requeridos',
        color: 'red'
      });
      return false;
    }

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  }, [currentStep, formData]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  }, [currentStep]);

  const submitReservation = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo obtener tu email',
        color: 'red'
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate ? (() => {
          const year = formData.eventDate.getFullYear();
          const month = String(formData.eventDate.getMonth() + 1).padStart(2, '0');
          const day = String(formData.eventDate.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })() : '',
        eventTime: formData.eventTime,
        customer: {
          name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
          email: user.primaryEmailAddress.emailAddress,
          phone: formData.customerPhone
        },
        child: {
          name: formData.childName.trim(),
          age: parseInt(formData.childAge)
        },
        guestCount: {
          adults: parseInt(formData.adultCount) || 0,
          kids: parseInt(formData.kidsCount) || 0
        },
        specialComments: formData.specialComments.trim() || undefined,
        foodOptionId: formData.foodOptionId || undefined,
        selectedDrink: formData.selectedDrink || undefined,
        foodExtras: formData.selectedFoodUpgrades?.map(upgrade => 
          `${upgrade.fromDish}-${upgrade.toDish}-${upgrade.additionalPrice}`
        ) || [],
        extraServices: formData.selectedExtraServices 
          ? formData.selectedExtraServices.split(',').filter(Boolean) 
          : [],
        eventThemeId: formData.eventThemeId || undefined,
        selectedThemePackage: formData.selectedThemePackage || undefined,
        selectedTheme: formData.selectedThemePackage || undefined,
        paymentMethod: formData.paymentMethod,
        appliedCoupon: appliedCoupon || undefined
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReservationId(data.data._id);
        clearFormDataFromStorage();
        return data.data._id;
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Error al crear la reservación',
          color: 'red'
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al crear la reservación',
        color: 'red'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}