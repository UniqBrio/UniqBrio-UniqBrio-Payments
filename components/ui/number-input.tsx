"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  allowNegative?: boolean
  allowDecimals?: boolean
  onChange?: (value: number | null) => void
  onValueChange?: (value: string) => void
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, allowNegative = false, allowDecimals = true, onChange, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value
      
      // Remove any non-numeric characters except decimal point and minus sign
      if (allowDecimals) {
        value = value.replace(/[^0-9.-]/g, '')
      } else {
        value = value.replace(/[^0-9-]/g, '')
      }
      
      // Handle negative numbers
      if (!allowNegative) {
        value = value.replace(/-/g, '')
      } else {
        // Only allow minus at the beginning
        const minusCount = (value.match(/-/g) || []).length
        if (minusCount > 1) {
          value = value.replace(/-/g, '')
          if (value.length > 0) {
            value = '-' + value
          }
        } else if (value.includes('-') && !value.startsWith('-')) {
          value = value.replace('-', '')
        }
      }
      
      // Handle decimal points
      if (allowDecimals) {
        const decimalCount = (value.match(/\./g) || []).length
        if (decimalCount > 1) {
          const parts = value.split('.')
          value = parts[0] + '.' + parts.slice(1).join('')
        }
      }
      
      // Update the input value
      e.target.value = value
      
      // Call the onChange callback with the numeric value
      if (onChange) {
        const numericValue = value === '' || value === '-' ? null : parseFloat(value)
        onChange(isNaN(numericValue!) ? null : numericValue)
      }
      
      // Call the onValueChange callback with the string value
      if (onValueChange) {
        onValueChange(value)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent 'e', 'E', '+' characters
      if (['e', 'E', '+'].includes(e.key)) {
        e.preventDefault()
      }
      
      // Prevent minus if not allowed
      if (!allowNegative && e.key === '-') {
        e.preventDefault()
      }
      
      // Prevent decimal point if not allowed
      if (!allowDecimals && e.key === '.') {
        e.preventDefault()
      }
    }

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }