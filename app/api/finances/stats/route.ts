import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';

// GET - Obtener estadísticas financieras
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'month'; // month, week, year
    
    // Construir filtro de fecha
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Por defecto, último mes
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFilter = {
        date: { $gte: lastMonth }
      };
    }
    
    // Estadísticas generales
    const generalStats = await Finance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);
    
    // Estadísticas por categoría
    const categoryStats = await Finance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              count: '$count'
            }
          },
          totalByType: { $sum: '$total' }
        }
      }
    ]);
    
    // Estadísticas por método de pago
    const paymentMethodStats = await Finance.aggregate([
      { $match: { ...dateFilter, paymentMethod: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Tendencias por período
    let groupByPeriod: any;
    switch (period) {
      case 'week':
        groupByPeriod = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      case 'year':
        groupByPeriod = {
          year: { $year: '$date' }
        };
        break;
      default: // month
        groupByPeriod = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
    }
    
    const trends = await Finance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            ...groupByPeriod,
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);
    
    // Top etiquetas más usadas
    const topTags = await Finance.aggregate([
      { $match: { ...dateFilter, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Transacciones relacionadas con reservas
    const reservationStats = await Finance.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          'reservation.reservationId': { $exists: true, $ne: null } 
        } 
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calcular totales generales
    const totalIncome = generalStats.find(s => s._id === 'income')?.total || 0;
    const totalExpense = generalStats.find(s => s._id === 'expense')?.total || 0;
    const balance = totalIncome - totalExpense;
    
    const incomeCount = generalStats.find(s => s._id === 'income')?.count || 0;
    const expenseCount = generalStats.find(s => s._id === 'expense')?.count || 0;
    
    const avgIncome = generalStats.find(s => s._id === 'income')?.average || 0;
    const avgExpense = generalStats.find(s => s._id === 'expense')?.average || 0;
    
    // Transacciones recientes (últimas 5)
    const recentTransactions = await Finance.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reservation.reservationId');
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          balance,
          incomeCount,
          expenseCount,
          totalTransactions: incomeCount + expenseCount,
          avgIncome: Math.round(avgIncome * 100) / 100,
          avgExpense: Math.round(avgExpense * 100) / 100
        },
        categoryBreakdown: categoryStats,
        paymentMethods: paymentMethodStats,
        trends,
        topTags,
        reservationRelated: {
          income: reservationStats.find(s => s._id === 'income') || { total: 0, count: 0 },
          expense: reservationStats.find(s => s._id === 'expense') || { total: 0, count: 0 }
        },
        recentTransactions,
        period: {
          type: period,
          startDate: dateFilter.date?.$gte || null,
          endDate: dateFilter.date?.$lte || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching finance stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las estadísticas financieras' },
      { status: 500 }
    );
  }
}