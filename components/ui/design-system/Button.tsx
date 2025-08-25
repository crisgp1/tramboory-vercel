"use client"

import React from 'react'
import { Button, ButtonProps } from '@mantine/core'
import { designTokens } from './tokens'

interface DesignSystemButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export default function DesignSystemButton({ 
  variant = 'secondary', 
  size = 'md',
  className = '',
  children,
  ...props 
}: DesignSystemButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-[${designTokens.colors.text.primary}] 
          text-white 
          border-[${designTokens.colors.text.primary}]
          hover:bg-[${designTokens.colors.text.secondary}]
          active:bg-[${designTokens.colors.text.primary}]
          shadow-sm
        `
      case 'secondary': 
        return `
          bg-[${designTokens.colors.background.primary}] 
          text-[${designTokens.colors.text.primary}] 
          border-[${designTokens.colors.border.primary}]
          hover:bg-[${designTokens.colors.background.secondary}]
          active:bg-[${designTokens.colors.background.tertiary}]
          shadow-sm
        `
      case 'ghost':
        return `
          bg-transparent 
          text-[${designTokens.colors.text.secondary}] 
          border-transparent
          hover:bg-[${designTokens.colors.background.secondary}]
          active:bg-[${designTokens.colors.background.tertiary}]
        `
      case 'danger':
        return `
          bg-[${designTokens.colors.action.danger}] 
          text-white 
          border-[${designTokens.colors.action.danger}]
          hover:opacity-90
          active:opacity-100
          shadow-sm
        `
      default:
        return ''
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return `
          px-3 py-1.5 
          text-sm 
          min-h-[32px]
          font-medium
        `
      case 'md':
        return `
          px-4 py-2 
          text-sm 
          min-h-[40px]
          font-medium
        `
      case 'lg':
        return `
          px-6 py-2.5 
          text-base 
          min-h-[48px]
          font-medium
        `
      default:
        return ''
    }
  }

  return (
    <Button
      {...props}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        font-[${designTokens.typography.fontFamily.primary}]
        rounded-[${designTokens.radius.md}]
        border border-solid
        transition-all duration-[${designTokens.transition.fast}]
        focus-visible:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-[${designTokens.colors.border.focus}] 
        focus-visible:ring-offset-2
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </Button>
  )
}

