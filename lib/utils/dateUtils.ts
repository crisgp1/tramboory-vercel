/**
 * Centralized date utilities for consistent timezone handling
 * All dates are handled in Mexico City timezone (America/Mexico_City)
 * to ensure correct display and storage of event dates
 */

/**
 * Convert a date to Mexico City timezone string (YYYY-MM-DD)
 * This ensures dates are stored consistently in Mexico City time
 */
export function toUTCDateString(date: Date): string {
  // Use local date components to avoid timezone shift
  // This treats the date as being in Mexico City time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a local date to local date string (YYYY-MM-DD)
 * This is used for display purposes in the UI
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a date from a date string (YYYY-MM-DD) in Mexico City timezone
 * Sets time to noon to avoid date shift issues
 */
export function createUTCDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone (Mexico City) at noon
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Create a local date from a date string (YYYY-MM-DD)
 * Sets time to noon local to avoid date shift issues
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Get day of week using Mexican convention (Monday=0, Sunday=6)
 * @param date - The date to get day from
 * @param useUTC - Whether to use UTC or local day (default: false for Mexico City time)
 */
export function getMexicanDayOfWeek(date: Date, useUTC = false): number {
  // Always use local day to match Mexico City timezone
  const jsDayOfWeek = date.getDay();
  // Convert JavaScript (Sunday=0) to Mexican (Monday=0)
  return jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;
}

/**
 * Format a date for display in Mexican format
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Days of week in Mexican convention
 */
export const MEXICAN_DAYS = [
  'Lunes',    // 0
  'Martes',   // 1
  'Miércoles',// 2
  'Jueves',   // 3
  'Viernes',  // 4
  'Sábado',   // 5
  'Domingo'   // 6
];

/**
 * Get the Mexican day name for a date
 */
export function getMexicanDayName(date: Date, useUTC = false): string {
  const dayIndex = getMexicanDayOfWeek(date, useUTC);
  return MEXICAN_DAYS[dayIndex];
}

/**
 * Convert calendar picker date to API-compatible date string
 * The calendar shows local dates in Mexico City timezone
 */
export function calendarDateToUTC(localDate: Date): string {
  // Simply format the local date as-is since we're treating it as Mexico City time
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date, useUTC = false): boolean {
  // Always use local date strings to avoid timezone issues
  return toLocalDateString(date1) === toLocalDateString(date2);
}