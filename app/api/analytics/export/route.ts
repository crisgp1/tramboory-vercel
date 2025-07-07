import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'last30days'
    const format = searchParams.get('format') || 'pdf'

    // Obtener datos de analytics
    const [financesResponse, reservationsResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/finances/analytics?range=${range}`, {
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reservations/analytics?range=${range}`, {
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      })
    ])

    if (!financesResponse.ok || !reservationsResponse.ok) {
      return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
    }

    const financesData = await financesResponse.json()
    const reservationsData = await reservationsResponse.json()

    // Generar reporte según el formato
    if (format === 'pdf') {
      // Generar PDF
      const pdfContent = generatePDFContent(financesData, reservationsData, range)
      
      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-report-${range}-${Date.now()}.pdf"`
        }
      })
    } else if (format === 'excel') {
      // Generar Excel
      const excelContent = generateExcelContent(financesData, reservationsData, range)
      
      return new NextResponse(excelContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-report-${range}-${Date.now()}.xlsx"`
        }
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
    
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

function generatePDFContent(financesData: any, reservationsData: any, range: string): Buffer {
  // Implementación básica de PDF
  // En un proyecto real, usarías una librería como jsPDF o Puppeteer
  const content = `
    REPORTE DE ANALYTICS - ${range.toUpperCase()}
    =============================================
    
    RESUMEN FINANCIERO:
    - Ingresos Totales: $${financesData.summary?.totalRevenue?.toLocaleString() || 0}
    - Pagos Pendientes: $${financesData.summary?.pendingPayments?.toLocaleString() || 0}
    - Crecimiento Mensual: ${financesData.summary?.monthlyGrowth?.toFixed(2) || 0}%
    
    RESUMEN DE RESERVAS:
    - Total Reservas: ${reservationsData.summary?.totalReservations || 0}
    - Eventos Completados: ${reservationsData.summary?.completedEvents || 0}
    - Tasa de Ocupación: ${reservationsData.summary?.occupancyRate?.toFixed(2) || 0}%
    
    Generado el: ${new Date().toLocaleDateString('es-MX')}
  `
  
  return Buffer.from(content, 'utf-8')
}

function generateExcelContent(financesData: any, reservationsData: any, range: string): Buffer {
  // Implementación básica de Excel
  // En un proyecto real, usarías una librería como exceljs o xlsx
  const csvContent = `
Período,${range}
Fecha de Generación,${new Date().toLocaleDateString('es-MX')}

MÉTRICAS FINANCIERAS
Ingresos Totales,${financesData.summary?.totalRevenue || 0}
Pagos Pendientes,${financesData.summary?.pendingPayments || 0}
Crecimiento Mensual,${financesData.summary?.monthlyGrowth || 0}%

MÉTRICAS DE RESERVAS
Total Reservas,${reservationsData.summary?.totalReservations || 0}
Eventos Completados,${reservationsData.summary?.completedEvents || 0}
Eventos Cancelados,${reservationsData.summary?.cancelledEvents || 0}
Tasa de Ocupación,${reservationsData.summary?.occupancyRate || 0}%
  `
  
  return Buffer.from(csvContent, 'utf-8')
}