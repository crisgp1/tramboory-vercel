"use client"

import React, { ReactNode } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Loader2 
} from 'lucide-react'

export interface DataTableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => ReactNode
  className?: string
}

export interface DataTableAction<T = any> {
  label: string
  icon?: React.ElementType
  onClick: (item: T) => void
  variant?: 'primary' | 'secondary' | 'danger'
  show?: (item: T) => boolean
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  actions?: DataTableAction<T>[]
  emptyMessage?: string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  className?: string
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  actions = [],
  emptyMessage = "No hay datos disponibles",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ""
}: DataTableProps<T>) {
  
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const renderCell = (column: DataTableColumn<T>, item: T) => {
    const value = getNestedValue(item, column.key)
    
    if (column.render) {
      return column.render(value, item)
    }
    
    return value?.toString() || '-'
  }

  const getActionVariantClasses = (variant: string = 'secondary') => {
    const variants = {
      primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
      secondary: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50',
      danger: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
    return variants[variant as keyof typeof variants] || variants.secondary
  }

  return (
    <div className={`glass-card ${className}`}>
      {/* Search Bar */}
      {onSearchChange && (
        <div className="p-6 border-b border-slate-200/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-3" />
                    <span className="text-slate-500">Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-slate-800 ${column.className || ''}`}
                    >
                      {renderCell(column, item)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions.filter(action => !action.show || action.show(item)).map((action, actionIndex) => {
                          const Icon = action.icon
                          return (
                            <button
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={`p-2 rounded-lg transition-colors ${getActionVariantClasses(action.variant)}`}
                              title={action.label}
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 py-4 border-t border-slate-200/50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}