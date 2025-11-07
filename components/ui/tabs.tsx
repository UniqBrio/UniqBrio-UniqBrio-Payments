'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  compact?: boolean
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, compact = false, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('flex flex-wrap items-center gap-4', compact && 'gap-2', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'underline' | 'ghost'
}

const sizeClasses: Record<string, string> = {
  sm: 'h-9 px-5 text-sm',
  md: 'h-11 px-8 text-sm',
  lg: 'h-12 px-10 text-base',
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size = 'md', variant = 'pill', ...props }, ref) => {
  const base =
    'relative inline-flex items-center justify-center whitespace-nowrap select-none font-semibold rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants: Record<string, string> = {
    pill: [
      'min-w-[150px]',
      'border-[#F2994A] text-[#F2994A] bg-white',
      'data-[state=active]:bg-[#7B61FF] data-[state=active]:text-white data-[state=active]:border-[#7B61FF]',
      'hover:shadow-[0_0_0_4px_rgba(242,153,74,0.12)]',
      'data-[state=active]:shadow-[0_0_0_4px_rgba(123,97,255,0.15)]',
      'active:translate-y-px',
    ].join(' '),
    underline: [
      'rounded-none border-transparent border-b-2',
      'text-gray-600',
      'data-[state=active]:border-[#7B61FF] data-[state=active]:text-[#7B61FF]',
      'hover:text-[#7B61FF]',
    ].join(' '),
    ghost: [
      'border-transparent bg-transparent text-gray-600',
      'data-[state=active]:text-[#7B61FF]',
      'hover:bg-gray-100',
    ].join(' '),
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(base, sizeClasses[size], variants[variant], className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF] focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
