/**
 * Centralized date utilities for consistent timezone handling
 * All dates are handled in UTC to avoid timezone confusion
 */

/**
 * Convert a local date to UTC date string (YYYY-MM-DD)
 * This is used for API communication and database storage
 */
export function toUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
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
 * Create a UTC date at noon from a date string (YYYY-MM-DD)
 * This avoids timezone shift issues
 */
export function createUTCDate(dateString: string): Date {
  return new Date(dateString + 'T12:00:00.000Z');
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
 * @param useUTC - Whether to use UTC or local day
 */
export function getMexicanDayOfWeek(date: Date, useUTC = true): number {
  const jsDayOfWeek = useUTC ? date.getUTCDay() : date.getDay();
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
export function getMexicanDayName(date: Date, useUTC = true): string {
  const dayIndex = getMexicanDayOfWeek(date, useUTC);
  return MEXICAN_DAYS[dayIndex];
}

/**
 * Convert calendar picker date to API-compatible UTC date string
 * The calendar shows local dates, but we store/query in UTC
 */
export function calendarDateToUTC(localDate: Date): string {
  // Create UTC date at noon from local date components
  const utcDate = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    12, 0, 0, 0
  ));
  return toUTCDateString(utcDate);
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date, useUTC = true): boolean {
  if (useUTC) {
    return toUTCDateString(date1) === toUTCDateString(date2);
  }
  return toLocalDateString(date1) === toLocalDateString(date2);
}