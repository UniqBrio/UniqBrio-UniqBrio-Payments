
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { StudentManualPayment, StudentManualPaymentPayload } from "./student-manual-payment"
import { PaymentRecord } from './payment-types'
import { Send, QrCode, Smartphone, Link, Edit, Save, X, CreditCard, Mail } from "lucide-react"
import { useReminderActions } from "./reminder-actions"
import { usePaymentActions } from "./payment-actions"
import { EmailPreviewDialog } from "./email-preview-dialog"
import { RegistrationFeesDisplay, calculateRegistrationStatus } from "./registration-fees-display"
import QRCodeLib from 'qrcode'

// Utility function for formatting currency
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `${formattedNumber} ${currency}`
}



// Since payment-utils is missing, let's define these functions here temporarily
const formatDate = (dateString: string | null) => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const year = date.getFullYear().toString().slice(-2)
    return `${day} ${month} ${year}`
  } catch {
    return 'Invalid'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'Pending':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'Overdue':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getCurrencyName = (currency: string) => {
  const currencyNames = { USD: "US Dollar", INR: "Indian Rupee", GBP: "British Pound", EUR: "Euro" }
  return currencyNames[currency as keyof typeof currencyNames] || "Indian Rupee"
}

interface PaymentTableRowProps {
  record: PaymentRecord
  isColumnVisible: (key: string) => boolean
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
  refreshPaymentData?: () => void
  selectable?: boolean
  selected?: boolean
  onSelectRow?: () => void
}

export function PaymentTableRow({ record, isColumnVisible, onUpdateRecord, refreshPaymentData, selectable, selected, onSelectRow }: PaymentTableRowProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)
  const [qrCodeOpen, setQrCodeOpen] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string>('')

  // Calculate dynamic payment status based on both course balance and registration fees
  const calculateDynamicStatus = (): "Paid" | "Pending" => {
    const courseFullyPaid = record.balancePayment <= 0;
    const registrationStatus = calculateRegistrationStatus(record.registrationFees);
    
    // If course is fully paid (balance = 0) AND all registration fees paid
    if (courseFullyPaid && registrationStatus === "Paid") {
      return "Paid";
    }
    return "Pending";
  };

  const dynamicStatus = calculateDynamicStatus();
  
  // Show payment options only if course balance > 0 OR any registration fee is unpaid
  const courseHasBalance = record.balancePayment > 0;
  const registrationStatus = calculateRegistrationStatus(record.registrationFees);
  const showPaymentOptions = courseHasBalance || registrationStatus === "Pending";

  // Use extracted hooks
  const { handleSendReminder } = useReminderActions({ record })
  const {
    manualPaymentOpen,
    setManualPaymentOpen,
    alreadyPaidAlertOpen,
    setAlreadyPaidAlertOpen,
    isFullyPaid,
    handlePaymentButtonClick,
    handleManualPayment,
    generatePayslip
  } = usePaymentActions({ record, onUpdateRecord, refreshPaymentData })

  // Check if payments are completed (for display purposes)
  const isRegistrationPaid = record.registrationFees?.overall?.paid || false
  const isCoursePaid = record.balancePayment === 0

  // Generate QR code when dialog opens
  useEffect(() => {
    if (qrCodeOpen && record.paymentDetails?.upiId) {
      const generateQR = async () => {
        try {
          // Create UPI payment string
          const upiString = `upi://pay?pa=${record.paymentDetails?.upiId}&pn=UniqBrio&am=${record.balancePayment}&cu=INR&tn=Payment for ${record.activity}`
          const qrCodeDataURL = await QRCodeLib.toDataURL(upiString, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setGeneratedQR(qrCodeDataURL)
        } catch (error) {
          console.error('QR Code generation failed:', error)
          setGeneratedQR('')
        }
      }
      generateQR()
    }
  }, [qrCodeOpen, record.paymentDetails?.upiId, record.balancePayment, record.activity])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) return "-"
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const year = date.getFullYear().toString().slice(-2)
      return `${month}'${year}`
    } catch (error) {
      console.error("Date formatting error:", error)
      return "-"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-red-600 text-white border-red-600"
      case "overdue":
        return "bg-red-800 text-white border-red-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCurrencyName = (currency: string) => {
    return currency || 'INR'
  }

  const startEditingText = (record: PaymentRecord) => {
    setEditingText({ id: record.id, text: record.communicationText })
  }

  const saveEditedText = () => {
    if (!editingText) return
    onUpdateRecord(editingText.id, { communicationText: editingText.text })
    setEditingText(null)
    toast({
      title: "✔ Communication Updated",
      description: "Communication text has been updated successfully.",
    })
  }

  return (
    <>
      <TableRow key={record.id} className="hover:bg-[#9234ea]/5 border-[#9234ea]/10">
      {selectable && (
        <TableCell className="p-3 w-8">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelectRow}
            aria-label="Select row"
          />
        </TableCell>
      )}
      {isColumnVisible('id') && (
        <TableCell className="font-medium text-sm p-3">{record.id}</TableCell>
      )}
      {isColumnVisible('name') && (
        <TableCell className="text-sm p-3">{record.name}</TableCell>
      )}
      {isColumnVisible('course') && (
        <TableCell className="text-sm p-3">{record.activity}</TableCell>
      )}
      {isColumnVisible('category') && (
        <TableCell className="text-sm p-3">
          <Badge variant="outline" className="text-sm border-purple-200">
            {record.category}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('courseType') && (
        <TableCell className="text-sm p-3">
          <Badge variant="secondary" className="text-sm">
            {record.courseType}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('registration') && (
        <TableCell className="text-sm p-3">
          <RegistrationFeesDisplay record={record} />
        </TableCell>
      )}
      {isColumnVisible('courseRegFee') && (
        <TableCell className="text-[11px] p-1 font-medium">
          {record.registrationFees?.courseRegistration?.amount?.toLocaleString() ?? '-'}
          {record.registrationFees?.courseRegistration?.paid ? <span className="ml-1 text-green-600">✓</span> : ''}
        </TableCell>
      )}
      {isColumnVisible('studentRegFee') && (
        <TableCell className="text-[11px] p-1 font-medium">
          {record.registrationFees?.studentRegistration?.amount?.toLocaleString() ?? '-'}
          {record.registrationFees?.studentRegistration?.paid ? <span className="ml-1 text-green-600">✓</span> : ''}
        </TableCell>
      )}
      {isColumnVisible('finalPayment') && (
        <TableCell className="text-[11px] p-1 font-medium">
          {record.finalPayment > 0 
            ? <span className="inline-flex items-center gap-1">
                {record.finalPayment.toLocaleString()} {getCurrencyName(record.currency)}
                {record.derivedFinalPayment && (
                  <span
                    title="Computed via client fallback triple-rule (sync API unavailable)"
                    className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300"
                  >F</span>
                )}
              </span>
            : '-'}
        </TableCell>
      )}
      {isColumnVisible('totalPaid') && (
        <TableCell className="text-[11px] p-1 text-green-600 font-medium">
          {/* Only show Course Registration Fee payments in Total Paid */}
          {record.registrationFees?.courseRegistration?.paid
            ? (record.registrationFees?.courseRegistration?.amount ?? 0).toLocaleString()
            : '0'} {getCurrencyName(record.currency)}
        </TableCell>
      )}
      {isColumnVisible('balance') && (
        <TableCell className="text-[11px] p-1">
          <span className={record.balancePayment > 0 ? "text-red-600 font-medium" : "text-green-600"}>
            {record.balancePayment.toLocaleString()} {getCurrencyName(record.currency)} <span className="text-red-500">*</span>
          </span>
        </TableCell>
      )}
      {isColumnVisible('status') && (
        <TableCell className="text-[11px] p-1">
          <Badge className={`text-[11px] ${getStatusColor(dynamicStatus)}`}>
            {dynamicStatus}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('frequency') && (
        <TableCell className="text-[11px] p-1">{record.paymentFrequency}</TableCell>
      )}
      {isColumnVisible('paidDate') && (
        <TableCell className="text-[11px] p-1 text-center">
          {formatDate(record.paidDate)}
        </TableCell>
      )}
      {isColumnVisible('nextDue') && (
        <TableCell className="text-[11px] p-1 text-center">
          {formatDate(record.nextPaymentDate)}
        </TableCell>
      )}
      {isColumnVisible('courseStartDate') && (
        <TableCell className="text-[11px] p-1 text-center">
          {formatDate(record.courseStartDate ?? null)}
        </TableCell>
      )}
      {isColumnVisible('reminder') && (
        <TableCell className="text-[11px] p-1">
          <Badge 
            variant={record.paymentStatus === 'Paid' || !record.paymentReminder ? "secondary" : "default"} 
            className={`text-[11px] ${record.paymentStatus !== 'Paid' ? 'cursor-pointer hover:opacity-80' : ''} ${
              record.paymentStatus !== 'Paid' && record.paymentReminder 
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-[#9234ea]' 
                : ''
            }`}
            onClick={() => {
              if (record.paymentStatus !== 'Paid') {
                const newReminderState = !record.paymentReminder;
                onUpdateRecord(record.id, { paymentReminder: newReminderState });
                toast({
                  title: newReminderState ? "✔ Reminder Enabled" : "❌ Reminder Disabled",
                  description: `Payment reminders ${newReminderState ? 'enabled' : 'disabled'} for ${record.name}`,
                });
              }
            }}
            title={record.paymentStatus === 'Paid' ? 'Reminders automatically disabled for paid payments' : 'Click to toggle reminder'}
          >
            {record.paymentStatus === 'Paid' ? "Off (Paid)" : (record.paymentReminder ? "On" : "Off")}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('mode') && (
        <TableCell className="text-[11px] p-1">
          <div className="flex items-center gap-1">
            <span>{record.reminderMode}</span>
            {record.reminderMode === 'SMS' && (
              <div className="flex items-center gap-1">
                
                <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="inline">
                  <polygon points="10,40 60,40 60,30 90,50 60,70 60,60 10,60"
                           fill="#8A4FFF" />
                  <text x="12" y="90" fontFamily="Arial, sans-serif" fontSize="20" fill="#8A4FFF" fontWeight="bold">
                    SOON
                  </text>
                </svg>
              </div>
            )}
          </div>
        </TableCell>
      )}
      {isColumnVisible('communication') && (
        <TableCell className="text-[11px] p-1 max-w-xs">
          <div className="space-y-2">
            {editingText && editingText.id === record.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editingText.text}
                  onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                  className="text-[11px]"
                  rows={3}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={saveEditedText}
                    className="bg-[#9234ea] hover:bg-[#9234ea]/90"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingText(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <p className="text-[11px] text-gray-600 truncate" title={record.communicationText}>
                  {record.communicationText}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditingText(record)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </TableCell>
      )}
      {isColumnVisible('paymentDetails') && (
        <TableCell className="text-[11px] p-1">
          <div className="flex flex-col gap-1">
            {record.reminderMode === "SMS" || record.reminderMode === "WhatsApp" ? (
              <>
                {record.paymentDetails?.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span 
                      className="cursor-pointer text-blue-600 hover:underline"
                      onClick={() => navigator.clipboard.writeText(record.paymentDetails?.upiId ?? "")}
                      title="Click to copy UPI ID"
                    >
                      {record.paymentDetails?.upiId}
                    </span>
                  </div>
                )}
                {record.paymentDetails?.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <a 
                      href={record.paymentDetails?.paymentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title="Open payment link"
                    >
                      Link
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                {record.paymentDetails?.qrCode && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <QrCode className="h-3 w-3" />
                    <span 
                      className="cursor-pointer text-blue-600 hover:underline"
                      onClick={() => setQrCodeOpen(true)}
                      title="View QR Code"
                    >
                      QR
                    </span>
                  </div>
                )}
                {record.paymentDetails?.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span 
                      className="cursor-pointer text-blue-600 hover:underline"
                      onClick={() => navigator.clipboard.writeText(record.paymentDetails?.upiId ?? "")}
                      title="Click to copy UPI ID"
                    >
                      {record.paymentDetails?.upiId}
                    </span>
                  </div>
                )}
                {record.paymentDetails?.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <a 
                      href={record.paymentDetails?.paymentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title="Open payment link"
                    >
                      Link
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </TableCell>
      )}
      {isColumnVisible('manualPayment') && (
        <TableCell className="text-sm p-3">
          {showPaymentOptions ? (
            <>
              <Button
                size="sm"
                onClick={handlePaymentButtonClick}
                className="bg-[#9234ea] hover:bg-[#9234ea]/90 h-7 px-2 text-xs"
                title="Manual Payment"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Payment
              </Button>
              <StudentManualPayment
                student={record}
                onSubmit={handleManualPayment}
                open={manualPaymentOpen}
                onOpenChange={setManualPaymentOpen}
              />
            </>
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
              Fully Paid
            </Badge>
          )}
        </TableCell>
      )}
      {isColumnVisible('payslip') && (
        <TableCell className="text-sm p-3">
          <Button
            size="sm"
            variant="outline"
            onClick={generatePayslip}
            className="border-[#9234ea]/30 h-7 w-7 p-0 flex items-center justify-center"
            title="Generate Payslip"
          >
           <img src="/invoice-envelope.svg" alt="Payslip Icon" className="h-5 w-5" />
          </Button>
        </TableCell>
      )}
      {isColumnVisible('actions') && (
        <TableCell className="text-sm p-3">
          <div className="flex gap-1">
            {/* Send Reminder (only if balance > 0, reminder enabled, and status is not Paid) */}
            {record.paymentReminder && 
             record.balancePayment > 0 && 
             record.paymentStatus !== 'Paid' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (record.reminderMode === "Email") {
                    setEmailPreviewOpen(true)
                  } else {
                    handleSendReminder()
                  }
                }}
                className="border-[#9234ea]/30 h-7 w-7 p-0"
                title="Send Reminder"
              >
                <Send className="h-3 w-3" />
              </Button>
            )}
            {/* Show info when reminder is disabled for paid payments */}
            {record.paymentStatus === 'Paid' && (
              <span 
                className="text-xs text-gray-500 px-2 py-1 bg-green-50 rounded border border-green-200" 
                title="Reminders are automatically disabled for paid payments"
              >
                Paid ✓
              </span>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
    
    {/* QR Code Popup Dialog */}
    <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Payment QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="bg-white p-4 rounded-lg shadow-md border">
            {/* Display generated QR code first, then fallback to database QR, then placeholder */}
            {generatedQR ? (
              <img 
                src={generatedQR} 
                alt="Payment QR Code" 
                className="w-64 h-64 object-contain"
              />
            ) : record.paymentDetails?.qrCode && record.paymentDetails?.qrCode !== 'QR_CODE_PLACEHOLDER' ? (
              <img 
                src={record.paymentDetails?.qrCode} 
                alt="Payment QR Code" 
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.classList.add('hidden');
                  const fallback = target.parentElement?.querySelector('.qr-fallback') as HTMLElement;
                  if (fallback) {
                    fallback.classList.remove('hidden');
                    fallback.classList.add('flex');
                  }
                }}
              />
            ) : (
              <div className="qr-fallback w-64 h-64 bg-gray-50 flex items-center justify-center text-gray-800 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center p-4">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium">Generating QR Code...</p>
                  <p className="text-xs text-gray-500">Please wait</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Pay {formatCurrency(record.balancePayment, record.currency)}</p>
            <p className="text-xs text-gray-600">{record.name} - {record.activity}</p>
            {record.paymentDetails?.upiId && (
              <p className="text-xs text-gray-500">UPI ID: {record.paymentDetails?.upiId}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setQrCodeOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Email Preview Dialog */}
    <EmailPreviewDialog
      record={record}
      isOpen={emailPreviewOpen}
      onClose={() => setEmailPreviewOpen(false)}
      generatedQR={generatedQR}
      setGeneratedQR={setGeneratedQR}
    />

    <AlertDialog open={alreadyPaidAlertOpen} onOpenChange={setAlreadyPaidAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Payment Already Completed</AlertDialogTitle>
          <AlertDialogDescription>
            You have already paid your fee amount. Both registration fees and course fees are fully paid.
            {isRegistrationPaid && <div className="mt-2 text-green-600 font-medium">✔ Registration Fees: Paid</div>}
            {isCoursePaid && <div className="text-green-600 font-medium">✔ Course Fees: Paid</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-[#9234ea] hover:bg-[#9234ea]/90">Okay</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}