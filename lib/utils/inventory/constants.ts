// Constantes para el sistema de inventario

// Configuración de IDs
export const ID_PREFIXES = {
  PRODUCT: 'PROD',
  SUPPLIER: 'SUPP',
  MOVEMENT: 'MOV',
  BATCH: 'BATCH',
  ALERT: 'ALERT',
  PURCHASE_ORDER: 'PO'
} as const;

// Configuración de conversiones de unidades
export const UNIT_CONVERSIONS = {
  // Conversiones de volumen
  VOLUME: {
    'ml_to_l': 0.001,
    'l_to_ml': 1000,
    'l_to_gal': 0.264172,
    'gal_to_l': 3.78541,
    'ml_to_gal': 0.000264172,
    'gal_to_ml': 3785.41
  },
  // Conversiones de peso
  WEIGHT: {
    'g_to_kg': 0.001,
    'kg_to_g': 1000,
    'kg_to_lb': 2.20462,
    'lb_to_kg': 0.453592,
    'g_to_lb': 0.00220462,
    'lb_to_g': 453.592
  }
} as const;

// Configuración de alertas
export const ALERT_CONFIG = {
  DEFAULT_WARNING_DAYS: 7, // Días antes de caducidad para alertar
  DEFAULT_REORDER_MULTIPLIER: 1.5, // Multiplicador para punto de reorden
  MAX_ALERTS_PER_PRODUCT: 10, // Máximo de alertas activas por producto
  ALERT_COOLDOWN_HOURS: 24 // Horas entre alertas del mismo tipo
} as const;

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    EMAIL: 'email',
    PUSH: 'push',
    IN_APP: 'in_app'
  },
  TEMPLATES: {
    LOW_STOCK: 'inventory-low-stock',
    EXPIRY_WARNING: 'inventory-expiry-warning',
    REORDER_POINT: 'inventory-reorder-point',
    EXPIRED_PRODUCT: 'inventory-expired-product'
  }
} as const;

// Configuración de transacciones
export const TRANSACTION_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 100,
  TIMEOUT_MS: 30000
} as const;

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// Roles con acceso al inventario
export const INVENTORY_ROLES = ['admin', 'gerente', 'proveedor'] as const;

// Permisos específicos del inventario
export const INVENTORY_PERMISSIONS = {
  VIEW_PRODUCTS: 'inventory:view_products',
  MANAGE_PRODUCTS: 'inventory:manage_products',
  VIEW_MOVEMENTS: 'inventory:view_movements',
  CREATE_MOVEMENTS: 'inventory:create_movements',
  VIEW_SUPPLIERS: 'inventory:view_suppliers',
  MANAGE_SUPPLIERS: 'inventory:manage_suppliers',
  VIEW_ALERTS: 'inventory:view_alerts',
  MANAGE_ALERTS: 'inventory:manage_alerts',
  VIEW_REPORTS: 'inventory:view_reports',
  MAKE_ADJUSTMENTS: 'inventory:make_adjustments'
} as const;

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS = {
  admin: Object.values(INVENTORY_PERMISSIONS),
  gerente: [
    INVENTORY_PERMISSIONS.VIEW_PRODUCTS,
    INVENTORY_PERMISSIONS.MANAGE_PRODUCTS,
    INVENTORY_PERMISSIONS.VIEW_MOVEMENTS,
    INVENTORY_PERMISSIONS.CREATE_MOVEMENTS,
    INVENTORY_PERMISSIONS.VIEW_SUPPLIERS,
    INVENTORY_PERMISSIONS.VIEW_ALERTS,
    INVENTORY_PERMISSIONS.MANAGE_ALERTS,
    INVENTORY_PERMISSIONS.VIEW_REPORTS,
    INVENTORY_PERMISSIONS.MAKE_ADJUSTMENTS
  ],
  proveedor: [
    INVENTORY_PERMISSIONS.VIEW_PRODUCTS,
    INVENTORY_PERMISSIONS.MANAGE_PRODUCTS,
    INVENTORY_PERMISSIONS.VIEW_MOVEMENTS,
    INVENTORY_PERMISSIONS.CREATE_MOVEMENTS,
    INVENTORY_PERMISSIONS.VIEW_SUPPLIERS,
    INVENTORY_PERMISSIONS.VIEW_ALERTS
  ]
} as const;

// Estados válidos para productos
export const PRODUCT_STATUSES = ['active', 'inactive', 'discontinued'] as const;

// Estados válidos para lotes
export const BATCH_STATUSES = ['available', 'reserved', 'quarantine', 'expired'] as const;

// Métodos de cálculo de costos
export const COST_METHODS = ['FIFO', 'LIFO', 'AVERAGE'] as const;

// Configuración de validación
export const VALIDATION_CONFIG = {
  PRODUCT_NAME_MIN_LENGTH: 2,
  PRODUCT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  BATCH_ID_LENGTH: 12,
  MIN_QUANTITY: 0.001,
  MAX_QUANTITY: 999999.999,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99
} as const;

// Exportar COMMON_UNITS para el converter
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

// Configuración de índices para MongoDB
export const MONGODB_INDEXES = {
  PRODUCTS: [
    { productId: 1 },
    { name: 'text', description: 'text' },
    { category: 1 },
    { 'suppliers.supplierId': 1 },
    { isActive: 1, createdAt: -1 }
  ],
  INVENTORY: [
    { productId: 1, locationId: 1 },
    { 'batches.batchId': 1 },
    { 'batches.expiryDate': 1 },
    { 'batches.status': 1 },
    { lastUpdated: -1 }
  ],
  MOVEMENTS: [
    { movementId: 1 },
    { productId: 1, createdAt: -1 },
    { type: 1, createdAt: -1 },
    { performedBy: 1, createdAt: -1 },
    { 'reference.type': 1, 'reference.id': 1 }
  ],
  SUPPLIERS: [
    { supplierId: 1 },
    { name: 'text', description: 'text' },
    { isActive: 1 }
  ],
  ALERTS: [
    { productId: 1, type: 1 },
    { priority: 1, isActive: 1 },
    { createdAt: -1 },
    { isActive: 1, priority: 1, createdAt: -1 }
  ]
} as const;