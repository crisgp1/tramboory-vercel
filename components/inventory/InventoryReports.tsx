"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
  Select,
  SelectItem,
  DatePicker,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner
} from "@heroui/react"
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
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
    <div className="space-y-6">
      {/* Controles de reporte */}
      <Card className="border border-gray-200">
        <CardBody className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <Select
                label="Tipo de Reporte"
                selectedKeys={[reportType]}
                onSelectionChange={(keys) => setReportType(Array.from(keys)[0] as string)}
              >
                {reportTypes.map((type) => (
                  <SelectItem key={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Período"
                selectedKeys={[dateRange]}
                onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
              >
                {dateRanges.map((range) => (
                  <SelectItem key={range.key}>
                    {range.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="bordered"
                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                onPress={() => exportReport('pdf')}
              >
                PDF
              </Button>
              <Button
                variant="bordered"
                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                onPress={() => exportReport('excel')}
              >
                Excel
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card className="border border-gray-200">
          <CardBody className="p-12 text-center">
            <Spinner size="lg" />
            <p className="text-gray-600 mt-4">Generando reporte...</p>
          </CardBody>
        </Card>
      ) : reportData ? (
        <>
          {/* Resumen de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ArchiveBoxIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Productos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reportData.summary.totalProducts}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(reportData.summary.totalValue)}
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
                    <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reportData.summary.lowStockItems}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Por Vencer</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reportData.summary.expiringSoon}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Contenido específico del reporte */}
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top productos */}
              <Card className="border border-gray-200">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Productos Más Activos</h3>
                  <div className="space-y-3">
                    {reportData.topProducts && reportData.topProducts.length > 0 ? (
                      reportData.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-gray-600">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{product.totalMovements} movimientos</p>
                            <p className="text-sm text-gray-600">{formatCurrency(product.value)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay datos de productos activos disponibles</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Breakdown por categorías */}
              <Card className="border border-gray-200">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Distribución por Categorías</h3>
                  <div className="space-y-3">
                    {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? (
                      reportData.categoryBreakdown.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{category.category}</span>
                            <span className="text-sm text-gray-600">{category.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{category.productCount} productos</span>
                            <span>{formatCurrency(category.totalValue)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay datos de categorías disponibles</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {reportType === 'movements' && (
            <Card className="border border-gray-200">
              <CardBody className="p-0">
                <Table aria-label="Movimientos de inventario">
                  <TableHeader>
                    <TableColumn>FECHA</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn>CANTIDAD</TableColumn>
                    <TableColumn>VALOR</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay movimientos disponibles">
                    {reportData.movements && reportData.movements.length > 0 ? (
                      reportData.movements.map((movement, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(movement.date)}</TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={
                                movement.type === 'ENTRADA' ? 'success' :
                                movement.type === 'SALIDA' ? 'danger' : 'primary'
                              }
                            >
                              {movement.type}
                            </Chip>
                          </TableCell>
                          <TableCell>{movement.productName}</TableCell>
                          <TableCell>
                            {movement.quantity} {movement.unit}
                          </TableCell>
                          <TableCell>{formatCurrency(movement.value)}</TableCell>
                        </TableRow>
                      ))
                    ) : []}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card className="border border-gray-200">
          <CardBody className="p-12 text-center">
            <p className="text-gray-600">No hay datos disponibles para el período seleccionado</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}