import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'spinner' | 'dots' | 'pulse'
}

export function LoadingState({ 
  text = 'Cargando...', 
  size = 'md',
  className = '',
  variant = 'spinner'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12'
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const renderSpinner = () => (
    <Loader2 className={cn(
      'animate-spin text-gray-600',
      iconSizes[size]
    )} />
  )

  const renderDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-600 rounded-full animate-pulse',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <div className={cn(
      'bg-gray-200 rounded-lg animate-pulse',
      size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32'
    )} />
  )

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      default:
        return renderSpinner()
    }
  }
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      {renderVariant()}
      {text && (
        <p className={cn(
          'text-gray-600 mt-3 font-medium',
          textSizes[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

export interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ 
  className = '',
  width,
  height,
  variant = 'rectangular'
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div 
      className={cn(
        'bg-gray-200 animate-pulse',
        variantClasses[variant],
        !height && variant === 'text' && 'h-4',
        !height && variant === 'circular' && 'w-12 h-12',
        !height && variant === 'rectangular' && 'h-20',
        className
      )}
      style={style}
    />
  )
}