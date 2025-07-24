"use client"

import React from 'react'
import { Select, SelectProps, SelectItem } from '@heroui/react'
import { nordicTokens } from './tokens'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface NordicSelectProps extends Omit<SelectProps, 'variant'> {
  error?: boolean
  helperText?: string
  options?: { key: string; label: string }[]
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
        variant="flat"
        selectorIcon={<ChevronDownIcon className="w-4 h-4" />}
        className={className}
        classNames={{
          base: "w-full",
          mainWrapper: "w-full",
          trigger: `
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
            focus:border-[${nordicTokens.colors.border.focus}]
            focus:ring-1
            focus:ring-[${nordicTokens.colors.border.focus}]/20
            transition-all duration-[${nordicTokens.transition.fast}]
            data-[focus=true]:border-[${nordicTokens.colors.border.focus}]
            data-[focus=true]:ring-1
            data-[focus=true]:ring-[${nordicTokens.colors.border.focus}]/20
          `,
          value: `
            text-[${nordicTokens.colors.text.primary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontFamily.primary}]
            placeholder:text-[${nordicTokens.colors.text.tertiary}]
          `,
          selectorIcon: `
            text-[${nordicTokens.colors.text.tertiary}]
            right-[${nordicTokens.spacing.md}]
          `,
          label: `
            text-[${nordicTokens.colors.text.secondary}]
            text-[${nordicTokens.typography.fontSize.sm}]
            font-[${nordicTokens.typography.fontWeight.medium}]
            mb-[${nordicTokens.spacing.xs}]
          `,
          listboxWrapper: `
            bg-[${nordicTokens.colors.background.primary}]
            shadow-[${nordicTokens.shadow.lg}]
            border border-[${nordicTokens.colors.border.primary}]
            rounded-[${nordicTokens.radius.lg}]
          `,
          popoverContent: `
            bg-[${nordicTokens.colors.background.primary}]
            shadow-[${nordicTokens.shadow.lg}]
            border border-[${nordicTokens.colors.border.primary}]
            rounded-[${nordicTokens.radius.lg}]
            p-0
          `
        }}
      >
        {children || options.map((option) => (
          <SelectItem 
            key={option.key} 
            className={`
              text-[${nordicTokens.colors.text.primary}]
              text-[${nordicTokens.typography.fontSize.sm}]
              hover:bg-[${nordicTokens.colors.background.secondary}]
              focus:bg-[${nordicTokens.colors.background.secondary}]
              data-[selected=true]:bg-[${nordicTokens.colors.background.tertiary}]
              rounded-[${nordicTokens.radius.sm}]
              mx-1
              transition-colors duration-[${nordicTokens.transition.fast}]
            `}
          >
            {option.label}
          </SelectItem>
        ))}
      </Select>
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