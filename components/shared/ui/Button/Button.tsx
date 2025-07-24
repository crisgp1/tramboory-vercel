"use client"

import React, { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ElementType
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: ReactNode
}

const variantStyles = {
  primary: {
    base: 'bg-blue-600 text-white border-blue-600',
    hover: 'hover:bg-blue-700 hover:border-blue-700',
    disabled: 'disabled:bg-blue-300 disabled:border-blue-300'
  },
  secondary: {
    base: 'bg-slate-100 text-slate-700 border-slate-200',
    hover: 'hover:bg-slate-200 hover:border-slate-300',
    disabled: 'disabled:bg-slate-50 disabled:text-slate-400'
  },
  danger: {
    base: 'bg-red-600 text-white border-red-600',
    hover: 'hover:bg-red-700 hover:border-red-700',
    disabled: 'disabled:bg-red-300 disabled:border-red-300'
  },
  ghost: {
    base: 'bg-transparent text-slate-600 border-transparent',
    hover: 'hover:bg-slate-100 hover:text-slate-700',
    disabled: 'disabled:text-slate-400'
  },
  outline: {
    base: 'bg-transparent text-slate-600 border-slate-300',
    hover: 'hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700',
    disabled: 'disabled:text-slate-400 disabled:border-slate-200'
  }
}

const sizeStyles = {
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  md: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]
  
  const isDisabled = disabled || loading
  
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg border font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20
        ${variantStyle.base} ${variantStyle.hover} ${variantStyle.disabled}
        ${sizeStyle.padding} ${sizeStyle.text}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className={`${sizeStyle.icon} animate-spin`} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={sizeStyle.icon} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={sizeStyle.icon} />
      )}
    </button>
  )
}

// Predefined button variants
export const PrimaryButton = ({ ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
)

export const SecondaryButton = ({ ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
)

export const DangerButton = ({ ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="danger" {...props} />
)

export const GhostButton = ({ ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props} />
)

export const OutlineButton = ({ ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="outline" {...props} />
)