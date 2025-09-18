"use client"

import { Checkbox } from "@/components/ui/checkbox"

interface FilterGroup {
  title: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}

interface SidebarFilterProps {
  filterGroups: FilterGroup[]
}

export function SidebarFilter({ filterGroups }: SidebarFilterProps) {
  const handleCheckboxChange = (groupIndex: number, value: string, checked: boolean) => {
    const group = filterGroups[groupIndex]
    const newSelected = checked 
      ? [...group.selected, value]
      : group.selected.filter(v => v !== value)
    group.onChange(newSelected)
  }

  return (
    <div className="bg-white p-6 space-y-6">
      {filterGroups.map((group, groupIndex) => (
        <div key={group.title} className="space-y-3">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
            {group.title}
          </h3>
          <div className="space-y-2">
            {group.options.map((option) => (
              <div 
                key={option.value} 
                className="flex items-center space-x-3 hover:bg-gray-50 p-1 rounded cursor-pointer"
              >
                <Checkbox
                  id={`${group.title}-${option.value}`}
                  checked={group.selected.includes(option.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(groupIndex, option.value, checked as boolean)
                  }
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label
                  htmlFor={`${group.title}-${option.value}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}