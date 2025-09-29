"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { PaymentRecord } from './payment-types'
import QRCodeLib from 'qrcode'
import { Mail } from "lucide-react"

// Utility functions
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `${formattedNumber} ${currency}`
}

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

export interface EmailPreviewDialogProps {
  record: PaymentRecord
  isOpen: boolean
  onClose: () => void
  generatedQR: string
  setGeneratedQR: (qr: string) => void
}

export function EmailPreviewDialog({ record, isOpen, onClose, generatedQR, setGeneratedQR }: EmailPreviewDialogProps) {
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' })

  const showEmailPreview = async () => {
    // Generate QR code if not already generated
    if (!generatedQR && record.paymentDetails.upiId) {
      try {
        const upiString = `upi://pay?pa=${record.paymentDetails.upiId}&pn=UniqBrio&am=${record.balancePayment}&cu=INR&tn=Payment for ${record.activity}`
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
      }
    }

    const subject = `Payment Reminder - ${record.activity} | ${record.cohort} - UniqBrio`
    const body = `Dear ${record.name},

${record.communicationText}

COHORT & COURSE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Course: ${record.activity}
• Cohort: ${record.cohort || 'Not Assigned'}
• Batch: ${record.batch || 'Not Assigned'}
• Instructor: ${record.instructor || 'TBD'}
• Class Schedule: ${record.classSchedule || 'TBD'}
• Course Type: ${record.courseType}
• Category: ${record.category}
• Course Start Date: ${formatDate(record.courseStartDate || null)}

PAYMENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Student ID: ${record.id}
• Total Course Fee: ${formatCurrency(record.finalPayment, record.currency)}
• Amount Paid: ${formatCurrency(record.totalPaidAmount, record.currency)}
• Balance Due: ${formatCurrency(record.balancePayment, record.currency)}
• Payment Status: ${record.paymentStatus}
• Due Date: ${formatDate(record.nextPaymentDate)}
• Payment Frequency: ${record.paymentFrequency}

COURSE-WISE SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This payment is specifically for your enrollment in "${record.activity}".
Your cohort "${record.cohort}" includes students with similar learning goals and schedule.

Key Details:
✓ Batch Timing: ${record.classSchedule || 'To be confirmed'}
✓ Course Duration: As per curriculum guidelines  
✓ Learning Mode: ${record.courseType} sessions
✓ Support Level: ${record.category} student support

PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${record.paymentDetails.upiId ? `• UPI ID: ${record.paymentDetails.upiId}` : ''}
${record.paymentDetails.paymentLink ? `• Payment Link: ${record.paymentDetails.paymentLink}` : ''}
• QR Code: Available in attachment below
• Payment Modes: UPI, Card, Bank Transfer

IMPORTANT REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Complete payment to secure your seat in ${record.cohort}
• Late payments may affect your batch allocation
• Contact support for payment assistance if needed
• Keep your payment receipt for future reference

We're excited to have you as part of the ${record.cohort} learning community!

Best regards,
UniqBrio Academic Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: support@uniqbrio.com
📱 Phone: +91 XXXXX XXXXX
🌐 Website: www.uniqbrio.com`

    setEmailContent({ subject, body })
  }

  const sendEmailReminder = async () => {
    try {
      // Show loading state
      toast({
        title: "📤 Sending Email...",
        description: `Preparing to send email reminder to ${record.name}`,
      })

      // Call the unified API to send email reminder
      const response = await fetch('/api/payments/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: record.id,
          communicationModes: ['Email']
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Email Sent Successfully",
          description: `Payment reminder email sent to ${record.name}`,
        })
        
        console.log('✅ Email sent successfully:', result)
        onClose()
      } else {
        toast({
          title: "❌ Email Failed",
          description: result.message || 'Failed to send email reminder',
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('❌ Failed to send email:', error)
      
      toast({
        title: "❌ Email Failed",
        description: `Failed to send email to ${record.name}. Please try again.`,
        variant: "destructive"
      })
    }
  }

  // Generate email content when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      showEmailPreview()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview - Payment Reminder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject:</label>
            <div className="p-3 bg-gray-50 rounded border">
              {emailContent.subject}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Body:</label>
            <Textarea
              value={emailContent.body}
              onChange={(e) => setEmailContent(prev => ({ ...prev, body: e.target.value }))}
              className="h-96 font-mono text-sm"
              placeholder="Email content will appear here..."
            />
          </div>
          
          {generatedQR && (
            <div>
              <label className="text-sm font-medium">QR Code Attachment:</label>
              <div className="p-4 bg-gray-50 rounded border inline-block">
                <img src={generatedQR} alt="Payment QR Code" className="w-32 h-32" />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={sendEmailReminder} className="bg-[#9234ea] hover:bg-[#7a2cbe]">
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}