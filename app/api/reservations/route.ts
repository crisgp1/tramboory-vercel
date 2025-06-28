import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import PackageConfig from '@/models/PackageConfig';
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
    const packageConfig = await PackageConfig.findById(packageId);
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
    
    // Verificar si es día de descanso
    const eventDateObj = new Date(eventDate);
    const dayOfWeek = eventDateObj.getDay();
    const isRestDay = dayOfWeek === systemConfig.restDay;
    
    // Calcular precio del paquete según el día
    let packagePrice;
    if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Lunes a Jueves
      packagePrice = packageConfig.pricing.mondayToThursday;
    } else { // Viernes a Domingo
      packagePrice = packageConfig.pricing.fridayToSunday;
    }
    
    // Calcular precios
    let foodPrice = 0;
    let foodOptionData = null;
    
    if (foodOptionId) {
      const foodOption = await FoodOption.findById(foodOptionId);
      if (foodOption) {
        foodPrice = foodOption.basePrice;
        foodOptionData = {
          configId: foodOption._id,
          name: foodOption.name,
          basePrice: foodOption.basePrice,
          selectedExtras: foodExtras || []
        };
        
        // Agregar precio de extras de comida
        if (foodExtras && foodExtras.length > 0) {
          foodPrice += foodExtras.reduce((sum: number, extra: any) => sum + extra.price, 0);
        }
      }
    }
    
    // Calcular precio de servicios extras
    let extrasPrice = 0;
    const extraServicesData = [];
    
    if (extraServices && extraServices.length > 0) {
      for (const extraService of extraServices) {
        const service = await ExtraService.findById(extraService.configId);
        if (service) {
          const quantity = extraService.quantity || 1;
          extrasPrice += service.price * quantity;
          extraServicesData.push({
            configId: service._id,
            name: service.name,
            price: service.price,
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
        const themePackage = eventTheme.packages.find(
          (pkg: any) => pkg.name === selectedThemePackage.name
        );
        if (themePackage) {
          themePrice = themePackage.price;
          eventThemeData = {
            configId: eventTheme._id,
            name: eventTheme.name,
            selectedPackage: {
              name: themePackage.name,
              pieces: themePackage.pieces,
              price: themePackage.price
            },
            selectedTheme: selectedTheme || ''
          };
        }
      }
    }
    
    // Calcular totales
    const restDayFee = isRestDay ? systemConfig.restDayFee : 0;
    const subtotal = packagePrice + foodPrice + extrasPrice + themePrice;
    const total = subtotal + restDayFee;
    
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
      isRestDay,
      restDayFee,
      foodOption: foodOptionData,
      extraServices: extraServicesData,
      eventTheme: eventThemeData,
      customer,
      child,
      specialComments,
      pricing: {
        packagePrice,
        foodPrice,
        extrasPrice,
        themePrice,
        restDayFee,
        subtotal,
        total
      }
    });
    
    await newReservation.save();
    
    return NextResponse.json(
      { success: true, data: newReservation },
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