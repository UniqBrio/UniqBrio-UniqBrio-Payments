
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
import { formatDateToDisplay } from '@/lib/date-utils'
import { ReminderPreviewDialog } from "./reminder-preview-dialog"
import { CommunicationModeColumnCompact } from '@/components/communication-mode-column'
import { usePaymentActions } from "./payment-actions"
import { EmailPreviewDialog } from "./email-preview-dialog"
import { RegistrationFeesDisplay, calculateRegistrationStatus, getRegistrationSummary } from "./registration-fees-display"
import QRCodeLib from 'qrcode'

// Utility function for formatting currency
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `${formattedNumber} ${currency}`
}

// Utility function to get available payment methods based on communication mode
const getAvailablePaymentMethods = (communicationChannels: string[] | null) => {
  // If no communication channels or empty array, show only "-"
  if (!communicationChannels || communicationChannels.length === 0) {
    return {
      showQR: false,
      showUPI: false,
      showLink: false,
      showEmail: false,
      showDash: true
    }
  }
  
  // Check what channels are available
  const hasEmail = communicationChannels.some(channel => channel.toLowerCase().includes('email'))
  const hasSMS = communicationChannels.some(channel => channel.toLowerCase().includes('sms'))
  const hasWhatsApp = communicationChannels.some(channel => channel.toLowerCase().includes('whatsapp'))
  
  // SMS mode: Show only UPI (avoid QR and email)
  if (hasSMS && !hasWhatsApp && !hasEmail) {
    return {
      showQR: false,
      showUPI: true,
      showLink: false,
      showEmail: false,
      showDash: false
    }
  }
  
  // WhatsApp mode: Show link, QR, UPI 
  if (hasWhatsApp) {
    return {
      showQR: true,
      showUPI: true,
      showLink: true,
      showEmail: false,
      showDash: false
    }
  }
  
  // Email mode: Show all options (email, QR, UPI, link)
  if (hasEmail) {
    return {
      showQR: true,
      showUPI: true,
      showLink: true,
      showEmail: true,
      showDash: false
    }
  }
  
  // Default: show all options if channels exist but don't match specific patterns
  return {
    showQR: true,
    showUPI: true,
    showLink: true,
    showEmail: false,
    showDash: false
  }
}



// Since payment-utils is missing, let's define these functions here temporarily
const formatDate = (dateString: string | null) => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    const month = date.getMonth() + 1 // getMonth() returns 0-11
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
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
  onViewDetails?: () => void
}

export function PaymentTableRow({ record, isColumnVisible, onUpdateRecord, refreshPaymentData, selectable, selected, onSelectRow, onViewDetails }: PaymentTableRowProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)
  const [qrCodeOpen, setQrCodeOpen] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [reminderPreviewOpen, setReminderPreviewOpen] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string>('')
  
  // Use communication channels from record prop (batch fetched at parent level)
  const [communicationChannels, setCommunicationChannels] = useState<string[]>(
    record.communicationChannels || []
  )

  // Update when record changes
  useEffect(() => {
    setCommunicationChannels(record.communicationChannels || [])
  }, [record.communicationChannels])

  // Registration fees summary for totals
  const regSummary = getRegistrationSummary(record.registrationFees);
  const totalRegAmount = regSummary?.totalAmount || 0;
  const totalPaid = record.totalPaidAmount || 0;
  const overallDue = (record.finalPayment || 0) + totalRegAmount;
  const overallBalance = Math.max(overallDue - totalPaid, 0);

  // Calculate dynamic payment status based on overall due vs paid
  const calculateDynamicStatus = (): "Paid" | "Pending" | "-" => {
    if (record.finalPayment === 0 || record.finalPayment === null || record.finalPayment === undefined) {
      return "-";
    }
    return overallBalance === 0 ? "Paid" : "Pending";
  };

  const dynamicStatus = calculateDynamicStatus();
  
  // Show payment options only if course balance > 0 OR any registration fee is unpaid
  const courseHasBalance = record.balancePayment > 0;
  const registrationStatus = calculateRegistrationStatus(record.registrationFees);
  const hasAnyRegFees = Boolean(record.registrationFees?.studentRegistration || record.registrationFees?.courseRegistration);
  // Show payment options when there is any outstanding amount by the overall calculation
  const showPaymentOptions = overallBalance > 0 || (hasAnyRegFees && registrationStatus === "Pending") || courseHasBalance;

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

  // Enhanced reminder function with payment options using user's preferred communication mode
  const handleSendReminderWithPaymentOptions = () => {
    // Console message removed
    setReminderPreviewOpen(true);
  }

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
          // Console message removed
          setGeneratedQR('')
        }
      }
      generateQR()
    }
  }, [qrCodeOpen, record.paymentDetails?.upiId, record.balancePayment, record.activity])

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'N/A') return "-"
    try {
      // Handle ISO date strings like "2025-02-05T00:00:00.000+00:00"
      const date = new Date(dateString)
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) return "-"
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0') // getMonth() returns 0-11
      const day = date.getDate().toString().padStart(2, '0')
      const year = date.getFullYear()
      
      // Return in MM/DD/YYYY format
      return `${month}/${day}/${year}`
    } catch (error) {
      // Console message removed
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
    const defaultText = `Make a payment quickly - Balance: ₹${(record.balancePayment || 0).toLocaleString()}`;
    const courseKey = record.matchedCourseId || record.activity || record.enrolledCourse || 'NA';
    setEditingText({ id: `${record.id}::${courseKey}` , text: record.communicationText || defaultText })
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
      <TableRow
        key={record.id}
        className="hover:bg-[#9234ea]/5 border-[#9234ea]/10 cursor-pointer"
        onClick={(e) => {
          // If any modal/dialog is open (manual payment, shadcn dialog, or our details dialog),
          // do not trigger the row-level details popup.
          if (typeof document !== 'undefined') {
            const modalOpen = document.querySelector('.rdd-overlay,[role="dialog"][aria-modal="true"],[data-state="open"][role="dialog"]');
            if (modalOpen) return;
          }
          const el = e.target as HTMLElement
          if (el.closest('button, a, input, select, textarea, [role="button"], .rdd-ignore-row-click')) return
          onViewDetails?.()
        }}
      >
      {selectable && (
        <TableCell className="p-3 w-[50px] text-center">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelectRow}
            aria-label="Select row"
            className="rdd-ignore-row-click"
          />
        </TableCell>
      )}
      {isColumnVisible('id') && (
        <TableCell className="font-medium text-sm p-3 text-center w-[120px]">{record.id}</TableCell>
      )}
      {isColumnVisible('name') && (
        <TableCell className="text-sm p-3 text-center w-[180px]">{record.name}</TableCell>
      )}
      {isColumnVisible('category') && (
        <TableCell className="text-sm p-3 text-center w-[140px]">
          <Badge variant="outline" className="text-sm border-purple-200">
            {record.category}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('program') && (
        <TableCell className="text-sm p-3 text-center w-[220px]">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-medium text-purple-600 text-xs">
              {(record as any).matchedCourseId || record.enrolledCourse || record.activity || '-'}
            </span>
            <span className="text-gray-700">
              {record.program || record.enrolledCourse || record.activity || 'N/A'}
            </span>
          </div>
        </TableCell>
      )}
      {isColumnVisible('cohort') && (
        <TableCell className="text-sm p-3 text-center w-[220px]">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-medium text-purple-600 text-xs">
              {(record as any).cohortId || '-'}
            </span>
            <span className="text-gray-700">
              {record.cohort || 'Unassigned'}
            </span>
          </div>
        </TableCell>
      )}
      {isColumnVisible('courseType') && (
        <TableCell className="text-sm p-3 text-center w-[140px]">
          <Badge variant="secondary" className="text-sm">
            {record.courseType}
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('registration') && (
        <TableCell className="text-sm p-3 text-center w-[140px]">
          <RegistrationFeesDisplay record={record} />
        </TableCell>
      )}
      {isColumnVisible('courseRegFee') && (
        <TableCell className="text-sm p-3 font-medium text-center w-[150px]">
          {record.registrationFees?.courseRegistration?.amount?.toLocaleString() ?? '-'}
        </TableCell>
      )}
      {isColumnVisible('studentRegFee') && (
        <TableCell className="text-sm p-3 font-medium text-center w-[160px]">
          {record.registrationFees?.studentRegistration?.amount?.toLocaleString() ?? '-'}
        </TableCell>
      )}
            {isColumnVisible('finalPayment') && (
        <TableCell className="text-sm p-3 w-[150px] text-center">
          <span className="font-medium">
            {(record.finalPayment || 0).toLocaleString()}
          </span>
        </TableCell>
      )}
      {isColumnVisible('totalPaid') && (
        <TableCell className="text-sm p-3 text-green-600 font-medium text-center w-[150px]">
          {/* Show totalPaidAmount from payments collection */}
          {record.totalPaidAmount && record.totalPaidAmount > 0
            ? (record.totalPaidAmount).toLocaleString()
            : '0'}
        </TableCell>
      )}
      {isColumnVisible('balance') && (
        <TableCell className="text-sm p-3 w-[150px] text-center">
          <span
            className={overallBalance > 0 ? "text-red-600 font-medium" : "text-green-600"}
            title={`Due: ₹${overallDue.toLocaleString()}\nPaid: ₹${totalPaid.toLocaleString()}\nBalance: ₹${overallBalance.toLocaleString()}`}
          >
            {overallBalance.toLocaleString()}
          </span>
        </TableCell>
      )}
      {isColumnVisible('status') && (
        <TableCell className="text-sm p-3 text-center w-[120px]">
          {dynamicStatus === "-" ? (
            <span className="text-gray-400 italic">N/A</span>
          ) : (
            <Badge className={`text-sm ${getStatusColor(dynamicStatus)}`}>
              {dynamicStatus}
            </Badge>
          )}
        </TableCell>
      )}
      {/* {isColumnVisible('frequency') && (
        <TableCell className="text-[11px] p-1">{record.paymentFrequency}</TableCell>
      )} */}
      {isColumnVisible('paidDate') && (
        <TableCell className="text-sm p-3 text-center w-[140px]">
          {record.paidDate ? (
            <span title={`Raw date: ${record.paidDate}`}>
              {formatDateToDisplay(record.paidDate)}
            </span>
          ) : (
            <span className="text-gray-400 italic">-</span>
          )}
        </TableCell>
      )}
      {/* {isColumnVisible('nextDue') && (
        <TableCell className="text-[11px] p-1 text-center">

          {(() => {
            // If course fee is 0, do not show a computed next due date
            if ((record.finalPayment ?? 0) === 0) {
              return <span className="text-gray-400 italic">-</span>
            }
            let next = record.nextPaymentDate;
            // Fallback: compute from courseStartDate (+30 days) if missing
            if (!next && record.courseStartDate) {
              try {
                const base = new Date(record.courseStartDate);
                if (!isNaN(base.getTime())) {
                  const d = new Date(base); d.setDate(d.getDate() + 30); next = d.toISOString();
                }
              } catch {}
            }
            return next ? (
              <span title={`Next Due: ${next}`}>{formatDateToDisplay(next)}</span>
            ) : (
              <span className="text-gray-400 italic">-</span>
            );
          })()}
        </TableCell>
      )} */}
      {/* {isColumnVisible('courseStartDate') && (
        <TableCell className="text-[11px] p-1 text-center">
          {formatDateToDisplay(record.courseStartDate)}
        </TableCell>
      )} */}
      {isColumnVisible('reminder') && (
        <TableCell className="text-sm p-3 text-center w-[120px]">
          {(() => {
            // Effective reminder state: default ON when pending (if unset/falsey), OFF when fully paid
            const isPaid = record.paymentStatus === 'Paid' || dynamicStatus === 'Paid' || overallBalance === 0;
            const effectiveReminder = isPaid ? false : (record.paymentReminder ?? (dynamicStatus === 'Pending'));
            return (
              <Badge
                role="button"
                variant={isPaid || !effectiveReminder ? 'secondary' : 'default'}
                className={`text-sm ${!isPaid ? 'cursor-pointer hover:opacity-80' : ''} ${
                  !isPaid && effectiveReminder ? 'bg-purple-600 text-white border-purple-600 hover:bg-[#9234ea]' : ''
                } rdd-ignore-row-click`}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!isPaid) {
                    const newReminderState = !effectiveReminder;
                    try {
                      const courseKey = record.matchedCourseId || record.activity || record.enrolledCourse || 'NA';
                      await onUpdateRecord(`${record.id}::${courseKey}`, { paymentReminder: newReminderState });
                      toast({
                        title: newReminderState ? '✔ Reminder Enabled' : '❌ Reminder Disabled',
                        description: `Payment reminders ${newReminderState ? 'enabled' : 'disabled'} for ${record.name}`,
                      });
                    } catch (error) {
                      toast({
                        title: '❌ Update Failed',
                        description: 'Failed to update reminder setting. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  } else {
                    toast({
                      title: '⚠️ Cannot Update',
                      description: 'Reminders are automatically disabled for paid payments.',
                      variant: 'default',
                    });
                  }
                }}
                title={isPaid ? 'Reminders automatically disabled for paid payments' : 'Click to toggle reminder'}
              >
                {isPaid ? 'Off (Paid)' : effectiveReminder ? 'On' : 'Off'}
              </Badge>
            );
          })()}
        </TableCell>
      )}
      {/* {isColumnVisible('mode') && (
        <TableCell className="text-[11px] p-1 min-w-[100px] text-center">
          <CommunicationModeColumnCompact 
            studentId={record.id}
            studentName={record.name}
            className="w-full"
          />
        </TableCell>
      )} */}
      {/* {isColumnVisible('communication') && (
        <TableCell className="text-[11px] p-1 max-w-xs text-center">
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
                <div className={`text-[11px] ${record.communicationText?.includes('Make a payment quickly') ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  <div className="truncate" title={record.communicationText || `Make a payment quickly - Balance: ₹${(record.balancePayment || 0).toLocaleString()}`}>
                    {(record.communicationText || `Make a payment quickly - Balance: ₹${(record.balancePayment || 0).toLocaleString()}`).split('\n')[0]}
                  </div>
                  {(record.communicationText || '').includes('💳') && (
                    <div className="text-[9px] text-gray-500 mt-1">
                      Payment options available
                    </div>
                  )}
                </div>
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
        <TableCell className="text-[11px] p-1 text-center">
          {(() => {
            const availableMethods = getAvailablePaymentMethods(communicationChannels)
            

            if (availableMethods.showDash) {
              return <span className="text-gray-500">-</span>
            }
            
            return (
              <div className="flex justify-center items-center gap-2">
                {availableMethods.showQR && (
                  <div className="flex items-center gap-1 text-[11px]" title="QR Code Payment">
                    <QrCode className={`h-4 w-4 ${record.paymentDetails?.qrCode && record.paymentDetails.qrCode !== '' ? 'text-purple-600 cursor-pointer hover:text-purple-800' : 'text-gray-400'}`} 
                            onClick={record.paymentDetails?.qrCode ? () => setQrCodeOpen(true) : undefined} />
                  </div>
                )}
                

                {availableMethods.showUPI && (
                  <div className="flex items-center gap-1 text-[11px]" title={record.paymentDetails?.upiId ? `UPI: ${record.paymentDetails.upiId}` : 'UPI Payment'}>
                    <Smartphone className={`h-4 w-4 ${record.paymentDetails?.upiId && record.paymentDetails.upiId !== '' ? 'text-green-600 cursor-pointer hover:text-green-800' : 'text-gray-400'}`} 
                               onClick={record.paymentDetails?.upiId ? () => {
                                 navigator.clipboard.writeText(record.paymentDetails?.upiId ?? "uniqbrio@upi");
                                 toast({
                                   title: "UPI ID Copied",
                                   description: "UPI ID copied to clipboard",
                                 });
                               } : undefined} />
                  </div>
                )}
                

                {availableMethods.showLink && (
                  <div className="flex items-center gap-1 text-[11px]" title="Payment Link">
                    <Link className={`h-4 w-4 ${record.paymentDetails?.paymentLink && record.paymentDetails.paymentLink !== '' ? 'text-blue-600 cursor-pointer hover:text-blue-800' : 'text-gray-400'}`} 
                          onClick={record.paymentDetails?.paymentLink ? () => window.open(record.paymentDetails?.paymentLink, '_blank') : undefined} />
                  </div>
                )}
                
              </div>
            )
          })()}
        </TableCell>
      )} */}
      {isColumnVisible('manualPayment') && (
        <TableCell className="text-sm p-3 text-center w-[160px]">
          {/* Check if all payment amounts are 0 to show N/A */}
          {(record.finalPayment || 0) === 0 && 
           (record.totalPaidAmount || 0) === 0 && 
           (record.balancePayment || 0) === 0 ? (
            <span className="text-gray-400 text-sm">N/A</span>
          ) : showPaymentOptions ? (
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
        <TableCell className="text-sm p-3 text-center w-[120px]">
          {(record.totalPaidAmount || 0) === 0 ? (
            <span className="text-gray-400 text-sm">N/A</span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={generatePayslip}
              className="border-[#9234ea]/30 h-7 w-7 p-0 flex items-center justify-center"
              title="Generate Payslip"
            >
             <img src="/invoice-envelope.svg" alt="Payslip Icon" className="h-5 w-5" />
            </Button>
          )}
        </TableCell>
      )}
      {isColumnVisible('actions') && (
        <TableCell className="text-sm p-3 text-center w-[160px]">
          <div className="flex gap-2 justify-center">
            {/* Check if all payment amounts are 0 to show N/A */}
            {(record.finalPayment || 0) === 0 && 
             (record.totalPaidAmount || 0) === 0 && 
             (record.balancePayment || 0) === 0 ? (
              <span className="text-gray-400 text-sm">N/A</span>
            ) : (
              <>
                {/* Send Reminder Logic - Only show for students with balance > 0 */}
                {record.balancePayment > 0 && dynamicStatus === 'Pending' ? (
                  (() => {
                    // We're inside the branch where dynamicStatus === 'Pending'
                    const isPaid = record.paymentStatus === 'Paid' || overallBalance === 0;
                    const effectiveReminder = isPaid ? false : (record.paymentReminder ?? true);
                    return effectiveReminder ? (
                    // Show Send Reminder button when reminder is ON and balance > 0
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        // Console messages removed
                        e.preventDefault();
                        handleSendReminderWithPaymentOptions();
                      }}
                      className="border-[#9234ea] hover:bg-[#9234ea] hover:text-white h-8 w-8 p-0 cursor-pointer bg-white transition-colors duration-200 shadow-sm group"
                      title="Send Payment Reminder"
                    >
                      <Send className="h-4 w-4 text-[#9234ea] group-hover:text-white transition-colors duration-200" />
                    </Button>
                    ) : (
                      // Show "-" when reminder is OFF but balance > 0
                      <span className="text-gray-400 italic">-</span>
                    );
                  })()
                ) : dynamicStatus === 'Paid' ? (
                  // Show "Paid" when payment is completed
                  <span 
                    className="text-xs text-gray-500 px-2 py-1 bg-green-50 rounded border border-green-200" 
                    title="Payment completed - reminders disabled"
                  >
                    Paid
                  </span>
                ) : (
                  // Show "-" for unmatched students or other cases
                  <span className="text-gray-400 italic">-</span>
                )}
              </>
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

    {/* Reminder Preview Dialog */}
    <ReminderPreviewDialog
      record={record}
      isOpen={reminderPreviewOpen}
      onClose={() => setReminderPreviewOpen(false)}
      onSendConfirm={async (mode) => {
        // Console message removed
        // Call API to actually send reminder for the chosen mode
        try {
          const response = await fetch('/api/payments/send-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: record.id, communicationModes: [mode] })
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              toast({
                title: '✅ Reminder Sent',
                description: `Your ${mode} reminder was sent successfully.`,
              })
            } else {
              toast({
                title: '⚠️ Reminder Issue',
                description: result.message || `Failed to send ${mode} reminder.`,
                variant: 'destructive'
              })
            }
          } else {
            toast({
              title: '❌ Send Failed',
              description: `Could not send ${mode} reminder (status ${response.status}).`,
              variant: 'destructive'
            })
          }
        } catch (err) {
          // Console message removed
          toast({
            title: '❌ Error',
            description: `An error occurred while sending the ${mode} reminder.`,
            variant: 'destructive'
          })
        } finally {
          setReminderPreviewOpen(false)
        }
      }}
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