"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Chip,
  Spinner,
  Divider
} from "@heroui/react"
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useRole } from "@/hooks/useRole"
import toast from "react-hot-toast"

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

interface AnalyticsData {
  summary: {
    totalRevenue: number
    totalReservations: number
    averageEventValue: number
    monthlyGrowth: number
    pendingPayments: number
    completedEvents: number
    cancellationRate: number
    occupancyRate: number
  }
  revenueChart: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill?: boolean
    }>
  }
  reservationsChart: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string[]
    }>
  }
  monthlyComparison: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string
    }>
  }
  topServices: Array<{
    name: string
    revenue: number
    bookings: number
    growthRate: number
  }>
  paymentStatus: {
    paid: number
    pending: number
    overdue: number
  }
}

export default function AnalyticsManager() {
  const { isAdmin, isGerente } = useRole()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("last30days")
  const [selectedMetric, setSelectedMetric] = useState("revenue")

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [financesResponse, reservationsResponse] = await Promise.all([
        fetch(`/api/finances/analytics?range=${dateRange}`),
        fetch(`/api/reservations/analytics?range=${dateRange}`)
      ])

      if (financesResponse.ok && reservationsResponse.ok) {
        const financesData = await financesResponse.json()
        const reservationsData = await reservationsResponse.json()
        
        // Combinar y procesar los datos
        const combinedData = combineAnalyticsData(financesData, reservationsData)
        setAnalyticsData(combinedData)
      } else {
        toast.error("Error al cargar los datos de analytics")
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error("Error al cargar los datos de analytics")
    } finally {
      setLoading(false)
    }
  }

  const combineAnalyticsData = (financesData: any, reservationsData: any): AnalyticsData => {
    // Procesar datos de finanzas
    const totalRevenue = financesData.summary?.totalRevenue || 0
    const pendingPayments = financesData.summary?.pendingPayments || 0
    
    // Procesar datos de reservas
    const totalReservations = reservationsData.summary?.totalReservations || 0
    const completedEvents = reservationsData.summary?.completedEvents || 0
    const cancelledEvents = reservationsData.summary?.cancelledEvents || 0
    
    // Calcular métricas derivadas
    const averageEventValue = totalReservations > 0 ? totalRevenue / totalReservations : 0
    const cancellationRate = totalReservations > 0 ? (cancelledEvents / totalReservations) * 100 : 0
    
    // Generar datos para gráficos
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
    })

    const revenueData = financesData.dailyRevenue || Array(30).fill(0)
    const reservationsCountData = reservationsData.dailyReservations || Array(30).fill(0)

    return {
      summary: {
        totalRevenue,
        totalReservations,
        averageEventValue,
        monthlyGrowth: financesData.summary?.monthlyGrowth || 0,
        pendingPayments,
        completedEvents,
        cancellationRate,
        occupancyRate: reservationsData.summary?.occupancyRate || 0
      },
      revenueChart: {
        labels: last30Days,
        datasets: [
          {
            label: 'Ingresos Diarios',
            data: revenueData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true
          }
        ]
      },
      reservationsChart: {
        labels: ['Confirmadas', 'Pendientes', 'Canceladas'],
        datasets: [
          {
            label: 'Reservas por Estado',
            data: [
              completedEvents,
              reservationsData.summary?.pendingReservations || 0,
              cancelledEvents
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }
        ]
      },
      monthlyComparison: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
          {
            label: 'Ingresos Mensuales',
            data: financesData.monthlyRevenue || Array(12).fill(0),
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          }
        ]
      },
      topServices: financesData.topServices || [],
      paymentStatus: {
        paid: financesData.paymentStatus?.paid || 0,
        pending: financesData.paymentStatus?.pending || 0,
        overdue: financesData.paymentStatus?.overdue || 0
      }
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/analytics/export?range=${dateRange}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${dateRange}-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Reporte exportado exitosamente')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Error al exportar el reporte')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const dateRanges = [
    { key: "last7days", label: "Últimos 7 días" },
    { key: "last30days", label: "Últimos 30 días" },
    { key: "last90days", label: "Últimos 90 días" },
    { key: "thisMonth", label: "Este mes" },
    { key: "lastMonth", label: "Mes anterior" },
    { key: "thisYear", label: "Este año" }
  ]

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value)
          }
        }
      }
    }
  }

  if (!isAdmin && !isGerente) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md w-full border border-gray-200">
          <CardBody className="text-center p-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-600">No tienes permisos para ver esta sección</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Métricas y reportes del negocio</p>
        </div>
        
        <div className="flex gap-2">
          <Select
            selectedKeys={[dateRange]}
            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
            className="min-w-[160px]"
            variant="bordered"
          >
            {dateRanges.map((range) => (
              <SelectItem key={range.key}>{range.label}</SelectItem>
            ))}
          </Select>
          
          <Button
            variant="bordered"
            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            onPress={() => exportReport('pdf')}
          >
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : analyticsData ? (
        <>
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analyticsData.summary.totalRevenue)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {analyticsData.summary.monthlyGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="w-3 h-3 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-xs ${analyticsData.summary.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(analyticsData.summary.monthlyGrowth)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analyticsData.summary.totalReservations}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analyticsData.summary.completedEvents} completados
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analyticsData.summary.averageEventValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Por evento
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analyticsData.summary.pendingPayments)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tasa ocupación: {analyticsData.summary.occupancyRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Ingresos Diarios</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="h-64">
                  <Line data={analyticsData.revenueChart} options={chartOptions} />
                </div>
              </CardBody>
            </Card>

            {/* Reservations Status */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Estado de Reservas</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="h-64">
                  <Doughnut 
                    data={analyticsData.reservationsChart} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const
                        }
                      }
                    }} 
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Monthly Comparison */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold text-gray-900">Comparación Mensual</h3>
            </CardHeader>
            <CardBody className="pt-2">
              <div className="h-80">
                <Bar data={analyticsData.monthlyComparison} options={chartOptions} />
              </div>
            </CardBody>
          </Card>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Servicios Más Populares</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="space-y-3">
                  {analyticsData.topServices.length > 0 ? (
                    analyticsData.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.bookings} reservas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(service.revenue)}</p>
                          <div className="flex items-center gap-1">
                            {service.growthRate >= 0 ? (
                              <ArrowTrendingUpIcon className="w-3 h-3 text-green-600" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-3 h-3 text-red-600" />
                            )}
                            <span className={`text-xs ${service.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(service.growthRate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No hay datos de servicios disponibles</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Payment Status */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Estado de Pagos</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Pagados</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(analyticsData.paymentStatus.paid)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Pendientes</span>
                    </div>
                    <span className="font-semibold text-yellow-600">
                      {formatCurrency(analyticsData.paymentStatus.pending)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Vencidos</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(analyticsData.paymentStatus.overdue)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay datos disponibles para el período seleccionado</p>
        </div>
      )}
    </div>
  )
}