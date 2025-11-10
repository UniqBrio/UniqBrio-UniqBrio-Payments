"use client"

import React, { useEffect, useId, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import "./record-details-dialog.css"

export type RecordDetailsField = {
  label: string
  value: React.ReactNode
  span?: 1 | 2
  icon?: React.ReactNode
}

export type RecordDetailsSection = {
  title?: string
  fields: RecordDetailsField[]
}

export type RecordStatus = {
  label: string
  tone?: "default" | "success" | "warning" | "danger" | "info"
}

export type RecordDetailsDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  avatarUrl?: string
  avatarFallback?: string
  status?: RecordStatus
  sections: RecordDetailsSection[]
  actions?: React.ReactNode
  className?: string
  headerChips?: React.ReactNode
}

export default function RecordDetailsDialog(props: RecordDetailsDialogProps) {
  const {
    open,
    onClose,
    title,
    subtitle,
    avatarUrl,
    avatarFallback,
    status,
    sections,
    actions,
    className,
  } = props

  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocused = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement
      const t = setTimeout(() => {
        closeBtnRef.current?.focus()
      }, 0)
      return () => clearTimeout(t)
    } else if (previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && e.target === e.currentTarget) {
      onClose()
    }
  }

  const statusClass = useMemo(() => {
    switch (status?.tone) {
      case "success":
        return "rdd-badge rdd-badge-success"
      case "warning":
        return "rdd-badge rdd-badge-warning"
      case "danger":
        return "rdd-badge rdd-badge-danger"
      case "info":
        return "rdd-badge rdd-badge-info"
      default:
        return "rdd-badge"
    }
  }, [status])

  if (!open) return null

  return createPortal(
    <div className="rdd-overlay" onMouseDown={onOverlayClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`rdd-dialog ${className ?? ""}`}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        <header className="rdd-header rdd-header-gradient">
          <div className="rdd-header-left">
            {(avatarUrl || avatarFallback) && (
              <div className="rdd-avatar" aria-hidden="true">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </div>
            )}
            <div className="rdd-titles">
              <h2 id={titleId} className="rdd-title">
                {title}
              </h2>
              {subtitle && <p className="rdd-subtitle">{subtitle}</p>}
              {/* Chips row (category etc.) and status badge on the same line */}
              {(props.headerChips || status?.label) && (
                <div className="rdd-chips">
                  {props.headerChips}
                  {status?.label && <span className={statusClass}>{status.label}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="rdd-header-right">
            <button
              ref={closeBtnRef}
              type="button"
              className="rdd-icon-btn"
              aria-label="Close details dialog"
              onClick={onClose}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="rdd-content">
          {sections.map((section, idx) => (
            <section key={idx} className="rdd-section">
              {section.title && <h3 className="rdd-section-title">{section.title}</h3>}
              <div className="rdd-grid">
                {section.fields.map((f, i) => (
                  <div key={i} className={`rdd-field ${f.span === 2 ? "rdd-span-2" : ""}`}>
                    <div className="rdd-field-label">
                      {f.icon && <span className="rdd-field-icon">{f.icon}</span>}
                      {f.label}
                    </div>
                    <div className="rdd-field-value">{f.value}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {actions && <footer className="rdd-footer">{actions}</footer>}
      </div>
    </div>,
    document.body
  )
}
