import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import Reservation from '@/models/Reservation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

interface TimeBlock {
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  duration: number;
  halfHourBreak: boolean;
  maxEventsPerBlock: number;
}

interface RestDay {
  day: number;
  name: string;
  fee: number;
  canBeReleased: boolean;
}

interface DayAvailability {
  date: string;
  available: boolean;
  totalSlots: number;
  availableSlots: number;
  isRestDay: boolean;
  restDayFee?: number;
  hasReservations: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Year and month parameters are required and must be valid' },
        { status: 400 }
      );
    }
    
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración del sistema activa' },
        { status: 404 }
      );
    }
    
    // Generate all days in the month
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get all reservations for the month
    const reservations = await Reservation.find({
      eventDate: {
        $gte: monthStart,
        $lte: monthEnd
      },
      status: { $ne: 'cancelled' }
    });
    
    // Group reservations by date
    const reservationsByDate: { [key: string]: any[] } = {};
    reservations.forEach(reservation => {
      const dateKey = format(reservation.eventDate, 'yyyy-MM-dd');
      if (!reservationsByDate[dateKey]) {
        reservationsByDate[dateKey] = [];
      }
      reservationsByDate[dateKey].push(reservation);
    });
    
    // Calculate availability for each day
    const availability: { [key: string]: DayAvailability } = {};
    
    for (const day of monthDays) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();
      const dayReservations = reservationsByDate[dateKey] || [];
      
      // Check if it's a rest day
      const restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
      const isRestDay = !!restDay;
      
      // Get time blocks for this day
      const dayBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
        block.days.includes(dayOfWeek)
      ) || [];
      
      // Calculate total slots and available slots based on block configurations
      let totalSlots = 0;
      let availableSlots = 0;
      
      if (dayBlocks.length > 0) {
        // Check if system has global oneEventPerDay policy
        const oneEventPerDay = systemConfig.oneEventPerDay ?? true;
        
        if (oneEventPerDay) {
          // ONE EVENT PER DAY LOGIC
          // Count total available time slots for display purposes
          for (const block of dayBlocks) {
            const blockSlots = generateBlockSlots(
              block.startTime,
              block.endTime,
              block.duration,
              block.halfHourBreak
            );
            totalSlots += blockSlots.length;
          }
          
          // If there's ANY reservation on this day, all slots are unavailable
          if (dayReservations.length > 0) {
            availableSlots = 0;
          } else {
            // Otherwise, all slots are available (but only one can be booked)
            availableSlots = totalSlots;
          }
        } else {
          // MULTIPLE EVENTS LOGIC - calculate based on individual block capacities
          for (const block of dayBlocks) {
            const blockSlots = generateBlockSlots(
              block.startTime,
              block.endTime,
              block.duration,
              block.halfHourBreak
            );
            
            for (const slot of blockSlots) {
              totalSlots++;
              
              // Check if this slot is available
              const slotReservations = dayReservations.filter(res => {
                const resTime = res.eventTime;
                const resEndTime = calculateEndTime(resTime, res.eventDuration || systemConfig.defaultEventDuration);
                const slotEndTime = calculateEndTime(slot.time, block.duration);
                
                return isTimeOverlap(
                  { start: resTime, end: resEndTime },
                  { start: slot.time, end: slotEndTime }
                );
              });
              
              if (slotReservations.length < block.maxEventsPerBlock) {
                availableSlots++;
              }
            }
          }
        }
      } else {
        // Fallback to basic business hours if no blocks configured
        const businessHours = systemConfig.businessHours || { start: '14:00', end: '19:00' };
        const slots = generateBasicSlots(businessHours.start, businessHours.end, systemConfig.defaultEventDuration);
        
        totalSlots = slots.length;
        availableSlots = slots.filter(slot => {
          const slotReservations = dayReservations.filter(res => res.eventTime === slot);
          return slotReservations.length < (systemConfig.maxConcurrentEvents || 1);
        }).length;
      }
      
      // If it's a rest day and can't be released, set availability to false
      if (isRestDay && restDay && !restDay.canBeReleased) {
        availableSlots = 0;
      }
      
      availability[dateKey] = {
        date: dateKey,
        available: availableSlots > 0,
        totalSlots,
        availableSlots,
        isRestDay,
        restDayFee: isRestDay && restDay ? restDay.fee : undefined,
        hasReservations: dayReservations.length > 0
      };
    }
    
    return NextResponse.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching month availability:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener disponibilidad del mes' },
      { status: 500 }
    );
  }
}

function generateBlockSlots(
  startTime: string, 
  endTime: string, 
  duration: number,
  halfHourBreak: boolean
): { time: string; endTime: string }[] {
  const slots: { time: string; endTime: string }[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMin; // Convert to minutes
  const endTimeMinutes = endHour * 60 + endMin;
  const durationMinutes = duration * 60;
  const breakMinutes = halfHourBreak ? 30 : 0;
  
  while (currentTime + durationMinutes <= endTimeMinutes) {
    const slotStartHour = Math.floor(currentTime / 60);
    const slotStartMin = currentTime % 60;
    const slotEndTime = currentTime + durationMinutes;
    const slotEndHour = Math.floor(slotEndTime / 60);
    const slotEndMin = slotEndTime % 60;
    
    const startTimeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;
    const endTimeString = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
    
    slots.push({
      time: startTimeString,
      endTime: endTimeString
    });
    
    // Add duration plus break time
    currentTime += durationMinutes + breakMinutes;
  }
  
  return slots;
}

function generateBasicSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    slots.push(timeString);
    
    // Add duration hours
    currentHour += duration;
    
    // Handle minute overflow
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
    
    // Break if we've exceeded end time
    if (currentHour > endHour || (currentHour === endHour && currentMin > endMin)) {
      break;
    }
  }
  
  return slots;
}

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hour, min] = startTime.split(':').map(Number);
  const totalMinutes = hour * 60 + min + (durationHours * 60);
  const endHour = Math.floor(totalMinutes / 60);
  const endMin = totalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
}

function isTimeOverlap(
  time1: { start: string; end: string },
  time2: { start: string; end: string }
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const start1 = toMinutes(time1.start);
  const end1 = toMinutes(time1.end);
  const start2 = toMinutes(time2.start);
  const end2 = toMinutes(time2.end);
  
  return start1 < end2 && start2 < end1;
}