"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ChevronDown, LayoutGrid, List } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

interface FilterGroup {
  heading: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

interface DashboardFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  sortBy: string
  setSortBy: (sort: string) => void
  filterGroups: FilterGroup[]
}

export function DashboardFilterBar({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  filterGroups
}: DashboardFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true)

  const handleFilterChange = (groupIndex: number, value: string, checked: boolean) => {
    const group = filterGroups[groupIndex]
    const newSelected = checked 
      ? [...group.selected, value]
      : group.selected.filter(v => v !== value)
    group.onChange(newSelected)
  }

  const totalFiltersSelected = filterGroups.reduce((sum, group) => sum + group.selected.length, 0)

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      {/* Filter Dropdown */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="border-gray-300 hover:border-purple-500 gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
            {totalFiltersSelected > 0 && (
              <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {totalFiltersSelected}
              </span>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-6">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.heading} className="space-y-3">
                <h4 className="font-medium text-sm text-gray-900">{group.heading}</h4>
                
                {/* Selected items */}
                {group.selected.length > 0 && (
                  <div className="space-y-2 pb-2 border-b border-gray-100">
                    {group.selected.map(selectedValue => {
                      const option = group.options.find(opt => opt.value === selectedValue)
                      return (
                        <div key={selectedValue} className="flex items-center justify-between bg-purple-50 px-2 py-1 rounded text-sm">
                          <span className="text-purple-700">{option?.label}</span>
                          <button
                            onClick={() => handleFilterChange(groupIndex, selectedValue, false)}
                            className="text-purple-500 hover:text-purple-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* All options */}
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${group.heading}-${option.value}`}
                        checked={group.selected.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleFilterChange(groupIndex, option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`${group.heading}-${option.value}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Duration</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>


    </div>
  )
}