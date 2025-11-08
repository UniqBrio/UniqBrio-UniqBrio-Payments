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
type PaymentOption = "One time" | "Monthly" | "EMI"
export type StudentManualPaymentPayload = {
  studentId: string
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" | "Card" | "Bank Transfer"
  notes?: string
  receivedByName: string
  receivedByRole: "instructor" | "non-instructor" | "admin" | "superadmin"
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration")[] // Multiple payment types
  paymentOption?: PaymentOption
}
interface StudentManualPaymentProps {
  student: PaymentRecord
  onSubmit: (payload: StudentManualPaymentPayload) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function StudentManualPayment({ student, onSubmit, open, onOpenChange }: StudentManualPaymentProps) {
  // Determine if this is the first payment (no previous payments made)
  const isFirstPayment = student.totalPaidAmount === 0;
  
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
        paymentOption: payload.paymentOption,
      })}
      prefillAmount={student.balancePayment > 0 ? student.balancePayment : undefined}
      isFirstPayment={isFirstPayment}
      studentInfo={{
        id: student.id,
        name: student.name,
        balancePayment: student.balancePayment,
        totalPaidAmount: student.totalPaidAmount,
        courseType: student.courseType ?? '-',
        category: student.category ?? '-',
        activity: student.activity ?? '-',
        program: student.program ?? '-',
        registrationFees: student.registrationFees,
      }}
    />
  )
}









import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { formatDateToDisplay } from "@/lib/date-utils"

export type ManualPaymentPayload = {
  amount: number
  date: string // ISO date
  mode: "Cash" | "UPI" | "Card" | "Bank Transfer";
  notes?: string
  receiverName: string
  receiverId: string
  receivedByName: string
  receivedByRole: "instructor" | "non-instructor" | "admin" | "superadmin"
  paymentTypes: ("course" | "studentRegistration" | "courseRegistration")[]
  paymentOption?: PaymentOption
}

export function ManualPaymentDialog({
  open,
  onClose,
  onSubmit,
  defaultMode = "Cash",
  prefillAmount,
  studentInfo,
  isFirstPayment = true,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ManualPaymentPayload) => void
  defaultMode?: ManualPaymentPayload["mode"]
  prefillAmount?: number
  isFirstPayment?: boolean
  studentInfo?: { id: string; name: string; balancePayment?: number; totalPaidAmount?: number; courseType?: string; category?: string; activity?: string; program?: string; registrationFees?: any }
}) {
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
  const [mode, setMode] = useState<ManualPaymentPayload["mode"]>(defaultMode)
  const [notes, setNotes] = useState<string>("")
  const [paymentTypes, setPaymentTypes] = useState<ManualPaymentPayload["paymentTypes"]>(["course"])
  const [receivedByName, setReceivedByName] = useState<string>("")
  const [receivedByRole, setReceivedByRole] = useState<ManualPaymentPayload["receivedByRole"]>("instructor")
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("Monthly")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  // Removed receiverName and receiverId state
  
  // Validation states for progressive form
  const [amountTouched, setAmountTouched] = useState(false)
  const [dateTouched, setDateTouched] = useState(false)
  const [modeTouched, setModeTouched] = useState(false)
  const [receivedByNameTouched, setReceivedByNameTouched] = useState(false)
  const [receivedByRoleTouched, setReceivedByRoleTouched] = useState(false)
  const [paymentOptionTouched, setPaymentOptionTouched] = useState(false)
  
  // Calculate currently selected total based on chosen payment types (for One time mode validation)
  const selectedTotal: number = useMemo(() => {
    let total = 0;
    const options = getAvailablePaymentOptions();
    paymentTypes.forEach((type) => {
      const opt = options.find((o) => o.value === type);
      if (opt && !opt.paid && typeof opt.amount === 'number') {
        total += opt.amount;
      }
    });
    return total;
  }, [paymentTypes, studentInfo]);

  // Constants and helpers for Monthly option
  const MONTHLY_INSTALLMENT_DEFAULT = 5000;
  const getRegistrationPendingTotal = () => {
    let total = 0;
    const s = getActualFeeData(studentInfo?.registrationFees?.studentRegistration);
    const c = getActualFeeData(studentInfo?.registrationFees?.courseRegistration);
    if (s && !s.paid && typeof s.amount === 'number') total += s.amount;
    if (c && !c.paid && typeof c.amount === 'number') total += c.amount;
    return total;
  };
  const registrationPending = getRegistrationPendingTotal();
  const defaultMonthlyAmount = MONTHLY_INSTALLMENT_DEFAULT + registrationPending;

  // Validation helpers
  const enteredAmount = parseFloat(amount) || 0
  const isPaymentOptionValid = paymentOption === "One time" || paymentOption === "Monthly" || paymentOption === "EMI"
  const isAmountValid = paymentOption === "One time"
    ? (amount.trim() !== "" && enteredAmount > 0 && enteredAmount === selectedTotal)
    : (amount.trim() !== "" && enteredAmount > 0) // Monthly can be edited freely
  const isAmountMismatch = paymentOption === "One time" 
    ? (amount.trim() !== "" && enteredAmount !== selectedTotal)
    : false
  const isDateValid = date.trim() !== ""
  const isModeValid = mode && mode.length > 0
  const isReceivedByNameValid = receivedByName.trim() !== ""
  const isReceivedByRoleValid = receivedByRole && receivedByRole.length > 0
  
  // Progressive validation - each field depends on previous ones being valid
  const canEnableDate = isAmountValid
  const canEnableMode = isAmountValid && isDateValid
  const canEnableReceivedByName = isAmountValid && isDateValid && isModeValid
  const canEnableReceivedByRole = isAmountValid && isDateValid && isModeValid && isReceivedByNameValid

  // Helper function to safely extract fee data from actual database values
  function getActualFeeData(feeObj: any) {
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
  function getAvailablePaymentOptions() {
    const courseBalance = studentInfo?.balancePayment || 0;
    const options = [
      { value: "course", label: "Course Payment", amount: courseBalance, paid: courseBalance <= 0 }
    ];
    // Show registration fee options only if they exist in actual data
    if (studentInfo?.registrationFees) {
      if (studentInfo.registrationFees.studentRegistration) {
        const studentRegData = getActualFeeData(studentInfo.registrationFees.studentRegistration);
        options.push({
          value: "studentRegistration",
          label: "Student Registration Fee",
          amount: (studentRegData && studentRegData.amount !== null) ? studentRegData.amount : '-',
          paid: studentRegData ? studentRegData.paid : false
        });
      }
      if (studentInfo.registrationFees.courseRegistration) {
        const courseRegData = getActualFeeData(studentInfo.registrationFees.courseRegistration);
        options.push({
          value: "courseRegistration", 
          label: "Course Registration Fee",
          amount: (courseRegData && courseRegData.amount !== null) ? courseRegData.amount : '-',
          paid: courseRegData ? courseRegData.paid : false
        });
      }
    }
    return options;
  };

  // Initialize fields when dialog opens and reset when it closes
  useEffect(() => {
  if (open && studentInfo) {
      // Apply defaults based on current paymentOption
      const options = getAvailablePaymentOptions();
      if (paymentOption === "One time") {
        const allUnpaid = options.filter(o => !o.paid && typeof o.amount === 'number').map(o => o.value as any);
        setPaymentTypes(allUnpaid);
        const sum = options.filter(o => !o.paid && typeof o.amount === 'number').reduce((acc, o) => acc + (o.amount as number), 0);
        setAmount(sum > 0 ? String(sum) : "");
      } else if (paymentOption === "Monthly") {
        // Include course always; include registration fees only if unpaid
        const monthlyTypes = options
          .filter(o => o.value === 'course' || ((o.value === 'studentRegistration' || o.value === 'courseRegistration') && !o.paid))
          .map(o => o.value as any);
        setPaymentTypes(monthlyTypes as any);
        setAmount(defaultMonthlyAmount > 0 ? String(defaultMonthlyAmount) : "");
      }
    } else if (!open) {
      // Reset when dialog closes
      setPaymentTypes([]);
      setAmount("");
      setNotes("");
      setReceivedByName("");
      setReceivedByRole("instructor");
      setPaymentOption("Monthly");
      setPaymentOptionTouched(false);
    }
  }, [open]);

  // Recalculate when payment option changes explicitly
  useEffect(() => {
    if (!open || !studentInfo) return;
    const options = getAvailablePaymentOptions();
    if (paymentOption === "One time") {
      const allUnpaid = options.filter(o => !o.paid && typeof o.amount === 'number').map(o => o.value as any);
      setPaymentTypes(allUnpaid);
      const sum = options.filter(o => !o.paid && typeof o.amount === 'number').reduce((acc, o) => acc + (o.amount as number), 0);
      setAmount(sum > 0 ? String(sum) : "");
    } else if (paymentOption === "Monthly") {
      const monthlyTypes = options
        .filter(o => o.value === 'course' || ((o.value === 'studentRegistration' || o.value === 'courseRegistration') && !o.paid))
        .map(o => o.value as any);
      setPaymentTypes(monthlyTypes as any);
      setAmount(defaultMonthlyAmount > 0 ? String(defaultMonthlyAmount) : "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOption]);

  // Calculate/auto-fill amount when payment types change
  useEffect(() => {
    if (!studentInfo) return;
    if (paymentOption === "One time") {
      setAmount(selectedTotal > 0 ? selectedTotal.toString() : "");
    }
  }, [paymentTypes, studentInfo, selectedTotal, paymentOption]);


  const handleSubmit = () => {
    // Always use the user input from the amount field, not the balance amount
    const value = parseFloat(amount);
  const balancePayment = studentInfo?.balancePayment || 0;
    
    // Validation for required fields
    if (
      isNaN(value) || value <= 0 ||
      !date ||
      !mode || !isPaymentOptionValid ||
      !receivedByName.trim() ||
      !receivedByRole
    ) {
      toast({
        title: "Required fields missing",
        description: "Please fill all required fields including payment option, amount, date, mode, receiver name and role.",
        variant: "destructive",
      });
      return;
    }

    // For One time, amount must exactly match sum of selected payment types
    if (paymentOption === "One time" && value !== selectedTotal) {
      toast({
        title: "Amount must match selection",
        description: `Entered amount ₹${value.toLocaleString()} must equal the total of selected payment types ₹${selectedTotal.toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    // Monthly: allow edited amount even after registrations paid (no locking)
    
    onSubmit({
      amount: value,
      date,
      mode,
      notes: notes.trim() || undefined,
      receiverName: receivedByName.trim(),
      receiverId: studentInfo?.id || "",
      receivedByName: receivedByName.trim(),
      receivedByRole,
      paymentTypes,
      paymentOption,
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
    setPaymentOption("Monthly");
    onClose();
  }

  const [file, setFile] = useState<File | undefined>(undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto " onInteractOutside={(e) => e.preventDefault()}>
        {/* X icon removed as per user request */}
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
                          // Console message removed as requested
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
                Select multiple payment types to pay together. Amount is calculated automatically and must match the selected total.
              </p>
            </div>
          )}
          {/* Payment option dropdown - moved above amount and mandatory */}
          <div className="grid gap-1">
            <RequiredLabel>Payment option</RequiredLabel>
            <Select 
              value={paymentOption}
              onValueChange={(v) => { setPaymentOption(v as PaymentOption); setPaymentOptionTouched(true); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="One time">One time</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="EMI" disabled>EMI</SelectItem>
              </SelectContent>
            </Select>
            {paymentOptionTouched && !isPaymentOptionValid && (
              <span className="text-red-500 text-xs">Please select a payment option</span>
            )}
          </div>

          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-amount">
              Payment Amount 
            </RequiredLabel>
            <Input
              id="mp-amount"
              type="text"
              value={amount}
              required
              disabled={paymentOption === 'One time' ? !isFirstPayment : false}
              onBlur={() => setAmountTouched(true)}
              onChange={(e) => {
                // Only allow editing on first payment
                if (paymentOption === 'One time' && !isFirstPayment) return;
                
                // Only allow numbers and decimal point
                const value = e.target.value.replace(/[^0-9.]/g, '');
                // Prevent multiple decimal points
                const parts = value.split('.');
                if (parts.length > 2) {
                  return;
                }
                
                // Check if the entered amount exceeds the selected total of payment types
                const numericValue = parseFloat(value) || 0;
                
                // One time: cap to selected total; Monthly: free input
                if (paymentOption === 'One time' && numericValue > selectedTotal && selectedTotal > 0) {
                  setAmount(selectedTotal.toString());
                  toast({
                    title: "Amount capped to selection",
                    description: `Maximum allowed based on selected types is ₹${selectedTotal.toLocaleString()}`,
                    variant: "default",
                  });
                } else {
                  setAmount(value);
                }
              }}
              placeholder={isFirstPayment ? "Enter amount" : "Full remaining balance"}
              className={`text-left ${amountTouched && !isAmountValid ? 'border-red-500 focus:border-red-500' : ''} ${!isFirstPayment ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {amountTouched && !isAmountValid && (
              <span className="text-red-500 text-xs">
                {paymentOption === 'One time' && isAmountMismatch && selectedTotal > 0
                  ? `Amount must equal the total of selected payment types (₹${selectedTotal.toLocaleString()})`
                  : "Please enter a valid amount"}
              </span>
            )}
            {/* Helper: show selected total for clarity */}
            {paymentOption === 'One time' ? (
              <p className="text-xs text-gray-600 mt-1">Selected total: ₹{selectedTotal.toLocaleString()}</p>
            ) : (
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                <p>Default monthly total: ₹{defaultMonthlyAmount.toLocaleString()}</p>
                <p className="text-[11px] text-gray-500">Includes: Monthly installment ₹{MONTHLY_INSTALLMENT_DEFAULT.toLocaleString()} + Registration fees ₹{registrationPending.toLocaleString()} (Student ₹{(getActualFeeData(studentInfo?.registrationFees?.studentRegistration)?.paid ? 0 : (getActualFeeData(studentInfo?.registrationFees?.studentRegistration)?.amount || 0)).toLocaleString()} + Course ₹{(getActualFeeData(studentInfo?.registrationFees?.courseRegistration)?.paid ? 0 : (getActualFeeData(studentInfo?.registrationFees?.courseRegistration)?.amount || 0)).toLocaleString()})</p>
              </div>
            )}
            {/* Payment type indicator */}
            {isFirstPayment ? (
              <p className="text-xs text-green-600 mt-1">
                {paymentOption === 'Monthly' ? '✏️ You can edit the monthly amount if needed.' : '✏️ Amount auto-calculated from selected items.'}
              </p>
            ) : (
              <p className="text-xs text-blue-600 mt-1">
                {paymentOption === 'Monthly'
                  ? `✏️ Monthly default is ₹${MONTHLY_INSTALLMENT_DEFAULT.toLocaleString()} (editable).`
                  : `🔒 `}
                {paymentOption !== 'Monthly' && (<strong>Course Fee:</strong>)} {paymentOption !== 'Monthly' && ` Amount is set to full remaining balance (₹${(studentInfo?.balancePayment || 0).toLocaleString()}).`}
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <RequiredLabel htmlFor="mp-date">Date</RequiredLabel>
            <div className="relative">
              {showDatePicker ? (
                <Input 
                  id="mp-date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => {
                    setDateTouched(true);
                    setShowDatePicker(false);
                  }}
                  disabled={!canEnableDate}
                  required 
                  autoFocus
                  className={`${dateTouched && !isDateValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              ) : (
                <Input 
                  id="mp-date-display" 
                  type="text" 
                  value={date ? formatDateToDisplay(date) : ''} 
                  onFocus={() => setShowDatePicker(true)}
                  disabled={!canEnableDate}
                  readOnly
                  placeholder="Select date"
                  required 
                  className={`${dateTouched && !isDateValid ? 'border-red-500 focus:border-red-500' : ''} ${!canEnableDate ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer`}
                />
              )}
            </div>
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
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
            {modeTouched && !isModeValid && (
              <span className="text-red-500 text-xs">Please select a payment mode</span>
            )}
            {!canEnableMode && (
              <span className="text-gray-500 text-xs">Complete the amount and date fields first</span>
            )}
          </div>
        {(mode === "UPI" || mode === "Card" || mode === "Bank Transfer") && (
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