import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import Reservation from '@/models/Reservation';
import { getMexicanDayOfWeek, getMexicanDayName, createUTCDate } from '@/lib/utils/dateUtils';

interface TimeBlock {
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  duration: number;
  halfHourBreak: boolean;
  maxEventsPerBlock: number;
  oneReservationPerDay?: boolean;
}

interface RestDay {
  day: number;
  name: string;
  fee: number;
  canBeReleased: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    const date = createUTCDate(dateParam); // Use consistent date creation
    const dayOfWeek = getMexicanDayOfWeek(date); // Use local day conversion
    const dayName = getMexicanDayName(date);
    
    console.log('🔍 DEBUG: Day conversion:', {
      dateParam,
      dayOfWeek,
      dayName
    });
    
    console.log('Date calculation debug:', {
      inputDate: dateParam,
      dateObject: date.toISOString(),
      dayOfWeek,
      dayName
    });
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    console.log('System config loaded:', {
      found: !!systemConfig,
      timeBlocksCount: systemConfig?.timeBlocks?.length || 0,
      timeBlocksDetails: systemConfig?.timeBlocks?.map((b: any) => ({
        name: b.name,
        maxEventsPerBlock: b.maxEventsPerBlock,
        days: b.days
      }))
    });
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración del sistema activa' },
        { status: 404 }
      );
    }
    
    // Check if it's a rest day from restDays configuration (legacy support)
    let restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
    let isRestDay = !!restDay;
    let restDayFee = 0;
    
    // If found in restDays, use that fee
    if (restDay) {
      restDayFee = restDay.fee;
    }
    
    // Get time blocks for this day
    const dayBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
      block.days.includes(dayOfWeek)
    ) || [];
    
    console.log('Available blocks debug:', {
      date: dateParam,
      dayOfWeek,
      dayName: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][dayOfWeek],
      isRestDay,
      restDay,
      totalTimeBlocks: systemConfig.timeBlocks?.length || 0,
      dayBlocks: dayBlocks.length,
      dayBlocksDetails: dayBlocks.map((b: TimeBlock) => ({
        name: b.name,
        days: b.days,
        daysNames: b.days.map(d => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d]),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        maxEventsPerBlock: b.maxEventsPerBlock,
        includesCurrentDay: b.days.includes(dayOfWeek)
      }))
    });
    
    // If it's a rest day and can't be released, return no blocks
    if (isRestDay && restDay && !restDay.canBeReleased) {
      return NextResponse.json({
        success: true,
        data: {
          date: dateParam,
          isRestDay: true,
          restDayInfo: restDay,
          canBeReleased: false,
          blocks: []
        }
      });
    }
    
    // If it's a rest day that can be released, we still need to provide time blocks
    // Use default time blocks or create basic ones for rest days
    let timeBlocksToUse = dayBlocks;
    if (isRestDay && restDay && restDay.canBeReleased && dayBlocks.length === 0) {
      // Create default time blocks for rest days
      timeBlocksToUse = [{
        name: 'Horario especial',
        days: [dayOfWeek],
        startTime: '10:00',
        endTime: '18:00',
        duration: 4,
        halfHourBreak: true,
        maxEventsPerBlock: 2
      }];
    }
    
    // Get existing reservations for the date - use UTC to match stored dates
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    console.log('Querying reservations for date range:', {
      inputDate: dateParam,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    const existingReservations = await Reservation.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    });
    
    console.log('Found existing reservations:', {
      count: existingReservations.length,
      reservations: existingReservations.map(r => ({
        id: r._id.toString(),
        eventDate: r.eventDate.toISOString(),
        eventTime: r.eventTime,
        status: r.status
      }))
    });
    
    // Process each time block
    const availableBlocks = timeBlocksToUse.map((block: TimeBlock) => {
      console.log(`Processing time block: ${block.name}`, {
        startTime: block.startTime,
        endTime: block.endTime,
        duration: block.duration,
        halfHourBreak: block.halfHourBreak
      });
      
      const slots = generateBlockSlots(
        block.startTime,
        block.endTime,
        block.duration,
        block.halfHourBreak
      );
      
      console.log(`Generated ${slots.length} slots for ${block.name}:`, slots.map(s => s.time));
      
      // Check availability for each slot in the block
      const slotsWithAvailability = slots.map(slot => {
        let isAvailable = true;
        let remainingCapacity = block.maxEventsPerBlock;
        
        if ((block as any).oneReservationPerDay) {
          // For one-reservation-per-day blocks, check if there's ANY reservation on this day
          const hasAnyReservationToday = existingReservations.length > 0;
          isAvailable = !hasAnyReservationToday;
          remainingCapacity = hasAnyReservationToday ? 0 : 1;
          
          console.log(`One reservation per day slot ${slot.time}:`, {
            slotTime: slot.time,
            hasAnyReservationToday,
            totalReservationsToday: existingReservations.length,
            isAvailable,
            remainingCapacity
          });
        } else {
          // Normal slot-based availability
          const reservationsAtTime = existingReservations.filter(res => {
            const resTime = res.eventTime;
            const resEndTime = calculateEndTime(resTime, res.eventDuration || systemConfig.defaultEventDuration);
            const slotEndTime = calculateEndTime(slot.time, block.duration);
            
            // Check if there's time overlap
            return isTimeOverlap(
              { start: resTime, end: resEndTime },
              { start: slot.time, end: slotEndTime }
            );
          });
          
          isAvailable = reservationsAtTime.length < block.maxEventsPerBlock;
          remainingCapacity = block.maxEventsPerBlock - reservationsAtTime.length;
          
          console.log(`Slot ${slot.time} capacity check:`, {
            slotTime: slot.time,
            maxEventsPerBlock: block.maxEventsPerBlock,
            reservationsAtTime: reservationsAtTime.length,
            reservationTimes: reservationsAtTime.map(r => r.eventTime),
            isAvailable,
            remainingCapacity
          });
        }
        
        return {
          time: slot.time,
          endTime: slot.endTime,
          available: isAvailable,
          remainingCapacity,
          totalCapacity: block.maxEventsPerBlock
        };
      });
      
      return {
        blockName: block.name,
        startTime: block.startTime,
        endTime: block.endTime,
        duration: block.duration,
        halfHourBreak: block.halfHourBreak,
        slots: slotsWithAvailability
      };
    });
    
    // Rest day fee already calculated above
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        dayOfWeek,
        isRestDay,
        restDayInfo: restDay || null,
        restDayFee,
        blocks: availableBlocks,
        defaultEventDuration: systemConfig.defaultEventDuration
      }
    });
  } catch (error) {
    console.error('Error fetching available blocks:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener bloques disponibles' },
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