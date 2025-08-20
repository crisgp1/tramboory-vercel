"use client"

import React from 'react'
import { Modal, ModalProps } from '@mantine/core'
import { nordicTokens } from './tokens'
import { XMarkIcon } from '@heroicons/react/24/outline'
import NordicButton from './NordicButton'

interface NordicModalProps extends Omit<ModalProps, 'size'> {
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showCloseButton?: boolean
  children: React.ReactNode
}

export default function NordicModal({ 
  title,
  size = 'lg',
  showCloseButton = true,
  onClose,
  className = '',
  children,
  ...props 
}: NordicModalProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md': 
        return 'max-w-lg'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      case '2xl':
        return 'max-w-6xl'
      default:
        return 'max-w-2xl'
    }
  }

  return (
    <Modal
      {...props}
      onClose={onClose}
      className={className}
      size={size === '2xl' ? 'xl' : size}
      styles={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)'
        },
        content: {
          maxHeight: '90vh',
          overflow: 'hidden'
        },
        header: {
          padding: '24px 24px 16px',
          borderBottom: 'none'
        },
        body: {
          padding: '0 24px',
          maxHeight: '70vh',
          overflow: 'auto'
        }
      }}
      title={
        title ? (
          <div className="relative w-full">
            <h2 className="text-2xl font-semibold text-slate-800 leading-tight m-0">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-0 right-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        ) : showCloseButton ? (
          <div className="relative w-full">
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        ) : undefined
      }
    >
      {children}
    </Modal>
  )
}

// Export ModalFooter with Nordic styling
export function NordicModalFooter({ 
  children,
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      {...props}
      className={`px-6 pt-4 pb-6 border-none flex justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  )
}