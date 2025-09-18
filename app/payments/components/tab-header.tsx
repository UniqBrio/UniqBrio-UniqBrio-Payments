"use client"

import { Button } from "@/components/ui/button"

interface TabHeaderProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabHeader({ tabs, activeTab, onTabChange, className = "" }: TabHeaderProps) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none ${
            activeTab === tab.id
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-transparent text-purple-600 hover:text-purple-700 hover:border-purple-300"
          }`}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}