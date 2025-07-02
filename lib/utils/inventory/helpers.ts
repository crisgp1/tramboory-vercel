import { ID_PREFIXES, VALIDATION_CONFIG } from './constants';
import { UserRole } from '@/lib/roles';
import { INVENTORY_ROLES, ROLE_PERMISSIONS } from './constants';

/**
 * Genera un ID único para entidades del inventario
 */
export function generateInventoryId(prefix: keyof typeof ID_PREFIXES): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${ID_PREFIXES[prefix]}-${timestamp}-${random}`;
}

/**
 * Genera un ID de lote único
 */
export function generateBatchId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `${timestamp}${random}`.toUpperCase().substr(0, VALIDATION_CONFIG.BATCH_ID_LENGTH);
}

/**
 * Valida si un usuario tiene acceso al sistema de inventario
 */
export function hasInventoryAccess(userRole: UserRole): boolean {
  return INVENTORY_ROLES.includes(userRole as any);
}

/**
 * Verifica si un usuario tiene un permiso específico del inventario
 */
export function hasInventoryPermission(userRole: UserRole, permission: string): boolean {
  if (!hasInventoryAccess(userRole)) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission as any) || false;
}

/**
 * Formatea una cantidad con su unidad
 */
export function formatQuantity(quantity: number, unit: string, decimals: number = 2): string {
  return `${quantity.toFixed(decimals)} ${unit}`;
}

/**
 * Formatea un precio en formato de moneda
 */
export function formatPrice(price: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Calcula los días hasta la fecha de caducidad
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina si un producto está próximo a caducar
 */
export function isNearExpiry(expiryDate: Date, warningDays: number = 7): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  return daysUntilExpiry <= warningDays && daysUntilExpiry > 0;
}

/**
 * Determina si un producto ha caducado
 */
export function isExpired(expiryDate: Date): boolean {
  return getDaysUntilExpiry(expiryDate) <= 0;
}

/**
 * Valida que una cantidad sea válida
 */
export function isValidQuantity(quantity: number): boolean {
  return quantity >= VALIDATION_CONFIG.MIN_QUANTITY && 
         quantity <= VALIDATION_CONFIG.MAX_QUANTITY &&
         !isNaN(quantity) &&
         isFinite(quantity);
}

/**
 * Valida que un precio sea válido
 */
export function isValidPrice(price: number): boolean {
  return price >= VALIDATION_CONFIG.MIN_PRICE && 
         price <= VALIDATION_CONFIG.MAX_PRICE &&
         !isNaN(price) &&
         isFinite(price);
}

/**
 * Sanitiza un string para uso en nombres de productos
 */
export function sanitizeProductName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/[^\w\s\-\.]/g, '') // Solo letras, números, espacios, guiones y puntos
    .substring(0, VALIDATION_CONFIG.PRODUCT_NAME_MAX_LENGTH);
}

/**
 * Calcula el stock total disponible de un array de lotes
 */
export function calculateTotalStock(batches: Array<{ quantity: number; status: string }>): number {
  return batches
    .filter(batch => batch.status === 'available')
    .reduce((total, batch) => total + batch.quantity, 0);
}

/**
 * Encuentra el lote más antiguo disponible (FIFO)
 */
export function findOldestBatch<T extends { receivedDate: Date; status: string; quantity: number }>(
  batches: T[]
): T | null {
  const availableBatches = batches
    .filter(batch => batch.status === 'available' && batch.quantity > 0)
    .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());
  
  return availableBatches[0] || null;
}

/**
 * Encuentra el lote más reciente disponible (LIFO)
 */
export function findNewestBatch<T extends { receivedDate: Date; status: string; quantity: number }>(
  batches: T[]
): T | null {
  const availableBatches = batches
    .filter(batch => batch.status === 'available' && batch.quantity > 0)
    .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());
  
  return availableBatches[0] || null;
}

/**
 * Calcula el costo promedio ponderado de los lotes
 */
export function calculateWeightedAverageCost(
  batches: Array<{ quantity: number; costPerUnit: number; status: string }>
): number {
  const availableBatches = batches.filter(batch => batch.status === 'available');
  
  if (availableBatches.length === 0) return 0;
  
  const totalValue = availableBatches.reduce(
    (sum, batch) => sum + (batch.quantity * batch.costPerUnit), 
    0
  );
  const totalQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.quantity, 
    0
  );
  
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

/**
 * Genera un slug único para URLs
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/[\s_-]+/g, '-') // Espacios y guiones múltiples a uno solo
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Redondea un número a un número específico de decimales
 */
export function roundToDecimals(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convierte una fecha a string en formato ISO para MongoDB
 */
export function toISOString(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Parsea una fecha desde string o Date
 */
export function parseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Genera opciones de paginación para MongoDB
 */
export function getPaginationOptions(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return { skip, limit };
}

/**
 * Crea un objeto de respuesta estándar para APIs
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  errors?: any[]
) {
  return {
    success,
    data,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
}