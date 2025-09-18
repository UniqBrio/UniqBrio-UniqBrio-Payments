"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type ManualPaymentPayload = {
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" | "Card" |"QR" ;
  notes?: string
}

export function ManualPaymentDialog({
  open,
  onClose,
  onSubmit,
  defaultMode = "Cash",
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ManualPaymentPayload) => void
  defaultMode?: ManualPaymentPayload["mode"]
}) {
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<ManualPaymentPayload["mode"]>(defaultMode)
  const [notes, setNotes] = useState<string>("")

  // Debug logging
  console.log('ManualPaymentDialog render - open:', open)

  const handleSubmit = () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    onSubmit({ amount: value, date, mode, notes: notes.trim() || undefined })
    // reset minimal
    setAmount("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Manual Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="mp-amount">Amount</Label>
            <Input
              id="mp-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="mp-date">Date</Label>
            <Input id="mp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as ManualPaymentPayload["mode"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="mp-notes">Notes (optional)</Label>
            <Input id="mp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reference, remarks" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}