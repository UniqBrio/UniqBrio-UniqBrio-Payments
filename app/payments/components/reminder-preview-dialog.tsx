"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PaymentRecord } from './payment-types'
import { Mail, MessageSquare, Phone, Loader2 } from "lucide-react"
import { useStudentCommunicationPreferences } from '@/hooks/use-student-communication-preferences'
import { toast } from "@/components/ui/use-toast"

interface ReminderPreviewDialogProps {
  record: PaymentRecord
  isOpen: boolean
  onClose: () => void
  onSendConfirm: () => void
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
  const [studentCommPrefs, setStudentCommPrefs] = useState<any>(null)
  const [fetchingPrefs, setFetchingPrefs] = useState(false)
  // Modes that are not yet implemented for sending
  const COMING_SOON_MODES = ['SMS']
  
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
      courseName: record.activity,
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
        return `Subject: 💳 Payment Reminder - ${baseInfo.courseName} Course | ${baseInfo.cohort}

Dear ${baseInfo.studentName},

This is a friendly reminder regarding your pending payment for the ${baseInfo.courseName} course.

STUDENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Student ID: ${baseInfo.studentId}
• Course: ${baseInfo.courseName}
• Cohort: ${baseInfo.cohort}

PAYMENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Course Fee: ${formatCurrency(baseInfo.totalFee)}
• Amount Paid: ${formatCurrency(baseInfo.paidAmount)}
• Balance Due: ${formatCurrency(baseInfo.balanceAmount)}
• Due Date: ${formatDate(baseInfo.dueDate)}

PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• UPI ID: ${baseInfo.upiId}
• Payment Link: ${baseInfo.paymentLink}
• QR Code: Available on request

${record.communicationText || 'Please complete your payment to secure your enrollment and continue your learning journey with us.'}

For any queries, feel free to contact our support team.

Best regards,
UniqBrio Academic Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: support@uniqbrio.com
📱 Phone: +91-XXXXX-XXXXX
🌐 Website: www.uniqbrio.com`

      case 'sms':
        return `Hi ${baseInfo.studentName}!

Payment reminder for ${baseInfo.courseName}
Balance Due: ${formatCurrency(baseInfo.balanceAmount)}
Due Date: ${formatDate(baseInfo.dueDate)}

Payment Options:
UPI: ${baseInfo.upiId}
Link: ${baseInfo.paymentLink}

Complete payment to secure your enrollment.

- UniqBrio Team`

      case 'whatsapp':
        return `Hi ${baseInfo.studentName}! 📚

*Payment Reminder - ${baseInfo.courseName}*

💰 *Amount Due:* ${formatCurrency(baseInfo.balanceAmount)}
📅 *Due Date:* ${formatDate(baseInfo.dueDate)}
🎓 *Course:* ${baseInfo.courseName}
👥 *Cohort:* ${baseInfo.cohort}

*Payment Options:*
🏦 *UPI ID:* ${baseInfo.upiId}
💳 *Payment Link:* ${baseInfo.paymentLink}

${record.communicationText || 'Complete payment to secure your enrollment! 🎯'}

For support: 📞 +91-XXXXX-XXXXX

*- UniqBrio Team* 🚀`

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
            const preferredChannels = preferences.channels || ['Email']
            // Pick first non-coming-soon mode; fallback to Email
            const preferredMode = preferredChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'Email'
            setSelectedMode(preferredMode)
            setMessageContent(generateReminderContent(preferredMode))
          } else {
            // Fallback to record preferences or default
            console.log('⚠️ No preferences from students collection, using fallback')
            const fallbackChannels = record.communicationPreferences?.channels || ['Email']
            const fallbackMode = fallbackChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'Email'
            setSelectedMode(fallbackMode)
            setMessageContent(generateReminderContent(fallbackMode))
          }
        } catch (error) {
          console.error('❌ Error fetching student preferences:', error)
          // Use record preferences as fallback
          const fallbackChannels = record.communicationPreferences?.channels || ['Email']
          const fallbackMode = fallbackChannels.find((c: string) => !COMING_SOON_MODES.includes(c)) || 'Email'
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
    setMessageContent(generateReminderContent(mode))
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
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
            <div className="flex gap-2">
              {['Email', 'SMS', 'WhatsApp'].map((mode) => {
                const isComingSoon = COMING_SOON_MODES.includes(mode)
                const isSelected = selectedMode === mode
                return (
                  <Button
                    key={mode}
                    variant="outline"
                    size="sm"
                    disabled={isComingSoon}
                    onClick={() => {
                      if (isComingSoon) {
                        toast({
                          title: `${mode} Coming Soon`,
                          description: `${mode} reminders are not yet enabled. Please choose another mode.`,
                        })
                        return
                      }
                      handleModeChange(mode)
                    }}
                    aria-pressed={isSelected}
                    title={isComingSoon ? `${mode} sending not yet available` : `${mode} mode`}
                    className={`flex items-center gap-1 transition-colors duration-200 border-[1.5px] relative
                      ${isComingSoon
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        : (isSelected
                            ? 'bg-[#9234ea] border-[#9234ea] text-white hover:bg-[#7a2cbe] hover:text-white'
                            : 'bg-white border-[#9234ea] text-[#9234ea] hover:bg-[#9234ea]/10 hover:text-[#9234ea]')}
                    `}
                  >
                    {getModeIcon(mode)}
                    {mode}
                    {isComingSoon && (
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-gray-200 text-gray-600">Soon</span>
                    )}
                    {!isComingSoon && (studentCommPrefs?.channels?.includes(mode as any) || record.communicationPreferences?.channels?.includes(mode as any)) && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {studentCommPrefs?.channels?.includes(mode) ? 'Student Preference' : 'Available'}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 p-3 rounded border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Student:</strong> {record.name}</div>
              <div><strong>ID:</strong> {record.id}</div>
              <div><strong>Course:</strong> {record.activity}</div>
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
                <div className="text-xs text-gray-600 mt-1">📡 Data fetched from students collection</div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {fetchingPrefs ? 'Fetching preferences...' : '⚠️ No student preferences found, using defaults'}
              </div>
            )}
          </div>
          
          {/* Message Content */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message Content:</label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="h-96 font-mono text-sm"
              placeholder="Reminder message content will appear here..."
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (COMING_SOON_MODES.includes(selectedMode)) {
                  toast({
                    title: `${selectedMode} Coming Soon`,
                    description: `Sending via ${selectedMode} is not yet enabled. Please pick Email or WhatsApp.`,
                  })
                  return
                }
                console.log('📤 REMINDER PREVIEW - Would send:', {
                  mode: selectedMode,
                  student: record.name,
                  content: messageContent
                });
                onSendConfirm();
                onClose();
              }} 
              className="bg-[#9234ea] hover:bg-[#7a2cbe]"
            >
              {getModeIcon(selectedMode)}
              Send {selectedMode} Reminder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}