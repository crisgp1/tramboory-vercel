import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import Reservation from '@/models/Reservation';
import { format } from 'date-fns';

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
    
    // Get reservations for the day with improved date handling
    // Create date range for the specific day (local timezone)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // First, get ALL reservations to debug
    const totalReservations = await Reservation.countDocuments({ status: { $ne: 'cancelled' } });
    console.log('Total reservations in database:', totalReservations);
    
    // Get all reservations in a wider range to catch timezone issues
    const startOfPrevDay = new Date(date);
    startOfPrevDay.setDate(startOfPrevDay.getDate() - 1);
    startOfPrevDay.setHours(0, 0, 0, 0);
    const endOfNextDay = new Date(date);
    endOfNextDay.setDate(endOfNextDay.getDate() + 2);
    endOfNextDay.setHours(23, 59, 59, 999);
    
    const allReservations = await Reservation.find({
      eventDate: {
        $gte: startOfPrevDay,
        $lte: endOfNextDay
      },
      status: { $ne: 'cancelled' }
    }).lean();
    
    console.log('Reservations in wide date range:', allReservations.length);
    
    // Filter by exact date string match with better timezone handling
    const targetDateStr = format(date, 'yyyy-MM-dd');
    const reservations = allReservations.filter(reservation => {
      // Handle both string and Date eventDate
      const eventDate = new Date(reservation.eventDate);
      const reservationDateStr = format(eventDate, 'yyyy-MM-dd');
      
      // Debug individual reservation dates
      if (allReservations.length < 10) {
        console.log(`Reservation ${reservation._id}: eventDate=${reservation.eventDate}, formatted=${reservationDateStr}, target=${targetDateStr}`);
      }
      
      return reservationDateStr === targetDateStr;
    });
    
    // Transform reservation data for summary (with correct field names)
    const reservationDetails = reservations.map(reservation => ({
      _id: reservation._id,
      customer: {
        name: reservation.customer?.name || 'Sin nombre',
        email: reservation.customer?.email || 'Sin email',
        phone: reservation.customer?.phone || 'Sin teléfono'
      },
      child: {
        name: reservation.child?.name || 'Sin nombre',
        age: reservation.child?.age || 0
      },
      eventTime: reservation.eventTime || '00:00',
      eventDuration: reservation.eventDuration || systemConfig.defaultEventDuration || systemConfig.timeBlocks?.[0]?.duration || 2,
      status: reservation.status || 'pending',
      totalAmount: reservation.pricing?.total || 0,
      packageName: reservation.package?.name || 'Paquete no disponible',
      paymentStatus: reservation.paymentStatus || 'pending',
      specialComments: reservation.specialComments || '',
      createdAt: reservation.createdAt
    }));
    
    // Check if it's a rest day
    const restDay = systemConfig.restDays?.find((rd: RestDay) => rd.day === dayOfWeek);
    const isRestDay = !!restDay;
    
    // Get time blocks for this day
    const dayBlocks = systemConfig.timeBlocks?.filter((block: TimeBlock) => 
      block.days.includes(dayOfWeek)
    ) || [];
    
    console.log('Day details debug:', {
      date: dateParam,
      parsedDate: date.toISOString(),
      targetDateStr,
      dayOfWeek,
      totalReservationsInDB: totalReservations,
      allReservationsFound: allReservations.length,
      reservationsAfterFilter: reservations.length,
      reservationTimes: reservations.map(r => r?.eventTime || 'no-time'),
      reservationData: reservations.map(r => ({
        id: r._id,
        eventDate: r.eventDate,
        eventDateISO: new Date(r.eventDate).toISOString(),
        eventTime: r.eventTime,
        customerName: r.customer?.name,
        packageName: r.package?.name,
        totalAmount: r.pricing?.total,
        status: r.status
      })),
      dayBlocks: dayBlocks.length,
      systemConfigFound: !!systemConfig,
      defaultEventDuration: systemConfig.defaultEventDuration,
      reservationDetailsCount: reservationDetails.length
    });
    
    // Log first few reservations from DB for debugging
    if (totalReservations > 0 && allReservations.length === 0) {
      const sampleReservations = await Reservation.find({ status: { $ne: 'cancelled' } }).limit(3).lean();
      console.log('Sample reservations from DB:', sampleReservations.map(r => ({
        id: r._id,
        eventDate: r.eventDate,
        eventDateISO: new Date(r.eventDate).toISOString(),
        status: r.status
      })));
    }
    
    // Calculate total revenue
    const totalRevenue = reservationDetails.reduce((sum, res) => sum + (res.totalAmount || 0), 0);
    const averageEventValue = reservationDetails.length > 0 ? totalRevenue / reservationDetails.length : 0;
    
    // Process time blocks with availability
    const timeBlocksWithSlots = dayBlocks.map((block: TimeBlock) => {
      const blockSlots = generateBlockSlots(
        block.startTime,
        block.endTime,
        block.duration,
        block.halfHourBreak
      );
      
      const slotsWithAvailability = blockSlots.map(slot => {
        // Use the same filtering logic as available-blocks
        const reservationsAtTime = reservations.filter(res => {
          const resTime = res.eventTime;
          const resEndTime = calculateEndTime(resTime, res.eventDuration || systemConfig.defaultEventDuration || block.duration || 2);
          const slotEndTime = calculateEndTime(slot.time, block.duration);
          
          // Check if there's time overlap
          return isTimeOverlap(
            { start: resTime, end: resEndTime },
            { start: slot.time, end: slotEndTime }
          );
        });
        
        const isAvailable = reservationsAtTime.length < block.maxEventsPerBlock;
        const remainingCapacity = block.maxEventsPerBlock - reservationsAtTime.length;
        
        // Transform reservations for display (with correct field names)
        const slotReservationsDisplay = reservationsAtTime.map(res => ({
          _id: res._id,
          customer: {
            name: res.customer?.name || 'Sin nombre',
            email: res.customer?.email || 'Sin email',
            phone: res.customer?.phone || 'Sin teléfono'
          },
          child: {
            name: res.child?.name || 'Sin nombre',
            age: res.child?.age || 0
          },
          eventTime: res.eventTime || '00:00',
          eventDuration: res.eventDuration || systemConfig.defaultEventDuration || block.duration || 2,
          status: res.status || 'pending',
          totalAmount: res.pricing?.total || 0,
          packageName: res.package?.name || 'Paquete no disponible',
          paymentStatus: res.paymentStatus || 'pending',
          specialComments: res.specialComments || '',
          createdAt: res.createdAt
        }));
        
        return {
          time: slot.time,
          endTime: slot.endTime,
          available: isAvailable,
          remainingCapacity,
          totalCapacity: block.maxEventsPerBlock,
          reservations: slotReservationsDisplay
        };
      });
      
      return {
        name: block.name,
        startTime: block.startTime,
        endTime: block.endTime,
        duration: block.duration,
        slots: slotsWithAvailability
      };
    });
    
    // Calculate total slots and available slots
    const totalSlots = timeBlocksWithSlots.reduce((sum: number, block: any) => sum + block.slots.length, 0);
    const availableSlots = timeBlocksWithSlots.reduce((sum: number, block: any) => 
      sum + block.slots.filter((slot: any) => slot.available).length, 0
    );
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        totalSlots,
        availableSlots,
        reservations: reservationDetails,
        totalRevenue,
        averageEventValue,
        isRestDay,
        restDayFee: isRestDay && restDay ? restDay.fee : undefined,
        timeBlocks: timeBlocksWithSlots
      }
    });
  } catch (error) {
    console.error('Error fetching day details:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener detalles del día' },
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