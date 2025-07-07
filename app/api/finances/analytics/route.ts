import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'last30days'

    const { db } = await connectToDatabase()
    
    // Calcular fechas según el rango
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last30days':
        startDate.setDate(now.getDate() - 30)
        break
      case 'last90days':
        startDate.setDate(now.getDate() - 90)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        now.setDate(0) // Último día del mes anterior
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Obtener datos de finanzas
    const finances = await db.collection('finances').find({
      createdAt: {
        $gte: startDate,
        $lte: now
      }
    }).toArray()

    // Calcular métricas generales
    const totalRevenue = finances
      .filter(f => f.type === 'income' && f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0)

    const pendingPayments = finances
      .filter(f => f.type === 'income' && f.status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0)

    // Calcular crecimiento mensual
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const lastMonthRevenue = await db.collection('finances').find({
      type: 'income',
      status: 'paid',
      createdAt: {
        $gte: lastMonthStart,
        $lte: lastMonthEnd
      }
    }).toArray()

    const lastMonthTotal = lastMonthRevenue.reduce((sum, f) => sum + f.amount, 0)
    const monthlyGrowth = lastMonthTotal > 0 ? ((totalRevenue - lastMonthTotal) / lastMonthTotal) * 100 : 0

    // Generar datos diarios para el período
    const dailyRevenue = []
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < Math.min(daysInRange, 30); i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayRevenue = finances
        .filter(f => 
          f.type === 'income' && 
          f.status === 'paid' &&
          new Date(f.createdAt) >= dayStart && 
          new Date(f.createdAt) <= dayEnd
        )
        .reduce((sum, f) => sum + f.amount, 0)
      
      dailyRevenue.push(dayRevenue)
    }

    // Ingresos mensuales del año actual
    const monthlyRevenue = []
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1)
      const monthEnd = new Date(now.getFullYear(), month + 1, 0)
      
      const monthRevenue = await db.collection('finances').find({
        type: 'income',
        status: 'paid',
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd
        }
      }).toArray()
      
      monthlyRevenue.push(monthRevenue.reduce((sum, f) => sum + f.amount, 0))
    }

    // Top servicios/conceptos por ingresos
    const serviceRevenue: { [key: string]: { revenue: number, count: number } } = {}
    
    finances
      .filter(f => f.type === 'income' && f.status === 'paid')
      .forEach(f => {
        const concept = f.concept || 'Otros'
        if (!serviceRevenue[concept]) {
          serviceRevenue[concept] = { revenue: 0, count: 0 }
        }
        serviceRevenue[concept].revenue += f.amount
        serviceRevenue[concept].count += 1
      })

    const topServices = Object.entries(serviceRevenue)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        bookings: data.count,
        growthRate: Math.random() * 20 - 10 // Placeholder - calcular crecimiento real
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Estado de pagos
    const paidAmount = finances
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0)

    const overdueAmount = finances
      .filter(f => f.status === 'overdue')
      .reduce((sum, f) => sum + f.amount, 0)

    const responseData = {
      summary: {
        totalRevenue,
        pendingPayments,
        monthlyGrowth
      },
      dailyRevenue,
      monthlyRevenue,
      topServices,
      paymentStatus: {
        paid: paidAmount,
        pending: pendingPayments,
        overdue: overdueAmount
      }
    }

    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Error fetching finance analytics:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}