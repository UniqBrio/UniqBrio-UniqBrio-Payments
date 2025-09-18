"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, NotificationTemplate, CalendarIntegration } from "@/types/schedule"

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  theme: "light" | "dark"
  toggleTheme: () => void
  language: string
  setLanguage: (language: string) => void
  notifications: NotificationTemplate[]
  calendarIntegrations: CalendarIntegration[]
  isOffline: boolean
  pinnedMenuItems: string[]
  setPinnedMenuItems: (items: string[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [language, setLanguage] = useState("en")
  const [isOffline, setIsOffline] = useState(false)
  const [pinnedMenuItems, setPinnedMenuItems] = useState<string[]>([])

  // Sample notification templates
  const [notifications] = useState<NotificationTemplate[]>([
    {
      id: "reminder",
      name: "Class Reminder",
      type: "reminder",
      channels: ["push", "email"],
      template: "Your class {className} starts in {timeUntil}",
      variables: ["className", "timeUntil"],
    },
    {
      id: "cancellation",
      name: "Class Cancellation",
      type: "cancellation",
      channels: ["push", "sms", "email"],
      template: "Your class {className} on {date} has been cancelled. Reason: {reason}",
      variables: ["className", "date", "reason"],
    },
  ])

  const [calendarIntegrations] = useState<CalendarIntegration[]>([
    { provider: "google", isConnected: false, syncEnabled: false },
    { provider: "outlook", isConnected: false, syncEnabled: false },
    { provider: "apple", isConnected: false, syncEnabled: false },
  ])

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("uniqbrio-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Default user for demo
      const defaultUser: User = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        preferences: {
          theme: "light",
          language: "en",
          notifications: {
            push: true,
            sms: true,
            email: true,
            classReminders: true,
            cancellations: true,
            rescheduling: true,
            assignments: true,
          },
          pinnedMenuItems: ["home", "services-schedule", "payments"],
        },
      }
      setUser(defaultUser)
      localStorage.setItem("uniqbrio-user", JSON.stringify(defaultUser))
    }
  }, [])

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("uniqbrio-theme") as "light" | "dark"
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("uniqbrio-language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Load pinned menu items
  useEffect(() => {
    if (user?.preferences.pinnedMenuItems) {
      setPinnedMenuItems(user.preferences.pinnedMenuItems)
    }
  }, [user])

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("uniqbrio-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")

    // Update user preferences
    if (user) {
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, theme: newTheme },
      }
      setUser(updatedUser)
      localStorage.setItem("uniqbrio-user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        toggleTheme,
        language,
        setLanguage,
        notifications,
        calendarIntegrations,
        isOffline,
        pinnedMenuItems,
        setPinnedMenuItems,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
