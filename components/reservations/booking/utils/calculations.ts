import { FormData, PricingBreakdown, PackageOption, FoodOption, EventTheme, ExtraService } from '../types';

export const formatTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const calculateEndTime = (startTime: string, durationHours: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`;
};

export const formatTimeRangeWithFarewell = (startTime: string, endTime: string, duration: number): string => {
  return `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)} (${duration} horas incluye despedida)`;
};

export const calculatePricing = (
  formData: FormData,
  packageOptions: PackageOption[],
  foodOptions: FoodOption[],
  eventThemes: EventTheme[],
  extraServices: ExtraService[]
): PricingBreakdown => {
  const selectedPackage = packageOptions.find(p => p._id === formData.packageId);
  const selectedFood = foodOptions.find(f => f._id === formData.foodOptionId);
  const selectedTheme = eventThemes.find(t => t._id === formData.eventThemeId);
  
  const adultCount = parseInt(formData.adultCount) || 0;
  const kidsCount = parseInt(formData.kidsCount) || 0;
  
  // Calculate package price based on weekend/weekday
  let basePrice = 0;
  if (selectedPackage) {
    const packageData = selectedPackage as any;
    
    // Determine if the event is on weekend
    const isEventWeekend = formData.eventDate ? isWeekend(formData.eventDate) : false;
    
    if (packageData.pricing) {
      basePrice = isEventWeekend 
        ? (packageData.pricing.weekend || packageData.pricing.weekday || 0)
        : (packageData.pricing.weekday || 0);
    } else {
      basePrice = packageData.basePrice || 0;
    }
  }
  
  const foodPrice = selectedFood 
    ? ((selectedFood.adultPrice || selectedFood.basePrice) * adultCount) + 
      ((selectedFood.kidsPrice || selectedFood.basePrice) * kidsCount)
    : 0;
  
  const upgradesPrice = formData.selectedFoodUpgrades.reduce((total, upgrade) => {
    return total + upgrade.additionalPrice;
  }, 0);
  
  const themePrice = selectedTheme?.packages?.find(p => p.id === formData.selectedThemePackage)?.price || 0;
  
  const selectedExtras = formData.selectedExtraServices.split(',').filter(Boolean);
  const extrasPrice = selectedExtras.reduce((total, extraId) => {
    const extra = extraServices.find(e => e._id === extraId);
    return total + (extra?.price || 0);
  }, 0);
  
  const subtotal = basePrice + foodPrice + upgradesPrice + themePrice + extrasPrice;
  const discount = 0; // TODO: Implement discount logic based on coupon
  const total = subtotal - discount;
  
  return {
    basePrice,
    foodPrice,
    upgradesPrice,
    themePrice,
    extrasPrice,
    subtotal,
    discount,
    total
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getWeekdayName = (date: Date): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 5 || day === 6; // Viernes(5), Sábado(6), Domingo(0)
};

export const getDayRangeLabel = (date: Date): string => {
  const day = date.getDay();
  // Lunes(1), Martes(2), Miércoles(3), Jueves(4)
  if (day >= 1 && day <= 4) {
    return 'Lunes - Jueves';
  }
  // Viernes(5), Sábado(6), Domingo(0) 
  if (day === 5 || day === 6 || day === 0) {
    return 'Viernes - Domingo';
  }
  return 'Días festivos';
};