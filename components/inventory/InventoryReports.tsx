"use client"

import React, { useState, useEffect } from "react"
import { 
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
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Reportes de Inventario
            </h1>
            <p className="text-slate-600">Análisis detallado y reportes del inventario</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm text-slate-700 font-medium">Tipo de Reporte</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="glass-input w-full px-4 py-3 text-slate-800"
              >
                {reportTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700 font-medium">Período</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="glass-input w-full px-4 py-3 text-slate-800"
              >
                {dateRanges.map((range) => (
                  <option key={range.key} value={range.key}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => exportReport('pdf')}
              className="glass-button-danger px-6 py-3 flex items-center gap-2 text-sm font-medium"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="glass-button-success px-6 py-3 flex items-center gap-2 text-sm font-medium"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg font-medium">Generando reporte...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Resumen de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-stat stat-blue p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <ArchiveBoxIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {reportData.summary.totalProducts}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Total Productos
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-stat stat-green p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {formatCurrency(reportData.summary.totalValue)}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Valor Total
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-stat stat-orange p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {reportData.summary.lowStockItems}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Stock Bajo
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-stat stat-purple p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {reportData.summary.expiringSoon}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Por Vencer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido específico del reporte */}
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top productos */}
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  Productos Más Activos
                </h3>
                <div className="space-y-4">
                  {reportData.topProducts && reportData.topProducts.length > 0 ? (
                    reportData.topProducts.map((product, index) => (
                      <div key={index} className="glass-stat p-4 hover:bg-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{product.productName}</p>
                            <p className="text-sm text-slate-500 font-mono">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{product.totalMovements} movimientos</p>
                            <p className="text-sm text-slate-600">{formatCurrency(product.value)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ArchiveBoxIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-500">No hay datos de productos activos disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown por categorías */}
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  Distribución por Categorías
                </h3>
                <div className="space-y-6">
                  {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? (
                    reportData.categoryBreakdown.map((category, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{category.category}</span>
                          <span className="text-sm font-medium text-slate-600 bg-white/60 px-3 py-1 rounded-full">
                            {category.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{category.productCount} productos</span>
                          <span className="font-medium text-slate-800">{formatCurrency(category.totalValue)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ChartBarIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-500">No hay datos de categorías disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {reportType === 'movements' && (
            <div className="glass-card overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  Movimientos de Inventario
                </h3>

                {/* Vista Desktop - Tabla Glassmorphism */}
                <div className="hidden lg:block">
                  {reportData.movements && reportData.movements.length > 0 ? (
                    <div className="glass-table overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/40 border-b border-white/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Fecha</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">Tipo</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Producto</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-800">Cantidad</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-800">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.movements.map((movement, index) => (
                            <tr key={index} className="border-b border-white/30 hover:bg-white/40 transition-colors duration-200">
                              <td className="px-6 py-4 text-sm text-slate-800">
                                {formatDate(movement.date)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  movement.type === 'ENTRADA' ? 'bg-green-100/80 text-green-800' :
                                  movement.type === 'SALIDA' ? 'bg-red-100/80 text-red-800' : 'bg-blue-100/80 text-blue-800'
                                }`}>
                                  {movement.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                {movement.productName}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                                {movement.quantity} {movement.unit}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                                {formatCurrency(movement.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ChartBarIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-500">No hay movimientos disponibles</p>
                    </div>
                  )}
                </div>

                {/* Vista Mobile - Cards */}
                <div className="lg:hidden">
                  {reportData.movements && reportData.movements.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.movements.map((movement, index) => (
                        <div key={index} className="glass-stat p-4 hover:bg-white/80 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-800">{movement.productName}</p>
                              <p className="text-sm text-slate-500">{formatDate(movement.date)}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              movement.type === 'ENTRADA' ? 'bg-green-100/80 text-green-800' :
                              movement.type === 'SALIDA' ? 'bg-red-100/80 text-red-800' : 'bg-blue-100/80 text-blue-800'
                            }`}>
                              {movement.type}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Cantidad</p>
                              <p className="font-semibold text-slate-800">{movement.quantity} {movement.unit}</p>
                            </div>
                            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Valor</p>
                              <p className="font-semibold text-slate-800">{formatCurrency(movement.value)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ChartBarIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-500">No hay movimientos disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-600 text-lg">No hay datos disponibles para el período seleccionado</p>
        </div>
      )}
    </div>
  )
}