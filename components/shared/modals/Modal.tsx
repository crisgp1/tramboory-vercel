"use client"

import React, { useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ElementType
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  children: ReactNode
  footer?: ReactNode
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
  full: 'max-w-[95vw]'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'lg',
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}: ModalProps) {

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (closeOnEscape && event.key === 'Escape' && isOpen) {
      onClose()
    }
  }, [closeOnEscape, isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose()
    }
  }, [closeOnBackdrop, onClose])

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          w-full ${sizeClasses[size]} max-h-[95vh] 
          bg-white/95 backdrop-blur-xl 
          rounded-2xl shadow-2xl 
          border border-white/20
          flex flex-col
          overflow-hidden
          animate-in fade-in-0 zoom-in-95 duration-300
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between 
          px-6 py-5 
          border-b border-white/10
          bg-gradient-to-r from-slate-50/80 to-blue-50/80
          backdrop-blur-sm
          flex-shrink-0
          ${headerClassName}
        `}>
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-200/20">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-slate-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {showCloseButton && (
            <button
              onClick={onClose}
              className="
                p-2 rounded-xl 
                bg-white/60 hover:bg-white/80 
                border border-white/20 hover:border-white/40
                transition-all duration-200
                backdrop-blur-sm
                group
              "
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className={`
          flex-1 overflow-y-auto p-6
          bg-white/70 backdrop-blur-sm
          ${bodyClassName}
        `}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            px-6 py-4 
            border-t border-white/10
            bg-gradient-to-r from-slate-50/80 to-blue-50/80
            backdrop-blur-sm
            flex-shrink-0
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  // Use createPortal to render outside the current DOM tree
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}

// Utility components for common use cases
export function ModalFooter({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  )
}

export function ModalActions({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {children}
    </div>
  )
}

// Glass button components for consistency
export function ModalButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  className = '',
  ...props
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  [key: string]: any
}) {
  const variants = {
    primary: 'bg-blue-500/90 hover:bg-blue-600/90 text-white border-blue-400/30',
    secondary: 'bg-white/60 hover:bg-white/80 text-slate-700 border-white/40',
    danger: 'bg-red-500/90 hover:bg-red-600/90 text-white border-red-400/30',
    success: 'bg-green-500/90 hover:bg-green-600/90 text-white border-green-400/30'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-medium rounded-xl
        border backdrop-blur-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}