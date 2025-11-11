"use client";
import "./payment-filters.css";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, LayoutGrid, List, Filter, Upload, Check, Info, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Menu, Grid3X3, ChevronDown, CalendarDays } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
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
  paymentCategoryFilters?: string[]
  setPaymentCategoryFilters?: (categories: string[]) => void
  priceRange?: { min: number; max: number }
  setPriceRange?: (range: { min: number; max: number }) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  onExport: () => void
  selectedCount?: number
  columns: ColumnConfig[]
  onColumnToggle: (key: string, visible: boolean) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  onUpload?: () => void
  records?: any[]
  filteredRecords?: any[]
  totalRecords?: any[]
  embedded?: boolean
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
  paymentCategoryFilters = [],
  setPaymentCategoryFilters = () => {},
  priceRange = { min: 0, max: 100000 },
  setPriceRange = () => {},
  viewMode,
  setViewMode,
  onExport,
  selectedCount = 0,
  columns,
  onColumnToggle,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onUpload = () => {},
  records = [],
  filteredRecords = [],
  totalRecords = [],
  embedded = false,
}: PaymentFiltersProps) {

  // Use totalRecords or records for generating filter options (all available data)
  const allRecords = totalRecords.length > 0 ? totalRecords : records
  const availableCourses = [...new Set(allRecords.map(record => record.activity).filter(Boolean))]
  const availableCategories = [...new Set(allRecords.map(record => record.category).filter(Boolean))]
  
  // Include N/A as a status option along with existing payment statuses, but exclude "-"
  const baseStatuses = [...new Set(allRecords.map(record => record.paymentStatus).filter(Boolean))]
    .filter(status => status !== "-") // Remove "-" from filter options
  const availableStatuses = [...baseStatuses, "N/A"].filter((status, index, array) => array.indexOf(status) === index)
  
  // Fee Categories from payment records (Student Registration, Course Registration, etc.)
  const availablePaymentCategories = [
    "Student Registration",
    "Course Registration", 
    "Course Fee"
  ]

  const [tempStatusFilters, setTempStatusFilters] = useState<string[]>(statusFilters)
  const [tempCategoryFilters, setTempCategoryFilters] = useState<string[]>(categoryFilters)
  const [tempCourseFilters, setTempCourseFilters] = useState<string[]>(courseFilters)
  const [tempPaymentCategoryFilters, setTempPaymentCategoryFilters] = useState<string[]>(paymentCategoryFilters)
  const [tempPriceRange, setTempPriceRange] = useState<{ min: number; max: number }>(priceRange)
  const [isClearing, setIsClearing] = useState(false)
  // Protect against programmatic/autofill changes by only accepting search changes while focused
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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

  const handlePaymentCategoryChange = (paymentCategory: string, checked: boolean) => {
    if (checked) {
      setTempPaymentCategoryFilters([...tempPaymentCategoryFilters, paymentCategory])
    } else {
      setTempPaymentCategoryFilters(tempPaymentCategoryFilters.filter(c => c !== paymentCategory))
    }
  }

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [permanentFilterIcon, setPermanentFilterIcon] = useState<"apply" | "clear" | null>(null)
  
  const handleApply = () => {
    setStatusFilters(tempStatusFilters)
    setCategoryFilters(tempCategoryFilters)
    setCourseFilters(tempCourseFilters)
    setPaymentCategoryFilters(tempPaymentCategoryFilters)
    setPriceRange(tempPriceRange)
    setFilterPopoverOpen(false)
    setIsClearing(false)
    // Set permanent icon to show green checkmark after applying
    setPermanentFilterIcon("apply")
  }



  const handleClearAll = () => {
    setIsClearing(true)
    setTempStatusFilters([])
    setTempCategoryFilters([])
    setTempCourseFilters([])
    setTempPaymentCategoryFilters([])
    setTempPriceRange({ min: 0, max: 100000 })
    setStatusFilters([])
    setCategoryFilters([])
    setCourseFilters([])
    setPaymentCategoryFilters([])
    setPriceRange({ min: 0, max: 100000 })
    // Set permanent icon to show red X after clearing
    setPermanentFilterIcon("clear")
    setTimeout(() => {
      setIsClearing(false)
      setFilterPopoverOpen(false)
    }, 300)
  }

  const hasActiveFilters = statusFilters.length > 0 || categoryFilters.length > 0 || courseFilters.length > 0 || paymentCategoryFilters.length > 0 || (priceRange.min > 0 || priceRange.max < 100000)

  // Sorting state and options
  const SORT_FIELDS = [
    { key: 'id', label: 'Student ID' },
    { key: 'name', label: 'Student Name' },
    { key: 'type', label: 'Course Type' },
    { key: 'amount', label: 'Course Fee' },
  ];


  const hasRecords = records && records.length > 0;

  // Calculate counts for display
  const filteredCount = filteredRecords.length
  const totalCount = totalRecords.length > 0 ? totalRecords.length : records.length

  const exportLabel = selectedCount > 0 ? `Export (${selectedCount})` : 'Export';

  return (
    <div className={`${embedded ? 'p-0 bg-transparent shadow-none' : 'p-4 bg-white rounded-lg shadow-sm'} mb-4 ${hasRecords ? 'w-full' : ''}`}>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 w-full">
          <div className={`relative ${hasRecords ? 'flex-grow' : 'flex-1 min-w-[120px] max-w-[900px]'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="payments-search"
                name="paymentsSearch"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className={`pl-10 pr-2 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 w-full max-w-[1000px]`}
                placeholder="Search by student name or course name"
                value={searchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => {
                  // Only apply search while the user is actively focused in the field
                  if (isSearchFocused) {
                    setSearchTerm(e.target.value)
                  }
                }}
              />
          </div>
          <TooltipProvider delayDuration={200}>
            <Popover 
              open={filterPopoverOpen} 
              onOpenChange={(open) => {
                setFilterPopoverOpen(open)
                // Reset permanent icon when opening filter dropdown
                if (open) {
                  setPermanentFilterIcon(null)
                }
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 gap-1 border border-gray-200 text-black hover:bg-gray-50 rounded-md shadow-sm flex items-center relative"
                      aria-label="Filters"
                    >
                      <div className="relative flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        {/* Show green checkmark when filters are applied or during transient apply state */}
                        {(permanentFilterIcon === "apply" || (hasActiveFilters && !isClearing)) && (
                          <span className="absolute -top-2 -right-3">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="10" r="10" fill="#22C55E"/>
                              <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                        {/* Show red X when clearing or permanently cleared */}
                        {(isClearing || permanentFilterIcon === "clear") && (
                          <span className="absolute -top-2 -right-3">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                              <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Filters</TooltipContent>
              </Tooltip>
            <PopoverContent side="bottom" align="end" className="w-[320px] md:w-[600px] max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Filter dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Courses Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Courses</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {tempCourseFilters.length === 0 ? (
                            "All Courses"
                          ) : tempCourseFilters.length === 1 ? (
                            tempCourseFilters[0]
                          ) : (
                            `${tempCourseFilters.length} selected`
                          )}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                        {availableCourses.map((course) => (
                          <DropdownMenuItem
                            key={course}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Checkbox
                              checked={tempCourseFilters.includes(course)}
                              onCheckedChange={(checked) => handleCourseChange(course, checked as boolean)}
                              className="data-[state=checked]:bg-purple-600 border-purple-500"
                            />
                            <span className="text-sm">{course}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Categories Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Categories</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {tempCategoryFilters.length === 0 ? (
                            "All Categories"
                          ) : tempCategoryFilters.length === 1 ? (
                            tempCategoryFilters[0]
                          ) : (
                            `${tempCategoryFilters.length} selected`
                          )}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {availableCategories.map((category) => (
                          <DropdownMenuItem
                            key={category}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Checkbox
                              checked={tempCategoryFilters.includes(category)}
                              onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                              className="data-[state=checked]:bg-purple-600 border-purple-500"
                            />
                            <span className="text-sm">{category}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Status</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {tempStatusFilters.length === 0 ? (
                            "All Statuses"
                          ) : tempStatusFilters.length === 1 ? (
                            tempStatusFilters[0] === "inprogress" ? "In Progress" : 
                            tempStatusFilters[0].charAt(0).toUpperCase() + tempStatusFilters[0].slice(1)
                          ) : (
                            `${tempStatusFilters.length} selected`
                          )}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {availableStatuses.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Checkbox
                              checked={tempStatusFilters.includes(status)}
                              onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                              className="data-[state=checked]:bg-purple-600 border-purple-500"
                            />
                            <span className="text-sm">{status}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-gray-900">Price Range (INR)</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        id="price-min"
                        name="priceMin"
                        type="number"
                        autoComplete="off"
                        placeholder="0"
                        value={tempPriceRange.min || ''}
                        onChange={(e) => setTempPriceRange({ ...tempPriceRange, min: Number(e.target.value) || 0 })}
                        className="h-8 text-sm"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <Input
                        id="price-max"
                        name="priceMax"
                        type="number"
                        autoComplete="off"
                        placeholder="100000"
                        value={tempPriceRange.max || ''}
                        onChange={(e) => setTempPriceRange({ ...tempPriceRange, max: Number(e.target.value) || 100000 })}
                        className="h-8 text-sm"
                        min="0"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Filter by course fee amount
                    </div>
                  </div>

                {/* Action buttons */}
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleApply}
                  >
                    Apply Filters
                  </Button>
                </div>

                </div>
            </PopoverContent>
          </Popover>
          </TooltipProvider>
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
              <div className="w-px bg-gray-300"></div>
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
            </div>

          {/* Export Button */}
          <TooltipButton
            onClick={onExport}
            className="h-10 px-3 py-2 bg-white text-black border-gray-300 hover:bg-gray-50 rounded-md shadow-sm flex items-center gap-2"
            tooltip={exportLabel}
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">{exportLabel}</span>
          </TooltipButton>

         
        </div>
        {/* Results Count */}
        {hasRecords && (
          <div className={`flex items-center justify-between gap-2 mt-2 px-4 py-2 bg-[#f6f3ff]  rounded-lg ${hasRecords ? 'w-full' : 'w-fit'}`}>
            <div className="flex items-center gap-2">
              {/* <Info className="h-4 w-4 text-[#9234ea]" /> */}
              <span className="text-sm text-[#9234ea] font-medium">
                Showing {filteredCount} payments
              </span>
            </div>
            <ColumnVisibility
              columns={columns}
              onColumnToggle={onColumnToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
}