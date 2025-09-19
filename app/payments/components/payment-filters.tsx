"use client";
import "./payment-filters.css";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, LayoutGrid, List, Filter, Upload, Check, Info, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Menu, Grid3X3 } from "lucide-react"
import { ColumnVisibility, ColumnConfig } from './column-visibility'
import { TooltipButton } from './tooltip-button'

interface PaymentFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilters: string[]
  setStatusFilters: (statuses: string[]) => void
  categoryFilters: string[]
  setCategoryFilters: (categories: string[]) => void
  courseFilters: string[]
  setCourseFilters: (courses: string[]) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  onExport: () => void
  columns: ColumnConfig[]
  onColumnToggle: (key: string, visible: boolean) => void
  // sortBy?: string
  // setSortBy?: (sort: string) => void
  onUpload?: () => void
  records?: any[]
}

export function PaymentFilters({
  searchTerm,
  setSearchTerm,
  statusFilters,
  setStatusFilters,
  categoryFilters,
  setCategoryFilters,
  courseFilters,
  setCourseFilters,
  viewMode,
  setViewMode,
  onExport,
  columns,
  onColumnToggle,
  // sortBy = "name-asc",
  // setSortBy = () => {},
  onUpload = () => {},
  records = [],
}: PaymentFiltersProps) {

  // Generate dynamic filter options from actual data
  const availableCourses = [...new Set(records.map(record => record.activity).filter(Boolean))]
  const availableCategories = [...new Set(records.map(record => record.category).filter(Boolean))]
  const availableStatuses = [...new Set(records.map(record => record.paymentStatus).filter(Boolean))]

  const [tempStatusFilters, setTempStatusFilters] = useState<string[]>(statusFilters)
  const [tempCategoryFilters, setTempCategoryFilters] = useState<string[]>(categoryFilters)
  const [tempCourseFilters, setTempCourseFilters] = useState<string[]>(courseFilters)
  // Sorting logic removed
  const [isClearing, setIsClearing] = useState(false)

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setTempStatusFilters([...tempStatusFilters, status])
    } else {
      setTempStatusFilters(tempStatusFilters.filter(s => s !== status))
    }
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setTempCategoryFilters([...tempCategoryFilters, category])
    } else {
      setTempCategoryFilters(tempCategoryFilters.filter(c => c !== category))
    }
  }

  const handleCourseChange = (course: string, checked: boolean) => {
    if (checked) {
      setTempCourseFilters([...tempCourseFilters, course])
    } else {
      setTempCourseFilters(tempCourseFilters.filter(c => c !== course))
    }
  }

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const handleApply = () => {
    setStatusFilters(tempStatusFilters)
    setCategoryFilters(tempCategoryFilters)
    setCourseFilters(tempCourseFilters)
    setFilterPopoverOpen(false)
    setIsClearing(false)
  }



  const handleClearAll = () => {
    setIsClearing(true)
    setTempStatusFilters([])
    setTempCategoryFilters([])
    setTempCourseFilters([])
    setStatusFilters([])
    setCategoryFilters([])
    setCourseFilters([])
    setTimeout(() => {
      setIsClearing(false)
      setFilterPopoverOpen(false)
    }, 300)
  }

  const hasActiveFilters = statusFilters.length > 0 || categoryFilters.length > 0 || courseFilters.length > 0



  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-[#9234ea] focus:ring-[#9234ea] focus:ring-1 focus:outline-none focus-visible:border-[#9234ea] focus-visible:ring-[#9234ea] bg-gray-50"
          />
        </div>

        {/* Horizontal Toolbar */}
        <div className="flex items-center gap-2">

        {/* Filter Button */}
        <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 w-10 p-0 border-[#9234ea] text-[#9234ea] hover:bg-[#9234ea]/10 rounded-md shadow-sm relative"
              title="Filter payments by status and mode"
            >
              <Filter className="h-5 w-5" />
              {isClearing ? (
                <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="h-2 w-2 text-white" />
                </div>
              ) : hasActiveFilters ? (
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-2 w-2 text-white" />
                </div>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white rounded-lg shadow-lg border border-black" align="start">
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <div className="p-3 space-y-3">
                {/* Filter by Course */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-900">Filter by Course</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCourses.map((course) => (
                      <div key={course} className="flex items-center gap-1">

                        <Checkbox
                          id={`course-${course}`}
                          checked={tempCourseFilters.includes(course)}
                          onCheckedChange={(checked) => handleCourseChange(course, checked as boolean)}
                          className="h-4 w-4 data-[state=checked]:bg-[#9234ea] data-[state=checked]:border-[#9234ea]"
                        />
                        <label htmlFor={`course-${course}`} className="text-xs text-gray-700 cursor-pointer">
                          {course}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filter by Category */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-900">Filter by Category</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center gap-1">
                        <Checkbox
                          id={`category-${category}`}
                          checked={tempCategoryFilters.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                          className="h-4 w-4 data-[state=checked]:bg-[#9234ea] data-[state=checked]:border-[#9234ea]"
                        />
                        <label htmlFor={`category-${category}`} className="text-xs text-gray-700 cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filter by Status */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-900">Filter by Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableStatuses.map((status) => (
                      <div key={status} className="flex items-center gap-1">
                        <Checkbox
                          id={`status-${status}`}
                          checked={tempStatusFilters.includes(status)}
                          onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                          className="h-4 w-4 data-[state=checked]:bg-[#9234ea] data-[state=checked]:border-[#9234ea]"
                        />
                        <label htmlFor={`status-${status}`} className="text-xs text-gray-700 cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleApply} 
                      className="flex-1 bg-[#9234ea] hover:bg-[#9234ea]/90 text-white text-xs h-8" 
                      title="Apply filters"
                    >
                      <span className="text-white font-bold mr-1">✔</span>
                      Apply
                    </Button>
                    <Button 
                      onClick={handleClearAll}
                      variant="outline" 
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs h-8" 
                      title="Clear all filters"
                    >
                      <X className="h-3 w-3 mr-1 text-red-600" />
                      Clear
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </PopoverContent>
        </Popover>

  {/* Sort Dropdown removed */}


        {/* View Toggle Buttons */}
        <div className="border border-gray-300 rounded-md flex overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`h-10 w-10 p-0 rounded-none border-0 ${
              viewMode === "grid" 
                ? "bg-[#9234ea] text-white hover:bg-[#9234ea]/90" 
                : "bg-white text-black hover:bg-gray-50"
            }`}
            title="Grid View - Show payment cards"
          >
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="4" r="2.5" />
              <circle cx="12" cy="4" r="2.5" />
              <circle cx="4" cy="12" r="2.5" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </Button>
          <div className="w-px bg-gray-300"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`h-10 w-10 p-0 rounded-none border-0 ${
              viewMode === "list" 
                ? "bg-[#9234ea] text-white hover:bg-[#9234ea]/90" 
                : "bg-white text-black hover:bg-gray-50"
            }`}
            title="List View - Show payment table"
          >
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" />
            </svg>
          </Button>
        </div>

            
                {/* Export Icon */}
        <TooltipButton
          onClick={onExport}
          className="h-10 w-10 p-0 bg-white text-black border-gray-300 hover:bg-gray-50 rounded-md shadow-sm"
          tooltip="Export selected rows"
        >
          <Download className="h-4 w-4" />
        </TooltipButton>



          <ColumnVisibility
            columns={columns}
            onColumnToggle={onColumnToggle}
          />
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#9234ea] rounded-full"></div>
        <span className="text-sm text-[#9234ea] font-medium">Payment records found</span>
      </div>
    </div>
  )
}