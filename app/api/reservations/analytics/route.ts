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

    // Obtener reservas del período
    const reservations = await db.collection('reservations').find({
      createdAt: {
        $gte: startDate,
        $lte: now
      }
    }).toArray()

    // Calcular métricas generales
    const totalReservations = reservations.length
    const completedEvents = reservations.filter(r => r.status === 'completed').length
    const cancelledEvents = reservations.filter(r => r.status === 'cancelled').length
    const pendingReservations = reservations.filter(r => r.status === 'pending').length
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length

    // Calcular tasa de ocupación
    const totalPossibleSlots = 30 * 10 // Ejemplo: 30 días * 10 slots por día
    const occupiedSlots = confirmedReservations + completedEvents
    const occupancyRate = totalPossibleSlots > 0 ? (occupiedSlots / totalPossibleSlots) * 100 : 0

    // Generar datos diarios de reservas
    const dailyReservations = []
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < Math.min(daysInRange, 30); i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayReservations = reservations.filter(r => {
        const reservationDate = new Date(r.createdAt)
        return reservationDate >= dayStart && reservationDate <= dayEnd
      }).length
      
      dailyReservations.push(dayReservations)
    }

    // Análisis por tipo de evento
    const eventTypes: { [key: string]: number } = {}
    reservations.forEach(r => {
      const eventType = r.eventType || 'Otros'
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1
    })

    // Top tipos de eventos
    const topEventTypes = Object.entries(eventTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Reservas por mes del año actual
    const monthlyReservations = []
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1)
      const monthEnd = new Date(now.getFullYear(), month + 1, 0)
      
      const monthReservations = await db.collection('reservations').find({
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd
        }
      }).toArray()
      
      monthlyReservations.push(monthReservations.length)
    }

    // Análisis de horarios más populares
    const hourlyBookings: { [key: number]: number } = {}
    reservations.forEach(r => {
      if (r.eventDate) {
        const hour = new Date(r.eventDate).getHours()
        hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1
      }
    })

    const peakHours = Object.entries(hourlyBookings)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Duración promedio de eventos
    const eventsWithDuration = reservations.filter(r => r.duration && r.duration > 0)
    const averageDuration = eventsWithDuration.length > 0 
      ? eventsWithDuration.reduce((sum, r) => sum + r.duration, 0) / eventsWithDuration.length 
      : 0

    // Revenue por reserva (si está disponible)
    const reservationsWithRevenue = reservations.filter(r => r.totalPrice && r.totalPrice > 0)
    const averageRevenue = reservationsWithRevenue.length > 0
      ? reservationsWithRevenue.reduce((sum, r) => sum + r.totalPrice, 0) / reservationsWithRevenue.length
      : 0

    const responseData = {
      summary: {
        totalReservations,
        completedEvents,
        cancelledEvents,
        pendingReservations,
        occupancyRate
      },
      dailyReservations,
      monthlyReservations,
      eventTypes: Object.entries(eventTypes).map(([type, count]) => ({ type, count })),
      topEventTypes,
      peakHours,
      averageDuration,
      averageRevenue,
      statusBreakdown: {
        completed: completedEvents,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        cancelled: cancelledEvents
      }
    }

    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Error fetching reservations analytics:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}