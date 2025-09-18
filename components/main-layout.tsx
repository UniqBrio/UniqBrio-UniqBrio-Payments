"use client"

import type React from "react"

import { useState } from "react"
import Sidebar from "./sidebar"
import Header from "./header"

import ErrorBoundary from "./error-boundary"
import { useSidebarPosition } from "@/contexts/sidebar-position-context"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("English")
  const [userRole, setUserRole] = useState<"admin" | "super admin">("admin")
  const { position } = useSidebarPosition()

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language)
  }

  const changeUserRole = (role: "admin" | "super admin") => {
    setUserRole(role)
  }

  // Determine layout based on sidebar position
  const renderLayout = () => {
    switch (position) {
      case "left":
        return (
          <div className="flex h-screen bg-gray-50">
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        )
      case "right":
        return (
          <div className="flex h-screen bg-gray-50">
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          </div>
        )
      case "top":
        return (
          <div className="flex flex-col h-screen bg-gray-50">
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        )
      case "bottom":
        return (
          <div className="flex flex-col h-screen bg-gray-50">
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                currentLanguage={currentLanguage}
                changeLanguage={changeLanguage}
                userRole={userRole}
                changeUserRole={changeUserRole}
              />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                          The UniqBrio application is currently unavailable.
                        </h2>
                        <p className="text-gray-600">Please try again later or contact support.</p>
                      </div>
                    </div>
                  }
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
            <Sidebar position={position} collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          </div>
        )
      default:
        return null
    }
  }

  return renderLayout()
}
