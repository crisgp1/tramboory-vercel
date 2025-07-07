"use client"

import React from "react"
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Pagination,
  Spinner
} from "@heroui/react"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"

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
  color?: 'default' | 'primary' | 'warning' | 'danger'
  onClick: (item: any) => void
  isVisible?: (item: any) => boolean
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
  
  const getTextAlign = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Spinner size="lg" />
        <p className="text-gray-600 text-sm mt-4">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 ${getTextAlign(column.align)} text-xs font-medium text-gray-700 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                  
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${getTextAlign(column.align)} text-sm text-gray-900`}
                    >
                      {renderCell(item, column.key)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Dropdown 
                          placement="bottom-end"
                          classNames={{
                            base: "before:bg-white",
                            content: "bg-white border border-gray-200 shadow-lg min-w-[150px]"
                          }}
                        >
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="h-8 w-8"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu 
                            aria-label="Acciones"
                            itemClasses={{
                              base: [
                                "rounded-md",
                                "transition-colors",
                                "data-[hover=true]:bg-gray-100",
                              ],
                            }}
                          >
                            {actions
                              .filter(action => !action.isVisible || action.isVisible(item))
                              .map(action => (
                                <DropdownItem
                                  key={action.key}
                                  startContent={action.icon && (
                                    <span className={
                                      action.color === 'danger' ? 'text-red-600' :
                                      action.color === 'warning' ? 'text-orange-600' :
                                      action.color === 'primary' ? 'text-blue-600' :
                                      'text-gray-600'
                                    }>
                                      {action.icon}
                                    </span>
                                  )}
                                  onPress={() => action.onClick(item)}
                                  className={
                                    action.color === 'danger' 
                                      ? "text-gray-700 data-[hover=true]:bg-red-50 data-[hover=true]:text-red-700"
                                      : action.color === 'warning'
                                      ? "text-gray-700 data-[hover=true]:bg-orange-50 data-[hover=true]:text-orange-700"
                                      : "text-gray-700"
                                  }
                                >
                                  {action.label}
                                </DropdownItem>
                              ))}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={pagination.total}
            page={pagination.current}
            onChange={pagination.onChange}
            showControls
            classNames={{
              wrapper: "gap-0 overflow-visible h-8",
              item: "w-8 h-8 text-sm rounded-md",
              cursor: "bg-gray-900 text-white font-medium",
              next: "bg-transparent hover:bg-gray-100",
              prev: "bg-transparent hover:bg-gray-100",
            }}
          />
        </div>
      )}
    </>
  )
}

// Componente auxiliar para chips de estado
export function StatusChip({ 
  status, 
  size = "sm" 
}: { 
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}) {
  const configs = {
    active: { color: 'success' as const, label: 'Activo' },
    inactive: { color: 'danger' as const, label: 'Inactivo' },
    pending: { color: 'warning' as const, label: 'Pendiente' },
    success: { color: 'success' as const, label: 'Completado' },
    warning: { color: 'warning' as const, label: 'Advertencia' },
    danger: { color: 'danger' as const, label: 'Error' }
  }

  const config = configs[status] || configs.active

  return (
    <Chip
      size={size}
      variant="flat"
      color={config.color}
      classNames={{
        base: "h-6",
        content: "text-xs font-medium"
      }}
    >
      {config.label}
    </Chip>
  )
}