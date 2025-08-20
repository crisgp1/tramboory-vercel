"use client"

import React from 'react'
import { Card, CardProps } from '@mantine/core'
import { nordicTokens } from './tokens'

interface NordicCardProps extends Omit<CardProps, 'shadow'> {
  variant?: 'default' | 'bordered' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function NordicCard({ 
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props 
}: NordicCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return `
          bg-[${nordicTokens.colors.background.primary}]
          shadow-[${nordicTokens.shadow.sm}]
          border border-[${nordicTokens.colors.border.secondary}]
        `
      case 'bordered':
        return `
          bg-[${nordicTokens.colors.background.primary}]
          border border-[${nordicTokens.colors.border.primary}]
          shadow-none
        `
      case 'flat':
        return `
          bg-[${nordicTokens.colors.background.secondary}]
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
        return `p-[${nordicTokens.spacing.lg}]`
      case 'md':
        return `p-[${nordicTokens.spacing['2xl']}]`
      case 'lg':
        return `p-[${nordicTokens.spacing['3xl']}]`
      default:
        return `p-[${nordicTokens.spacing['2xl']}]`
    }
  }

  return (
    <Card
      {...props}
      className={`
        ${getVariantStyles()}
        rounded-[${nordicTokens.radius.lg}]
        transition-all duration-[${nordicTokens.transition.normal}]
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
export function NordicStatsCard({ 
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
        return nordicTokens.colors.status.active
      case 'down':
        return nordicTokens.colors.action.danger
      default:
        return nordicTokens.colors.text.tertiary
    }
  }

  return (
    <NordicCard variant="default" padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontWeight.medium}]
            text-[${nordicTokens.colors.text.secondary}]
            mb-[${nordicTokens.spacing.xs}]
          `}>
            {title}
          </p>
          <p className={`
            text-[${nordicTokens.typography.fontSize['3xl']}]
            font-[${nordicTokens.typography.fontWeight.bold}]
            text-[${nordicTokens.colors.text.primary}]
            leading-[${nordicTokens.typography.lineHeight.tight}]
            mb-[${nordicTokens.spacing.xs}]
          `}>
            {value}
          </p>
          {change && (
            <p className={`
              text-[${nordicTokens.typography.fontSize.xs}]
              font-[${nordicTokens.typography.fontWeight.medium}]
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
            bg-[${nordicTokens.colors.background.tertiary}]
            rounded-[${nordicTokens.radius.lg}]
            flex items-center justify-center
            text-[${nordicTokens.colors.text.secondary}]
          `}>
            {icon}
          </div>
        )}
      </div>
    </NordicCard>
  )
}