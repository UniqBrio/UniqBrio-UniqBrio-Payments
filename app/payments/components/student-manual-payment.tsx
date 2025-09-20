"use client";
import React from "react";
// Reusable label with red asterisk for required fields
function RequiredLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {children}
      <span className="text-red-500 text-base leading-none">*</span>
    </Label>
  );
}
// Export a StudentManualPayment wrapper for compatibility
import type { PaymentRecord } from './payment-types'
export type StudentManualPaymentPayload = {
  studentId: string
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" | "QR"
  notes?: string
  receiverName: string
  receiverId: string
}
interface StudentManualPaymentProps {
  student: PaymentRecord
  onSubmit: (payload: StudentManualPaymentPayload) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function StudentManualPayment({ student, onSubmit, open, onOpenChange }: StudentManualPaymentProps) {
  // Pass all relevant student info for display
  return (
    <ManualPaymentDialog
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={(payload) => onSubmit({
        studentId: student.id,
        amount: payload.amount,
        date: payload.date,
        mode: payload.mode,
        notes: payload.notes,
        receiverName: payload.receiverName,
        receiverId: payload.receiverId,
      })}
      prefillAmount={student.balancePayment > 0 ? student.balancePayment : undefined}
      studentInfo={{
        id: student.id,
        name: student.name,
        balancePayment: student.balancePayment,
        courseType: student.courseType ?? '-',
        category: student.category ?? '-',
        activity: student.activity ?? '-',
      }}
    />
  )
}









import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export type ManualPaymentPayload = {
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" |"QR" ;
  notes?: string
  receiverName: string
  receiverId: string
}

export function ManualPaymentDialog({
  open,
  onClose,
  onSubmit,
  defaultMode = "Cash",
  prefillAmount,
  studentInfo,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ManualPaymentPayload) => void
  defaultMode?: ManualPaymentPayload["mode"]
  prefillAmount?: number
  studentInfo?: { id: string; name: string; balancePayment?: number; courseType?: string; category?: string; activity?: string }
}) {
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<ManualPaymentPayload["mode"]>(defaultMode)
  const [notes, setNotes] = useState<string>("")
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverId, setReceiverId] = useState<string>("");

  // Auto-fill amount with balance when dialog opens
  useEffect(() => {
    if (open) {
      // Prefer studentInfo.balancePayment, fallback to prefillAmount
      let balanceAmount = studentInfo?.balancePayment;
      if (balanceAmount === undefined && prefillAmount !== undefined) {
        balanceAmount = prefillAmount;
      }
      if (balanceAmount !== undefined) {
        setAmount(balanceAmount.toString());
      } else {
        setAmount("");
      }
    }
  }, [open, prefillAmount, studentInfo?.balancePayment]);


  const handleSubmit = () => {
    // Always use the user input from the amount field, not the balance amount
    const value = parseFloat(amount);
    
    // Validation for required fields
    if (
      isNaN(value) || value <= 0 ||
      !date ||
      !mode ||
      !receiverName.trim() ||
      !receiverId.trim()
    ) {
      toast({
        title: "Required fields missing",
        description: "Please fill all required fields and ensure amount is greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit({
      amount: value,
      date,
      mode,
      notes: notes.trim() || undefined,
      receiverName: receiverName.trim(),
      receiverId: receiverId.trim(),
    });
    
    setAmount("");
    setNotes("");
    setReceiverName("");
    setReceiverId("");
    onClose();
  }

  const [file, setFile] = useState<File | undefined>(undefined);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Manual Payment</DialogTitle>
          {studentInfo && (
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-md">
              <p><strong>Student:</strong> {studentInfo.name || '-'}</p>
              <p><strong>ID:</strong> {studentInfo.id || '-'}</p>
              <p><strong>Course Type:</strong> {studentInfo.courseType || '-'}</p>
              <p><strong>Category:</strong> {studentInfo.category || '-'}</p>
              <p><strong>Activity:</strong> {studentInfo.activity || '-'}</p>
              <p><strong>Balance Payment:</strong> ₹{(studentInfo.balancePayment ?? 0).toLocaleString()}</p>
              <p><strong>Payment Receiver Name:</strong> {receiverName || '-'}</p>
              <p><strong>Payment Receiver ID:</strong> {receiverId || '-'}</p>
            </div>
          )}
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-amount">Payment Amount</RequiredLabel>
            <Input
              id="mp-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              required
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-date">Date</RequiredLabel>
            <Input id="mp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="grid gap-1">
            <RequiredLabel>Mode</RequiredLabel>
            <Select value={mode} onValueChange={(v) => setMode(v as ManualPaymentPayload["mode"])} required>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        {(mode === "UPI" ||mode === "QR") && (
          <div className="grid gap-1">
            <Label htmlFor="mp-file">Upload File (Reference Only)</Label>
            <Input
              id="mp-file"
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                setFile(files && files.length > 0 ? files[0] : undefined);
              }}
            />
            <span className="text-xs text-gray-500">Upload payment screenshot or receipt for reference (optional).</span>
          </div>
        )}
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-receiver-name">Payment Receiver Name</RequiredLabel>
            <Input
              id="mp-receiver-name"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Enter receiver name"
              required
            />
          </div>
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-receiver-id">Payment Receiver ID</RequiredLabel>
            <Input
              id="mp-receiver-id"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Enter receiver ID"
              required
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}