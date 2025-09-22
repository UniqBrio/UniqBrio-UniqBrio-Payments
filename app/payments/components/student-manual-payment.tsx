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
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration" | "confirmationFee")[] // Multiple payment types
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
        paymentTypes: payload.paymentTypes,
      })}
      prefillAmount={student.balancePayment > 0 ? student.balancePayment : undefined}
      studentInfo={{
        id: student.id,
        name: student.name,
        balancePayment: student.balancePayment,
        courseType: student.courseType ?? '-',
        category: student.category ?? '-',
        activity: student.activity ?? '-',
        registrationFees: student.registrationFees,
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

export type ManualPaymentPayload = {
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" |"QR" ;
  notes?: string
  receiverName: string
  receiverId: string
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration" | "confirmationFee")[]
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
  studentInfo?: { id: string; name: string; balancePayment?: number; courseType?: string; category?: string; activity?: string; registrationFees?: any }
}) {
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<ManualPaymentPayload["mode"]>(defaultMode)
  const [notes, setNotes] = useState<string>("")
  const [paymentTypes, setPaymentTypes] = useState<ManualPaymentPayload["paymentTypes"]>(["course"])
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverId, setReceiverId] = useState<string>("");

  // Check if registration fees are already paid
  const isRegistrationPaid = studentInfo?.registrationFees?.paid;
  
  // Get available payment options based on registration status
  const getAvailablePaymentOptions = () => {
    const options = [
      { value: "course", label: "Course Payment", amount: studentInfo?.balancePayment || 0 }
    ];
    
    if (!isRegistrationPaid && studentInfo?.registrationFees) {
      if (studentInfo.registrationFees.studentRegistration) {
        options.push({
          value: "studentRegistration",
          label: "Student Registration Fee",
          amount: studentInfo.registrationFees.studentRegistration
        });
      }
      if (studentInfo.registrationFees.courseRegistration) {
        options.push({
          value: "courseRegistration", 
          label: "Course Registration Fee",
          amount: studentInfo.registrationFees.courseRegistration
        });
      }
      if (studentInfo.registrationFees.confirmationFee) {
        options.push({
          value: "confirmationFee",
          label: "Advance/Confirmation Fee", 
          amount: studentInfo.registrationFees.confirmationFee
        });
      }
    }
    
    return options;
  };

  // Auto-fill amount based on selected payment types when dialog opens
  useEffect(() => {
    if (open && studentInfo) {
      // If registration is already paid, default to course payment only
      if (isRegistrationPaid) {
        setPaymentTypes(["course"]);
        setAmount((studentInfo.balancePayment || 0).toString());
      } else {
        // Reset to course payment by default
        setPaymentTypes(["course"]);
        setAmount((studentInfo.balancePayment || 0).toString());
      }
    }
  }, [open, studentInfo, isRegistrationPaid]);

  // Calculate total amount when payment types change
  useEffect(() => {
    if (studentInfo) {
      let totalAmount = 0;
      const options = getAvailablePaymentOptions();
      
      paymentTypes.forEach(type => {
        const option = options.find(opt => opt.value === type);
        if (option) {
          totalAmount += option.amount;
        }
      });
      
      setAmount(totalAmount.toString());
    }
  }, [paymentTypes, studentInfo]);


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
      paymentTypes,
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
              
              {studentInfo.registrationFees && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-medium">Registration Fees:</p>
                  {studentInfo.registrationFees.studentRegistration && (
                    <p><strong>Student Reg:</strong> ₹{studentInfo.registrationFees.studentRegistration.toLocaleString()}</p>
                  )}
                  {studentInfo.registrationFees.courseRegistration && (
                    <p><strong>Course Reg:</strong> ₹{studentInfo.registrationFees.courseRegistration.toLocaleString()}</p>
                  )}
                  {studentInfo.registrationFees.confirmationFee && (
                    <p><strong>Advance Fee:</strong> ₹{studentInfo.registrationFees.confirmationFee.toLocaleString()}</p>
                  )}
                  <p><strong>Status:</strong> {studentInfo.registrationFees.paid ? "✔ Paid" : "Pending"}</p>
                </div>
              )}
              
              <p><strong>Payment Receiver Name:</strong> {receiverName || '-'}</p>
              <p><strong>Payment Receiver ID:</strong> {receiverId || '-'}</p>
            </div>
          )}
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {!isRegistrationPaid && getAvailablePaymentOptions().length > 1 && (
            <div className="grid gap-2">
              <RequiredLabel>Payment Types (Select Multiple)</RequiredLabel>
              <div className="border rounded-md p-3 space-y-2 bg-white">
                {getAvailablePaymentOptions().map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paymentTypes.includes(option.value as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentTypes([...paymentTypes, option.value as any]);
                        } else {
                          setPaymentTypes(paymentTypes.filter(type => type !== option.value));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{option.label}</span>
                    <span className="text-gray-500 ml-auto">₹{option.amount.toLocaleString()}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                Select multiple payment types to pay together. Amount will be calculated automatically.
              </p>
            </div>
          )}
          
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
          <Button onClick={handleSubmit} className="bg-[#9234ea] hover:bg-[#9234ea]/90">Save payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}