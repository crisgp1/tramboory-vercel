import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import SystemConfig from '@/models/SystemConfig';

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
    
    // Set times to cover full days
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
      const dateKey = reservation.eventDate.toISOString().split('T')[0];
      reservationCounts[dateKey] = (reservationCounts[dateKey] || 0) + 1;
    });
    
    // Generate availability data for each day
    const availability: { [key: string]: 'available' | 'limited' | 'unavailable' } = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = reservationCounts[dateKey] || 0;
      const dayOfWeek = currentDate.getDay();
      
      // Check if it's a rest day that cannot be released
      const restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
      const isBlockedRestDay = restDay && !restDay.canBeReleased;
      
      // Get time blocks configured for this day
      const dayTimeBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
        block.days.includes(dayOfWeek)
      ) || [];
      
      // Calculate total capacity for the day based on time blocks
      let totalDayCapacity = dayTimeBlocks.reduce((total: number, block: TimeBlock) => {
        return total + block.maxEventsPerBlock;
      }, 0);
      
      // If it's a rest day that can be released and no blocks configured, add default capacity
      const isRestDay = !!restDay;
      if (isRestDay && restDay && restDay.canBeReleased && dayTimeBlocks.length === 0) {
        totalDayCapacity = 2; // Default capacity for rest days
      }
      
      // Debug logging for availability calculation
      if (dateKey === '2025-07-22' || dateKey === '2025-07-23' || dateKey === '2025-07-24') {
        console.log(`Availability debug for ${dateKey} (day ${dayOfWeek}):`, {
          isRestDay,
          isBlockedRestDay,
          dayTimeBlocks: dayTimeBlocks.length,
          totalDayCapacity,
          currentReservations: count,
          restDay
        });
      }
      
      // Mark as unavailable if:
      // 1. It's a blocked rest day
      // 2. No time blocks are configured for this day (and it's not a releaseable rest day)
      // 3. Already reached the total capacity for the day
      if (isBlockedRestDay) {
        // Blocked rest days are truly unavailable
        availability[dateKey] = 'unavailable';
      } else if (totalDayCapacity === 0) {
        // No capacity configured for this day
        availability[dateKey] = 'unavailable';
      } else if (count >= totalDayCapacity) {
        // Day is fully booked
        availability[dateKey] = 'unavailable';
      } else if (totalDayCapacity > 0 && count >= totalDayCapacity * 0.5) {
        // Day has limited availability (50% or more booked)
        availability[dateKey] = 'limited';
      } else {
        // Day is available
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