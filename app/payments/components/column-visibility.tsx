"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, X, Save } from "lucide-react"

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

  // Move all selected displayed columns up as a block, preserving order
  const moveUp = () => {
    if (selectedDisplayed.length === 0) return;
    const indices = displayedColumns
      .map((col, idx) => selectedDisplayed.includes(col.key) ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b);
    if (indices.length === 0 || indices[0] === 0) return; // can't move if topmost is already at top
    const newDisplayed = [...displayedColumns];
    for (let i = 0; i < newDisplayed.length; i++) {
      // For each selected index, swap with the one above if not already at top or above another selected
      if (indices.includes(i) && !indices.includes(i - 1) && i > 0) {
        const temp = newDisplayed[i - 1];
        newDisplayed[i - 1] = newDisplayed[i];
        newDisplayed[i] = temp;
      }
    }
    setDisplayedColumns(newDisplayed);
  }

  // Move all selected displayed columns down as a block, preserving order
  const moveDown = () => {
    if (selectedDisplayed.length === 0) return;
    const indices = displayedColumns
      .map((col, idx) => selectedDisplayed.includes(col.key) ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => b - a); // reverse order for down
    if (indices.length === 0 || indices[0] === displayedColumns.length - 1) return; // can't move if bottommost is at bottom
    const newDisplayed = [...displayedColumns];
    for (let i = newDisplayed.length - 1; i >= 0; i--) {
      if (indices.includes(i) && !indices.includes(i + 1) && i < newDisplayed.length - 1) {
        const temp = newDisplayed[i + 1];
        newDisplayed[i + 1] = newDisplayed[i];
        newDisplayed[i] = temp;
      }
    }
    setDisplayedColumns(newDisplayed);
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
        <Button variant="outline" size="sm" className="h-10 w-10 p-0 bg-[#ede9fe] text-[#9333ea] border-[#a78bfa] hover:bg-[#c4b5fd]/60" title="Display columns">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="10" y="4" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="16" y="4" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="4" y="10" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="10" y="10" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="16" y="10" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="4" y="16" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="10" y="16" width="4" height="4" rx="1.5" fill="#a78bfa" />
            <rect x="16" y="16" width="4" height="4" rx="1.5" fill="#a78bfa" />
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
              <div className="flex gap-2 mb-2">
                <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Select all available columns">
                  <input
                    type="checkbox"
                    checked={selectedAvailable.length === availableColumns.length && availableColumns.length > 0}
                    onChange={e => setSelectedAvailable(e.target.checked ? availableColumns.map(col => col.key) : [])}
                  />
                  Select All
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Deselect all available columns">
                  <input
                    type="checkbox"
                    checked={selectedAvailable.length === 0}
                    onChange={e => setSelectedAvailable([])}
                  />
                  Deselect All
                </label>
              </div>
              <div className="border rounded h-40 overflow-y-auto bg-white" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9333ea #f3f4f6'
              }}>
                <div className="p-2 space-y-1">
                  {availableColumns.map((column) => (
                    <div
                      key={column.key}
                      className={`flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedAvailable.includes(column.key)
                          ? 'bg-[#9234ea]/10 border border-[#9234ea]/30'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedAvailable.includes(column.key)) {
                          setSelectedAvailable(selectedAvailable.filter(id => id !== column.key))
                        } else {
                          setSelectedAvailable([...selectedAvailable, column.key]);
                          setSelectedDisplayed([]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAvailable.includes(column.key)}
                        onChange={() => {
                          if (selectedAvailable.includes(column.key)) {
                            setSelectedAvailable(selectedAvailable.filter(id => id !== column.key))
                          } else {
                            setSelectedAvailable([...selectedAvailable, column.key]);
                            setSelectedDisplayed([]);
                          }
                        }}
                        className="accent-[#9234ea]"
                        title={column.label}
                        onClick={e => e.stopPropagation()}
                      />
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
              <div className="flex gap-2 mb-2">
                <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Select all displayed columns">
                  <input
                    type="checkbox"
                    checked={selectedDisplayed.length === displayedColumns.length && displayedColumns.length > 0}
                    onChange={e => setSelectedDisplayed(e.target.checked ? displayedColumns.map(col => col.key) : [])}
                  />
                  Select All
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Deselect all displayed columns">
                  <input
                    type="checkbox"
                    checked={selectedDisplayed.length === 0}
                    onChange={e => setSelectedDisplayed([])}
                  />
                  Deselect All
                </label>
              </div>
              <div className="border rounded h-40 overflow-y-auto bg-white" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9333ea #f3f4f6'
              }}>
                <div className="p-2 space-y-1">
                  {displayedColumns.map((column) => (
                    <div
                      key={column.key}
                      className={`flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer transition-colors ${
                        selectedDisplayed.includes(column.key)
                          ? 'bg-[#9234ea]/10 border border-[#9234ea]/30'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedDisplayed.includes(column.key)) {
                          setSelectedDisplayed(selectedDisplayed.filter(id => id !== column.key))
                        } else {
                          setSelectedDisplayed([...selectedDisplayed, column.key]);
                          setSelectedAvailable([]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDisplayed.includes(column.key)}
                        onChange={() => {
                          if (selectedDisplayed.includes(column.key)) {
                            setSelectedDisplayed(selectedDisplayed.filter(id => id !== column.key))
                          } else {
                            setSelectedDisplayed([...selectedDisplayed, column.key]);
                            setSelectedAvailable([]);
                          }
                        }}
                        className="accent-[#9234ea]"
                        title={column.label}
                        onClick={e => e.stopPropagation()}
                      />
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
                disabled={selectedDisplayed.length === 0 || displayedColumns.length === 0 || displayedColumns.findIndex(col => col.key === selectedDisplayed[0]) === 0}
                className="w-10 h-8 p-0 bg-gray-100 hover:bg-gray-200"
                title="Move selected up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveDown}
                disabled={selectedDisplayed.length === 0 || displayedColumns.length === 0 || displayedColumns.findIndex(col => col.key === selectedDisplayed[selectedDisplayed.length-1]) === displayedColumns.length - 1}
                className="w-10 h-8 p-0 bg-gray-100 hover:bg-gray-200"
                title="Move selected down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAvailable([])
                setSelectedDisplayed([])
              }}
              className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50"
              title="Reset all column selections"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={apply}
              className="w-12 h-10 p-0 bg-[#9234ea] hover:bg-[#9234ea]/90 text-white"
              title="Apply column changes"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={cancel} className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50" title="Close dialog">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}