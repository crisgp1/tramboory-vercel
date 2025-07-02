// Tipos para el sistema de inventario

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  REORDER_POINT = 'REORDER_POINT',
  EXPIRED_PRODUCT = 'EXPIRED_PRODUCT',
  QUARANTINE_ALERT = 'QUARANTINE_ALERT'
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE = 'AJUSTE',
  MERMA = 'MERMA'
}

export enum StockMovementReason {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  EXPIRED = 'EXPIRED',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  TRANSFER = 'transfer',
  CHECK = 'check'
}

// Interfaces para Purchase Orders
export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface PaymentTerms {
  method: PaymentMethod;
  creditDays: number;
  dueDate?: Date;
}

export interface PurchaseOrder {
  _id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryLocation: string;
  paymentTerms: PaymentTerms;
  notes?: string;
  internalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  orderedBy?: string;
  orderedAt?: Date;
  receivedBy?: string;
  receivedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para Products
export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  location?: string;
  supplier?: string;
  status: ProductStatus;
  tags: string[];
  images: string[];
  expirationDate?: Date;
  batchNumber?: string;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para Suppliers
export interface SupplierContact {
  name: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  businessName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contacts: SupplierContact[];
  paymentTerms: PaymentTerms;
  status: SupplierStatus;
  notes?: string;
  tags: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para Stock Movements
export interface StockMovement {
  _id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalValue?: number;
  previousStock: number;
  newStock: number;
  location?: string;
  batchNumber?: string;
  expirationDate?: Date;
  referenceId?: string; // ID de la orden, venta, etc.
  referenceType?: string; // 'purchase_order', 'sale', etc.
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// Interfaces para Stock Transfers
export interface StockTransfer {
  _id: string;
  transferId: string;
  fromLocation: string;
  toLocation: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    batchNumber?: string;
    expirationDate?: Date;
  }[];
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  sentBy?: string;
  sentAt?: Date;
  receivedBy?: string;
  receivedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Constantes para categorías de productos
export const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Bebidas Alcohólicas',
  'Cervezas',
  'Vinos',
  'Licores',
  'Alimentos',
  'Snacks',
  'Botanas',
  'Dulces',
  'Comida Preparada',
  'Ingredientes',
  'Condimentos',
  'Especias',
  'Aceites',
  'Vinagres',
  'Lácteos',
  'Carnes',
  'Pescados',
  'Mariscos',
  'Frutas',
  'Verduras',
  'Granos',
  'Cereales',
  'Panadería',
  'Repostería',
  'Congelados',
  'Enlatados',
  'Conservas',
  'Productos de Limpieza',
  'Detergentes',
  'Desinfectantes',
  'Artículos de Higiene',
  'Papel',
  'Plásticos',
  'Utensilios',
  'Equipos',
  'Herramientas',
  'Suministros',
  'Otros'
];

// Constantes para unidades comunes
export const COMMON_UNITS = {
  VOLUME: {
    ML: { code: 'ml', name: 'Mililitro', category: 'volume' },
    L: { code: 'l', name: 'Litro', category: 'volume' },
    GAL: { code: 'gal', name: 'Galón', category: 'volume' },
    OZ: { code: 'oz', name: 'Onza líquida', category: 'volume' },
    CUP: { code: 'cup', name: 'Taza', category: 'volume' },
    PINT: { code: 'pint', name: 'Pinta', category: 'volume' },
    QUART: { code: 'quart', name: 'Cuarto', category: 'volume' }
  },
  WEIGHT: {
    G: { code: 'g', name: 'Gramo', category: 'weight' },
    KG: { code: 'kg', name: 'Kilogramo', category: 'weight' },
    LB: { code: 'lb', name: 'Libra', category: 'weight' },
    OZ: { code: 'oz_weight', name: 'Onza', category: 'weight' },
    TON: { code: 'ton', name: 'Tonelada', category: 'weight' }
  },
  PIECE: {
    UNIT: { code: 'unit', name: 'Unidad', category: 'piece' },
    PIECE: { code: 'piece', name: 'Pieza', category: 'piece' },
    PACK: { code: 'pack', name: 'Paquete', category: 'piece' },
    BOX: { code: 'box', name: 'Caja', category: 'piece' },
    CASE: { code: 'case', name: 'Caso', category: 'piece' },
    DOZEN: { code: 'dozen', name: 'Docena', category: 'piece' },
    PAIR: { code: 'pair', name: 'Par', category: 'piece' },
    SET: { code: 'set', name: 'Conjunto', category: 'piece' },
    BOTTLE: { code: 'bottle', name: 'Botella', category: 'piece' },
    CAN: { code: 'can', name: 'Lata', category: 'piece' },
    BAG: { code: 'bag', name: 'Bolsa', category: 'piece' },
    ROLL: { code: 'roll', name: 'Rollo', category: 'piece' }
  }
};

// Tipos para filtros y búsquedas
export interface InventoryFilters {
  search?: string;
  category?: string;
  status?: string;
  supplier?: string;
  location?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus;
  supplier?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para respuestas de API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  categories: {
    name: string;
    count: number;
    value: number;
  }[];
}

export interface PurchaseOrderStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  totalValue: number;
  monthlyStats: {
    month: string;
    orders: number;
    value: number;
  }[];
}