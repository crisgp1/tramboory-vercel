import { create } from 'zustand';
import { Reservation } from '@/types/reservation';

interface ReservationState {
  reservations: Reservation[];
  loading: boolean;
  selectedReservation: Reservation | null;
  filter: 'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled';
  searchTerm: string;
  
  // Actions
  setReservations: (reservations: Reservation[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  setFilter: (filter: 'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled') => void;
  setSearchTerm: (term: string) => void;
  
  // Computed
  filteredReservations: () => Reservation[];
  stats: () => {
    total: number;
    confirmed: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  loading: false,
  selectedReservation: null,
  filter: 'all',
  searchTerm: '',
  
  setReservations: (reservations) => set({ reservations }),
  setLoading: (loading) => set({ loading }),
  setSelectedReservation: (reservation) => set({ selectedReservation: reservation }),
  setFilter: (filter) => set({ filter }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  filteredReservations: () => {
    const { reservations, filter, searchTerm } = get();
    let filtered = reservations;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  },
  
  stats: () => {
    const { reservations } = get();
    return {
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };
  },
}));