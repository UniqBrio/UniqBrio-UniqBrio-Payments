"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, X, Save, ChevronsRight, ChevronsLeft, ChevronUp, ChevronDown } from "lucide-react"

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
  // Keyboard navigation state
  const [focusedList, setFocusedList] = useState<'available' | 'displayed'>('available')
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  // Keyboard focus indices
  const [focusAvailable, setFocusAvailable] = useState<number | null>(null)
  const [focusDisplayed, setFocusDisplayed] = useState<number | null>(null)
  
  // Refs for focus management
  const availableListRef = useRef<HTMLDivElement>(null)
  const displayedListRef = useRef<HTMLDivElement>(null)
  
  // Initialize columns when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setAvailableColumns(columns.filter(col => !col.visible))
      setDisplayedColumns(columns.filter(col => col.visible))
      setSelectedAvailable([])
      setSelectedDisplayed([])
      setFocusedList('available')
      setFocusedIndex(0)
      // Focus on available list after a short delay
      setTimeout(() => availableListRef.current?.focus(), 100)
    }
  }
  
  // Helper functions for keyboard shortcuts
  const selectAllAvailable = () => setSelectedAvailable(availableColumns.map(col => col.key))
  const clearAvailableSelection = () => setSelectedAvailable([])
  const selectAllDisplayed = () => setSelectedDisplayed(displayedColumns.map(col => col.key))
  const clearDisplayedSelection = () => setSelectedDisplayed([])
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

  const reset = () => {
    // Reset to show all columns
    const allColumns = columns.map(col => ({ ...col, visible: true }))
    setDisplayedColumns(allColumns)
    setAvailableColumns([])
    setSelectedAvailable([])
    setSelectedDisplayed([])
  }

  // Comprehensive keyboard shortcuts
  useEffect(() => {
    if (!open) return
    
    const handler = (e: KeyboardEvent) => {
      const currentList = focusedList === 'available' ? availableColumns : displayedColumns
      const currentSelected = focusedList === 'available' ? selectedAvailable : selectedDisplayed
      const setCurrentSelected = focusedList === 'available' ? setSelectedAvailable : setSelectedDisplayed

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          if (e.shiftKey) {
            const nextIdx = Math.min(focusedIndex + 1, currentList.length - 1)
            setFocusedIndex(nextIdx)
            const item = currentList[nextIdx]
            if (item && !currentSelected.includes(item.key)) {
              setCurrentSelected(prev => [...prev, item.key])
            }
          } else {
            setFocusedIndex(Math.min(focusedIndex + 1, currentList.length - 1))
          }
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          if (e.shiftKey) {
            const prevIdx = Math.max(focusedIndex - 1, 0)
            setFocusedIndex(prevIdx)
            const item = currentList[prevIdx]
            if (item && !currentSelected.includes(item.key)) {
              setCurrentSelected(prev => [...prev, item.key])
            }
          } else {
            setFocusedIndex(Math.max(focusedIndex - 1, 0))
          }
          break
        }
        case ' ':
        case 'Enter': {
          e.preventDefault()
          if (focusedIndex < currentList.length) {
            const item = currentList[focusedIndex]
            setCurrentSelected(prev => 
              prev.includes(item.key) 
                ? prev.filter(v => v !== item.key) 
                : [...prev, item.key]
            )
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          if (focusedList === 'available') {
            setFocusedList('displayed')
            setFocusedIndex(0)
            displayedListRef.current?.focus()
          } else {
            setFocusedList('available')
            setFocusedIndex(0)
            availableListRef.current?.focus()
          }
          break
        }
        case 'a':
        case 'A': {
          if (e.ctrlKey) {
            e.preventDefault()
            focusedList === 'available' ? selectAllAvailable() : selectAllDisplayed()
          }
          break
        }
        case 'd':
        case 'D': {
          if (e.ctrlKey) {
            e.preventDefault()
            focusedList === 'available' ? clearAvailableSelection() : clearDisplayedSelection()
          }
          break
        }
        case 'ArrowRight': {
          if (focusedList === 'available' && selectedAvailable.length) {
            e.preventDefault()
            moveToDisplayed()
          }
          break
        }
        case 'ArrowLeft': {
          if (focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveToAvailable()
          }
          break
        }
        case 'PageUp': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveUp()
          }
          break
        }
        case 'PageDown': {
          if (e.ctrlKey && focusedList === 'displayed' && selectedDisplayed.length) {
            e.preventDefault()
            moveDown()
          }
          break
        }
        case 's':
        case 'S': {
          if (e.ctrlKey) {
            e.preventDefault()
            apply()
          }
          break
        }
        case 'r':
        case 'R': {
          if (e.ctrlKey) {
            e.preventDefault()
            reset()
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(currentList.length - 1)
          break
        }
        case 'Escape': {
          e.preventDefault()
          setOpen(false)
          break
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, focusedList, focusedIndex, availableColumns, displayedColumns, selectedAvailable, selectedDisplayed])

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
          <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs font-semibold mb-2 text-gray-800">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">↑↓</kbd> Navigate</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Shift+↑↓</kbd> Multi-select</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Space/Enter</kbd> Toggle</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Tab</kbd> Switch list</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+A</kbd> Select all</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+D</kbd> Deselect all</div>
              
              
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+S</kbd> Save</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Ctrl+R</kbd> Reset</div>
              <div><kbd className="px-1 py-0.5 bg-white border rounded text-gray-700">Escape</kbd> Close</div>
            </div>
          </div>
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
                ref={availableListRef}
                className={`border rounded h-60 overflow-y-auto bg-white outline-none custom-scroll ${
                  focusedList === 'available' ? 'border-purple-300 ring-1 ring-purple-200' : ''
                }`}
                aria-label="Available columns"
                tabIndex={focusedList === 'available' ? 0 : -1}
                onFocus={() => setFocusedList('available')}
                onClick={() => { 
                  setFocusedList('available')
                  if (focusAvailable === null && availableColumns.length > 0) setFocusAvailable(0) 
                }}
              >
                <div className="p-2 space-y-1">
                  {availableColumns.map((column, idx) => {
                    const selected = selectedAvailable.includes(column.key)
                    const focused = focusedList === 'available' && focusedIndex === idx
                    return (
                      <label
                        key={column.key}
                        className={`flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors border cursor-pointer select-none
                          ${selected ? 'bg-[#9234ea]/10 border-[#9234ea]/30' : 'border-transparent hover:bg-gray-50'}
                          ${focused ? 'bg-purple-100 border border-purple-300' : ''}`}
                        onClick={() => { 
                          setFocusedList('available')
                          setFocusedIndex(idx)
                          availableListRef.current?.focus()
                        }}
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
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Displayed Columns</h3>
              </div>
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
                ref={displayedListRef}
                className={`border rounded h-60 overflow-y-auto bg-white outline-none custom-scroll ${
                  focusedList === 'displayed' ? 'border-purple-300 ring-1 ring-purple-200' : ''
                }`}
                aria-label="Displayed columns"
                tabIndex={focusedList === 'displayed' ? 0 : -1}
                onFocus={() => setFocusedList('displayed')}
                onClick={() => { 
                  setFocusedList('displayed')
                  if (focusDisplayed === null && displayedColumns.length > 0) setFocusDisplayed(0) 
                }}
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
                          ${focusedList === 'displayed' && focusedIndex === idx ? 'bg-purple-100 border border-purple-300' : ''}`}
                        onClick={() => { 
                          setFocusedList('displayed')
                          setFocusedIndex(idx)
                          displayedListRef.current?.focus()
                        }}
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
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
            <div></div>
            <div></div>
            <div className="flex justify-start space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={moveUp}
                disabled={selectedDisplayed.length === 0}
                className={`w-10 h-8 p-0 ${
                  selectedDisplayed.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="Move Up (Ctrl+PgUp)"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={moveDown}
                disabled={selectedDisplayed.length === 0}
                className={`w-10 h-8 p-0 ${
                  selectedDisplayed.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="Move Down (Ctrl+PgDn)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              onClick={apply}
              className="w-12 h-10 p-0 bg-[#9234ea] hover:bg-[#9234ea]/90 text-white"
              title="Save (Ctrl+S)"
              aria-label="Save"
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={reset}
              className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50"
              title="Reset (Ctrl+R)"
              aria-label="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={cancel} 
              className="w-12 h-10 p-0 border-gray-300 hover:bg-gray-50" 
              title="Close (Escape)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}