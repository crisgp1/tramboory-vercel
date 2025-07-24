"use client"

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalProps } from '@heroui/react'
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
      classNames={{
        backdrop: "bg-black/30 backdrop-blur-md",
        wrapper: "items-center justify-center p-4",
        base: `
          ${getSizeClasses()}
          w-full
          glass-modal
          m-0
        `,
        header: `
          px-6
          pt-6
          pb-4
          border-none
        `,
        body: `
          px-6
          py-0
          max-h-[70vh]
          overflow-y-auto
        `,
        footer: `
          px-6
          pt-4
          pb-6
          border-none
          justify-end
          gap-3
        `
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {(title || showCloseButton) && (
              <ModalHeader className="relative">
                {title && (
                  <h2 className="text-2xl font-semibold text-slate-800 leading-tight m-0">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-500" />
                  </button>
                )}
              </ModalHeader>
            )}
            
            <ModalBody>
              {children}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

// Export ModalFooter with Nordic styling
export function NordicModalFooter({ 
  children,
  className = '',
  ...props 
}: React.ComponentProps<typeof ModalFooter>) {
  return (
    <ModalFooter 
      {...props}
      className={`px-6 pt-4 pb-6 border-none justify-end gap-3 ${className}`}
    >
      {children}
    </ModalFooter>
  )
}