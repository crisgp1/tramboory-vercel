"use client"

import React from 'react'
import { Card, CardProps } from '@mantine/core'
import { designTokens } from './tokens'

interface DesignSystemCardProps extends Omit<CardProps, 'shadow'> {
  variant?: 'default' | 'bordered' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function DesignSystemCard({ 
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props 
}: DesignSystemCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return `
          bg-[${designTokens.colors.background.primary}]
          shadow-[${designTokens.shadow.sm}]
          border border-[${designTokens.colors.border.secondary}]
        `
      case 'bordered':
        return `
          bg-[${designTokens.colors.background.primary}]
          border border-[${designTokens.colors.border.primary}]
          shadow-none
        `
      case 'flat':
        return `
          bg-[${designTokens.colors.background.secondary}]
          border-none
          shadow-none
        `
      default:
        return ''
    }
  }

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return 'p-0'
      case 'sm':
        return `p-[${designTokens.spacing.lg}]`
      case 'md':
        return `p-[${designTokens.spacing['2xl']}]`
      case 'lg':
        return `p-[${designTokens.spacing['3xl']}]`
      default:
        return `p-[${designTokens.spacing['2xl']}]`
    }
  }

  return (
    <Card
      {...props}
      className={`
        ${getVariantStyles()}
        rounded-[${designTokens.radius.lg}]
        transition-all duration-[${designTokens.transition.normal}]
        ${className}
      `}
    >
      <div className={`${getPaddingStyles()} overflow-visible`}>
        {children}
      </div>
    </Card>
  )
}

// Specialized card components
export function StatsCard({ 
  title, 
  value, 
  change, 
  trend,
  icon,
  className = ''
}: {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  className?: string
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return designTokens.colors.status.active
      case 'down':
        return designTokens.colors.action.danger
      default:
        return designTokens.colors.text.tertiary
    }
  }

  return (
    <DesignSystemCard variant="default" padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`
            text-[${designTokens.typography.fontSize.sm}]
            font-[${designTokens.typography.fontWeight.medium}]
            text-[${designTokens.colors.text.secondary}]
            mb-[${designTokens.spacing.xs}]
          `}>
            {title}
          </p>
          <p className={`
            text-[${designTokens.typography.fontSize['3xl']}]
            font-[${designTokens.typography.fontWeight.bold}]
            text-[${designTokens.colors.text.primary}]
            leading-[${designTokens.typography.lineHeight.tight}]
            mb-[${designTokens.spacing.xs}]
          `}>
            {value}
          </p>
          {change && (
            <p className={`
              text-[${designTokens.typography.fontSize.xs}]
              font-[${designTokens.typography.fontWeight.medium}]
            `}
            style={{ color: getTrendColor() }}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`
            w-12 h-12 
            bg-[${designTokens.colors.background.tertiary}]
            rounded-[${designTokens.radius.lg}]
            flex items-center justify-center
            text-[${designTokens.colors.text.secondary}]
          `}>
            {icon}
          </div>
        )}
      </div>
    </DesignSystemCard>
  )
}

