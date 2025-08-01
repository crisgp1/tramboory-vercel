"use client"

import React from 'react'
import { Button, ButtonProps } from '@heroui/react'
import { nordicTokens } from './tokens'

interface NordicButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export default function NordicButton({ 
  variant = 'secondary', 
  size = 'md',
  className = '',
  children,
  ...props 
}: NordicButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-[${nordicTokens.colors.text.primary}] 
          text-white 
          border-[${nordicTokens.colors.text.primary}]
          hover:bg-[${nordicTokens.colors.text.secondary}]
          active:bg-[${nordicTokens.colors.text.primary}]
          shadow-sm
        `
      case 'secondary': 
        return `
          bg-[${nordicTokens.colors.background.primary}] 
          text-[${nordicTokens.colors.text.primary}] 
          border-[${nordicTokens.colors.border.primary}]
          hover:bg-[${nordicTokens.colors.background.secondary}]
          active:bg-[${nordicTokens.colors.background.tertiary}]
          shadow-sm
        `
      case 'ghost':
        return `
          bg-transparent 
          text-[${nordicTokens.colors.text.secondary}] 
          border-transparent
          hover:bg-[${nordicTokens.colors.background.secondary}]
          active:bg-[${nordicTokens.colors.background.tertiary}]
        `
      case 'danger':
        return `
          bg-[${nordicTokens.colors.action.danger}] 
          text-white 
          border-[${nordicTokens.colors.action.danger}]
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
        font-[${nordicTokens.typography.fontFamily.primary}]
        rounded-[${nordicTokens.radius.md}]
        border border-solid
        transition-all duration-[${nordicTokens.transition.fast}]
        focus-visible:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-[${nordicTokens.colors.border.focus}] 
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