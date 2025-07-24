/**
 * Location utilities for inventory management
 */

export const LOCATION_MAP: Record<string, string> = {
  'almacen': 'Almacén Principal',
  'cocina': 'Cocina',
  'salon': 'Salón',
  'bodega': 'Bodega',
  'recepcion': 'Recepción'
};

export const AVAILABLE_LOCATIONS = [
  { id: 'almacen', name: 'Almacén Principal' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'salon', name: 'Salón' },
  { id: 'bodega', name: 'Bodega' },
  { id: 'recepcion', name: 'Recepción' }
];

/**
 * Get location display name from location ID
 */
export function getLocationName(locationId: string): string {
  return LOCATION_MAP[locationId] || locationId;
}

/**
 * Validate if location ID exists
 */
export function isValidLocationId(locationId: string): boolean {
  return locationId in LOCATION_MAP;
}

/**
 * Get all available location IDs
 */
export function getAvailableLocationIds(): string[] {
  return Object.keys(LOCATION_MAP);
}