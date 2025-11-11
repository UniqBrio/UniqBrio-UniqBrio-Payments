"use client"

import React, { useState, useEffect } from "react"
import QRCode from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PaymentRecord } from './payment-types'
import { Mail, MessageSquare, Phone, Loader2, Smartphone } from "lucide-react"
import { useStudentCommunicationPreferences } from '@/hooks/use-student-communication-preferences'
import { toast } from "@/components/ui/use-toast"

interface ReminderPreviewDialogProps {
  record: PaymentRecord
  isOpen: boolean
  onClose: () => void
  /** Called after user clicks send (only for non-coming-soon modes). Provides selected communication mode. */
  onSendConfirm: (mode: string) => void
}

// Utility function for formatting currency
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `₹${formattedNumber}`
}

// Utility function for formatting date
const formatDate = (dateString: string | null) => {
  if (!dateString || dateString === 'N/A') return 'N/A'
  try {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  } catch {
    return 'Invalid Date'
  }
}

export function ReminderPreviewDialog({ record, isOpen, onClose, onSendConfirm }: ReminderPreviewDialogProps) {
  const [messageContent, setMessageContent] = useState('')
  const [selectedMode, setSelectedMode] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [studentCommPrefs, setStudentCommPrefs] = useState<any>(null)
  const [fetchingPrefs, setFetchingPrefs] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  // Modes that are not yet implemented for sending
  // NOTE: SMS removed from this list to enable real sending
  const COMING_SOON_MODES: string[] = ['WhatsApp']

  // Fetch preview via API (used for coming soon modes or when we want server-format)
  const fetchPreview = async (mode: string) => {
    if (!record?.id) return
    try {
      setLoadingPreview(true)
      const res = await fetch(`/api/payments/reminder/preview?studentId=${encodeURIComponent(record.id)}&mode=${encodeURIComponent(mode)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.content) {
          setMessageContent(data.content)
        } else {
          setMessageContent(generateReminderContent(mode))
        }
      } else {
        setMessageContent(generateReminderContent(mode))
      }
    } catch (e) {
      console.error('Preview fetch failed:', e)
      setMessageContent(generateReminderContent(mode))
    } finally {
      setLoadingPreview(false)
    }
  }
  
  // Hook to fetch communication preferences from students collection
  const { 
    fetchCommunicationPreferences, 
    loading: prefsLoading, 
    error: prefsError 
  } = useStudentCommunicationPreferences()

  // Generate reminder message content based on communication mode
  const generateReminderContent = (mode: string) => {
    const baseInfo = {
      studentName: record.name,
      studentId: record.id,
      courseName: record.program || record.activity,
      courseCode: record.activity,
      cohort: record.cohort || 'Not Assigned',
      balanceAmount: record.balancePayment || 0,
      totalFee: record.finalPayment || 0,
      paidAmount: record.totalPaidAmount || 0,
      dueDate: record.nextPaymentDate,
      currency: record.currency || 'INR',
      upiId: record.paymentDetails?.upiId || 'uniqbrio@paytm',
      paymentLink: record.paymentDetails?.paymentLink || 'https://pay.uniqbrio.com'
    }

    switch (mode.toLowerCase()) {
      case 'email':
        return `Subject: Payment Reminder - ${baseInfo.courseName}

Dear ${baseInfo.studentName},

This is a payment reminder for your enrollment in ${baseInfo.courseName}.

Student ID: ${baseInfo.studentId}
Student Name: ${baseInfo.studentName} 
Course ID: ${baseInfo.courseCode}
Course Name: ${baseInfo.courseName}
Course Level: ${record.category || '-'}


Payment Summary:
- Course Fee: ${formatCurrency(baseInfo.totalFee)}
- Total Paid: ${formatCurrency(baseInfo.paidAmount)}
- Balance Fee: ${formatCurrency(baseInfo.balanceAmount)}


Payment Options:
- UPI: ${baseInfo.upiId}
- Link: ${baseInfo.paymentLink}

Please complete your payment Soon.

Best regards,
UniqBrio Academic Team
support@uniqbrio.com

Best regards,
UniqBrio Academic Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: support@uniqbrio.com
📱 Phone: +91-XXXXX-XXXXX
🌐 Website: www.uniqbrio.com`

      case 'sms':
        return `Payment Reminder
Student Id : ${baseInfo.studentId}
Student Name: ${baseInfo.studentName}
Course ID:${baseInfo.courseCode}
Course Name : ${baseInfo.courseName}
Course Level: ${record.category || '-'}
Outstanding: ${formatCurrency(baseInfo.balanceAmount)}
Pay via UPI: ${baseInfo.upiId}
Pay via Link: ${baseInfo.paymentLink}`

      case 'whatsapp':
        return `*Payment Reminder*

Hello ${baseInfo.studentName},

Student ID: ${baseInfo.studentId}
Student Name: ${baseInfo.studentName}
Course ID: ${baseInfo.courseCode}
Course Name: ${baseInfo.courseName}
Course Level: ${record.category || '-'}
Outstanding Amount: ${formatCurrency(baseInfo.balanceAmount)}

*Payment Options:*
UPI: ${baseInfo.upiId}
Link: ${baseInfo.paymentLink}

Please complete your payment by the due date.

UniqBrio Academic Team`

      case 'in app':
      case 'app':
        return `📱 In-App Notification

Payment Reminder for ${baseInfo.studentName}

Student ID: ${baseInfo.studentId}
Student Name: ${baseInfo.studentName}
Course ID: ${baseInfo.courseCode}
Course: ${baseInfo.courseName} 
Outstanding: ${formatCurrency(baseInfo.balanceAmount)}

Tap to pay now via:
• UPI: ${baseInfo.upiId}
• Payment Link: ${baseInfo.paymentLink}

- UniqBrio Team`

      default:
        return `Payment reminder for ${baseInfo.studentName} - ${baseInfo.courseName}`
    }
  }

  // Fetch communication preferences from students collection when dialog opens
  useEffect(() => {
    const fetchStudentPreferences = async () => {
      if (isOpen && record.id) {
        setFetchingPrefs(true)
        console.log('🔍 Fetching communication preferences for student:', record.id)
        
        try {
          const preferences = await fetchCommunicationPreferences(record.id)
          
          if (preferences) {
            console.log('✅ Student communication preferences:', preferences)
            setStudentCommPrefs(preferences)
            
            // Set initial mode from students collection preferences
            const preferredChannels = preferences.channels || ['In app']
            // Pick first non-coming-soon mode; fallback to In app
            const preferredMode = preferredChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'In app'
            setSelectedMode(preferredMode)
            setMessageContent(generateReminderContent(preferredMode))
          } else {
            // Fallback to record preferences or default
            console.log('⚠️ No preferences from students collection, using fallback')
            const fallbackChannels = record.communicationPreferences?.channels || ['In app']
            const fallbackMode = fallbackChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'In app'
            setSelectedMode(fallbackMode)
            setMessageContent(generateReminderContent(fallbackMode))
          }
        } catch (error) {
          console.error('❌ Error fetching student preferences:', error)
          // Use record preferences as fallback
          const fallbackChannels = record.communicationPreferences?.channels || ['In app']
          const fallbackMode = fallbackChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'In app'
          setSelectedMode(fallbackMode)
          setMessageContent(generateReminderContent(fallbackMode))
        } finally {
          setFetchingPrefs(false)
        }
      }
    }

    fetchStudentPreferences()
  }, [isOpen, record.id, fetchCommunicationPreferences])

  // Handle mode change
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
    // For coming soon modes, fetch from server so backend format stays in sync
    if (COMING_SOON_MODES.includes(mode)) {
      fetchPreview(mode)
    } else {
      setMessageContent(generateReminderContent(mode))
    }
    // regenerate QR for email/whatsapp (they support richer content)
    if (['Email','WhatsApp'].includes(mode)) {
      generateQR()
    }
  }

  // Get icon for communication mode
  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Phone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'in app':
      case 'app':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  // Generate QR code (UPI or payment link)
  const generateQR = async () => {
    try {
      const upiId = record.paymentDetails?.upiId || 'uniqbrio@paytm'
      const amount = record.balancePayment || 0
      // Prefer UPI string; fallback to payment link
      const value = upiId
        ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent('UniqBrio')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Payment for ' + (record.activity || 'Course'))}`
        : (record.paymentDetails?.paymentLink || 'https://pay.uniqbrio.com')
      const dataUrl = await QRCode.toDataURL(value, { width: 180, margin: 1 })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('QR generation failed:', err)
      setQrDataUrl('')
    }
  }

  // Generate QR initially when dialog opens for email/whatsapp default mode
  useEffect(() => {
    if (isOpen && ['Email','WhatsApp'].includes(selectedMode)) {
      generateQR()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedMode])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-0 shadow-xl [&>button]:top-2 [&>button]:right-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModeIcon(selectedMode)}
            Reminder Preview - {record.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Communication Mode Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Communication Mode:</label>
            <div className="flex gap-2 w-full">
              {['Email','In app', 'WhatsApp', 'SMS'].map((mode) => {
                const isSelected = selectedMode === mode
                const isComingSoon = mode === 'SMS' || mode === 'WhatsApp'
                return (
                  <div key={mode} className="flex flex-col items-center flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModeChange(mode)}
                      aria-pressed={isSelected}
                      title={`${mode} mode`}
                      disabled={isComingSoon}
                      className={`flex items-center justify-center gap-1 transition-colors duration-200 border-[1.5px] relative group w-full px-2
                        ${isComingSoon && isSelected
                          ? 'bg-gray-400 border-black text-white cursor-not-allowed'
                          : isComingSoon
                          ? 'bg-gray-200 border-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-200 hover:text-gray-600'
                          : isSelected
                          ? 'bg-[#9234ea] border-[#9234ea] text-white hover:bg-[#7a2cbe] hover:text-white'
                          : 'bg-white border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-600'}
                      `}
                    >
                      {getModeIcon(mode)}
                      {mode}
                      {isComingSoon && (
                        <span title="Coming Soon">🔜</span>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 p-3 rounded border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Student ID:</strong> {record.id}</div>
              <div><strong>Student Name:</strong> {record.name}</div>
              <div><strong>Course details:</strong> {record.program} ({record.activity})</div>
              <div><strong>Balance:</strong> {formatCurrency(record.balancePayment || 0)}</div>
            </div>
          </div>

          {/* Communication Preferences from Students Collection */}
          <div className="bg-blue-50 p-3 rounded border">
            <div className="flex items-center gap-2 mb-2">
              <strong className="text-sm">Student Communication Preferences:</strong>
              {fetchingPrefs && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {studentCommPrefs ? (
              <div className="text-sm space-y-1">
                <div><strong>Status:</strong> {studentCommPrefs.enabled ? '✅ Enabled' : '❌ Disabled'}</div>
                <div><strong>Preferred Channels:</strong> {studentCommPrefs.channels?.join(', ') || 'None'}</div>
                {/* <div className="text-xs text-gray-600 mt-1">📡 Data fetched from students collection</div> */}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {fetchingPrefs ? 'Fetching preferences...' : '⚠️ No student preferences found, using defaults'}
              </div>
            )}
          </div>
          
          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium block">Message Content:</label>
              {selectedMode === 'SMS' && (
                <span className="text-[11px] text-gray-500 font-mono">
                  {messageContent.length} chars{messageContent.length > 320 && ' (Long SMS, may split)'}
                </span>
              )}
            </div>
            <div className="relative">
              {loadingPreview && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading preview...
                </div>
              )}
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="h-96 font-mono text-sm"
                placeholder="Reminder message content will appear here..."
              />
              {selectedMode === 'SMS' && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Tip: Keep under 160 characters (current GSM segmenting) for a single SMS. Longer messages may be delivered as multiple parts.
                </p>
              )}
              {['Email','WhatsApp'].includes(selectedMode) && (
                <div className="mt-3 flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs font-medium text-gray-600">Payment QR</div>
                    <div className="p-2 bg-white border rounded shadow-sm">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="Payment QR" className="w-40 h-40" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center text-[10px] text-gray-400">Generating QR...</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (qrDataUrl) {
                          const a = document.createElement('a')
                          a.href = qrDataUrl
                          a.download = `${record.name}-payment-qr.png`
                          a.click()
                        }
                      }}
                      className="text-[10px] text-[#9234ea] hover:underline"
                    >Download QR</button>
                  </div>
                  <div className="flex-1 text-[11px] text-gray-600 space-y-1">
                    <p className="font-medium">Included Payment Options:</p>
                    <ul className="list-disc ml-4">
                      {record.paymentDetails?.upiId && <li>UPI ID: {record.paymentDetails.upiId}</li>}
                      {record.paymentDetails?.paymentLink && <li>Payment Link</li>}
                      <li>Amount: ₹{(record.balancePayment || 0).toLocaleString()}</li>
                      <li>Course: {record.activity}</li>
                    </ul>
                    <p className="text-[10px] text-gray-500">QR auto-generated for Email & WhatsApp previews.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (COMING_SOON_MODES.includes(selectedMode)) {
                  toast({
                    title: `${selectedMode} Sending Coming Soon`,
                    description: `Preview shown. Sending via ${selectedMode} will be enabled shortly.`,
                  })
                  return
                }
                const mode = selectedMode || 'Email'
                console.log('📤 REMINDER PREVIEW - Sending:', {
                  mode,
                  student: record.name,
                  content: messageContent
                });
                                
                // Fire callback so parent can show toast & trigger API
                onSendConfirm(mode)
                
                // Show custom success dialog
                setSuccessMessage(`✅ Sent ${mode} Reminder\nReminder has been sent to ${record.name}`)
                setShowSuccessDialog(true)
                
                // Auto close after 1 second
                setTimeout(() => {
                  setShowSuccessDialog(false)
                  onClose()
                }, 1000)
              }} 
              className={`bg-[#9234ea] hover:bg-[#7a2cbe]`}
            >
              {getModeIcon(selectedMode)}
              {`Send ${selectedMode || 'Email'} Reminder`}
            </Button>
          </div>
        </div>
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
            {/* <Button 
              onClick={() => {
                setShowSuccessDialog(false)
                onClose()
              }}
              className="bg-[#9234ea] hover:bg-[#7a2cbe]"
            >
              OK
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}