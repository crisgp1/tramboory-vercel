"use client"

import React from 'react'
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export interface StatusChipProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  label?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusVariants = {
  // Inventory specific statuses
  'active': { variant: 'success', icon: CheckCircleIcon },
  'inactive': { variant: 'danger', icon: XCircleIcon },
  'pending': { variant: 'warning', icon: ClockIcon },
  'in_stock': { variant: 'success', icon: CheckCircleIcon },
  'low_stock': { variant: 'warning', icon: ExclamationCircleIcon },
  'out_of_stock': { variant: 'danger', icon: XCircleIcon },
  
  // Purchase order statuses
  'DRAFT': { variant: 'default', icon: ClockIcon },
  'PENDING': { variant: 'warning', icon: ClockIcon },
  'APPROVED': { variant: 'info', icon: CheckCircleIcon },
  'ORDERED': { variant: 'info', icon: CheckCircleIcon },
  'RECEIVED': { variant: 'success', icon: CheckCircleIcon },
  'CANCELLED': { variant: 'danger', icon: XCircleIcon },
  
  // Transfer statuses  
  'IN_TRANSIT': { variant: 'info', icon: ClockIcon },
  'COMPLETED': { variant: 'success', icon: CheckCircleIcon },
  
  // Supplier statuses
  'preferred': { variant: 'success', icon: CheckCircleIcon },
  'standard': { variant: 'default', icon: CheckCircleIcon },
  'probation': { variant: 'warning', icon: ExclamationCircleIcon },
  'blocked': { variant: 'danger', icon: XCircleIcon }
} as const

const variantStyles = {
  default: {
    bg: 'bg-slate-100/80',
    text: 'text-slate-800',
    border: 'border-slate-200/50'
  },
  success: {
    bg: 'bg-green-100/80',
    text: 'text-green-800',
    border: 'border-green-200/50'
  },
  warning: {
    bg: 'bg-yellow-100/80',
    text: 'text-yellow-800',
    border: 'border-yellow-200/50'
  },
  danger: {
    bg: 'bg-red-100/80',
    text: 'text-red-800',
    border: 'border-red-200/50'
  },
  info: {
    bg: 'bg-blue-100/80',
    text: 'text-blue-800',
    border: 'border-blue-200/50'
  }
}

const sizeStyles = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
}

export default function StatusChip({
  status,
  variant,
  label,
  showIcon = true,
  size = 'md',
  className = ''
}: StatusChipProps) {
  
  // Auto-detect variant from status if not provided
  const statusConfig = statusVariants[status as keyof typeof statusVariants]
  const finalVariant = variant || statusConfig?.variant || 'default'
  const IconComponent = statusConfig?.icon
  
  // Auto-generate label if not provided
  const displayLabel = label || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  
  const variantStyle = variantStyles[finalVariant]
  const sizeStyle = sizeStyles[size]
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${variantStyle.bg} ${variantStyle.text} ${variantStyle.border}
        ${sizeStyle.padding} ${sizeStyle.text}
        ${className}
      `}
    >
      {showIcon && IconComponent && (
        <IconComponent className={sizeStyle.icon} />
      )}
      {displayLabel}
    </span>
  )
}

// Predefined status chips for common use cases
export const ActiveStatusChip = ({ label = "Activo", ...props }: Omit<StatusChipProps, 'status'>) => (
  <StatusChip status="active" label={label} {...props} />
)

export const InactiveStatusChip = ({ label = "Inactivo", ...props }: Omit<StatusChipProps, 'status'>) => (
  <StatusChip status="inactive" label={label} {...props} />
)

export const PendingStatusChip = ({ label = "Pendiente", ...props }: Omit<StatusChipProps, 'status'>) => (
  <StatusChip status="pending" label={label} {...props} />
)