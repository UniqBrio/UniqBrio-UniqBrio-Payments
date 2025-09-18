import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarPositionProvider } from "@/contexts/sidebar-position-context"
import { AppProvider } from "@/contexts/app-context"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniqBrio - Advanced Learning Platform",
  description: "Comprehensive learning management system with advanced scheduling, analytics, and AI-powered insights",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            <SidebarPositionProvider>
              {children}
              <Toaster />
            </SidebarPositionProvider>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
