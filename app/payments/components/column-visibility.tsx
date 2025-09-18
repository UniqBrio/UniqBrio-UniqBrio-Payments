"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, Copy, X, Grid3X3, Save } from "lucide-react"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
}

interface ColumnVisibilityProps {
  columns: ColumnConfig[]
  onColumnToggle: (key: string, visible: boolean) => void
}

export function ColumnVisibility({ columns, onColumnToggle }: ColumnVisibilityProps) {
  const [open, setOpen] = useState(false)
  const [availableColumns, setAvailableColumns] = useState<ColumnConfig[]>([])
  const [displayedColumns, setDisplayedColumns] = useState<ColumnConfig[]>([])
  
  // Initialize columns when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setAvailableColumns(columns.filter(col => !col.visible))
      setDisplayedColumns(columns.filter(col => col.visible))
    }
  }
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = useState<string[]>([])

  const moveToDisplayed = () => {
    const toMove = availableColumns.filter(col => selectedAvailable.includes(col.key))
    setDisplayedColumns([...displayedColumns, ...toMove])
    setAvailableColumns(availableColumns.filter(col => !selectedAvailable.includes(col.key)))
    setSelectedAvailable([])
  }

  const moveToAvailable = () => {
    const toMove = displayedColumns.filter(col => selectedDisplayed.includes(col.key))
    setAvailableColumns([...availableColumns, ...toMove])
    setDisplayedColumns(displayedColumns.filter(col => !selectedDisplayed.includes(col.key)))
    setSelectedDisplayed([])
  }

  const moveUp = () => {
    if (selectedDisplayed.length === 1) {
      const index = displayedColumns.findIndex(col => col.key === selectedDisplayed[0])
      if (index > 0) {
        const newDisplayed = [...displayedColumns]
        const temp = newDisplayed[index]
        newDisplayed[index] = newDisplayed[index - 1]
        newDisplayed[index - 1] = temp
        setDisplayedColumns(newDisplayed)
      }
    }
  }

  const moveDown = () => {
    if (selectedDisplayed.length === 1) {
      const index = displayedColumns.findIndex(col => col.key === selectedDisplayed[0])
      if (index < displayedColumns.length - 1) {
        const newDisplayed = [...displayedColumns]
        const temp = newDisplayed[index]
        newDisplayed[index] = newDisplayed[index + 1]
        newDisplayed[index + 1] = temp
        setDisplayedColumns(newDisplayed)
      }
    }
  }

  const apply = () => {
    // Apply column visibility changes to the table
    displayedColumns.forEach(col => onColumnToggle(col.key, true))
    availableColumns.forEach(col => onColumnToggle(col.key, false))
    setOpen(false)
  }

  const cancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 w-10 p-0 bg-[#9234ea] text-white border-[#9234ea] hover:bg-[#9234ea]/90" title="Columns">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="4" height="4" />
            <rect x="6" y="1" width="4" height="4" />
            <rect x="11" y="1" width="4" height="4" />
            <rect x="1" y="6" width="4" height="4" />
            <rect x="6" y="6" width="4" height="4" />
            <rect x="11" y="6" width="4" height="4" />
            <rect x="1" y="12" width="4" height="4" />
            <rect x="6" y="12" width="4" height="4" />
            <rect x="11" y="12" width="4" height="4" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">Select Displayed Columns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Column Lists */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Available Columns */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Available Columns</h3>
              <div className="border rounded h-40 overflow-y-auto bg-white" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9333ea #f3f4f6'
              }}>
                <div className="p-2 space-y-1">
                  {availableColumns.map((column) => (
                    <div
                      key={column.key}
                      className={`px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedAvailable.includes(column.key)
                          ? 'bg-[#9234ea]/10 border border-[#9234ea]/30'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedAvailable.includes(column.key)) {
                          setSelectedAvailable(selectedAvailable.filter(id => id !== column.key))
                        } else {
                          setSelectedAvailable([...selectedAvailable, column.key])
                        }
                      }}
                    >
                      {column.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Move Buttons */}
            <div className="flex flex-col items-center justify-center space-y-2 mt-20">
              <Button
                variant="outline"
                size="sm"
                onClick={moveToDisplayed}
                disabled={selectedAvailable.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
              >
                <ArrowRight className="h-4 w-4 text-[#9234ea]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveToAvailable}
                disabled={selectedDisplayed.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
              >
                <ArrowLeft className="h-4 w-4 text-[#9234ea]" />
              </Button>
            </div>

            {/* Displayed Columns */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Displayed Columns</h3>
              <div className="border rounded h-40 overflow-y-auto bg-white" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9333ea #f3f4f6'
              }}>
                <div className="p-2 space-y-1">
                  {displayedColumns.map((column) => (
                    <div
                      key={column.key}
                      className={`px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedDisplayed.includes(column.key)
                          ? 'bg-[#9234ea]/10 border border-[#9234ea]/30'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedDisplayed.includes(column.key)) {
                          setSelectedDisplayed(selectedDisplayed.filter(id => id !== column.key))
                        } else {
                          setSelectedDisplayed([column.key])
                        }
                      }}
                    >
                      {column.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reorder Buttons */}
          <div className="grid grid-cols-[1fr_auto_1fr]">
            <div></div>
            <div></div>
            <div className="flex justify-start space-x-2 ml-10">
              <Button
                variant="outline"
                size="sm"
                onClick={moveUp}
                disabled={selectedDisplayed.length !== 1 || displayedColumns.findIndex(col => col.key === selectedDisplayed[0]) === 0}
                className="w-10 h-8 p-0 bg-gray-100 hover:bg-gray-200"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveDown}
                disabled={selectedDisplayed.length !== 1 || displayedColumns.findIndex(col => col.key === selectedDisplayed[0]) === displayedColumns.length - 1}
                className="w-10 h-8 p-0 bg-gray-100 hover:bg-gray-200"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={apply}
              className="w-12 h-10 p-0 bg-[#9234ea] hover:bg-[#9234ea]/90 text-white"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={cancel} className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}