export interface FormData {
  childName: string;
  childAge: string;
  customerPhone: string;
  adultCount: string;
  kidsCount: string;
  eventDate: Date | null;
  eventTime: string;
  packageId: string;
  foodOptionId: string;
  selectedFoodUpgrades: FoodUpgrade[];
  selectedDrink: string;
  eventThemeId: string;
  selectedThemePackage: string;
  selectedExtraServices: string;
  specialComments: string;
  paymentMethod: 'transfer' | 'cash' | 'card';
  couponCode: string;
  termsAccepted: boolean;
  expandedOptions?: { [key: string]: boolean };
}

export interface FoodUpgrade {
  fromDish: string;
  toDish: string;
  additionalPrice: number;
  category: 'adult' | 'kids';
  foodOptionId: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxCapacity: number;
  currentCapacity: number;
  remainingCapacity: number;
}

export interface AvailableSlots {
  [key: string]: {
    slots: TimeSlot[];
    isUnavailable?: boolean;
    hasBookings?: boolean;
  };
}

export interface PackageOption {
  _id: string;
  name: string;
  description: string;
  basePrice?: number;
  pricing?: {
    weekday: number;
    weekend: number;
  };
  maxGuests: number;
  minGuests?: number;
  duration?: number;
  features?: string[];
  colorScheme?: string;
  icon?: string;
  popular?: boolean;
  availableForWeekend?: boolean;
  availableForWeekday?: boolean;
}

export interface FoodOption {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  adultPrice?: number;
  kidsPrice?: number;
  dishes?: {
    adult: string[];
    kids: string[];
  };
  upgrades?: {
    adult: Array<{
      fromDish: string;
      toDish: string;
      additionalPrice: number;
    }>;
    kids: Array<{
      fromDish: string;
      toDish: string;
      additionalPrice: number;
    }>;
  };
}

export interface EventTheme {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  gradient?: string;
  packages?: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
  }>;
}

export interface ExtraService {
  _id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  icon?: string;
}

export interface AvailabilityData {
  availableSlots: AvailableSlots;
  blockedDates: string[];
}

export type StepType = 'basic' | 'datetime' | 'package' | 'food' | 'extras' | 'payment' | 'confirmation';

export interface StepProps {
  formData: FormData;
  onUpdateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface PricingBreakdown {
  basePrice: number;
  foodPrice: number;
  upgradesPrice: number;
  themePrice: number;
  extrasPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}