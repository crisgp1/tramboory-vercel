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
    
    // Verificar si es día de descanso
    const eventDateObj = new Date(eventDate);
    const dayOfWeek = eventDateObj.getDay();
    const isRestDay = dayOfWeek === systemConfig.restDay;
    
    // Calcular precio del paquete según el día
    let packagePrice;
    if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Lunes a Jueves
      packagePrice = packageConfig.pricing.weekday;
    } else if (dayOfWeek === 5 || dayOfWeek === 6) { // Viernes y Sábado
      packagePrice = packageConfig.pricing.weekend;
    } else { // Domingo (considerar como día festivo)
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
    const restDayFee = isRestDay ? (parseFloat(systemConfig.restDayFee.toString()) || 0) : 0;
    const subtotal = (parseFloat(packagePrice.toString()) || 0) +
                    (parseFloat(foodPrice.toString()) || 0) +
                    (parseFloat(extrasPrice.toString()) || 0) +
                    (parseFloat(themePrice.toString()) || 0);
    const total = subtotal + restDayFee;
    
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
        packagePrice: parseFloat(packagePrice.toString()) || 0,
        foodPrice: parseFloat(foodPrice.toString()) || 0,
        extrasPrice: parseFloat(extrasPrice.toString()) || 0,
        themePrice: parseFloat(themePrice.toString()) || 0,
        restDayFee: parseFloat(restDayFee.toString()) || 0,
        subtotal: parseFloat(subtotal.toString()) || 0,
        total: parseFloat(total.toString()) || 0
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