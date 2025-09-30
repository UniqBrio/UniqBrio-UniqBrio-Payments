"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, X, Save, ChevronsRight, ChevronsLeft } from "lucide-react"

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
  // Keyboard focus indices
  const [focusAvailable, setFocusAvailable] = useState<number | null>(null)
  const [focusDisplayed, setFocusDisplayed] = useState<number | null>(null)
  
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
    setFocusAvailable(null)
  }

  const moveToAvailable = () => {
    const toMove = displayedColumns.filter(col => selectedDisplayed.includes(col.key))
    setAvailableColumns([...availableColumns, ...toMove])
    setDisplayedColumns(displayedColumns.filter(col => !selectedDisplayed.includes(col.key)))
    setSelectedDisplayed([])
    setFocusDisplayed(null)
  }

  const moveAllToDisplayed = () => {
    if (availableColumns.length === 0) return
    setDisplayedColumns([...displayedColumns, ...availableColumns])
    setAvailableColumns([])
    setSelectedAvailable([])
    setFocusAvailable(null)
  }

  const moveAllToAvailable = () => {
    if (displayedColumns.length === 0) return
    setAvailableColumns([...availableColumns, ...displayedColumns])
    setDisplayedColumns([])
    setSelectedDisplayed([])
    setFocusDisplayed(null)
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
      <button 
        className="ml-4 px-3 py-2 bg-purple-100 text-purple-700 rounded border border-purple-300 hover:bg-purple-200 flex items-center justify-center" 
        title="Displayed Columns"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="10" y="3" width="5" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="17" y="3" width="4" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="3" y="10" width="5" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="10" y="10" width="5" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="17" y="10" width="4" height="5" rx="1.5" fill="#7C3AED"></rect>
          <rect x="3" y="17" width="5" height="4" rx="1.5" fill="#7C3AED"></rect>
          <rect x="10" y="17" width="5" height="4" rx="1.5" fill="#7C3AED"></rect>
          <rect x="17" y="17" width="4" height="4" rx="1.5" fill="#7C3AED"></rect>
        </svg>
      </button>
      </DialogTrigger>
  <DialogContent className="sm:max-w-[820px] w-full">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Select Displayed Columns</DialogTitle>
          <p className="text-xs leading-relaxed text-gray-500 mt-1">Use arrow keys to navigate, Shift+Arrows to multi-select, Space/Enter to toggle, Tab to switch lists, buttons or Enter on buttons to move.</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Column Lists */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Available Columns */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Available Columns</h3>
              <div className="flex gap-2 mb-2">
                {/* <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Select all available columns">
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
                </label> */}
              </div>
              <div
                className="border rounded h-60 overflow-y-auto bg-white outline-none custom-scroll"
                aria-label="Available columns"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (availableColumns.length === 0) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setFocusAvailable(prev => {
                      const next = prev === null ? 0 : Math.min(prev + 1, availableColumns.length - 1)
                      if (e.shiftKey) {
                        const key = availableColumns[next].key
                        setSelectedAvailable(sel => sel.includes(key) ? sel : [...sel, key])
                      }
                      return next
                    })
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setFocusAvailable(prev => {
                      const next = prev === null ? 0 : Math.max(prev - 1, 0)
                      if (e.shiftKey) {
                        const key = availableColumns[next].key
                        setSelectedAvailable(sel => sel.includes(key) ? sel : [...sel, key])
                      }
                      return next
                    })
                  } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    setFocusAvailable(prev => {
                      const idx = prev ?? 0
                      const key = availableColumns[idx].key
                      setSelectedAvailable(sel => sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key])
                      return idx
                    })
                  } else if (e.key === 'Tab') {
                    // allow normal tab switching
                  }
                }}
                onClick={() => { if (focusAvailable === null && availableColumns.length>0) setFocusAvailable(0) }}
              >
                <div className="p-2 space-y-1">
                  {availableColumns.map((column, idx) => {
                    const selected = selectedAvailable.includes(column.key)
                    const focused = focusAvailable === idx
                    return (
                      <label
                        key={column.key}
                        className={`flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors border cursor-pointer select-none
                          ${selected ? 'bg-[#9234ea]/10 border-[#9234ea]/30' : 'border-transparent hover:bg-gray-50'}
                          ${focused ? 'ring-1 ring-[#9234ea]' : ''}`}
                        onMouseDown={() => setFocusAvailable(idx)}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              setSelectedAvailable(selectedAvailable.filter(id => id !== column.key))
                            } else {
                              setSelectedAvailable([...selectedAvailable, column.key])
                              setSelectedDisplayed([])
                            }
                          }}
                          className="accent-[#9234ea]"
                          aria-label={`Toggle ${column.label}`}
                        />
                        <span className="flex-1">{column.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Move Buttons */}
            <div className="flex flex-col items-center justify-center space-y-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={moveToDisplayed}
                disabled={selectedAvailable.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
                aria-label="Move selected to displayed"
              >
                <ArrowRight className="h-4 w-4 text-[#9234ea]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveAllToDisplayed}
                disabled={availableColumns.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
                aria-label="Move all to displayed"
              >
                <ChevronsRight className="h-4 w-4 text-[#9234ea]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveToAvailable}
                disabled={selectedDisplayed.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
                aria-label="Move selected to available"
              >
                <ArrowLeft className="h-4 w-4 text-[#9234ea]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveAllToAvailable}
                disabled={displayedColumns.length === 0}
                className="w-10 h-8 p-0 bg-[#9234ea]/10 hover:bg-[#9234ea]/20 border-[#9234ea]/30"
                aria-label="Move all to available"
              >
                <ChevronsLeft className="h-4 w-4 text-[#9234ea]" />
              </Button>
            </div>

            {/* Displayed Columns */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Displayed Columns</h3>
              <div className="flex gap-2 mb-2">
                {/* <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-700" title="Select all displayed columns">
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
                </label> */}
              </div>
              <div
                className="border rounded h-60 overflow-y-auto bg-white outline-none custom-scroll"
                aria-label="Displayed columns"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (displayedColumns.length === 0) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setFocusDisplayed(prev => {
                      const next = prev === null ? 0 : Math.min(prev + 1, displayedColumns.length - 1)
                      if (e.shiftKey) {
                        const key = displayedColumns[next].key
                        setSelectedDisplayed(sel => sel.includes(key) ? sel : [...sel, key])
                      }
                      return next
                    })
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setFocusDisplayed(prev => {
                      const next = prev === null ? 0 : Math.max(prev - 1, 0)
                      if (e.shiftKey) {
                        const key = displayedColumns[next].key
                        setSelectedDisplayed(sel => sel.includes(key) ? sel : [...sel, key])
                      }
                      return next
                    })
                  } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    setFocusDisplayed(prev => {
                      const idx = prev ?? 0
                      const key = displayedColumns[idx].key
                      setSelectedDisplayed(sel => sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key])
                      return idx
                    })
                  }
                }}
                onClick={() => { if (focusDisplayed === null && displayedColumns.length>0) setFocusDisplayed(0) }}
              >
                <div className="p-2 space-y-1">
                  {displayedColumns.map((column, idx) => {
                    const selected = selectedDisplayed.includes(column.key)
                    const focused = focusDisplayed === idx
                    return (
                      <label
                        key={column.key}
                        className={`flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors border cursor-pointer select-none
                          ${selected ? 'bg-[#9234ea]/10 border-[#9234ea]/30' : 'border-transparent hover:bg-gray-50'}
                          ${focused ? 'ring-1 ring-[#9234ea]' : ''}`}
                        onMouseDown={() => setFocusDisplayed(idx)}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              setSelectedDisplayed(selectedDisplayed.filter(id => id !== column.key))
                            } else {
                              setSelectedDisplayed([...selectedDisplayed, column.key])
                              setSelectedAvailable([])
                            }
                          }}
                          className="accent-[#9234ea]"
                          aria-label={`Toggle ${column.label}`}
                        />
                        <span className="flex-1">{column.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Reorder Buttons */}
          {/* <div className="grid grid-cols-[1fr_auto_1fr]">
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
          </div> */}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              onClick={apply}
              className="w-12 h-10 p-0 bg-[#9234ea] hover:bg-[#9234ea]/90 text-white"
              title="Apply column changes"
            >
              <Save className="w-4 h-4" />
            </Button>

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
            
            <Button variant="outline" onClick={cancel} className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50" title="Close dialog">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}