export interface Reservation {
  _id: string;
  package: {
    configId: string;
    name: string;
    maxGuests: number;
    basePrice: number;
  };
  eventDate: string;
  eventTime: string;
  isRestDay: boolean;
  restDayFee: number;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  child: {
    name: string;
    age: number;
  };
  foodOption?: {
    configId: string;
    name: string;
    basePrice: number;
    selectedExtras: Array<{
      name: string;
      price: number;
    }>;
  };
  extraServices: Array<{
    configId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  eventTheme?: {
    configId: string;
    name: string;
    selectedPackage: {
      name: string;
      pieces: number;
      price: number;
    };
    selectedTheme: string;
  };
  pricing: {
    total: number;
    subtotal: number;
    packagePrice: number;
    foodPrice: number;
    extrasPrice: number;
    themePrice: number;
    restDayFee: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationFilters {
  searchTerm: string;
  status: string;
  startDate?: string;
  endDate?: string;
}