"use client"

import React, { useState, useRef, useEffect } from "react"
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface NordicTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface NordicTableAction {
  key: string
  label: string
  icon?: React.ReactNode
  color?: 'default' | 'primary' | 'warning' | 'danger' | 'success'
  onClick: (item: any) => void
  isVisible?: (item: any) => boolean
}

// Custom glassmorphism dropdown component
function GlassDropdown({ 
  trigger, 
  children, 
  isOpen, 
  onToggle 
}: { 
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={onToggle} className="glass-button-icon p-2 rounded-lg hover:bg-white/20 transition-colors">
        {trigger}
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-white/90 backdrop-blur-md border border-white/20 rounded-xl shadow-xl"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="py-2">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface NordicTableProps {
  columns: NordicTableColumn[]
  data: any[]
  renderCell: (item: any, columnKey: string) => React.ReactNode
  actions?: NordicTableAction[]
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    total: number
    current: number
    onChange: (page: number) => void
  }
}

export default function NordicTable({
  columns,
  data,
  renderCell,
  actions,
  loading = false,
  emptyMessage = "No se encontraron registros",
  pagination
}: NordicTableProps) {
  
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({})
  
  const getTextAlign = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const closeDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: false
    }))
  }

  if (loading) {
    return (
      <div className="glass-table">
        <div className="flex flex-col justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="glass-table overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50 backdrop-blur-sm">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-4 ${getTextAlign(column.align)} text-xs font-semibold text-slate-700 uppercase tracking-wider ${column.width || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-4 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                    
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-slate-200/30">
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (actions ? 1 : 0)} 
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-white/30 transition-all duration-200">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 ${getTextAlign(column.align)} text-sm text-slate-800`}
                      >
                        {renderCell(item, column.key)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <GlassDropdown
                            trigger={<MoreVertical className="w-4 h-4 text-slate-600" />}
                            isOpen={openDropdowns[item._id || index] || false}
                            onToggle={() => toggleDropdown(item._id || index)}
                          >
                            {actions
                              .filter(action => !action.isVisible || action.isVisible(item))
                              .map(action => (
                                <button
                                  key={action.key}
                                  onClick={() => {
                                    action.onClick(item)
                                    closeDropdown(item._id || index)
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-white/30 transition-colors ${
                                    action.color === 'danger' ? 'text-red-700 hover:bg-red-50/50' :
                                    action.color === 'warning' ? 'text-orange-700 hover:bg-orange-50/50' :
                                    action.color === 'primary' ? 'text-blue-700 hover:bg-blue-50/50' :
                                    action.color === 'success' ? 'text-green-700 hover:bg-green-50/50' :
                                    'text-gray-700 hover:bg-gray-50/50'
                                  }`}
                                >
                                  {action.icon && (
                                    <span className={
                                      action.color === 'danger' ? 'text-red-600' :
                                      action.color === 'warning' ? 'text-orange-600' :
                                      action.color === 'primary' ? 'text-blue-600' :
                                      action.color === 'success' ? 'text-green-600' :
                                      'text-gray-600'
                                    }>
                                      {action.icon}
                                    </span>
                                  )}
                                  {action.label}
                                </button>
                              ))}
                          </GlassDropdown>
                        </div>
                      </td>
                    )}
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.total > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => pagination.onChange(Math.max(1, pagination.current - 1))}
            disabled={pagination.current === 1}
            className="glass-button-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="glass-card px-3 py-1 text-sm font-medium">
            {pagination.current} de {pagination.total}
          </span>
          
          <button
            onClick={() => pagination.onChange(Math.min(pagination.total, pagination.current + 1))}
            disabled={pagination.current === pagination.total}
            className="glass-button-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}

// Componente auxiliar para chips de estado con glassmorphism
export function StatusChip({ 
  status, 
  size = "sm" 
}: { 
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}) {
  const configs = {
    active: { className: 'bg-green-100 text-green-800', label: 'Activo' },
    inactive: { className: 'bg-red-100 text-red-800', label: 'Inactivo' },
    pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
    success: { className: 'bg-green-100 text-green-800', label: 'Completado' },
    warning: { className: 'bg-yellow-100 text-yellow-800', label: 'Advertencia' },
    danger: { className: 'bg-red-100 text-red-800', label: 'Error' }
  }

  const config = configs[status] || configs.active
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm', 
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}