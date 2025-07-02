import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';
import Reservation from '@/models/Reservation';

// POST - Generar transacciones financieras desde reservas
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { 
      reservationIds, 
      generateType = 'income', // 'income', 'expense', 'both'
      overwrite = false,
      createdBy 
    } = body;
    
    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de IDs de reservas' },
        { status: 400 }
      );
    }
    
    // Obtener las reservas
    const reservations = await Reservation.find({
      _id: { $in: reservationIds }
    });
    
    if (reservations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron reservas' },
        { status: 404 }
      );
    }
    
    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };
    
    for (const reservation of reservations) {
      try {
        const reservationId = reservation._id.toString();
        
        // Verificar si ya existen transacciones para esta reserva
        const existingTransactions = await Finance.find({
          'reservation.reservationId': reservation._id
        });
        
        if (existingTransactions.length > 0 && !overwrite) {
          results.skipped++;
          results.details.push({
            reservationId,
            status: 'skipped',
            reason: 'Ya existen transacciones para esta reserva'
          });
          continue;
        }
        
        // Si overwrite es true, eliminar transacciones existentes
        if (overwrite && existingTransactions.length > 0) {
          await Finance.deleteMany({
            'reservation.reservationId': reservation._id
          });
        }
        
        const transactionsToCreate = [];
        
        // Generar ingreso por la reserva
        if (generateType === 'income' || generateType === 'both') {
          const incomeTransaction = {
            type: 'income',
            description: `Ingreso por reserva - ${reservation.customer.name}`,
            amount: reservation.pricing.total,
            date: reservation.eventDate,
            category: 'reservation',
            subcategory: 'evento',
            reservation: {
              reservationId: reservation._id,
              customerName: reservation.customer.name,
              eventDate: reservation.eventDate
            },
            tags: [
              'reserva',
              'evento',
              reservation.package.name.toLowerCase().replace(/\s+/g, '-')
            ],
            paymentMethod: 'cash', // Por defecto, se puede cambiar después
            reference: `RES-${reservation._id.toString().slice(-8).toUpperCase()}`,
            notes: `Generado automáticamente desde reserva. Evento: ${reservation.child.name} (${reservation.child.age} años)`,
            status: reservation.status === 'confirmed' ? 'completed' : 'pending',
            createdBy,
            isSystemGenerated: true,
            isEditable: false
          };
          
          // Agregar etiquetas específicas según los servicios
          if (reservation.foodOption) {
            incomeTransaction.tags.push('comida');
          }
          if (reservation.extraServices && reservation.extraServices.length > 0) {
            incomeTransaction.tags.push('extras');
          }
          if (reservation.eventTheme) {
            incomeTransaction.tags.push('decoracion');
          }
          if (reservation.isRestDay) {
            incomeTransaction.tags.push('dia-descanso');
          }
          
          transactionsToCreate.push(incomeTransaction);
        }
        
        // Generar gastos relacionados (opcional)
        if (generateType === 'expense' || generateType === 'both') {
          // Ejemplo: costo estimado de materiales (30% del total)
          const materialCost = Math.round(reservation.pricing.total * 0.3);
          
          if (materialCost > 0) {
            const expenseTransaction = {
              type: 'expense',
              description: `Gastos de materiales - Evento ${reservation.customer.name}`,
              amount: materialCost,
              date: reservation.eventDate,
              category: 'operational',
              subcategory: 'materiales',
              reservation: {
                reservationId: reservation._id,
                customerName: reservation.customer.name,
                eventDate: reservation.eventDate
              },
              tags: [
                'materiales',
                'evento',
                'operativo',
                reservation.package.name.toLowerCase().replace(/\s+/g, '-')
              ],
              reference: `MAT-${reservation._id.toString().slice(-8).toUpperCase()}`,
              notes: `Gasto estimado de materiales (30% del total). Evento: ${reservation.child.name}`,
              status: 'pending',
              createdBy,
              isSystemGenerated: true,
              isEditable: false
            };
            
            transactionsToCreate.push(expenseTransaction);
          }
        }
        
        // Crear las transacciones
        if (transactionsToCreate.length > 0) {
          const createdTransactions = await Finance.insertMany(transactionsToCreate);
          results.created += createdTransactions.length;
          results.details.push({
            reservationId,
            status: 'created',
            transactionsCreated: createdTransactions.length,
            transactions: createdTransactions.map(t => ({
              id: t._id,
              type: t.type,
              amount: t.amount,
              description: t.description
            }))
          });
        }
        
      } catch (error) {
        console.error(`Error processing reservation ${reservation._id}:`, error);
        results.errors++;
        results.details.push({
          reservationId: reservation._id.toString(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Proceso completado. Creadas: ${results.created}, Omitidas: ${results.skipped}, Errores: ${results.errors}`,
      results
    });
    
  } catch (error) {
    console.error('Error generating finances from reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar transacciones desde reservas' },
      { status: 500 }
    );
  }
}

// GET - Obtener vista previa de transacciones que se generarían
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const reservationIds = searchParams.get('reservationIds')?.split(',') || [];
    const generateType = searchParams.get('generateType') || 'income';
    
    if (reservationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requieren IDs de reservas' },
        { status: 400 }
      );
    }
    
    // Obtener las reservas
    const reservations = await Reservation.find({
      _id: { $in: reservationIds }
    });
    
    const preview = [];
    let totalIncome = 0;
    let totalExpense = 0;
    
    for (const reservation of reservations) {
      const reservationPreview: any = {
        reservationId: reservation._id,
        customerName: reservation.customer.name,
        eventDate: reservation.eventDate,
        reservationTotal: reservation.pricing.total,
        transactions: []
      };
      
      // Verificar transacciones existentes
      const existingTransactions = await Finance.find({
        'reservation.reservationId': reservation._id
      });
      
      reservationPreview.hasExistingTransactions = existingTransactions.length > 0;
      reservationPreview.existingTransactionsCount = existingTransactions.length;
      
      // Vista previa de ingreso
      if (generateType === 'income' || generateType === 'both') {
        reservationPreview.transactions.push({
          type: 'income',
          description: `Ingreso por reserva - ${reservation.customer.name}`,
          amount: reservation.pricing.total,
          category: 'reservation'
        });
        totalIncome += reservation.pricing.total;
      }
      
      // Vista previa de gasto
      if (generateType === 'expense' || generateType === 'both') {
        const materialCost = Math.round(reservation.pricing.total * 0.3);
        if (materialCost > 0) {
          reservationPreview.transactions.push({
            type: 'expense',
            description: `Gastos de materiales - Evento ${reservation.customer.name}`,
            amount: materialCost,
            category: 'operational'
          });
          totalExpense += materialCost;
        }
      }
      
      preview.push(reservationPreview);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        preview,
        summary: {
          totalReservations: reservations.length,
          totalIncome,
          totalExpense,
          netAmount: totalIncome - totalExpense,
          reservationsWithExistingTransactions: preview.filter(p => p.hasExistingTransactions).length
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar vista previa' },
      { status: 500 }
    );
  }
}