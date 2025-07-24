"use client"

import React from "react"
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Pagination,
  Spinner,
  Chip
} from "@heroui/react"
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
        classNames={{
          wrapper: `
            bg-[${nordicTokens.colors.background.primary}]
            shadow-[${nordicTokens.shadow.sm}]
            border border-[${nordicTokens.colors.border.secondary}]
            rounded-[${nordicTokens.radius.lg}]
            p-0
          `,
          th: `
            bg-[${nordicTokens.colors.background.secondary}]
            text-[${nordicTokens.colors.text.secondary}]
            text-[${nordicTokens.typography.fontSize.xs}]
            font-[${nordicTokens.typography.fontWeight.semibold}]
            uppercase
            tracking-wide
            border-b border-[${nordicTokens.colors.border.secondary}]
            px-[${nordicTokens.spacing.lg}]
            py-[${nordicTokens.spacing.md}]
            first:rounded-tl-[${nordicTokens.radius.lg}]
            last:rounded-tr-[${nordicTokens.radius.lg}]
          `,
          td: `
            text-[${nordicTokens.colors.text.primary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            px-[${nordicTokens.spacing.lg}]
            py-[${nordicTokens.spacing.lg}]
            border-b border-[${nordicTokens.colors.border.secondary}]
            last:border-r-0
          `,
          tbody: `
            [&>tr:hover]:bg-[${nordicTokens.colors.background.secondary}]/50
            [&>tr:last-child>td]:border-b-0
          `
        }}
      >
        <TableHeader>
          {[
            ...columns.map((column) => (
              <TableColumn 
                key={column.key}
                align={column.align || 'start'}
              >
                {column.label}
              </TableColumn>
            )),
            ...(hasActions ? [
              <TableColumn key="actions" align="center">
                <span className="sr-only">Acciones</span>
              </TableColumn>
            ] : [])
          ]}
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner color="primary" />}
          emptyContent={
            <div className={`
              py-[${nordicTokens.spacing['4xl']}]
              text-center
            `}>
              <p className={`
                text-[${nordicTokens.colors.text.tertiary}]
                text-[${nordicTokens.typography.fontSize.sm}]
              `}>
                {emptyMessage}
              </p>
            </div>
          }
        >
          {data.map((item, index) => (
            <TableRow key={index}>
              {[
                ...columns.map((column) => (
                  <TableCell key={column.key}>
                    {renderCell(item, column.key)}
                  </TableCell>
                )),
                ...(hasActions ? [
                  <TableCell key="actions">
                    <div className="flex items-center justify-center gap-1">
                      {actions
                        ?.filter(action => !action.isVisible || action.isVisible(item))
                        .map((action) => (
                          <NordicButton
                            key={action.key}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            onPress={() => action.onClick(item)}
                            className="min-w-[32px] w-8 h-8 p-0"
                            title={action.label}
                          >
                            {action.icon || <EllipsisVerticalIcon className="w-4 h-4" />}
                          </NordicButton>
                        ))}
                    </div>
                  </TableCell>
                ] : [])
              ]}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && (
        <div className={`
          flex justify-center 
          mt-[${nordicTokens.spacing['2xl']}]
        `}>
          <Pagination
            total={Math.ceil(pagination.total / (pagination.pageSize || 10))}
            page={pagination.current}
            onChange={pagination.onChange}
            classNames={{
              wrapper: "gap-1",
              item: `
                bg-[${nordicTokens.colors.background.primary}]
                text-[${nordicTokens.colors.text.secondary}]
                border border-[${nordicTokens.colors.border.primary}]
                rounded-[${nordicTokens.radius.md}]
                hover:bg-[${nordicTokens.colors.background.secondary}]
                min-w-[36px] 
                h-[36px]
              `,
              cursor: `
                bg-[${nordicTokens.colors.text.primary}]
                text-white
                border border-[${nordicTokens.colors.text.primary}]
                rounded-[${nordicTokens.radius.md}]
                min-w-[36px] 
                h-[36px]
              `
            }}
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
    <Chip
      size="sm"
      className={`
        text-[${nordicTokens.typography.fontSize.xs}]
        font-[${nordicTokens.typography.fontWeight.medium}]
        px-[${nordicTokens.spacing.sm}]
        py-[${nordicTokens.spacing.xs}]
        rounded-[${nordicTokens.radius.sm}]
        border
      `}
      style={styles}
    >
      {label || status}
    </Chip>
  )
}