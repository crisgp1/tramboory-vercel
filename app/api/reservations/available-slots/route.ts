import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig, { ISystemConfig } from '@/models/SystemConfig';
import Reservation from '@/models/Reservation';

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
    
    const date = new Date(dateParam + 'T12:00:00.000Z'); // Parse as UTC noon to avoid timezone issues
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración del sistema activa' },
        { status: 404 }
      );
    }
    
    // Generate time slots based on time blocks
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format
    
    // Find time blocks for the day
    const dayTimeBlocks = systemConfig.timeBlocks.filter((block: any) => 
      block.days.includes(dayOfWeek)
    );
    
    console.log('🗓️ Day of week:', dayOfWeek);
    console.log('📋 All time blocks:', systemConfig.timeBlocks);
    console.log('✅ Matching blocks for day:', dayTimeBlocks);
    
    if (dayTimeBlocks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date: dateParam,
          isRestDay: false,
          restDayFee: 0,
          defaultEventDuration: systemConfig.defaultEventDuration,
          slots: []
        }
      });
    }
    
    // Use exact time slots from blocks (no generation needed)
    const timeSlots: string[] = [];
    dayTimeBlocks.forEach((block: any) => {
      // Each block represents one exact time slot
      timeSlots.push(block.startTime);
    });
    
    // Get existing reservations for the date - use UTC to match stored dates
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const existingReservations = await Reservation.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    });
    
    // Check if system has oneEventPerDay policy globally
    const oneEventPerDay = systemConfig.oneEventPerDay ?? true;
    
    // Check availability for each time slot
    const availableSlots = dayTimeBlocks.map((block: any) => {
      // If system has oneEventPerDay policy
      if (oneEventPerDay) {
        // Check if there's ANY reservation on this day
        if (existingReservations.length > 0) {
          return {
            time: block.startTime,
            available: false,
            remainingCapacity: 0,
            totalCapacity: 1
          };
        }
        // Otherwise, the slot is available (only one event per day allowed)
        return {
          time: block.startTime,
          available: true,
          remainingCapacity: 1,
          totalCapacity: 1
        };
      }
      
      // For systems without oneEventPerDay, check capacity normally
      const reservationsAtTime = existingReservations.filter(res => 
        res.eventTime === block.startTime
      );
      
      const maxCapacity = block.maxEventsPerBlock || 1;
      const isAvailable = reservationsAtTime.length < maxCapacity;
      const remainingCapacity = maxCapacity - reservationsAtTime.length;
      
      return {
        time: block.startTime,
        available: isAvailable,
        remainingCapacity,
        totalCapacity: maxCapacity
      };
    });
    
    // Check if date is rest day
    const restDay = systemConfig.restDays.find((rd: any) => rd.day === dayOfWeek);
    const isRestDay = !!restDay;
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        isRestDay,
        restDayFee: restDay?.fee || 0,
        defaultEventDuration: systemConfig.defaultEventDuration,
        slots: availableSlots
      }
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener horarios disponibles' },
      { status: 500 }
    );
  }
}

// No longer needed - we use exact block times