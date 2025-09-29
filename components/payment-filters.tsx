"use client"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Search, Filter, Download, LayoutGrid, List, X, Check } from "lucide-react"

interface PaymentFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  categoryFilter: string
  setCategoryFilter: (category: string) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  onFilter: () => void
  onExport: () => void
}

export function PaymentFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  viewMode,
  setViewMode,
  onFilter,
  onExport,
}: PaymentFiltersProps) {
  const hasActiveFilters = searchTerm || statusFilter !== "all" || categoryFilter !== "all"
  
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg border border-purple-200">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search courses, students, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 border border-purple-200 rounded-lg shadow-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 focus:outline-none"
            aria-label="Clear all filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full md:w-40 border-purple-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <SelectTrigger className="w-full md:w-40 border-purple-200">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="sports">Sports</SelectItem>
          <SelectItem value="arts">Arts</SelectItem>
          <SelectItem value="music">Music</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <div className="flex border border-purple-200 rounded-md overflow-hidden">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`border-0 rounded-none ${viewMode === "list" ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"}`}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`border-0 rounded-none ${viewMode === "grid" ? "bg-purple-600 text-white" : "bg-white hover:bg-purple-50"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={hasActiveFilters ? clearFilters : onFilter}
          className={hasActiveFilters ? "border-red-200 bg-red-50 hover:bg-red-100 text-red-600" : "border-purple-200 bg-purple-50 hover:bg-purple-100"}
        >
          {hasActiveFilters ? <X className="h-4 w-4 mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
          Filter
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className={hasActiveFilters ? "border-red-200 bg-red-50 hover:bg-red-100 text-red-600" : "border-green-200 bg-green-50 hover:bg-green-100 text-green-600"}
        >
          {hasActiveFilters ? <X className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Clear
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="border-purple-200 bg-orange-50 hover:bg-orange-100"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )
}
