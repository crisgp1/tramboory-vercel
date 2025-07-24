"use client"

import React from 'react'
import { Input, InputProps } from '@heroui/react'
import { nordicTokens } from './tokens'

interface NordicInputProps extends Omit<InputProps, 'variant'> {
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
      <Input
        {...props}
        variant="flat"
        className={className}
        classNames={{
          base: "w-full",
          mainWrapper: "w-full",
          inputWrapper: `
            bg-[${nordicTokens.colors.background.primary}]
            border 
            ${error 
              ? `border-[${nordicTokens.colors.border.error}]` 
              : `border-[${nordicTokens.colors.border.primary}]`
            }
            rounded-[${nordicTokens.radius.md}]
            px-[${nordicTokens.spacing.md}]
            py-[${nordicTokens.spacing.sm}]
            min-h-[44px]
            shadow-none
            hover:border-[${nordicTokens.colors.text.secondary}]
            focus-within:border-[${nordicTokens.colors.border.focus}]
            focus-within:ring-1
            focus-within:ring-[${nordicTokens.colors.border.focus}]/20
            transition-all duration-[${nordicTokens.transition.fast}]
            group-data-[focus=true]:border-[${nordicTokens.colors.border.focus}]
            group-data-[focus=true]:ring-1
            group-data-[focus=true]:ring-[${nordicTokens.colors.border.focus}]/20
          `,
          input: `
            text-[${nordicTokens.colors.text.primary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontFamily.primary}]
            placeholder:text-[${nordicTokens.colors.text.tertiary}]
            bg-transparent
            outline-none
            border-none
            shadow-none
          `,
          label: `
            text-[${nordicTokens.colors.text.secondary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontWeight.medium}]
            mb-[${nordicTokens.spacing.xs}]
          `
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