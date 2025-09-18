"use client"

import { useState } from "react"
import { DashboardFilterBar } from "./dashboard-filter-bar"

export function DashboardFilterExample() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [sortBy, setSortBy] = useState("newest")
  
  // Filter states
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [levelFilters, setLevelFilters] = useState<string[]>([])
  const [statusFilters, setStatusFilters] = useState<string[]>([])

  const filterGroups = [
    {
      heading: "Filter by Type",
      options: [
        { value: "course", label: "Course" },
        { value: "workshop", label: "Workshop" },
        { value: "seminar", label: "Seminar" },
        { value: "bootcamp", label: "Bootcamp" }
      ],
      selected: typeFilters,
      onChange: setTypeFilters
    },
    {
      heading: "Filter by Level",
      options: [
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" },
        { value: "expert", label: "Expert" }
      ],
      selected: levelFilters,
      onChange: setLevelFilters
    },
    {
      heading: "Filter by Status",
      options: [
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "cancelled", label: "Cancelled" }
      ],
      selected: statusFilters,
      onChange: setStatusFilters
    }
  ]

  return (
    <div className="p-6">
      <DashboardFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterGroups={filterGroups}
      />
      
      {/* Debug info */}
      <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
        <p><strong>Search:</strong> {searchTerm}</p>
        <p><strong>View Mode:</strong> {viewMode}</p>
        <p><strong>Sort:</strong> {sortBy}</p>
        <p><strong>Type Filters:</strong> {typeFilters.join(", ") || "None"}</p>
        <p><strong>Level Filters:</strong> {levelFilters.join(", ") || "None"}</p>
        <p><strong>Status Filters:</strong> {statusFilters.join(", ") || "None"}</p>
      </div>
    </div>
  )
}