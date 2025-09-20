"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

type SidebarPosition = "left" | "right" | "top" | "bottom"

interface SidebarPositionContextType {
  position: SidebarPosition
  setPosition: (position: SidebarPosition) => void
}

const SidebarPositionContext = createContext<SidebarPositionContextType | undefined>(undefined)

export function SidebarPositionProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default value and track if hydrated
  const [position, setPosition] = useState<SidebarPosition>("left")
  const [isHydrated, setIsHydrated] = useState(false)

  // Load the saved position from localStorage on component mount
  useEffect(() => {
    setIsHydrated(true)
    const savedPosition = localStorage.getItem("sidebarPosition") as SidebarPosition | null
    if (savedPosition) {
      setPosition(savedPosition)
    }
  }, [])

  // Save the position to localStorage whenever it changes
  const handleSetPosition = (newPosition: SidebarPosition) => {
    setPosition(newPosition)
    if (isHydrated) {
      localStorage.setItem("sidebarPosition", newPosition)
    }
  }

  return (
    <SidebarPositionContext.Provider value={{ position, setPosition: handleSetPosition }}>
      {children}
    </SidebarPositionContext.Provider>
  )
}

export function useSidebarPosition() {
  const context = useContext(SidebarPositionContext)
  if (context === undefined) {
    throw new Error("useSidebarPosition must be used within a SidebarPositionProvider")
  }
  return context
}
