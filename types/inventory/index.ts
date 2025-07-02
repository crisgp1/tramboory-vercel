// Tipos base para el sistema de inventario
export interface IUnit {
  code: string;
  name: string;
  category: 'volume' | 'weight' | 'piece' | 'length';
}

export interface IAlternativeUnit extends IUnit {
  conversionFactor: number;
  conversionType: 'fixed_volume' | 'contains' | 'weight';
  containedUnit?: string; // Para cajas que contienen botellas
}

export interface IUnits {
  base: IUnit;
  alternatives: IAlternativeUnit[];
}

export interface IPricingTier {
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  pricePerUnit: number;
  type: 'retail' | 'wholesale' | 'bulk';
}

export interface ISupplierReference {
  supplierId: string;
  supplierName: string; // Denormalizado para performance
  isPreferred: boolean;
  lastPurchasePrice: number;
  leadTimeDays: number;
}

export interface IStockLevels {
  minimum: number;
  reorderPoint: number;
  unit: string;
}

export interface IExpiryInfo {
  hasExpiry: boolean;
  shelfLifeDays?: number;
  warningDays?: number;
}

export interface IBatch {
  batchId: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  expiryDate?: Date;
  receivedDate: Date;
  supplierBatchCode?: string;
  status: 'available' | 'reserved' | 'quarantine' | 'expired';
}

export interface IInventoryTotals {
  available: number;
  reserved: number;
  quarantine: number;
  unit: string;
}

export interface IMovementReference {
  type: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer';
  id: string;
}

export interface IMovementCost {
  unitCost: number;
  totalCost: number;
  currency: string;
}

// Enums para tipos de movimiento
export enum MovementType {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE = 'AJUSTE',
  MERMA = 'MERMA'
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  REORDER_POINT = 'REORDER_POINT',
  EXPIRED_PRODUCT = 'EXPIRED_PRODUCT',
  QUARANTINE_ALERT = 'QUARANTINE_ALERT'
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

// Constantes para unidades comunes
export const COMMON_UNITS = {
  VOLUME: {
    ML: { code: 'ml', name: 'Mililitros', category: 'volume' as const },
    L: { code: 'l', name: 'Litros', category: 'volume' as const },
    GAL: { code: 'gal', name: 'Galones', category: 'volume' as const }
  },
  WEIGHT: {
    G: { code: 'g', name: 'Gramos', category: 'weight' as const },
    KG: { code: 'kg', name: 'Kilogramos', category: 'weight' as const },
    LB: { code: 'lb', name: 'Libras', category: 'weight' as const }
  },
  PIECE: {
    UNIT: { code: 'unit', name: 'Unidad', category: 'piece' as const },
    BOX: { code: 'box', name: 'Caja', category: 'piece' as const },
    PACK: { code: 'pack', name: 'Paquete', category: 'piece' as const }
  }
} as const;

// Categorías de productos comunes
export const PRODUCT_CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Insumos de Limpieza',
  'Materiales de Cocina',
  'Decoración',
  'Servicios',
  'Otros'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];