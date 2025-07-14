import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if system config already exists
    const existingConfig = await SystemConfig.findOne({});
    
    if (existingConfig) {
      // Update existing config to include timeBlocks and restDays if they don't exist
      const updateDoc: any = {};
      
      if (!existingConfig.timeBlocks || existingConfig.timeBlocks.length === 0) {
        updateDoc.timeBlocks = [
          {
            name: "Lunes a Viernes - Tarde",
            days: [1, 3, 4, 5], // Lunes, Miércoles, Jueves, Viernes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Fin de Semana - Tarde",
            days: [6, 0], // Sábado, Domingo
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Martes - Día de Descanso",
            days: [2], // Martes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          }
        ];
      }
      
      if (!existingConfig.restDays || existingConfig.restDays.length === 0) {
        updateDoc.restDays = [
          {
            day: 2, // Martes
            name: "Martes",
            fee: 1500,
            canBeReleased: true
          }
        ];
      }
      
      if (Object.keys(updateDoc).length > 0) {
        const updatedConfig = await SystemConfig.findByIdAndUpdate(
          existingConfig._id,
          { $set: updateDoc },
          { new: true }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Configuración actualizada con bloques de horarios',
          data: updatedConfig
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'La configuración ya tiene bloques de horarios',
          data: existingConfig
        });
      }
    } else {
      // Create new system config
      const defaultConfig = new SystemConfig({
        restDay: 2, // Martes
        restDayFee: 1500,
        businessHours: {
          start: "14:00",
          end: "19:00"
        },
        advanceBookingDays: 7,
        maxConcurrentEvents: 1,
        defaultEventDuration: 3.5,
        timeBlocks: [
          {
            name: "Lunes a Viernes - Tarde",
            days: [1, 3, 4, 5], // Lunes, Miércoles, Jueves, Viernes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Fin de Semana - Tarde",
            days: [6, 0], // Sábado, Domingo
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          },
          {
            name: "Martes - Día de Descanso",
            days: [2], // Martes
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          }
        ],
        restDays: [
          {
            day: 2, // Martes
            name: "Martes",
            fee: 1500,
            canBeReleased: true
          }
        ],
        isActive: true
      });
      
      const savedConfig = await defaultConfig.save();
      
      return NextResponse.json({
        success: true,
        message: 'Configuración del sistema creada exitosamente',
        data: savedConfig
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error initializing system config:', error);
    return NextResponse.json(
      { success: false, error: 'Error al inicializar la configuración del sistema' },
      { status: 500 }
    );
  }
}