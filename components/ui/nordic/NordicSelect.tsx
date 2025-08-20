"use client"

import React from 'react'
import { Select, SelectProps } from '@mantine/core'
import { nordicTokens } from './tokens'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface NordicSelectProps extends Omit<SelectProps, 'variant'> {
  error?: boolean
  helperText?: string
  options?: { value: string; label: string }[]
}

export default function NordicSelect({ 
  error = false,
  helperText,
  options = [],
  className = '',
  children,
  ...props 
}: NordicSelectProps) {
  return (
    <div className="w-full">
      <Select
        {...props}
        className={className}
        rightSection={<ChevronDownIcon className="w-4 h-4" />}
        styles={{
          input: {
            backgroundColor: 'white',
            border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '8px 12px',
            minHeight: '44px',
            fontSize: '14px'
          },
          dropdown: {
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px'
          }
        }}
        data={options?.map(option => ({ value: option.value, label: option.label })) || []}
      />
      {helperText && (
        <p className={`
          mt-[${nordicTokens.spacing.xs}] 
          text-[${nordicTokens.typography.fontSize.xs}] 
          ${error 
            ? `text-[${nordicTokens.colors.action.danger}]` 
            : `text-[${nordicTokens.colors.text.tertiary}]`
          }
        `}>
          {helperText}
        </p>
      )}
    </div>
  )
}