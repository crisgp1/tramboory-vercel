import React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '',
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  }
  
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  }
  
  return (
    <div className={cn(
      'text-center flex flex-col items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {Icon && (
        <Icon className={cn(
          'text-gray-400 mx-auto mb-4',
          iconSizes[size]
        )} />
      )}
      <h3 className={cn(
        'font-medium text-gray-900 mb-2',
        titleSizes[size]
      )}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}