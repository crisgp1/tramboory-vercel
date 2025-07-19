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
      
      // Check if there are time blocks configured for this day
      const hasTimeBlocks = systemConfig.timeBlocks?.some((block: TimeBlock) => 
        block.days.includes(dayOfWeek)
      );
      
      // Mark as unavailable only if:
      // 1. No time blocks are configured for this day (and it's not a rest day)
      // 2. Already has 2 or more events
      // Rest days that can't be released will show as 'available' but need unlocking
      if ((!hasTimeBlocks && !restDay) || count >= 2) {
        availability[dateKey] = 'unavailable';
      } else if (count === 1) {
        availability[dateKey] = 'limited';
      } else {
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