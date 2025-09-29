"use client"

import { toast } from "@/components/ui/use-toast"
import { PaymentRecord } from './payment-types'

// Utility function for formatting currency
const formatCurrency = (amount: number, currency: string = "INR") => {
  const numericAmount = isNaN(amount) ? 0 : amount
  const formattedNumber = new Intl.NumberFormat('en-IN').format(numericAmount)
  return `${formattedNumber} ${currency}`
}

export interface ReminderActionsProps {
  record: PaymentRecord
  onReminderSent?: () => void
}

export function useReminderActions({ record, onReminderSent }: ReminderActionsProps) {
    const handleReminderSend = async (record: PaymentRecord, channels: string[]) => {
    console.log(`Sending reminder to ${record.name} via:`, channels)
    
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "📤 Sending Reminder...",
        description: `Preparing to send reminder to ${record.name} via ${channels.join(', ')}`,
      })

      // Call the API to send actual reminders
      console.log('🚀 SENDING TO API:', {
        studentId: record.id,
        communicationModes: channels,
        recordData: { name: record.name, activity: record.activity }
      });

      const response = await fetch('/api/payments/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: record.id,
          communicationModes: channels
        })
      })

      console.log('📡 API Response Status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API Response Error:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Reminder Sent Successfully",
          description: `${result.message} to ${result.studentName}`,
        })

        // Log successful channels
        console.log('✅ Reminder sent successfully:', result)
        
        onReminderSent?.()
      } else {
        toast({
          title: "⚠️ Partial Success",
          description: result.message || 'Some reminders failed to send',
          variant: "destructive"
        })
        
        console.warn('⚠️ Partial reminder success:', result)
      }

    } catch (error) {
      console.error('❌ Failed to send reminder:', error)
      
      toast({
        title: "❌ Reminder Failed",
        description: `Failed to send reminder to ${record.name}. Please try again.`,
        variant: "destructive"
      })
    }
  }

  // These functions are now handled by the unified API
  // They serve as reference for message formats and can be used for previews
  
  // SMS Reminder Format (handled by API)
  const getSMSPreview = (record: PaymentRecord, paymentDetails: any) => {
    return `Hi ${paymentDetails.studentName}! 

Payment reminder for ${paymentDetails.courseName}
Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString('en-US')}

${paymentDetails.upiId ? `UPI: ${paymentDetails.upiId}` : ''}
${paymentDetails.paymentLink ? `Link: ${paymentDetails.paymentLink}` : ''}

Complete payment to secure your seat.
- UniqBrio Team`
  }

  // WhatsApp Reminder Format (handled by API)
  const getWhatsAppPreview = (record: PaymentRecord, paymentDetails: any) => {
    return `Hi ${paymentDetails.studentName}! 📚

*Payment Reminder - ${paymentDetails.courseName}*

💰 Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
📅 Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString('en-US')}

*Payment Options:*
${paymentDetails.upiId ? `🏦 UPI: ${paymentDetails.upiId}` : ''}
${paymentDetails.paymentLink ? `💳 Link: ${paymentDetails.paymentLink}` : ''}

Complete payment to secure enrollment! 🎓

- UniqBrio Team 🚀`
  }

  // Email Reminder Format (handled by API and EmailPreviewDialog)
  const getEmailPreview = (record: PaymentRecord, paymentDetails: any) => {
    return {
      subject: `Payment Reminder - ${paymentDetails.courseName} | ${record.cohort} - UniqBrio`,
      body: `Dear ${paymentDetails.studentName},

${record.communicationText}

PAYMENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Course: ${paymentDetails.courseName}  
• Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
• Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString('en-US')}
• Status: ${record.paymentStatus}

PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${paymentDetails.upiId ? `• UPI ID: ${paymentDetails.upiId}` : ''}
${paymentDetails.paymentLink ? `• Payment Link: ${paymentDetails.paymentLink}` : ''}
• QR Code: Available in attachment

Please complete your payment to secure your seat.

Best regards,
UniqBrio Academic Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 support@uniqbrio.com | 🌐 www.uniqbrio.com`
    }
  }

  // WhatsApp Reminder with UPI ID and Payment Link
  const sendWhatsAppReminder = (record: PaymentRecord, paymentDetails: any) => {
    const message = `Hi ${paymentDetails.studentName}! 🎓

Your payment reminder for *${paymentDetails.courseName}*
💰 Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
📅 Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString('en-US')}

*Payment Options:*
${paymentDetails.upiId ? `📱 UPI ID: ${paymentDetails.upiId}` : ''}
${paymentDetails.paymentLink ? `🔗 Payment Link: ${paymentDetails.paymentLink}` : ''}

Please complete your payment to continue your course.

Best regards,
UniqBrio Team ✨`

    // Here you would integrate with WhatsApp API
    console.log("WhatsApp Reminder:", message)
  }

  return {
    handleSendReminder: handleReminderSend,
    getSMSPreview,
    getWhatsAppPreview,
    getEmailPreview
  }
}