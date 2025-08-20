"use client"

import React from "react"
import { 
  Table, 
  Pagination,
  Loader,
  Badge
} from "@mantine/core"
import { nordicTokens } from './tokens'
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import NordicButton from './NordicButton'

interface NordicTableColumn {
  key: string
  label: string
  align?: 'start' | 'center' | 'end'
  sortable?: boolean
}

interface NordicTableAction {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
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
    pageSize?: number
  }
  className?: string
}

export default function NordicTable({
  columns,
  data,
  renderCell,
  actions,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  pagination,
  className = ''
}: NordicTableProps) {
  const hasActions = actions && actions.length > 0

  return (
    <div className={`w-full ${className}`}>
      <Table
        aria-label="Tabla de datos"
        className="border border-gray-200 rounded-lg"
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th 
                key={column.key}
                style={{ textAlign: column.align || 'left' }}
              >
                {column.label}
              </Table.Th>
            ))}
            {hasActions && (
              <Table.Th style={{ textAlign: 'center' }}>
                <span className="sr-only">Acciones</span>
              </Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (hasActions ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader size="sm" />
              </Table.Td>
            </Table.Tr>
          ) : data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (hasActions ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                <p className="text-slate-500 text-sm">
                  {emptyMessage}
                </p>
              </Table.Td>
            </Table.Tr>
          ) : (
            data.map((item, index) => (
              <Table.Tr key={index}>
                {columns.map((column) => (
                  <Table.Td key={column.key}>
                    {renderCell(item, column.key)}
                  </Table.Td>
                ))}
                {hasActions && (
                  <Table.Td>
                    <div className="flex items-center justify-center gap-1">
                      {actions
                        ?.filter(action => !action.isVisible || action.isVisible(item))
                        .map((action) => (
                          <NordicButton
                            key={action.key}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            {...{ onClick: () => action.onClick(item) }}
                            className="min-w-[32px] w-8 h-8 p-0"
                          >
                            {action.icon || <EllipsisVerticalIcon className="w-4 h-4" />}
                          </NordicButton>
                        ))}
                    </div>
                  </Table.Td>
                )}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {pagination && (
        <div className="flex justify-center mt-8">
          <Pagination
            total={Math.ceil(pagination.total / (pagination.pageSize || 10))}
            value={pagination.current}
            onChange={pagination.onChange}
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

// Status Chip Component
export function NordicStatusChip({ 
  status, 
  label, 
  variant = 'default' 
}: { 
  status: string
  label?: string
  variant?: 'success' | 'warning' | 'danger' | 'default'
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: `${nordicTokens.colors.status.active}20`,
          color: nordicTokens.colors.status.active,
          borderColor: `${nordicTokens.colors.status.active}40`
        }
      case 'warning':
        return {
          backgroundColor: `${nordicTokens.colors.status.warning}20`,
          color: nordicTokens.colors.status.warning,
          borderColor: `${nordicTokens.colors.status.warning}40`
        }
      case 'danger':
        return {
          backgroundColor: `${nordicTokens.colors.status.error}20`,
          color: nordicTokens.colors.status.error,
          borderColor: `${nordicTokens.colors.status.error}40`
        }
      default:
        return {
          backgroundColor: `${nordicTokens.colors.status.inactive}20`,
          color: nordicTokens.colors.status.inactive,
          borderColor: `${nordicTokens.colors.status.inactive}40`
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Badge
      size="sm"
      className="text-xs font-medium px-2 py-1 rounded border"
      style={styles}
    >
      {label || status}
    </Badge>
  )
}