import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import Reservation from '@/models/Reservation';

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
    
    const date = new Date(dateParam);
    const dayOfWeek = date.getDay();
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración del sistema activa' },
        { status: 404 }
      );
    }
    
    // Check if it's a rest day
    const restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
    const isRestDay = !!restDay;
    
    // Get time blocks for this day
    const dayBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
      block.days.includes(dayOfWeek)
    ) || [];
    
    console.log('Available blocks debug:', {
      date: dateParam,
      dayOfWeek,
      isRestDay,
      restDay,
      totalTimeBlocks: systemConfig.timeBlocks?.length || 0,
      dayBlocks: dayBlocks.length,
      dayBlocksDetails: dayBlocks.map((b: TimeBlock) => ({
        name: b.name,
        days: b.days,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration
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
    
    // Get existing reservations for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingReservations = await Reservation.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    });
    
    // Process each time block
    const availableBlocks = dayBlocks.map((block: TimeBlock) => {
      const slots = generateBlockSlots(
        block.startTime,
        block.endTime,
        block.duration,
        block.halfHourBreak
      );
      
      // Check availability for each slot in the block
      const slotsWithAvailability = slots.map(slot => {
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
        
        const isAvailable = reservationsAtTime.length < block.maxEventsPerBlock;
        const remainingCapacity = block.maxEventsPerBlock - reservationsAtTime.length;
        
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
    
    // Add rest day fee if applicable
    const restDayFee = isRestDay && restDay ? restDay.fee : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        dayOfWeek,
        isRestDay,
        restDayInfo: restDay || null,
        restDayFee,
        blocks: availableBlocks,
        businessHours: systemConfig.businessHours,
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