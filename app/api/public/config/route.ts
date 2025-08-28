import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PackageConfig from '@/models/PackageConfig';
import SystemConfig from '@/models/SystemConfig';
import FoodOption from '@/models/FoodOption';
import ExtraService from '@/models/ExtraService';
import EventTheme from '@/models/EventTheme';

// GET - Obtener configuración pública para el formulario de reservas
export async function GET() {
  try {
    await dbConnect();
    
    // Obtener paquetes activos
    const packages = await PackageConfig.find({ isActive: true }).sort({ number: 1 });
    
    // Obtener configuración del sistema
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    // Obtener opciones de alimentos activas
    const foodOptions = await FoodOption.find({ isActive: true }).sort({ name: 1 });
    
    // Obtener servicios extras activos
    const extraServices = await ExtraService.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    // Obtener temas de eventos activos
    const eventThemes = await EventTheme.find({ isActive: true }).sort({ name: 1 });
    
    // Formatear la respuesta
    const config = {
      packages: packages.map(pkg => ({
        id: pkg._id,
        name: pkg.name,
        number: pkg.number,
        maxGuests: pkg.maxGuests,
        pricing: pkg.pricing,
        description: pkg.description
      })),
      
      systemConfig: systemConfig ? {
        restDay: systemConfig.restDay,
        restDayFee: systemConfig.restDayFee,
        workingHours: systemConfig.workingHours,
        eventDuration: systemConfig.eventDuration,
        farewellTime: systemConfig.farewellTime,
        minAdvanceBookingDays: systemConfig.minAdvanceBookingDays || 7,
        advanceBookingDays: systemConfig.advanceBookingDays || 30
      } : null,
      
      foodOptions: foodOptions.map(food => ({
        id: food._id,
        name: food.name,
        description: food.description,
        basePrice: food.basePrice,
        category: food.category,
        adultDishes: food.adultDishes || [],
        kidsDishes: food.kidsDishes || [],
        upgrades: food.upgrades || []
      })),
      
      extraServices: extraServices.map(service => ({
        id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category
      })),
      
      eventThemes: eventThemes.map(theme => ({
        id: theme._id,
        name: theme.name,
        description: theme.description,
        includes: theme.includes,
        packages: theme.packages,
        availableThemes: theme.availableThemes
      }))
    };
    
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching public config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}