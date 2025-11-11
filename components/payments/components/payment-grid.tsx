"use client"

import { useState, useEffect } from "react"
import { formatDateToDisplay } from '@/lib/date-utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord, currencySymbols } from './payment-types'
import { Send, QrCode, Smartphone, Link, Edit, Save, X, CreditCard, Mail } from "lucide-react"
import { StudentManualPayment, StudentManualPaymentPayload } from "./student-manual-payment"
import { useReminderActions } from "./reminder-actions"
import { ReminderPreviewDialog } from "./reminder-preview-dialog"
import { CommunicationModeColumnCompact } from '@/components/communication-mode-column'
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

interface PaymentGridProps {
  filteredRecords: PaymentRecord[]
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
  refreshPaymentData?: () => void
}

export function PaymentGrid({ filteredRecords, onUpdateRecord, refreshPaymentData }: PaymentGridProps) {
  const [editingText, setEditingText] = useState<{ id: string; text: string } | null>(null)
  const [qrCodeOpen, setQrCodeOpen] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [reminderPreviewOpen, setReminderPreviewOpen] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string>('')
  const [communicationChannels, setCommunicationChannels] = useState<{ [key: string]: string[] | null }>({})
  const [activeRecord, setActiveRecord] = useState<PaymentRecord | null>(null)

  // Calculate dynamic payment status based on final payment and balance
  const calculateDynamicStatus = (record: PaymentRecord): "Paid" | "Pending" | "-" => {
    // If final payment is 0 (unmatched students), show "-"
    if (record.finalPayment === 0 || record.finalPayment === null || record.finalPayment === undefined) {
      return "-";
    }
    
    // If balance is 0, show "Paid"
    if (record.balancePayment === 0) {
      return "Paid";
    }
    
    // If balance is not 0, show "Pending"
    return "Pending";
  };

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

  const getCurrencySymbol = (currency: string) => {
    return currencySymbols?.[currency] || currency
  }

  // Enhanced reminder function with payment options using user's preferred communication mode
  const handleSendReminderWithPaymentOptions = (record: PaymentRecord) => {
    setActiveRecord(record);
    setReminderPreviewOpen(true);
  }

  const startEditingText = (record: PaymentRecord) => {
    const defaultText = `Make a payment quickly - Balance: ₹${(record.balancePayment || 0).toLocaleString()}`;
    const courseKey = record.matchedCourseId || record.activity || record.enrolledCourse || 'NA';
    setEditingText({ id: `${record.id}::${courseKey}`, text: record.communicationText || defaultText })
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

  // Generate QR code when dialog opens
  useEffect(() => {
    if (qrCodeOpen && activeRecord?.paymentDetails?.upiId) {
      const generateQR = async () => {
        try {
          // Create UPI payment string
          const upiString = `upi://pay?pa=${activeRecord.paymentDetails?.upiId}&pn=UniqBrio&am=${activeRecord.balancePayment}&cu=INR&tn=Payment for ${activeRecord.activity}`
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
  }, [qrCodeOpen, activeRecord?.paymentDetails?.upiId, activeRecord?.balancePayment, activeRecord?.activity])

  // Skip communication preferences fetching for grid view to reduce API calls
  useEffect(() => {
    // Set empty communication channels for all records to avoid API calls
    const channelsMap: { [key: string]: string[] | null } = {}
    filteredRecords.forEach(record => {
      if (record.id) {
        const key = `${record.id}::${record.matchedCourseId || record.activity || record.enrolledCourse || 'NA'}`
        channelsMap[key] = [] // Default to empty channels
      }
    })
    setCommunicationChannels(channelsMap)
  }, [filteredRecords])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecords.map((record) => (
          <PaymentGridCard
            key={`${record.id}::${record.matchedCourseId || record.activity || record.enrolledCourse || 'NA'}`}
            record={record}
            editingText={editingText}
            setEditingText={setEditingText}
            communicationChannels={communicationChannels[`${record.id}::${record.matchedCourseId || record.activity || record.enrolledCourse || 'NA'}`] || []}
            onUpdateRecord={onUpdateRecord}
            onStartEditingText={startEditingText}
            onSaveEditedText={saveEditedText}
            onSendReminder={handleSendReminderWithPaymentOptions}
            onOpenQRCode={(rec) => {
              setActiveRecord(rec);
              setQrCodeOpen(true);
            }}
            refreshPaymentData={refreshPaymentData}
          />
        ))}
      </div>

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
              ) : activeRecord?.paymentDetails?.qrCode && activeRecord?.paymentDetails?.qrCode !== 'QR_CODE_PLACEHOLDER' ? (
                <img 
                  src={activeRecord?.paymentDetails?.qrCode} 
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
              <p className="text-sm font-medium">Pay {formatCurrency(activeRecord?.balancePayment || 0, activeRecord?.currency)}</p>
              <p className="text-xs text-gray-600">{activeRecord?.name} - {activeRecord?.activity}</p>
              {activeRecord?.paymentDetails?.upiId && (
                <p className="text-xs text-gray-500">UPI ID: {activeRecord?.paymentDetails?.upiId}</p>
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
      {activeRecord && (
        <EmailPreviewDialog
          record={activeRecord}
          isOpen={emailPreviewOpen}
          onClose={() => setEmailPreviewOpen(false)}
          generatedQR={generatedQR}
          setGeneratedQR={setGeneratedQR}
        />
      )}

      {/* Reminder Preview Dialog */}
      {activeRecord && (
        <ReminderPreviewDialog
          record={activeRecord}
          isOpen={reminderPreviewOpen}
          onClose={() => setReminderPreviewOpen(false)}
          onSendConfirm={async (mode) => {
            try {
              const response = await fetch('/api/payments/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: activeRecord.id, communicationModes: [mode] })
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
      )}
    </>
  )
}

// Individual Grid Card Component
function PaymentGridCard({ 
  record, 
  editingText, 
  setEditingText, 
  communicationChannels, 
  onUpdateRecord, 
  onStartEditingText, 
  onSaveEditedText,
  onSendReminder,
  onOpenQRCode,
  refreshPaymentData 
}: {
  record: PaymentRecord
  editingText: { id: string; text: string } | null
  setEditingText: (value: { id: string; text: string } | null) => void
  communicationChannels: string[]
  onUpdateRecord: (id: string, updates: Partial<PaymentRecord>) => void
  onStartEditingText: (record: PaymentRecord) => void
  onSaveEditedText: () => void
  onSendReminder: (record: PaymentRecord) => void
  onOpenQRCode: (record: PaymentRecord) => void
  refreshPaymentData?: () => void
}) {
  
  // Calculate dynamic payment status based on final payment and balance
  const calculateDynamicStatus = (): "Paid" | "Pending" | "-" => {
    if (record.finalPayment === 0 || record.finalPayment === null || record.finalPayment === undefined) {
      return "-";
    }
    if (record.balancePayment === 0) {
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

  return (
    <>
      <Card
        className="border-2 border-orange-400/20 rounded-xl shadow-sm hover:shadow-lg transition-shadow p-1 hover:border-orange-400/40"
        style={{ boxShadow: '0 0 0 2px #f97316' }}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">
                {record.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Student ID: {record.id}</p>
            </div>
            {dynamicStatus === "-" ? (
              <span className="text-gray-400 italic text-xs">N/A</span>
            ) : (
              <Badge className={`text-xs ${getStatusColor(dynamicStatus)}`}>
                {dynamicStatus}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Course Information */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">{record.program || record.activity} {record.program && record.program !== record.activity ? `(${record.activity})` : ''}</p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs border-purple-200">
                {record.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {record.courseType}
              </Badge>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Course Reg Fee:</span>
              <span className="font-medium">
                {record.registrationFees?.courseRegistration?.amount?.toLocaleString() ?? '-'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Student Reg Fee:</span>
              <span className="font-medium">
                {record.registrationFees?.studentRegistration?.amount?.toLocaleString() ?? '-'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Course Fee (INR):</span>
              <span className="font-medium">
                {(record.finalPayment || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Paid (INR):</span>
              <span className="font-medium text-green-600">
                {(record.totalPaidAmount && record.totalPaidAmount > 0 ? record.totalPaidAmount : 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Balance (INR):</span>
              <span className={(record.balancePayment || 0) > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                {(record.balancePayment || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Paid Date:</span>
              <span>
                {record.paidDate ? (
                  <span title={`Raw date: ${record.paidDate}`}>
                    {formatDateToDisplay(record.paidDate)}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">-</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Next Reminder Date:</span>
              <span className="text-gray-400 italic">-</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Reminder:</span>
              <Badge 
                variant={record.paymentStatus === 'Paid' || !record.paymentReminder ? "secondary" : "default"} 
                className={`text-xs ${record.paymentStatus !== 'Paid' ? 'cursor-pointer hover:opacity-80' : ''} ${
                  record.paymentStatus !== 'Paid' && record.paymentReminder 
                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-[#9234ea]' 
                    : ''
                }`}
                onClick={async () => {
                  if (record.paymentStatus !== 'Paid') {
                    const newReminderState = !record.paymentReminder;
                    
                    try {
                      const courseKey = record.matchedCourseId || record.activity || record.enrolledCourse || 'NA';
                      await onUpdateRecord(`${record.id}::${courseKey}`, { paymentReminder: newReminderState });
                      toast({
                        title: newReminderState ? "✔ Reminder Enabled" : "❌ Reminder Disabled",
                        description: `Payment reminders ${newReminderState ? 'enabled' : 'disabled'} for ${record.name}`,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Update Failed",
                        description: "Failed to update reminder setting. Please try again.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    toast({
                      title: "⚠️ Cannot Update",
                      description: "Reminders are automatically disabled for paid payments.",
                      variant: "default",
                    });
                  }
                }}
                title={record.paymentStatus === 'Paid' ? 'Reminders automatically disabled for paid payments' : 'Click to toggle reminder'}
              >
                {record.paymentStatus === 'Paid' ? "Off (Paid)" : (record.paymentReminder ? "On" : "Off")}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {/* Manual Payment Button */}
            {(record.finalPayment || 0) === 0 && 
             (record.totalPaidAmount || 0) === 0 && 
             (record.balancePayment || 0) === 0 ? (
              <div className="text-center">
                <span className="text-gray-400 text-xs">N/A</span>
              </div>
            ) : showPaymentOptions ? (
              <Button
                size="sm"
                onClick={handlePaymentButtonClick}
                className="w-full bg-[#9234ea] hover:bg-[#9234ea]/90 h-8 text-xs"
                title="Manual Payment"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Manual Payment
              </Button>
            ) : (
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                  Fully Paid
                </Badge>
              </div>
            )}

            {/* Payslip Button */}
            {(record.totalPaidAmount || 0) === 0 ? (
              <div className="text-center">
                <span className="text-gray-400 text-xs">No Payslip</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={generatePayslip}
                className="w-full border-[#9234ea]/30 h-8 text-xs"
                title="Generate Payslip"
              >
                <img src="/invoice-envelope.svg" alt="Payslip Icon" className="h-4 w-4 mr-1" />
                Generate Payslip
              </Button>
            )}

            {/* Send Reminder Button */}
            {(record.finalPayment || 0) === 0 && 
             (record.totalPaidAmount || 0) === 0 && 
             (record.balancePayment || 0) === 0 ? (
              <div className="text-center">
                <span className="text-gray-400 text-xs">N/A</span>
              </div>
            ) : (
              <>
                {record.balancePayment > 0 && dynamicStatus === 'Pending' ? (
                  record.paymentReminder ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        onSendReminder(record);
                      }}
                      className="w-full border-[#9234ea] hover:bg-[#9234ea] hover:text-white h-8 text-xs bg-white transition-colors duration-200 shadow-sm"
                      title="Send Payment Reminder"
                    >
                      <Send className="h-3 w-3 mr-1 text-[#9234ea]" />
                      Send Reminder
                    </Button>
                  ) : (
                    <div className="text-center">
                      <span className="text-gray-400 italic text-xs">Reminder Off</span>
                    </div>
                  )
                ) : dynamicStatus === 'Paid' ? (
                  <div className="text-center">
                    <span 
                      className="text-xs text-gray-500 px-2 py-1 bg-green-50 rounded border border-green-200" 
                      title="Payment completed - reminders disabled"
                    >
                      Paid
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-gray-400 italic text-xs">-</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Manual Payment Dialog */}
      <StudentManualPayment
        student={record}
        onSubmit={handleManualPayment}
        open={manualPaymentOpen}
        onOpenChange={setManualPaymentOpen}
      />

      {/* Already Paid Alert */}
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