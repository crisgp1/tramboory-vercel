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
  Divider,
  Tab,
  Tabs,
  Progress,
  Tooltip as HeroTooltip
} from "@heroui/react"
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline"
import AvailabilityCalendar from "@/components/admin/AvailabilityCalendar"
import DayDetailsModal from "@/components/admin/DayDetailsModal"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<any>(null)
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [chartType, setChartType] = useState("line")

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
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Distribución</h1>
          <p className="text-gray-600">Centro de análisis y métricas</p>
        </div>
        
        <div className="flex gap-2">
          <Select
            selectedKeys={[dateRange]}
            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
            className="min-w-[160px]"
            variant="bordered"
            size="sm"
          >
            {dateRanges.map((range) => (
              <SelectItem key={range.key}>{range.label}</SelectItem>
            ))}
          </Select>
          
          <HeroTooltip content="Exportar reporte">
            <Button
              variant="bordered"
              size="sm"
              isIconOnly
              onPress={() => exportReport('pdf')}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </Button>
          </HeroTooltip>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key as string)}
            variant="underlined"
            classNames={{
              base: "w-full",
              tabList: "gap-6 w-full relative rounded-none p-4 border-b border-gray-200",
              cursor: "w-full bg-gray-900",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-gray-900 font-medium"
            }}
          >
            <Tab
              key="overview"
              title={
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Resumen General</span>
                </div>
              }
            />
            <Tab
              key="graphs"
              title={
                <div className="flex items-center gap-2">
                  <PresentationChartLineIcon className="w-4 h-4" />
                  <span>Gráficos</span>
                </div>
              }
            />
            <Tab
              key="calendar"
              title={
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendario</span>
                </div>
              }
            />
            <Tab
              key="distribution"
              title={
                <div className="flex items-center gap-2">
                  <ChartPieIcon className="w-4 h-4" />
                  <span>Distribución</span>
                </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : analyticsData ? (
        <>
          {/* Tab: Overview */}
          {selectedTab === "overview" && (
            <div className="space-y-6">
              {/* KPIs Cards with improved design */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                          <CurrencyDollarIcon className="w-6 h-6 text-green-700" />
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          className={analyticsData.summary.monthlyGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        >
                          {formatPercentage(analyticsData.summary.monthlyGrowth)}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(analyticsData.summary.totalRevenue)}
                        </p>
                        <Progress 
                          value={75} 
                          size="sm" 
                          color="success" 
                          className="mt-3"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <CalendarDaysIcon className="w-6 h-6 text-blue-700" />
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-blue-100 text-blue-700"
                        >
                          {analyticsData.summary.completedEvents}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Reservas</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {analyticsData.summary.totalReservations}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600">{analyticsData.summary.completedEvents} completados</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                          <ChartBarIcon className="w-6 h-6 text-purple-700" />
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-purple-100 text-purple-700"
                        >
                          Por evento
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Promedio</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(analyticsData.summary.averageEventValue)}
                        </p>
                        <Progress 
                          value={60} 
                          size="sm" 
                          color="secondary" 
                          className="mt-3"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                          <BanknotesIcon className="w-6 h-6 text-orange-700" />
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-orange-100 text-orange-700"
                        >
                          Pendiente
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pagos Pendientes</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(analyticsData.summary.pendingPayments)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <ClockIcon className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-gray-600">Ocupación: {analyticsData.summary.occupancyRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Quick Stats Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tasa de Cancelación</p>
                        <p className="text-xl font-bold text-gray-900">{analyticsData.summary.cancellationRate.toFixed(1)}%</p>
                      </div>
                      <div className="w-16 h-16">
                        <Doughnut
                          data={{
                            datasets: [{
                              data: [analyticsData.summary.cancellationRate, 100 - analyticsData.summary.cancellationRate],
                              backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(229, 231, 235, 0.5)'],
                              borderWidth: 0
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { enabled: false } }
                          }}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Eventos Completados</p>
                        <p className="text-xl font-bold text-gray-900">{analyticsData.summary.completedEvents}</p>
                      </div>
                      <div className="w-16 h-16">
                        <Doughnut
                          data={{
                            datasets: [{
                              data: [
                                analyticsData.summary.completedEvents,
                                analyticsData.summary.totalReservations - analyticsData.summary.completedEvents
                              ],
                              backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.5)'],
                              borderWidth: 0
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { enabled: false } }
                          }}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tasa de Ocupación</p>
                        <p className="text-xl font-bold text-gray-900">{analyticsData.summary.occupancyRate.toFixed(1)}%</p>
                      </div>
                      <div className="w-16 h-16">
                        <Doughnut
                          data={{
                            datasets: [{
                              data: [analyticsData.summary.occupancyRate, 100 - analyticsData.summary.occupancyRate],
                              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(229, 231, 235, 0.5)'],
                              borderWidth: 0
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { enabled: false } }
                          }}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* Tab: Graphs */}
          {selectedTab === "graphs" && (
            <div className="space-y-6">
              {/* Chart Type Selector */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={chartType === "line" ? "solid" : "bordered"}
                  onPress={() => setChartType("line")}
                  className={chartType === "line" ? "bg-gray-900 text-white" : ""}
                >
                  Líneas
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "bar" ? "solid" : "bordered"}
                  onPress={() => setChartType("bar")}
                  className={chartType === "bar" ? "bg-gray-900 text-white" : ""}
                >
                  Barras
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "area" ? "solid" : "bordered"}
                  onPress={() => setChartType("area")}
                  className={chartType === "area" ? "bg-gray-900 text-white" : ""}
                >
                  Área
                </Button>
              </div>

              {/* Main Chart */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ingresos</h3>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat" className="bg-green-100 text-green-700">
                        {formatPercentage(analyticsData.summary.monthlyGrowth)} vs mes anterior
                      </Chip>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-2">
                  <div className="h-96">
                    {chartType === "line" && (
                      <Line data={analyticsData.revenueChart} options={chartOptions} />
                    )}
                    {chartType === "bar" && (
                      <Bar 
                        data={{
                          ...analyticsData.revenueChart,
                          datasets: [{
                            ...analyticsData.revenueChart.datasets[0],
                            backgroundColor: 'rgba(34, 197, 94, 0.6)'
                          }]
                        }} 
                        options={chartOptions} 
                      />
                    )}
                    {chartType === "area" && (
                      <Line 
                        data={{
                          ...analyticsData.revenueChart,
                          datasets: [{
                            ...analyticsData.revenueChart.datasets[0],
                            fill: true,
                            tension: 0.3
                          }]
                        }} 
                        options={chartOptions} 
                      />
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Secondary Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Comparación Mensual</h3>
                  </CardHeader>
                  <CardBody className="pt-2">
                    <div className="h-64">
                      <Bar data={analyticsData.monthlyComparison} options={chartOptions} />
                    </div>
                  </CardBody>
                </Card>

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
            </div>
          )}

          {/* Tab: Calendar */}
          {selectedTab === "calendar" && (
            <div className="space-y-6">
              <AvailabilityCalendar
                className="w-full"
                onDateClick={(date, availability) => {
                  setSelectedDate(date);
                  setSelectedAvailability(availability);
                  setIsDayDetailsOpen(true);
                }}
              />
              
              {/* Calendar Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Días Disponibles</p>
                        <p className="text-xl font-bold text-gray-900">15</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Parcialmente Ocupados</p>
                        <p className="text-xl font-bold text-gray-900">8</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Totalmente Ocupados</p>
                        <p className="text-xl font-bold text-gray-900">7</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* Tab: Distribution */}
          {selectedTab === "distribution" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Servicios Populares</h3>
                    <HeroTooltip content="Ver todos los servicios">
                      <Button size="sm" variant="light" isIconOnly>
                        <ChartPieIcon className="w-4 h-4" />
                      </Button>
                    </HeroTooltip>
                  </div>
                </CardHeader>
                <CardBody className="pt-2">
                  <div className="space-y-3">
                    {analyticsData.topServices.length > 0 ? (
                      analyticsData.topServices.slice(0, 5).map((service, index) => (
                        <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-${['green', 'blue', 'purple', 'orange', 'pink'][index]}-500`} />
                                <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">{service.bookings} reservas</span>
                                <span className="text-xs font-medium text-gray-700">{formatCurrency(service.revenue)}</span>
                              </div>
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              className={service.growthRate >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                            >
                              {formatPercentage(service.growthRate)}
                            </Chip>
                          </div>
                          <Progress
                            value={(service.revenue / analyticsData.summary.totalRevenue) * 100}
                            size="sm"
                            color="primary"
                            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No hay datos disponibles</p>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Payment Status Distribution */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Distribución de Pagos</h3>
                    <HeroTooltip content="Ver detalles">
                      <Button size="sm" variant="light" isIconOnly>
                        <BanknotesIcon className="w-4 h-4" />
                      </Button>
                    </HeroTooltip>
                  </div>
                </CardHeader>
                <CardBody className="pt-2">
                  <div className="space-y-4">
                    {/* Chart */}
                    <div className="h-48">
                      <Doughnut
                        data={{
                          labels: ['Pagados', 'Pendientes', 'Vencidos'],
                          datasets: [{
                            data: [
                              analyticsData.paymentStatus.paid,
                              analyticsData.paymentStatus.pending,
                              analyticsData.paymentStatus.overdue
                            ],
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(239, 68, 68, 0.8)'
                            ],
                            borderWidth: 0
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right' as const,
                              labels: {
                                padding: 10,
                                font: { size: 11 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    
                    {/* Status Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium text-gray-700">Pagados</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(analyticsData.paymentStatus.paid)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <span className="text-sm font-medium text-gray-700">Pendientes</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(analyticsData.paymentStatus.pending)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span className="text-sm font-medium text-gray-700">Vencidos</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(analyticsData.paymentStatus.overdue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay datos disponibles para el período seleccionado</p>
        </div>
      )}
      
      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={isDayDetailsOpen}
        onClose={() => setIsDayDetailsOpen(false)}
        date={selectedDate}
        availability={selectedAvailability}
      />
    </div>
  )
}