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
  eventDuration?: number;
  eventBlock?: {
    name: string;
    startTime: string;
    endTime: string;
  };
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
  guestCount: {
    adults: number;
    kids: number;
  };
  selectedDrink?: string;
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
    discountAmount: number;
  };
  appliedCoupon?: {
    couponId: string;
    code: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_service';
    discountValue: number;
    discountAmount: number;
    appliedTo: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'partial' | 'overdue' | 'verifying' | 'verified' | 'rejected';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  paymentDate?: string;
  paymentNotes?: string;
  amountPaid?: number;
  paymentProof?: {
    filename: string;
    uploadedAt: string;
    reference?: string;
    notes?: string;
    url?: string;
  };
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