"use client"

import React from 'react'
import { TextInput, TextInputProps } from '@mantine/core'
import { nordicTokens } from './tokens'

interface NordicInputProps extends Omit<TextInputProps, 'variant'> {
  error?: boolean
  helperText?: string
}

export default function NordicInput({ 
  error = false,
  helperText,
  className = '',
  ...props 
}: NordicInputProps) {
  return (
    <div className="w-full">
      <TextInput
        {...props}
        className={className}
        styles={{
          input: {
            backgroundColor: 'white',
            border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '8px 12px',
            minHeight: '44px',
            fontSize: '14px'
          },
          label: {
            fontSize: '14px',
            fontWeight: 500,
            color: '#64748b',
            marginBottom: '4px'
          }
        }}
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