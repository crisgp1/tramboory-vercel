export interface Finance {
  _id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: Date;
  category: 'reservation' | 'operational' | 'salary' | 'other';
  subcategory?: string;
  reservation?: {
    reservationId: string;
    customerName: string;
    eventDate: Date;
  };
  tags: string[];
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // Nuevos campos para estructura jerárquica
  parentId?: string; // ID del registro padre (para children)
  isSystemGenerated?: boolean; // Si fue generado automáticamente por el sistema
  isEditable?: boolean; // Si puede ser editado por el usuario
  children?: Finance[]; // Registros hijos (gastos/ingresos adicionales)
  totalWithChildren?: number; // Total incluyendo children
}

export interface CreateFinanceRequest {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date?: Date;
  category: 'reservation' | 'operational' | 'salary' | 'other';
  subcategory?: string;
  reservationId?: string;
  tags?: string[];
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  reference?: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  createdBy?: string;
  parentId?: string; // Para crear children de una finanza existente
  isSystemGenerated?: boolean;
  isEditable?: boolean;
}

export interface UpdateFinanceRequest {
  type?: 'income' | 'expense';
  description?: string;
  amount?: number;
  date?: Date;
  category?: 'reservation' | 'operational' | 'salary' | 'other';
  subcategory?: string;
  reservationId?: string;
  tags?: string[];
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  reference?: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  createdBy?: string;
}

export interface CreateFinanceData {
  type: FinanceType;
  category: FinanceCategory;
  description: string;
  amount: number;
  date: Date;
  status: FinanceStatus;
  paymentMethod: PaymentMethod;
  subcategory?: string;
  tags: string[];
  notes?: string;
  reservationId?: string;
  parentId?: string; // Para crear children de una finanza existente
  isSystemGenerated?: boolean;
  isEditable?: boolean;
}

export interface FinanceFilters {
  type?: 'income' | 'expense';
  category?: 'reservation' | 'operational' | 'salary' | 'other';
  status?: 'pending' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactions: number;
  avgIncome: number;
  avgExpense: number;
}

export interface CategoryBreakdown {
  _id: 'income' | 'expense';
  categories: {
    category: string;
    total: number;
    count: number;
  }[];
  totalByType: number;
}

export interface PaymentMethodStats {
  _id: string;
  total: number;
  count: number;
}

export interface TrendData {
  _id: {
    year: number;
    month?: number;
    week?: number;
    type: 'income' | 'expense';
  };
  total: number;
  count: number;
}

export interface TagStats {
  tag: string;
  count: number;
  totalAmount: number;
  incomeAmount: number;
  expenseAmount: number;
  lastUsed: Date;
}

export interface FinanceStatsResponse {
  summary: FinanceStats;
  categoryBreakdown: CategoryBreakdown[];
  paymentMethods: PaymentMethodStats[];
  trends: TrendData[];
  topTags: TagStats[];
  reservationRelated: {
    income: { total: number; count: number };
    expense: { total: number; count: number };
  };
  recentTransactions: Finance[];
  period: {
    type: string;
    startDate: Date | null;
    endDate: Date | null;
  };
}

export interface TagManagementRequest {
  action: 'rename' | 'delete' | 'add' | 'remove';
  oldTag?: string;
  newTag?: string;
  transactionIds?: string[];
}

export interface GenerateFromReservationsRequest {
  reservationIds: string[];
  generateType?: 'income' | 'expense' | 'both';
  overwrite?: boolean;
  createdBy?: string;
}

export interface GenerateFromReservationsResult {
  created: number;
  skipped: number;
  errors: number;
  details: {
    reservationId: string;
    status: 'created' | 'skipped' | 'error';
    reason?: string;
    transactionsCreated?: number;
    transactions?: {
      id: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
    }[];
    error?: string;
  }[];
}

export interface ReservationFinancePreview {
  reservationId: string;
  customerName: string;
  eventDate: Date;
  reservationTotal: number;
  hasExistingTransactions: boolean;
  existingTransactionsCount: number;
  transactions: {
    type: 'income' | 'expense';
    description: string;
    amount: number;
    category: string;
  }[];
}

export interface FinancePreviewResponse {
  preview: ReservationFinancePreview[];
  summary: {
    totalReservations: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    reservationsWithExistingTransactions: number;
  };
}

// Constantes para las opciones
export const FINANCE_TYPES = ['income', 'expense'] as const;
export const FINANCE_CATEGORIES = ['reservation', 'operational', 'salary', 'other'] as const;
export const FINANCE_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'check', 'other'] as const;

// Type aliases for better readability
export type FinanceType = typeof FINANCE_TYPES[number];
export type FinanceCategory = typeof FINANCE_CATEGORIES[number];
export type FinanceStatus = typeof FINANCE_STATUSES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Labels en español para la UI
export const FINANCE_TYPE_LABELS = {
  income: 'Ingreso',
  expense: 'Egreso'
} as const;

export const FINANCE_CATEGORY_LABELS = {
  reservation: 'Reserva',
  operational: 'Operativo',
  salary: 'Sueldo',
  other: 'Otro'
} as const;

export const FINANCE_STATUS_LABELS = {
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado'
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  other: 'Otro'
} as const;