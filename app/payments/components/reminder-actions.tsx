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
  const handleSendReminder = () => {
    const paymentDetails = {
      qrCode: record.paymentDetails.qrCode,
      upiId: record.paymentDetails.upiId,
      paymentLink: record.paymentDetails.paymentLink,
      amount: record.balancePayment,
      studentName: record.name,
      courseName: record.activity,
      dueDate: record.nextPaymentDate
    }

    // Send reminder with payment details based on communication preferences
    const channels = record.communicationPreferences?.channels || [record.reminderMode || 'Email'];
    
    channels.forEach(channel => {
      if (channel === "SMS") {
        sendSMSReminder(record, paymentDetails)
      } else if (channel === "WhatsApp") {
        sendWhatsAppReminder(record, paymentDetails)
      } else if (channel === "Email" || channel === "In App") {
        // Email reminders are handled separately through EmailPreviewDialog
      }
    });

    toast({
      title: "✔ Payment Reminder Sent",
      description: `Reminder with payment options sent to ${record.name} via ${channels.join(', ')}`,
    })

    onReminderSent?.()
  }

  // SMS Reminder with UPI ID and Payment Link
  const sendSMSReminder = (record: PaymentRecord, paymentDetails: any) => {
    const message = `Hi ${paymentDetails.studentName}, 
    
Payment reminder for ${paymentDetails.courseName}
Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString()}

Payment Options:
${paymentDetails.upiId ? `UPI ID: ${paymentDetails.upiId}` : ''}
${paymentDetails.paymentLink ? `Payment Link: ${paymentDetails.paymentLink}` : ''}

Pay now to avoid late fees.
- UniqBrio Team`

    // Here you would integrate with SMS API
    console.log("SMS Reminder:", message)
  }

  // WhatsApp Reminder with UPI ID and Payment Link
  const sendWhatsAppReminder = (record: PaymentRecord, paymentDetails: any) => {
    const message = `Hi ${paymentDetails.studentName}! 🎓

Your payment reminder for *${paymentDetails.courseName}*
💰 Amount Due: ${formatCurrency(paymentDetails.amount, record.currency)}
📅 Due Date: ${new Date(paymentDetails.dueDate).toLocaleDateString()}

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
    handleSendReminder
  }
}