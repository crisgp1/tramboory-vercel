import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
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
    
    // Generate time slots based on business hours
    const timeSlots = generateTimeSlots(
      systemConfig.businessHours.start,
      systemConfig.businessHours.end,
      systemConfig.defaultEventDuration
    );
    
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
    
    // Check availability for each time slot
    const availableSlots = timeSlots.map(slot => {
      const reservationsAtTime = existingReservations.filter(res => 
        res.eventTime === slot
      );
      
      const isAvailable = reservationsAtTime.length < systemConfig.maxConcurrentEvents;
      const remainingCapacity = systemConfig.maxConcurrentEvents - reservationsAtTime.length;
      
      return {
        time: slot,
        available: isAvailable,
        remainingCapacity,
        totalCapacity: systemConfig.maxConcurrentEvents
      };
    });
    
    // Check if date is rest day
    const isRestDay = date.getDay() === systemConfig.restDay;
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        isRestDay,
        restDayFee: isRestDay ? systemConfig.restDayFee : 0,
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

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
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