"use client";
import "./payment-filters.css";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, LayoutGrid, List, Filter, Upload, Check, Info, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Menu, Grid3X3 } from "lucide-react"
import { ColumnVisibility, ColumnConfig } from './column-visibility'
import { TooltipButton } from './tooltip-button'
import React, { useState } from "react"

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
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
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
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
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

  // Sorting state and options
  const SORT_FIELDS = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
  ];


  const hasRecords = records && records.length > 0;

  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm mb-4 ${hasRecords ? 'w-full' : ''}`}>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 w-full">
          <div className={`relative ${hasRecords ? 'flex-grow' : 'flex-1 min-w-[120px] max-w-[850px]'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className={`pl-10 pr-2 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 w-full max-w-[850px]`}
                placeholder="Search courses, instructors, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 gap-1 border border-gray-200 text-black hover:bg-gray-50 rounded-md shadow-sm flex items-center"
                title="Filter"
              >
                <Filter className="h-5 w-5" />
                {hasActiveFilters && !isClearing && (
                  <span className="absolute top-1 right-2 flex items-center justify-center">
                    <span className="bg-purple-500 rounded-full w-4 h-4 flex items-center justify-center shadow">
                      <Check className="text-white h-2.5 w-2.5" />
                    </span>
                  </span>
                )}
                {isClearing && (
                  <span className="absolute top-1 right-2 flex items-center justify-center">
                    <span className="bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shadow">
                      <X className="text-white h-2.5 w-2.5" />
                    </span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white rounded-lg shadow-lg border-none" align="start">
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
                          <label htmlFor={`course-${course}`} className="text-sm text-gray-700 cursor-pointer">
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
                            className="h-5 w-5 data-[state=checked]:bg-[#9234ea] data-[state=checked]:border-[#9234ea]"
                          />
                          <label htmlFor={`category-${category}`} className="text-sm text-gray-700 cursor-pointer">
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
                            className="h-5 w-5 data-[state=checked]:bg-[#9234ea] data-[state=checked]:border-[#9234ea]"
                          />
                          <label htmlFor={`status-${status}`} className="text-sm text-gray-700 cursor-pointer">
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t-1">
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
                        className="flex-1 text-red-600 hover:bg-red-50 text-xs h-8" 
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 border border-gray-200 rounded-md shadow-sm flex items-center gap-2 min-w-[100px] font-semibold"
                title="Sort"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                <span className="capitalize font-medium">{SORT_FIELDS.find(f => f.key === sortBy)?.label || 'Sort'}</span>
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 bg-white rounded-lg shadow-lg border-none" align="start">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-900 mb-2">Sort By</div>
                <div className="mb-2 divide-y divide-gray-100">
                  {SORT_FIELDS.map(field => (
                    <div
                      key={field.key}
                      className={`flex items-center justify-between py-2 px-2 cursor-pointer rounded-md hover:bg-gray-50 ${sortBy === field.key ? 'bg-gray-100 font-semibold' : ''}`}
                      onClick={() => setSortBy(field.key)}
                    >
                      <span className="text-sm text-gray-700">{field.label}</span>
                      {sortBy === field.key && <span className="text-[#9234ea] text-lg ml-2">✓</span>}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold text-gray-900 mb-2 mt-2">Order</div>
                <div className="divide-y divide-gray-100">
                  <div
                    className={`flex items-center justify-between py-2 px-2 cursor-pointer rounded-md hover:bg-gray-50 ${sortOrder === 'asc' ? 'bg-gray-100 font-semibold' : ''}`}
                    onClick={() => setSortOrder('asc')}
                  >
                    <span className="text-sm text-gray-700">Ascending <span className="text-xs">↑</span></span>
                    {sortOrder === 'asc' && <span className="text-[#9234ea] text-lg ml-2">✓</span>}
                  </div>
                  <div
                    className={`flex items-center justify-between py-2 px-2 cursor-pointer rounded-md hover:bg-gray-50 ${sortOrder === 'desc' ? 'bg-gray-100 font-semibold' : ''}`}
                    onClick={() => setSortOrder('desc')}
                  >
                    <span className="text-sm text-gray-700">Descending <span className="text-xs">↓</span></span>
                    {sortOrder === 'desc' && <span className="text-[#9234ea] text-lg ml-2">✓</span>}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* View Toggle Buttons */}
          <div className="border border-gray-200 rounded-md flex overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-10 w-10 p-0 rounded-none border-0 ${
                  viewMode === "grid" 
                    ? "bg-[#9234ea] text-white hover:bg-[#9234ea]/90" 
                    : "bg-white text-black hover:bg-gray-50"
                }`}
                title="Grid"
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
                title="List"
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
            tooltip="Export"
          >
            <Download className="h-4 w-4" />
          </TooltipButton>

          <ColumnVisibility
            columns={columns}
            onColumnToggle={onColumnToggle}
          />
        </div>
        {/* Results Count */}
        {hasRecords && (
          <div className={`flex items-center gap-2 mt-2 px-4 py-2 bg-[#f6f3ff] border border-[#d1bfff] rounded-lg ${hasRecords ? 'w-full' : 'w-fit'}`}>
            <div className="w-2 h-2 bg-[#9234ea] rounded-full"></div>
            <span className="text-base text-[#9234ea] font-medium">
              {Array.isArray(records) ? `${records.length} payment records found` : 'Payment records found'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}