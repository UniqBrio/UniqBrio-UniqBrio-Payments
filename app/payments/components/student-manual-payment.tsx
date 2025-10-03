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
  receivedByName: string
  receivedByRole: "instructor" | "non-instructor" | "admin" | "superadmin"
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration")[] // Multiple payment types
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
        receivedByName: payload.receivedByName,
        receivedByRole: payload.receivedByRole,
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
        program: student.program ?? '-',
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
  receivedByName: string
  receivedByRole: "instructor" | "non-instructor" | "admin" | "superadmin"
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration")[]
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
  studentInfo?: { id: string; name: string; balancePayment?: number; courseType?: string; category?: string; activity?: string; program?: string; registrationFees?: any }
}) {
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<ManualPaymentPayload["mode"]>(defaultMode)
  const [notes, setNotes] = useState<string>("")
  const [paymentTypes, setPaymentTypes] = useState<ManualPaymentPayload["paymentTypes"]>(["course"])
  const [receivedByName, setReceivedByName] = useState<string>("")
  const [receivedByRole, setReceivedByRole] = useState<ManualPaymentPayload["receivedByRole"]>("instructor")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  // Removed receiverName and receiverId state
  
  // Validation states for progressive form
  const [amountTouched, setAmountTouched] = useState(false)
  const [dateTouched, setDateTouched] = useState(false)
  const [modeTouched, setModeTouched] = useState(false)
  const [receivedByNameTouched, setReceivedByNameTouched] = useState(false)
  const [receivedByRoleTouched, setReceivedByRoleTouched] = useState(false)
  
  // Validation helpers
  const isAmountValid = amount.trim() !== "" && parseFloat(amount) > 0
  const isDateValid = date.trim() !== ""
  const isModeValid = mode !== ""
  const isReceivedByNameValid = receivedByName.trim() !== ""
  const isReceivedByRoleValid = receivedByRole !== ""
  
  // Progressive validation - each field depends on previous ones being valid
  const canEnableDate = isAmountValid
  const canEnableMode = isAmountValid && isDateValid
  const canEnableReceivedByName = isAmountValid && isDateValid && isModeValid
  const canEnableReceivedByRole = isAmountValid && isDateValid && isModeValid && isReceivedByNameValid

  // Helper function to safely extract fee data from actual database values
  const getActualFeeData = (feeObj: any) => {
    if (!feeObj) return null;
    // If it's already in the correct format with amount property
    if (typeof feeObj === 'object' && feeObj.hasOwnProperty('amount')) {
      return {
        amount: typeof feeObj.amount === 'number' ? feeObj.amount : null,
        paid: Boolean(feeObj.paid)
      };
    }
    // If it's a direct number (actual amount from database)
    if (typeof feeObj === 'number') {
      return { amount: feeObj, paid: false };
    }
    // For other objects, try to extract meaningful data
    if (typeof feeObj === 'object') {
      const amount = feeObj.value || feeObj.fee || feeObj.cost || null;
      if (amount && typeof amount === 'number') {
        return { amount: amount, paid: Boolean(feeObj.paid) };
      }
    }
    return null; // Don't show if we can't determine the structure
  };

  // Check if registration fees are already paid
  const isRegistrationPaid = studentInfo?.registrationFees?.overall?.paid;
  
  // Get available payment options
  const getAvailablePaymentOptions = () => {
    const courseBalance = studentInfo?.balancePayment || 0;
    const options = [
      { value: "course", label: "Course Payment", amount: courseBalance, paid: courseBalance <= 0 }
    ];
    // Show registration fee options only if they exist in actual data
    if (studentInfo?.registrationFees) {
      if (studentInfo.registrationFees.studentRegistration) {
        const studentRegData = getActualFeeData(studentInfo.registrationFees.studentRegistration);
        if (studentRegData && studentRegData.amount !== null) {
          options.push({
            value: "studentRegistration",
            label: "Student Registration Fee",
            amount: studentRegData.amount,
            paid: studentRegData.paid
          });
        }
      }
      if (studentInfo.registrationFees.courseRegistration) {
        const courseRegData = getActualFeeData(studentInfo.registrationFees.courseRegistration);
        if (courseRegData && courseRegData.amount !== null) {
          options.push({
            value: "courseRegistration", 
            label: "Course Registration Fee",
            amount: courseRegData.amount,
            paid: courseRegData.paid
          });
        }
      }
    }
    return options;
  };

  // Auto-fill amount based on selected payment types when dialog opens
  useEffect(() => {
    if (open && studentInfo) {
      // Only set initial values when dialog first opens, not on every change
      // Start with course payment if there's a balance, otherwise start with available unpaid registration fees
      const options = getAvailablePaymentOptions();
      const unpaidOptions = options.filter(opt => !opt.paid);
      
      if (unpaidOptions.length > 0) {
        // Default to course payment if available and has balance, otherwise first unpaid option
        const courseOption = unpaidOptions.find(opt => opt.value === "course");
        const defaultType = (courseOption && courseOption.amount > 0) ? "course" : unpaidOptions[0].value;
        setPaymentTypes([defaultType as any]);
        
        // Set amount based on selected default type
        const selectedOption = options.find(opt => opt.value === defaultType);
        setAmount((selectedOption?.amount || 0).toString());
      } else {
        setPaymentTypes([]);
        setAmount("0");
      }
    } else if (!open) {
      // Reset when dialog closes
      setPaymentTypes([]);
      setAmount("");
      setNotes("");
      setReceivedByName("");
      setReceivedByRole("instructor");
    }
  }, [open]); // Remove studentInfo from dependency array

  // Calculate total amount when payment types change
  useEffect(() => {
    if (studentInfo) {
      let totalAmount = 0;
      const options = getAvailablePaymentOptions();
      
      paymentTypes.forEach(type => {
        const option = options.find(opt => opt.value === type);
        if (option && !option.paid) { // Only include unpaid fees in calculation
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
      !receivedByName.trim() ||
      !receivedByRole
    ) {
      toast({
        title: "Required fields missing",
        description: "Please fill all required fields including payment received by name and role.",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit({
      amount: value,
      date,
      mode,
      notes: notes.trim() || undefined,
      receivedByName: receivedByName.trim(),
      receivedByRole,
      paymentTypes,
    });
    
    // Show success dialog
    setSuccessMessage(`✅ Payment Saved Successfully!\nAmount: ₹${value.toLocaleString()}\nStudent: ${studentInfo?.name || 'Unknown'}`)
    setShowSuccessDialog(true)
    
    // Auto close after 1 second
    setTimeout(() => {
      setShowSuccessDialog(false)
      onClose()
    }, 1000)
    
    setAmount("");
    setNotes("");
    setReceivedByName("");
    setReceivedByRole("instructor");
    onClose();
  }

  const [file, setFile] = useState<File | undefined>(undefined);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Manual Payment</DialogTitle>
          {studentInfo && (
            <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-md">
              <p><strong>Student:</strong> {studentInfo.name || '-'}</p>
              <p><strong>ID:</strong> {studentInfo.id || '-'}</p>
              <p><strong>Course:</strong> {studentInfo.program || studentInfo.activity} {studentInfo.program && studentInfo.program !== studentInfo.activity ? `(${studentInfo.activity})` : ''}</p>
              <p><strong>Course Type:</strong> {studentInfo.courseType || '-'}</p>
              <p><strong>Category:</strong> {studentInfo.category || '-'}</p>
              <p><strong>Activity:</strong> {studentInfo.activity || '-'}</p>
              <p><strong>Program:</strong> {studentInfo.program || '-'}</p>
              <p><strong>Balance Payment:</strong> ₹{(studentInfo.balancePayment ?? 0).toLocaleString()}</p>
              {studentInfo.registrationFees && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-medium">Registration Fees:</p>
                  {studentInfo.registrationFees.studentRegistration && (() => {
                    const feeData = getActualFeeData(studentInfo.registrationFees.studentRegistration);
                    return feeData?.amount ? (
                      <p><strong>Student Reg:</strong> ₹{feeData.amount.toLocaleString()}</p>
                    ) : null;
                  })()}
                  {studentInfo.registrationFees.courseRegistration && (() => {
                    const feeData = getActualFeeData(studentInfo.registrationFees.courseRegistration);
                    return feeData?.amount ? (
                      <p><strong>Course Reg:</strong> ₹{feeData.amount.toLocaleString()}</p>
                    ) : null;
                  })()}
                  <p><strong>Status:</strong> {studentInfo.registrationFees.overall?.paid ? "✔ Paid" : "Pending"}</p>
                </div>
              )}
            </div>
          )}
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {getAvailablePaymentOptions().length > 1 && (
            <div className="grid gap-2">
              <RequiredLabel>Payment Types (Select Multiple)</RequiredLabel>
              <div className="border rounded-md p-3 space-y-2 bg-white">
                {getAvailablePaymentOptions().map((option) => {
                  // Check if this specific fee is already paid or if course balance is 0
                  const isFeePaid = (() => {
                    if (option.value === "course") return option.amount <= 0; // Disable if balance is 0 or negative
                    if (option.value === "studentRegistration") {
                      const feeData = getActualFeeData(studentInfo?.registrationFees?.studentRegistration);
                      return feeData?.paid || false;
                    }
                    if (option.value === "courseRegistration") {
                      const feeData = getActualFeeData(studentInfo?.registrationFees?.courseRegistration);
                      return feeData?.paid || false;
                    }
                    return false;
                  })();

                  const getStatusText = () => {
                    if (option.value === "course" && option.amount <= 0) {
                      return <span className="text-green-600 font-medium">(✓ Fully Paid)</span>;
                    }
                    if (isFeePaid && option.value !== "course") {
                      return <span className="text-green-600 font-medium">(✓ Paid)</span>;
                    }
                    return null;
                  };

                  return (
                    <div key={option.value} className={`flex items-center gap-2 text-sm ${isFeePaid ? 'opacity-50' : 'cursor-pointer'}`}>
                      <Checkbox
                        id={`payment-${option.value}`}
                        checked={paymentTypes.includes(option.value as any)}
                        disabled={isFeePaid}
                        onCheckedChange={(checked) => {
                          if (isFeePaid) return; // Prevent changes for paid/completed fees
                          console.log('Checkbox clicked:', option.value, 'checked:', checked);
                          const currentTypes = [...paymentTypes];
                          if (checked === true) {
                            if (!currentTypes.includes(option.value as any)) {
                              setPaymentTypes([...currentTypes, option.value as any]);
                            }
                          } else {
                            setPaymentTypes(currentTypes.filter(type => type !== option.value));
                          }
                        }}
                      />
                      <label htmlFor={`payment-${option.value}`} className={`flex-1 ${!isFeePaid ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <span>{option.label} {getStatusText()}</span>
                        <span className="text-gray-500 ml-auto">₹{option.amount.toLocaleString()}</span>
                      </label>
                    </div>
                  );
                })}
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
              type="text"
              value={amount}
              required
              onBlur={() => setAmountTouched(true)}
              onChange={(e) => {
                // Only allow numbers and decimal point
                const value = e.target.value.replace(/[^0-9.]/g, '');
                // Prevent multiple decimal points
                const parts = value.split('.');
                if (parts.length > 2) {
                  return;
                }
                setAmount(value);
              }}
              placeholder="Enter amount"
              className={`text-left ${amountTouched && !isAmountValid ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {amountTouched && !isAmountValid && (
              <span className="text-red-500 text-xs">Please enter a valid amount</span>
            )}
          </div>
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-date">Date</RequiredLabel>
            <Input 
              id="mp-date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => setDateTouched(true)}
              disabled={!canEnableDate}
              required 
              className={`${dateTouched && !isDateValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableDate ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {dateTouched && !isDateValid && (
              <span className="text-red-500 text-xs">Please select a date</span>
            )}
            {!canEnableDate && (
              <span className="text-gray-500 text-xs">Complete the amount field first</span>
            )}
          </div>
          <div className="grid gap-1">
            <RequiredLabel>Mode</RequiredLabel>
            <Select 
              value={mode} 
              onValueChange={(v) => {
                setMode(v as ManualPaymentPayload["mode"]);
                setModeTouched(true);
              }} 
              required
              disabled={!canEnableMode}
            >
              <SelectTrigger className={`${modeTouched && !isModeValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
            {modeTouched && !isModeValid && (
              <span className="text-red-500 text-xs">Please select a payment mode</span>
            )}
            {!canEnableMode && (
              <span className="text-gray-500 text-xs">Complete the amount and date fields first</span>
            )}
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
          <RequiredLabel htmlFor="mp-received-by-name">Payment Received By (Name)</RequiredLabel>
          <Input
            id="mp-received-by-name"
            type="text"
            value={receivedByName}
            required
            onBlur={() => setReceivedByNameTouched(true)}
            onChange={(e) => setReceivedByName(e.target.value)}
            disabled={!canEnableReceivedByName}
            placeholder="Enter name of person receiving payment"
            className={`${receivedByNameTouched && !isReceivedByNameValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableReceivedByName ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {receivedByNameTouched && !isReceivedByNameValid && (
            <span className="text-red-500 text-xs">Please enter the receiver's name</span>
          )}
          {!canEnableReceivedByName && (
            <span className="text-gray-500 text-xs">Complete the amount, date, and mode fields first</span>
          )}
        </div>
        
        <div className="grid gap-1">
          <RequiredLabel>Role</RequiredLabel>
          <Select 
            value={receivedByRole} 
            onValueChange={(v) => {
              setReceivedByRole(v as ManualPaymentPayload["receivedByRole"]);
              setReceivedByRoleTouched(true);
            }} 
            required
            disabled={!canEnableReceivedByRole}
          >
            <SelectTrigger className={`${receivedByRoleTouched && !isReceivedByRoleValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableReceivedByRole ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="non-instructor">Non-Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          {receivedByRoleTouched && !isReceivedByRoleValid && (
            <span className="text-red-500 text-xs">Please select a role</span>
          )}
          {!canEnableReceivedByRole && (
            <span className="text-gray-500 text-xs">Complete all previous fields first</span>
          )}
        </div>
        
       
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isAmountValid || !isDateValid || !isModeValid || !isReceivedByNameValid || !isReceivedByRoleValid}
            className="bg-[#9234ea] hover:bg-[#9234ea]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#9234ea]">
              ✅ Success
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm whitespace-pre-line">{successMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            {/* Auto-closes, no manual OK button needed */}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}