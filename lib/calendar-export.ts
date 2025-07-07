import { Reservation } from '@/types/reservation';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

/**
 * Converts a reservation to a calendar event
 */
export function reservationToCalendarEvent(reservation: Reservation): CalendarEvent {
  const eventDate = new Date(reservation.eventDate);
  const [hours, minutes] = reservation.eventTime.split(':').map(Number);
  
  // Set start time
  const startDate = new Date(eventDate);
  startDate.setHours(hours, minutes, 0, 0);
  
  // Set end time (assume 3 hours duration by default)
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 3);
  
  // Build title
  const title = `🎉 Fiesta de ${reservation.child.name} (${reservation.child.age} años)`;
  
  // Build description
  let description = `Celebración del cumpleaños de ${reservation.child.name}.\n\n`;
  
  if (reservation.package) {
    description += `📦 Paquete: ${reservation.package.name}\n`;
    description += `👥 Máximo de invitados: ${reservation.package.maxGuests}\n\n`;
  }
  
  if (reservation.foodOption) {
    description += `🍰 Comida: ${reservation.foodOption.name}\n`;
    if ((reservation.foodOption as any).description) {
      description += `   ${(reservation.foodOption as any).description}\n`;
    }
    description += `\n`;
  }
  
  if (reservation.eventTheme) {
    description += `🎨 Tema: ${reservation.eventTheme.name}\n`;
    if ((reservation as any).selectedThemePackage) {
      description += `   Paquete: ${(reservation as any).selectedThemePackage}\n`;
    }
    description += `\n`;
  }
  
  if (reservation.extraServices && reservation.extraServices.length > 0) {
    description += `✨ Servicios extras:\n`;
    reservation.extraServices.forEach(service => {
      description += `   • ${service.name}\n`;
    });
    description += `\n`;
  }
  
  if (reservation.specialComments) {
    description += `📝 Comentarios especiales:\n${reservation.specialComments}\n\n`;
  }
  
  description += `💰 Total: ${formatPrice(reservation.pricing?.total || 0)}\n`;
  description += `📋 Estado: ${getStatusText(reservation.status)}\n`;
  description += `🆔 ID de reserva: ${reservation._id}\n\n`;
  description += `📞 Contacto: info@tramboory.com\n`;
  description += `🌐 Tramboory - Tu celebración perfecta`;
  
  // Location
  const location = 'Tramboory - Centro de Celebraciones, México';
  
  return {
    title,
    description,
    location,
    startDate,
    endDate,
    url: `${window.location.origin}/reservaciones`
  };
}

/**
 * Generates an iCal (.ics) file content
 */
export function generateICalContent(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  };
  
  const uid = `${Date.now()}@tramboory.com`;
  const timestamp = formatDate(new Date());
  
  let icalContent = 'BEGIN:VCALENDAR\n';
  icalContent += 'VERSION:2.0\n';
  icalContent += 'PRODID:-//Tramboory//Reservations//ES\n';
  icalContent += 'CALSCALE:GREGORIAN\n';
  icalContent += 'METHOD:PUBLISH\n';
  icalContent += 'BEGIN:VEVENT\n';
  icalContent += `UID:${uid}\n`;
  icalContent += `DTSTAMP:${timestamp}\n`;
  icalContent += `DTSTART:${formatDate(event.startDate)}\n`;
  icalContent += `DTEND:${formatDate(event.endDate)}\n`;
  icalContent += `SUMMARY:${escapeText(event.title)}\n`;
  icalContent += `DESCRIPTION:${escapeText(event.description)}\n`;
  icalContent += `LOCATION:${escapeText(event.location)}\n`;
  
  if (event.url) {
    icalContent += `URL:${event.url}\n`;
  }
  
  icalContent += 'STATUS:CONFIRMED\n';
  icalContent += 'TRANSP:OPAQUE\n';
  icalContent += 'BEGIN:VALARM\n';
  icalContent += 'TRIGGER:-PT24H\n';
  icalContent += 'ACTION:DISPLAY\n';
  icalContent += `DESCRIPTION:Recordatorio: ${escapeText(event.title)} mañana\n`;
  icalContent += 'END:VALARM\n';
  icalContent += 'BEGIN:VALARM\n';
  icalContent += 'TRIGGER:-PT2H\n';
  icalContent += 'ACTION:DISPLAY\n';
  icalContent += `DESCRIPTION:Recordatorio: ${escapeText(event.title)} en 2 horas\n`;
  icalContent += 'END:VALARM\n';
  icalContent += 'END:VEVENT\n';
  icalContent += 'END:VCALENDAR\n';
  
  return icalContent;
}

/**
 * Downloads an iCal file
 */
export function downloadICalFile(event: CalendarEvent, filename?: string): void {
  const icalContent = generateICalContent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `fiesta-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generates Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description,
    location: event.location,
  });
  
  if (event.url) {
    params.append('sprop', `website:${event.url}`);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const formatOutlookDate = (date: Date): string => {
    return date.toISOString();
  };
  
  const params = new URLSearchParams({
    subject: event.title,
    startdt: formatOutlookDate(event.startDate),
    enddt: formatOutlookDate(event.endDate),
    body: event.description,
    location: event.location,
    path: '/calendar/action/compose',
    rru: 'addevent'
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generates Yahoo Calendar URL
 */
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const formatYahooDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };
  
  const duration = Math.round((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60));
  
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatYahooDate(event.startDate),
    dur: duration.toString().padStart(2, '0') + '00',
    desc: event.description,
    in_loc: event.location,
  });
  
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Helper function to format price
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
}

/**
 * Helper function to get status text
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'confirmed': return 'Confirmada';
    case 'pending': return 'Pendiente';
    case 'cancelled': return 'Cancelada';
    case 'completed': return 'Completada';
    default: return status;
  }
}

/**
 * Opens calendar export options
 */
export function exportToCalendar(reservation: Reservation, provider?: 'google' | 'outlook' | 'yahoo' | 'ical'): void {
  const event = reservationToCalendarEvent(reservation);
  
  switch (provider) {
    case 'google':
      window.open(generateGoogleCalendarUrl(event), '_blank');
      break;
    case 'outlook':
      window.open(generateOutlookCalendarUrl(event), '_blank');
      break;
    case 'yahoo':
      window.open(generateYahooCalendarUrl(event), '_blank');
      break;
    case 'ical':
    default:
      downloadICalFile(event);
      break;
  }
}