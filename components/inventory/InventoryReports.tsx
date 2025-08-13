"use client"

import React, { useState, useEffect } from "react"
import { 
  Loader,
  Card,
  Group,
  Stack,
  Title,
  Text,
  Select,
  Button,
  Table,
  Badge,
  Progress,
  Grid,
  Paper
} from "@mantine/core"
import {
  IconDownload,
  IconChartBar,
  IconCurrencyDollar,
  IconArchive,
  IconAlertTriangle
} from "@tabler/icons-react"
import { useRole } from "@/hooks/useRole"

interface ReportData {
  summary: {
    totalProducts: number
    totalValue: number
    lowStockItems: number
    expiringSoon: number
  }
  topProducts: Array<{
    productName: string
    sku: string
    totalMovements: number
    currentStock: number
    value: number
  }>
  categoryBreakdown: Array<{
    category: string
    productCount: number
    totalValue: number
    percentage: number
  }>
  movements: Array<{
    date: string
    type: string
    productName: string
    quantity: number
    unit: string
    value: number
  }>
}

export default function InventoryReports() {
  const { role, isAdmin, isGerente } = useRole()
  const [reportType, setReportType] = useState("summary")
  const [dateRange, setDateRange] = useState("last30days")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [reportType, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        range: dateRange
      })

      const response = await fetch(`/api/inventory/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        range: dateRange,
        format
      })

      const response = await fetch(`/api/inventory/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inventory-report-${reportType}-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  const reportTypes = [
    { key: "summary", label: "Resumen General" },
    { key: "movements", label: "Movimientos de Inventario" },
    { key: "valuation", label: "Valoración de Inventario" },
    { key: "alerts", label: "Alertas y Stock Bajo" },
    { key: "categories", label: "Análisis por Categorías" }
  ]

  const dateRanges = [
    { key: "today", label: "Hoy" },
    { key: "last7days", label: "Últimos 7 días" },
    { key: "last30days", label: "Últimos 30 días" },
    { key: "last90days", label: "Últimos 90 días" },
    { key: "thisMonth", label: "Este mes" },
    { key: "lastMonth", label: "Mes anterior" },
    { key: "thisYear", label: "Este año" }
  ]

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card>
        <Group mb="lg">
          <IconChartBar size={32} className="text-blue-600" />
          <div>
            <Title order={2}>Reportes de Inventario</Title>
            <Text c="dimmed">Análisis detallado y reportes del inventario</Text>
          </div>
        </Group>

        <Group justify="space-between">
          <Group grow>
            <Select
              label="Tipo de Reporte"
              value={reportType}
              onChange={(value) => value && setReportType(value)}
              data={reportTypes.map(type => ({ value: type.key, label: type.label }))}
            />
            <Select
              label="Período"
              value={dateRange}
              onChange={(value) => value && setDateRange(value)}
              data={dateRanges.map(range => ({ value: range.key, label: range.label }))}
            />
          </Group>

          <Group>
            <Button
              onClick={() => exportReport('pdf')}
              color="red"
              leftSection={<IconDownload size={16} />}
            >
              PDF
            </Button>
            <Button
              onClick={() => exportReport('excel')}
              color="green"
              leftSection={<IconDownload size={16} />}
            >
              Excel
            </Button>
          </Group>
        </Group>
      </Card>

      {loading ? (
        <Card p="xl">
          <Group justify="center">
            <Stack align="center">
              <Loader size="lg" />
              <Text c="dimmed" fw={500}>Generando reporte...</Text>
            </Stack>
          </Group>
        </Card>
      ) : reportData ? (
        <>
          {/* Resumen de métricas */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Paper p="md" withBorder>
                <Group>
                  <IconArchive size={32} className="text-blue-600" />
                  <div>
                    <Title order={3}>{reportData.summary.totalProducts}</Title>
                    <Text size="sm" c="dimmed">Total Productos</Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Paper p="md" withBorder>
                <Group>
                  <IconCurrencyDollar size={32} className="text-green-600" />
                  <div>
                    <Title order={3}>{formatCurrency(reportData.summary.totalValue)}</Title>
                    <Text size="sm" c="dimmed">Valor Total</Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Paper p="md" withBorder>
                <Group>
                  <IconAlertTriangle size={32} className="text-orange-600" />
                  <div>
                    <Title order={3}>{reportData.summary.lowStockItems}</Title>
                    <Text size="sm" c="dimmed">Stock Bajo</Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Paper p="md" withBorder>
                <Group>
                  <IconChartBar size={32} className="text-purple-600" />
                  <div>
                    <Title order={3}>{reportData.summary.expiringSoon}</Title>
                    <Text size="sm" c="dimmed">Por Vencer</Text>
                  </div>
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Contenido específico del reporte */}
          {reportType === 'summary' && (
            <Grid>
              {/* Top productos */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card>
                  <Group mb="md">
                    <IconChartBar size={24} className="text-emerald-600" />
                    <Title order={3}>Productos Más Activos</Title>
                  </Group>
                  <Stack>
                    {reportData.topProducts && reportData.topProducts.length > 0 ? (
                      reportData.topProducts.map((product, index) => (
                        <Paper key={index} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={600}>{product.productName}</Text>
                              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>{product.sku}</Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Text fw={700}>{product.totalMovements} movimientos</Text>
                              <Text size="sm" c="dimmed">{formatCurrency(product.value)}</Text>
                            </div>
                          </Group>
                        </Paper>
                      ))
                    ) : (
                      <Stack align="center" py="xl">
                        <IconArchive size={48} className="text-gray-400" />
                        <Text c="dimmed">No hay datos de productos activos disponibles</Text>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Breakdown por categorías */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card>
                  <Group mb="md">
                    <IconChartBar size={24} className="text-indigo-600" />
                    <Title order={3}>Distribución por Categorías</Title>
                  </Group>
                  <Stack>
                    {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? (
                      reportData.categoryBreakdown.map((category, index) => (
                        <Stack key={index} gap="xs">
                          <Group justify="space-between">
                            <Text fw={600}>{category.category}</Text>
                            <Badge>{category.percentage}%</Badge>
                          </Group>
                          <Progress value={category.percentage} color="indigo" size="md" />
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">{category.productCount} productos</Text>
                            <Text size="sm" fw={500}>{formatCurrency(category.totalValue)}</Text>
                          </Group>
                        </Stack>
                      ))
                    ) : (
                      <Stack align="center" py="xl">
                        <IconChartBar size={48} className="text-gray-400" />
                        <Text c="dimmed">No hay datos de categorías disponibles</Text>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          )}

          {reportType === 'movements' && (
            <Card>
              <Stack>
                <Group mb="md">
                  <IconChartBar size={24} className="text-purple-600" />
                  <Title order={3}>Movimientos de Inventario</Title>
                </Group>

                {reportData.movements && reportData.movements.length > 0 ? (
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Producto</Table.Th>
                        <Table.Th>Cantidad</Table.Th>
                        <Table.Th>Valor</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {reportData.movements.map((movement, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{formatDate(movement.date)}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={movement.type === 'ENTRADA' ? 'green' : movement.type === 'SALIDA' ? 'red' : 'blue'}
                            >
                              {movement.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{movement.productName}</Table.Td>
                          <Table.Td>{movement.quantity} {movement.unit}</Table.Td>
                          <Table.Td>{formatCurrency(movement.value)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Stack align="center" py="xl">
                    <IconChartBar size={48} className="text-gray-400" />
                    <Text c="dimmed">No hay movimientos disponibles</Text>
                  </Stack>
                )}

              </Stack>
            </Card>
          )}
          </>
      ) : (
        <Card p="xl">
          <Stack align="center">
            <IconChartBar size={48} className="text-gray-400" />
            <Text size="lg" c="dimmed">No hay datos disponibles para el período seleccionado</Text>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}