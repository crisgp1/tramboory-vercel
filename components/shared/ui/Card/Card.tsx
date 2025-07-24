import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'bordered' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = false
}: CardProps) {
  const baseClasses = 'rounded-lg transition-all duration-200'
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    glass: 'glass-card',
    bordered: 'bg-white border-2 border-gray-200',
    flat: 'bg-gray-50'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const hoverClasses = hover ? 'hover:shadow-md hover:scale-[1.01]' : ''
  
  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  )
}

export interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className = ''
}: StatsCardProps) {
  return (
    <Card variant="glass" className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export interface InfoCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  icon?: React.ElementType
  className?: string
  actions?: ReactNode
}

export function InfoCard({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  className = '',
  actions
}: InfoCardProps) {
  return (
    <Card variant="glass" className={className}>
      {(title || subtitle || Icon || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </Card>
  )
}