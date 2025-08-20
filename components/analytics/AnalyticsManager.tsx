"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  Title,
  Text,
  Button,
  Select,
  Badge,
  Loader,
  Divider,
  Tabs,
  Progress,
  Tooltip,
  Paper,
  Group,
  Stack,
  Grid,
  Center,
  ActionIcon,
  RingProgress,
  ThemeIcon
} from "@mantine/core"
import {
  IconChartBar,
  IconCurrencyDollar,
  IconCalendarEvent,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconDownload,
  IconPresentation,
  IconChartPie,
  IconCalendar,
  IconCash,
  IconClock,
  IconCircleCheck,
  IconCircleX
} from "@tabler/icons-react"
import AvailabilityCalendar from "@/components/admin/AvailabilityCalendar"
import DayDetailsModal from "@/components/admin/DayDetailsModal"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useRole } from "@/hooks/useRole"
import { notifications } from "@mantine/notifications"

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
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
        notifications.show({
          title: 'Error',
          message: 'Error al cargar los datos de analytics',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al cargar los datos de analytics',
        color: 'red'
      })
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
        notifications.show({
          title: 'Éxito',
          message: 'Reporte exportado exitosamente',
          color: 'green'
        })
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al exportar el reporte',
        color: 'red'
      })
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
      <Center h="60vh">
        <Paper p="xl" radius="md" withBorder shadow="sm" style={{maxWidth: 400, width: '100%'}}>
          <Stack align="center" gap="lg">
            <ThemeIcon size="xl" radius="xl" color="red">
              <IconAlertTriangle size={32} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
              <Title order={3}>Acceso Restringido</Title>
              <Text c="dimmed" ta="center">No tienes permisos para ver esta sección</Text>
            </Stack>
          </Stack>
        </Paper>
      </Center>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header with controls */}
      <Paper p="lg" withBorder>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={2}>Analytics</Title>
            <Text c="dimmed" size="sm">Centro de análisis y métricas del negocio</Text>
          </Stack>
          
          <Group>
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value || 'last30days')}
              data={dateRanges.map(range => ({ value: range.key, label: range.label }))}
              style={{ minWidth: 160 }}
              size="sm"
            />
            
            <Tooltip label="Exportar reporte">
              <ActionIcon 
                variant="light"
                onClick={() => exportReport('pdf')}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* Tabs Navigation */}
      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
            Resumen General
          </Tabs.Tab>
          <Tabs.Tab value="graphs" leftSection={<IconPresentation size={16} />}>
            Gráficos
          </Tabs.Tab>
          <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
            Calendario
          </Tabs.Tab>
          <Tabs.Tab value="distribution" leftSection={<IconChartPie size={16} />}>
            Distribución
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          {loading ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Loader size="lg" />
                <Text c="dimmed">Cargando analytics...</Text>
              </Stack>
            </Center>
          ) : analyticsData ? (
          <Stack gap="lg">
            {/* KPI Cards */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder>
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="green">
                      <IconCurrencyDollar size={24} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="xl" fw={600}>
                        {formatCurrency(analyticsData.summary.totalRevenue)}
                      </Text>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Ingresos Totales
                      </Text>
                    </Stack>
                  </Group>
                  <Text 
                    size="xs" 
                    c={analyticsData.summary.monthlyGrowth >= 0 ? 'green' : 'red'} 
                    mt="sm"
                  >
                    {formatPercentage(analyticsData.summary.monthlyGrowth)} vs mes anterior
                  </Text>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <ThemeIcon size="lg" radius="md" color="blue">
                      <IconCalendarEvent size={24} />
                    </ThemeIcon>
                    <Badge color="blue" variant="light">
                      {analyticsData.summary.completedEvents}
                    </Badge>
                  </Group>
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed" tt="uppercase">Total Reservas</Text>
                    <Text size="xl" fw={600}>
                      {analyticsData.summary.totalReservations}
                    </Text>
                    <Group gap="xs" mt="xs">
                      <IconCircleCheck size={16} color="green" />
                      <Text size="xs" c="dimmed">{analyticsData.summary.completedEvents} completados</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <ThemeIcon size="lg" radius="md" color="grape">
                      <IconChartBar size={24} />
                    </ThemeIcon>
                    <Badge color="grape" variant="light">
                      Por evento
                    </Badge>
                  </Group>
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed" tt="uppercase">Valor Promedio</Text>
                    <Text size="xl" fw={600}>
                      {formatCurrency(analyticsData.summary.averageEventValue)}
                    </Text>
                    <Progress value={60} size="sm" color="grape" mt="xs" />
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <ThemeIcon size="lg" radius="md" color="orange">
                      <IconCash size={24} />
                    </ThemeIcon>
                    <Badge color="orange" variant="light">
                      Pendiente
                    </Badge>
                  </Group>
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed" tt="uppercase">Pagos Pendientes</Text>
                    <Text size="xl" fw={600}>
                      {formatCurrency(analyticsData.summary.pendingPayments)}
                    </Text>
                    <Group gap="xs" mt="xs">
                      <IconClock size={16} color="orange" />
                      <Text size="xs" c="dimmed">Ocupación: {analyticsData.summary.occupancyRate.toFixed(1)}%</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Quick Stats Summary */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" align="center">
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Tasa de Cancelación</Text>
                      <Text size="xl" fw={700}>{analyticsData.summary.cancellationRate.toFixed(1)}%</Text>
                    </Stack>
                    <RingProgress
                      size={64}
                      thickness={8}
                      sections={[
                        { value: analyticsData.summary.cancellationRate, color: 'red' },
                        { value: 100 - analyticsData.summary.cancellationRate, color: 'gray.3' }
                      ]}
                    />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" align="center">
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Eventos Completados</Text>
                      <Text size="xl" fw={700}>{analyticsData.summary.completedEvents}</Text>
                    </Stack>
                    <RingProgress
                      size={64}
                      thickness={8}
                      sections={[
                        { value: (analyticsData.summary.completedEvents / analyticsData.summary.totalReservations) * 100, color: 'green' },
                        { value: ((analyticsData.summary.totalReservations - analyticsData.summary.completedEvents) / analyticsData.summary.totalReservations) * 100, color: 'gray.3' }
                      ]}
                    />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" align="center">
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Tasa de Ocupación</Text>
                      <Text size="xl" fw={700}>{analyticsData.summary.occupancyRate.toFixed(1)}%</Text>
                    </Stack>
                    <RingProgress
                      size={64}
                      thickness={8}
                      sections={[
                        { value: analyticsData.summary.occupancyRate, color: 'blue' },
                        { value: 100 - analyticsData.summary.occupancyRate, color: 'gray.3' }
                      ]}
                    />
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
          ) : (
            <Center py="xl">
              <Text c="dimmed">No hay datos disponibles para el período seleccionado</Text>
            </Center>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="graphs">
          {loading ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Loader size="lg" />
                <Text c="dimmed">Cargando analytics...</Text>
              </Stack>
            </Center>
          ) : analyticsData ? (
            <Stack gap="lg">
            {/* Chart Type Selector */}
            <Group>
              <Button
                size="sm"
                variant={chartType === "line" ? "filled" : "light"}
                onClick={() => setChartType("line")}
              >
                Líneas
              </Button>
              <Button
                size="sm"
                variant={chartType === "bar" ? "filled" : "light"}
                onClick={() => setChartType("bar")}
              >
                Barras
              </Button>
              <Button
                size="sm"
                variant={chartType === "area" ? "filled" : "light"}
                onClick={() => setChartType("area")}
              >
                Área
              </Button>
            </Group>

            {/* Main Chart */}
            <Card withBorder>
              <Card.Section p="lg" pb="xs">
                <Group justify="space-between">
                  <Title order={4}>Tendencia de Ingresos</Title>
                  <Badge color="green" variant="light">
                    {formatPercentage(analyticsData.summary.monthlyGrowth)} vs mes anterior
                  </Badge>
                </Group>
              </Card.Section>
              <Card.Section p="lg">
                <div style={{ height: 384 }}>
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
              </Card.Section>
            </Card>

            {/* Secondary Charts */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card withBorder>
                  <Title order={4} p="lg" pb="xs">Comparación Mensual</Title>
                  <div style={{ height: 256, padding: '0 var(--mantine-spacing-lg) var(--mantine-spacing-lg)' }}>
                    <Bar data={analyticsData.monthlyComparison} options={chartOptions} />
                  </div>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card withBorder>
                  <Title order={4} p="lg" pb="xs">Estado de Reservas</Title>
                  <div style={{ height: 256, padding: '0 var(--mantine-spacing-lg) var(--mantine-spacing-lg)' }}>
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
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
          ) : (
            <Center py="xl">
              <Text c="dimmed">No hay datos disponibles para el período seleccionado</Text>
            </Center>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="calendar">
          {loading ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Loader size="lg" />
                <Text c="dimmed">Cargando analytics...</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="lg">
            <AvailabilityCalendar
              onDateClick={(date, availability) => {
                setSelectedDate(date);
                setSelectedAvailability(availability);
                setIsDayDetailsOpen(true);
              }}
            />
            
            {/* Calendar Stats */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card withBorder p="md">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="green">
                      <IconCircleCheck size={24} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="xl" fw={600}>15</Text>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Días Disponibles
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card withBorder p="md">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="yellow">
                      <IconClock size={24} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="xl" fw={600}>8</Text>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Parcialmente Ocupados
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card withBorder p="md">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="red">
                      <IconCircleX size={24} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="xl" fw={600}>7</Text>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Totalmente Ocupados
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="distribution">
          {loading ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Loader size="lg" />
                <Text c="dimmed">Cargando analytics...</Text>
              </Stack>
            </Center>
          ) : analyticsData ? (
            <Grid>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              {/* Top Services */}
              <Card withBorder>
                <Group justify="space-between" p="lg" pb="xs">
                  <Title order={4}>Servicios Populares</Title>
                  <Tooltip label="Ver todos los servicios">
                    <ActionIcon variant="light" size="sm">
                      <IconChartPie size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Stack gap="sm" p="lg" pt="xs">
                  {analyticsData.topServices.length > 0 ? (
                    analyticsData.topServices.slice(0, 5).map((service, index) => (
                      <Paper key={index} p="md" withBorder radius="md">
                        <Group justify="space-between" align="center">
                          <Stack gap="xs">
                            <Group gap="xs">
                              <div 
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'][index]
                                }}
                              />
                              <Text size="sm" fw={500}>{service.name}</Text>
                            </Group>
                            <Group gap="md">
                              <Text size="xs" c="dimmed">{service.bookings} reservas</Text>
                              <Text size="xs" fw={500}>{formatCurrency(service.revenue)}</Text>
                            </Group>
                          </Stack>
                          <Badge
                            size="sm"
                            color={service.growthRate >= 0 ? 'green' : 'red'}
                            variant="light"
                          >
                            {formatPercentage(service.growthRate)}
                          </Badge>
                        </Group>
                        <Progress
                          value={(service.revenue / analyticsData.summary.totalRevenue) * 100}
                          size="sm"
                          color="blue"
                          mt="xs"
                        />
                      </Paper>
                    ))
                  ) : (
                    <Text ta="center" c="dimmed" py="lg">No hay datos disponibles</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 6 }}>
              {/* Payment Status Distribution */}
              <Card withBorder>
                <Group justify="space-between" p="lg" pb="xs">
                  <Title order={4}>Distribución de Pagos</Title>
                  <Tooltip label="Ver detalles">
                    <ActionIcon variant="light" size="sm">
                      <IconCash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Stack gap="md" p="lg" pt="xs">
                  {/* Chart */}
                  <div style={{ height: 192 }}>
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
                  <Stack gap="xs">
                    <Group justify="space-between" p="sm">
                      <Group gap="xs">
                        <div style={{ width: 12, height: 12, backgroundColor: '#22c55e', borderRadius: '50%' }} />
                        <Text size="sm" fw={500}>Pagados</Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {formatCurrency(analyticsData.paymentStatus.paid)}
                      </Text>
                    </Group>
                    
                    <Group justify="space-between" p="sm">
                      <Group gap="xs">
                        <div style={{ width: 12, height: 12, backgroundColor: '#fbbf24', borderRadius: '50%' }} />
                        <Text size="sm" fw={500}>Pendientes</Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {formatCurrency(analyticsData.paymentStatus.pending)}
                      </Text>
                    </Group>
                    
                    <Group justify="space-between" p="sm">
                      <Group gap="xs">
                        <div style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: '50%' }} />
                        <Text size="sm" fw={500}>Vencidos</Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {formatCurrency(analyticsData.paymentStatus.overdue)}
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
          ) : (
            <Center py="xl">
              <Text c="dimmed">No hay datos disponibles para el período seleccionado</Text>
            </Center>
          )}
        </Tabs.Panel>
      
      </Tabs>
      
      {/* Day Details Modal */}
      <DayDetailsModal
        opened={isDayDetailsOpen}
        onClose={() => setIsDayDetailsOpen(false)}
        date={selectedDate}
        availability={selectedAvailability}
      />
    </Stack>
  )
}