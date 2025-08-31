import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import SystemConfig from '@/models/SystemConfig';
import { toUTCDateString, getMexicanDayOfWeek, getMexicanDayName } from '@/lib/utils/dateUtils';

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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Default to next 90 days if no dates provided
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    
    if (!endDateParam) {
      endDate.setDate(endDate.getDate() + 90);
    }
    
    // Set times to cover full days in local timezone (Mexico City)
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get system configuration
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración del sistema activa' },
        { status: 404 }
      );
    }
    
    // Get all reservations in the date range (excluding cancelled)
    const reservations = await Reservation.find({
      eventDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $ne: 'cancelled' }
    }).select('eventDate');
    
    // Count reservations per day
    const reservationCounts: { [key: string]: number } = {};
    
    reservations.forEach(reservation => {
      // Use local date formatting to match frontend calendar
      const date = new Date(reservation.eventDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      reservationCounts[dateKey] = (reservationCounts[dateKey] || 0) + 1;
      
      // Debug logging for date processing
      if (dateKey.includes('2025-08-2')) {
        console.log('📅 Processing reservation:', {
          stored: reservation.eventDate.toISOString(),
          localDate: date.toString(),
          dateKey,
          dayOfWeek: getMexicanDayOfWeek(date),
          dayName: getMexicanDayName(date)
        });
      }
    });
    
    // Generate availability data for each day
    const availability: { [key: string]: 'available' | 'limited' | 'unavailable' } = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Use local date formatting to match frontend calendar
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const count = reservationCounts[dateKey] || 0;
      const dayOfWeek = getMexicanDayOfWeek(currentDate); // Use local for consistency
      
      // Check if it's a rest day that cannot be released
      const restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
      const isBlockedRestDay = restDay && !restDay.canBeReleased;
      
      // Get time blocks configured for this day
      const dayTimeBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
        block.days.includes(dayOfWeek)
      ) || [];
      
      // Calculate capacity based on system configuration
      let totalDayCapacity = 0;
      
      if (dayTimeBlocks.length > 0) {
        // Check if system has global oneEventPerDay policy
        const oneEventPerDay = systemConfig.oneEventPerDay ?? true;
        
        if (oneEventPerDay) {
          // ONE EVENT PER DAY LOGIC: Set capacity to 1
          totalDayCapacity = 1;
        } else {
          // Calculate total capacity based on individual block capacities
          totalDayCapacity = dayTimeBlocks.reduce((total: number, block: TimeBlock) => {
            return total + block.maxEventsPerBlock;
          }, 0);
        }
      }
      
      // If it's a rest day that can be released and no blocks configured
      const isRestDay = !!restDay;
      if (isRestDay && restDay && restDay.canBeReleased && dayTimeBlocks.length === 0) {
        totalDayCapacity = 2; // Default capacity for rest days
      }
      
      // Debug logging for availability calculation
      if (dateKey === '2025-07-22' || dateKey === '2025-07-23' || dateKey === '2025-07-24') {
        console.log(`Availability debug for ${dateKey}:`, {
          dayOfWeek,
          dayName: getMexicanDayName(currentDate),
          isRestDay,
          isBlockedRestDay,
          dayTimeBlocks: dayTimeBlocks.length,
          totalDayCapacity,
          currentReservations: count,
          restDay
        });
      }
      
      // Mark as unavailable if:
      // 1. It's a blocked rest day (rest day that cannot be released)
      // 2. Already reached the total capacity for the day
      // Note: Days with no time blocks should be 'available' so users can click them,
      // but will show "no slots available" when selected
      if (isBlockedRestDay) {
        // Blocked rest days are truly unavailable
        availability[dateKey] = 'unavailable';
      } else if (totalDayCapacity > 0 && count >= totalDayCapacity) {
        // Day is fully booked
        availability[dateKey] = 'unavailable';
      } else if (totalDayCapacity > 0 && count >= totalDayCapacity * 0.5) {
        // Day has limited availability (50% or more booked)
        availability[dateKey] = 'limited';
      } else {
        // Day is available (including days with no time blocks)
        // Days with no time blocks will show as available but have no slots
        availability[dateKey] = 'available';
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return NextResponse.json({
      success: true,
      data: availability,
      meta: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalDays: Object.keys(availability).length
      }
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener disponibilidad' },
      { status: 500 }
    );
  }
}