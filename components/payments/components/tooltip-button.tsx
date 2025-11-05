"use client"

import { Button } from "@/components/ui/button"
import "./tooltip.css"

interface TooltipButtonProps {
  children: React.ReactNode
  tooltip: string
  onClick?: () => void
  className?: string
  title?: string
}

export function TooltipButton({ children, tooltip, onClick, className, title }: TooltipButtonProps) {
  return (
    <div className="tooltip-container">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className={className}
        title={title}
      >
        {children}
      </Button>
      <div className="tooltip">{tooltip}</div>
    </div>
  )
}