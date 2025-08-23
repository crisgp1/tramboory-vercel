import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import Package from '@/models/Package';
import SystemConfig from '@/models/SystemConfig';
import FoodOption from '@/models/FoodOption';
import ExtraService from '@/models/ExtraService';
import EventTheme from '@/models/EventTheme';

// GET - Obtener todas las reservas
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerEmail = searchParams.get('customerEmail');
    
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.eventDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (customerEmail) {
      query['customer.email'] = customerEmail;
    }
    
    const reservations = await Reservation.find(query)
      .sort({ createdAt: -1 })
      .populate('package.configId')
      .populate('foodOption.configId')
      .populate('extraServices.configId')
      .populate('eventTheme.configId');
    
    return NextResponse.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las reservas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const {
      packageId,
      eventDate,
      eventTime,
      foodOptionId,
      foodExtras,
      extraServices,
      eventThemeId,
      selectedThemePackage,
      selectedTheme,
      customer,
      child,
      specialComments
    } = body;
    
    // Validar datos requeridos
    if (!packageId || !eventDate || !eventTime || !customer || !child) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener configuración del paquete
    const packageConfig = await Package.findById(packageId);
    if (!packageConfig) {
      return NextResponse.json(
        { success: false, error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener configuración del sistema
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    if (!systemConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuración del sistema no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar si es día de descanso - use UTC to avoid timezone issues
    const eventDateObj = new Date(eventDate + (eventDate.includes('T') ? '' : 'T12:00:00.000Z'));
    const jsDayOfWeek = eventDateObj.getUTCDay(); // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday...
    const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1; // Convert to Mexican: 0=Monday, 1=Tuesday, 6=Sunday
    const restDay = systemConfig.restDays?.find((rd: any) => rd.day === dayOfWeek);
    const isRestDay = !!restDay;
    
    console.log('🔍 RESERVATION DEBUG: Day conversion:', {
      eventDate,
      jsDayOfWeek,
      dayOfWeek,
      dayName: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][dayOfWeek],
      isRestDay,
      restDay,
      allRestDays: systemConfig.restDays
    });
    
    // Verificar si el horario está dentro de un bloque válido
    let validBlock = systemConfig.timeBlocks?.find((block: any) => {
      if (!block.days.includes(dayOfWeek)) return false;
      
      // Verificar si el horario está dentro del rango del bloque
      const [blockStartHour, blockStartMin] = block.startTime.split(':').map(Number);
      const [blockEndHour, blockEndMin] = block.endTime.split(':').map(Number);
      const [eventHour, eventMin] = eventTime.split(':').map(Number);
      
      const blockStartMinutes = blockStartHour * 60 + blockStartMin;
      const blockEndMinutes = blockEndHour * 60 + blockEndMin;
      const eventMinutes = eventHour * 60 + eventMin;
      
      return eventMinutes >= blockStartMinutes && eventMinutes < blockEndMinutes;
    });
    
    // If no block found but it's a releaseable rest day, create default block
    if (!validBlock && isRestDay && restDay && restDay.canBeReleased) {
      const [eventHour, eventMin] = eventTime.split(':').map(Number);
      const eventMinutes = eventHour * 60 + eventMin;
      
      // Default rest day hours: 10:00-18:00
      if (eventMinutes >= 600 && eventMinutes < 1080) { // 10:00 AM to 6:00 PM
        validBlock = {
          name: 'Horario especial',
          days: [dayOfWeek],
          startTime: '10:00',
          endTime: '18:00',
          duration: 4,
          halfHourBreak: true,
          maxEventsPerBlock: 2
        };
      }
    }
    
    if (!validBlock && !isRestDay) {
      console.error('No valid time block found:', {
        eventTime,
        dayOfWeek,
        isRestDay,
        availableBlocks: systemConfig.timeBlocks?.filter((b: any) => b.days.includes(dayOfWeek))
      });
      return NextResponse.json(
        { success: false, error: 'El horario seleccionado no está disponible' },
        { status: 400 }
      );
    }
    
    if (isRestDay && restDay && !restDay.canBeReleased) {
      return NextResponse.json(
        { success: false, error: 'No se permiten reservas en este día de descanso' },
        { status: 400 }
      );
    }
    
    // Verificar disponibilidad del slot de tiempo
    // Obtener todas las reservas existentes para esa fecha - use UTC to match stored dates
    const startOfDay = new Date(eventDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(eventDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const existingReservations = await Reservation.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    });
    
    console.log('Reservation validation debug:', {
      date: eventDate,
      dayOfWeek,
      eventTime,
      existingReservationsCount: existingReservations.length,
      validBlock: validBlock ? {
        name: validBlock.name,
        maxEventsPerBlock: validBlock.maxEventsPerBlock,
        startTime: validBlock.startTime,
        endTime: validBlock.endTime
      } : null,
      isRestDay,
      restDay
    });
    
    // Calcular el tiempo de finalización del evento
    const eventDuration = validBlock?.duration || systemConfig.defaultEventDuration;
    const [eventHour, eventMin] = eventTime.split(':').map(Number);
    const eventEndMinutes = (eventHour * 60 + eventMin) + (eventDuration * 60);
    const eventEndHour = Math.floor(eventEndMinutes / 60);
    const eventEndMin = eventEndMinutes % 60;
    const eventEndTime = `${eventEndHour.toString().padStart(2, '0')}:${eventEndMin.toString().padStart(2, '0')}`;
    
    // Verificar si hay conflictos de tiempo con otras reservas
    const conflictingReservations = existingReservations.filter(res => {
      const resStartTime = res.eventTime;
      const resDuration = res.eventDuration || systemConfig.defaultEventDuration;
      const [resHour, resMin] = resStartTime.split(':').map(Number);
      const resEndMinutes = (resHour * 60 + resMin) + (resDuration * 60);
      const resEndHour = Math.floor(resEndMinutes / 60);
      const resEndMin = resEndMinutes % 60;
      const resEndTime = `${resEndHour.toString().padStart(2, '0')}:${resEndMin.toString().padStart(2, '0')}`;
      
      // Convertir todo a minutos para comparación
      const eventStartMinutes = eventHour * 60 + eventMin;
      const eventEndMinutesCalc = eventEndMinutes;
      const resStartMinutes = resHour * 60 + resMin;
      const resEndMinutesCalc = resEndMinutes;
      
      // Verificar solapamiento
      return (eventStartMinutes < resEndMinutesCalc && resStartMinutes < eventEndMinutesCalc);
    });
    
    // Verificar capacidad del bloque de tiempo
    if (validBlock) {
      const maxEventsInBlock = validBlock.maxEventsPerBlock || 1;
      if (conflictingReservations.length >= maxEventsInBlock) {
        console.error('Block capacity exceeded:', {
          blockName: validBlock.name,
          maxEventsInBlock,
          conflictingReservations: conflictingReservations.length,
          eventTime,
          existingTimes: conflictingReservations.map(r => r.eventTime)
        });
        return NextResponse.json(
          { success: false, error: 'Este horario ya está completo. Por favor selecciona otro horario disponible.' },
          { status: 400 }
        );
      }
    }
    
    // Verificar capacidad total del día
    const dayTimeBlocks = systemConfig.timeBlocks?.filter((block: any) => 
      block.days.includes(dayOfWeek)
    ) || [];
    
    const totalDayCapacity = dayTimeBlocks.reduce((total: number, block: any) => {
      return total + (block.maxEventsPerBlock || 1);
    }, 0);
    
    if (totalDayCapacity > 0 && existingReservations.length >= totalDayCapacity) {
      return NextResponse.json(
        { success: false, error: 'Este día ya tiene la capacidad máxima de eventos. Por favor selecciona otra fecha.' },
        { status: 400 }
      );
    }
    
    // Calcular precio del paquete según el día (Mexican convention: 0=Monday, 1=Tuesday, ..., 6=Sunday)
    let packagePrice;
    if (dayOfWeek >= 0 && dayOfWeek <= 3) { // Lunes a Jueves (0-3)
      packagePrice = packageConfig.pricing.weekday;
    } else if (dayOfWeek === 4 || dayOfWeek === 5) { // Viernes y Sábado (4-5)
      packagePrice = packageConfig.pricing.weekend;
    } else { // Domingo (6) - considerar como día festivo
      packagePrice = packageConfig.pricing.holiday;
    }
    
    // Calcular precios
    let foodPrice = 0;
    let foodOptionData = null;
    
    if (foodOptionId) {
      const foodOption = await FoodOption.findById(foodOptionId);
      if (foodOption) {
        foodPrice = foodOption.basePrice || 0;
        
        // Procesar extras de comida - convertir strings a objetos
        const processedFoodExtras: Array<{name: string, price: number}> = [];
        if (foodExtras && Array.isArray(foodExtras)) {
          for (const extraKey of foodExtras) {
            if (typeof extraKey === 'string') {
              // Formato esperado: "nombre-precio"
              const parts = extraKey.split('-');
              if (parts.length >= 2) {
                const price = parseFloat(parts[parts.length - 1]);
                const name = parts.slice(0, -1).join('-');
                if (!isNaN(price)) {
                  processedFoodExtras.push({ name, price });
                  foodPrice += price;
                }
              }
            } else if (extraKey && typeof extraKey === 'object' && extraKey.name && extraKey.price) {
              // Si ya viene como objeto
              processedFoodExtras.push({
                name: extraKey.name,
                price: parseFloat(extraKey.price) || 0
              });
              foodPrice += parseFloat(extraKey.price) || 0;
            }
          }
        }
        
        foodOptionData = {
          configId: foodOption._id,
          name: foodOption.name,
          basePrice: foodOption.basePrice || 0,
          selectedExtras: processedFoodExtras
        };
      }
    }
    
    // Calcular precio de servicios extras
    let extrasPrice = 0;
    const extraServicesData = [];
    
    if (extraServices && Array.isArray(extraServices) && extraServices.length > 0) {
      for (const serviceId of extraServices) {
        // Los servicios extras vienen como array de IDs
        const service = await ExtraService.findById(serviceId);
        if (service) {
          const quantity = 1; // Por defecto cantidad 1
          const servicePrice = parseFloat(service.price.toString()) || 0;
          extrasPrice += servicePrice * quantity;
          extraServicesData.push({
            configId: service._id,
            name: service.name,
            price: servicePrice,
            quantity
          });
        }
      }
    }
    
    // Calcular precio de tema del evento
    let themePrice = 0;
    let eventThemeData = null;
    
    if (eventThemeId && selectedThemePackage) {
      const eventTheme = await EventTheme.findById(eventThemeId);
      if (eventTheme) {
        let themePackage = null;
        
        // selectedThemePackage puede venir como string "nombre-precio" o como objeto
        if (typeof selectedThemePackage === 'string') {
          // Buscar por nombre en el string
          const packageName = selectedThemePackage.split('-')[0];
          themePackage = eventTheme.packages.find(
            (pkg: any) => pkg.name === packageName
          );
        } else if (selectedThemePackage && selectedThemePackage.name) {
          // Si viene como objeto
          themePackage = eventTheme.packages.find(
            (pkg: any) => pkg.name === selectedThemePackage.name
          );
        }
        
        if (themePackage) {
          themePrice = parseFloat(themePackage.price.toString()) || 0;
          eventThemeData = {
            configId: eventTheme._id,
            name: eventTheme.name,
            selectedPackage: {
              name: themePackage.name,
              pieces: themePackage.pieces || 0,
              price: themePrice
            },
            selectedTheme: selectedTheme || eventTheme.themes[0] || ''
          };
        }
      }
    }
    
    // Calcular totales - asegurar que todos los valores sean números válidos
    const restDayFee = isRestDay && restDay ? (parseFloat(restDay.fee.toString()) || 0) : 0;
    const subtotal = (parseFloat(packagePrice.toString()) || 0) +
                    (parseFloat(foodPrice.toString()) || 0) +
                    (parseFloat(extrasPrice.toString()) || 0) +
                    (parseFloat(themePrice.toString()) || 0);
    const total = subtotal + restDayFee;
    
    console.log('🔍 RESERVATION PRICING DEBUG:', {
      packagePrice,
      foodPrice,
      extrasPrice,
      themePrice,
      isRestDay,
      restDayFee,
      subtotal,
      total
    });
    
    // Validar que los totales no sean NaN
    if (isNaN(subtotal) || isNaN(total)) {
      console.error('Error en cálculos:', {
        packagePrice,
        foodPrice,
        extrasPrice,
        themePrice,
        restDayFee,
        subtotal,
        total
      });
      return NextResponse.json(
        { success: false, error: 'Error en los cálculos de precio' },
        { status: 400 }
      );
    }
    
    // Log antes de crear la reserva
    console.log('Creating new reservation with data:', {
      packageName: packageConfig.name,
      eventDate: eventDateObj,
      eventTime,
      customerEmail: customer.email,
      childName: child.name,
      total: total
    });
    
    // Crear la reserva
    const newReservation = new Reservation({
      package: {
        configId: packageConfig._id,
        name: packageConfig.name,
        maxGuests: packageConfig.maxGuests,
        basePrice: packagePrice
      },
      eventDate: eventDateObj,
      eventTime,
      eventDuration: validBlock?.duration || systemConfig.defaultEventDuration,
      eventBlock: validBlock ? {
        name: validBlock.name,
        startTime: validBlock.startTime,
        endTime: validBlock.endTime
      } : undefined,
      isRestDay,
      restDayFee,
      foodOption: foodOptionData,
      extraServices: extraServicesData,
      eventTheme: eventThemeData,
      customer,
      child,
      specialComments,
      pricing: {
        packagePrice: parseFloat(packagePrice.toString()) || 0,
        foodPrice: parseFloat(foodPrice.toString()) || 0,
        extrasPrice: parseFloat(extrasPrice.toString()) || 0,
        themePrice: parseFloat(themePrice.toString()) || 0,
        restDayFee: parseFloat(restDayFee.toString()) || 0,
        subtotal: parseFloat(subtotal.toString()) || 0,
        total: parseFloat(total.toString()) || 0
      }
    });
    
    // Guardar la reserva con validación
    let savedReservation;
    try {
      savedReservation = await newReservation.save();
      console.log('Save operation completed, reservation ID:', savedReservation._id);
    } catch (saveError: any) {
      console.error('Error saving reservation to MongoDB:', saveError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al guardar la reserva: ' + (saveError.message || 'Unknown error'),
          details: saveError.errors ? Object.keys(saveError.errors).map(key => ({
            field: key,
            message: saveError.errors[key].message
          })) : undefined
        },
        { status: 500 }
      );
    }
    
    // Verificar que se guardó correctamente
    const verifyReservation = await Reservation.findById(savedReservation._id);
    if (!verifyReservation) {
      console.error('Reservation was not found after save:', savedReservation._id);
      
      // Intentar contar reservas para verificar conexión
      const count = await Reservation.countDocuments();
      console.log('Total reservations in database:', count);
      
      return NextResponse.json(
        { success: false, error: 'La reserva no se pudo verificar en la base de datos' },
        { status: 500 }
      );
    }
    
    console.log('Reservation saved and verified successfully:', {
      id: savedReservation._id.toString(),
      eventDate: savedReservation.eventDate,
      eventTime: savedReservation.eventTime,
      status: savedReservation.status,
      customerEmail: savedReservation.customer.email
    });
    
    return NextResponse.json(
      { success: true, data: savedReservation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}