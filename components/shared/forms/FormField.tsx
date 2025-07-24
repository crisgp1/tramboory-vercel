"use client"

import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface BaseFormFieldProps {
  label: string
  required?: boolean
  error?: string
  helpText?: string
  className?: string
  icon?: React.ElementType
}

// Input Field
interface FormInputProps extends BaseFormFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {}

export function FormInput({ 
  label, 
  required, 
  error, 
  helpText, 
  className = '', 
  icon: Icon,
  ...inputProps 
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          {...inputProps}
          className={`
            glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
          `}
        />
        {error && (
          <ExclamationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="w-4 h-4" />
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-slate-500">{helpText}</p>
      )}
    </div>
  )
}

// Select Field
interface FormSelectProps extends BaseFormFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export function FormSelect({ 
  label, 
  required, 
  error, 
  helpText, 
  className = '',
  options,
  placeholder,
  ...selectProps 
}: FormSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <select
          {...selectProps}
          className={`
            glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
          `}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <ExclamationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="w-4 h-4" />
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-slate-500">{helpText}</p>
      )}
    </div>
  )
}

// Textarea Field
interface FormTextareaProps extends BaseFormFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export function FormTextarea({ 
  label, 
  required, 
  error, 
  helpText, 
  className = '',
  ...textareaProps 
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <textarea
          {...textareaProps}
          className={`
            glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
          `}
        />
        {error && (
          <ExclamationCircleIcon className="absolute right-3 top-3 w-5 h-5 text-red-500" />
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="w-4 h-4" />
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-slate-500">{helpText}</p>
      )}
    </div>
  )
}

// Search Input
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  placeholder?: string
  onSearch?: (value: string) => void
  className?: string
}

export function SearchInput({ 
  placeholder = "Buscar...", 
  onSearch,
  className = '',
  onChange,
  ...inputProps 
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onSearch?.(e.target.value)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
        <svg 
          className="w-5 h-5 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        {...inputProps}
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        className="glass-input w-full pl-10 pr-4 py-3 text-slate-800 placeholder-slate-500"
      />
    </div>
  )
}

// Form Actions (for modal footers, form buttons)
interface FormActionsProps {
  children: ReactNode
  align?: 'left' | 'center' | 'right' | 'between'
  className?: string
}

export function FormActions({ 
  children, 
  align = 'right', 
  className = '' 
}: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div className={`flex items-center gap-3 ${alignmentClasses[align]} ${className}`}>
      {children}
    </div>
  )
}