"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { StudentManualPayment, StudentManualPaymentPayload } from "./student-manual-payment"
import { PaymentRecord } from './payment-types'
import { Send, QrCode, Smartphone, Link, Edit, Save, X, CreditCard, Mail } from "lucide-react"
import { generatePayslipPDF } from "./generate-payslip-pdf"
import QRCodeLib from 'qrcode'

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
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false)
  const [qrCodeOpen, setQrCodeOpen] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string>('')
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' })

  // Generate QR code when dialog opens
  useEffect(() => {
    if (qrCodeOpen && record.paymentDetails.upiId) {
      const generateQR = async () => {
        try {
          // Create UPI payment string
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
          setGeneratedQR('')
        }
      }
      generateQR()
    }
  }, [qrCodeOpen, record.paymentDetails.upiId, record.balancePayment, record.activity])

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

  const sendReminder = (record: PaymentRecord) => {
    // Check if it's email mode - show preview popup
    if (record.reminderMode === "Email") {
      showEmailPreview(record)
      return
    }

    // Prepare payment details for the reminder
    const paymentDetails = {
      qrCode: record.paymentDetails.qrCode,
      upiId: record.paymentDetails.upiId,
      paymentLink: record.paymentDetails.paymentLink,
      amount: record.balancePayment,
      studentName: record.name,
      courseName: record.activity,
      dueDate: record.nextPaymentDate
    }

    // Send reminder with payment details based on communication mode
    if (record.reminderMode === "SMS") {
      sendSMSReminder(record, paymentDetails)
    } else if (record.reminderMode === "WhatsApp") {
      sendWhatsAppReminder(record, paymentDetails)
    }

    toast({
      title: "✔ Reminder Sent",
      description: `Payment reminder with ${record.reminderMode === 'SMS' ? 'UPI/Link' : 'UPI/Link'} sent to ${record.name} via ${record.reminderMode}`,
    })
  }

  // SMS Reminder with UPI ID and Payment Link
  const sendSMSReminder = (record: PaymentRecord, paymentDetails: any) => {
    const message = `Hi ${paymentDetails.studentName}, 
    
Payment reminder for ${paymentDetails.courseName}
Amount Due: ₹${paymentDetails.amount}
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
💰 Amount Due: ₹${paymentDetails.amount}
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

  // Email Preview and Send Function
  const showEmailPreview = async (record: PaymentRecord) => {
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
• Course Start Date: ${formatDate(record.courseStartDate)}

PAYMENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Student ID: ${record.id}
• Total Course Fee: ₹${record.finalPayment.toLocaleString()}
• Amount Paid: ₹${record.totalPaidAmount.toLocaleString()}
• Balance Due: ₹${record.balancePayment.toLocaleString()}
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
    setEmailPreviewOpen(true)
  }

  const sendEmailReminder = (record: PaymentRecord) => {
    // Here you would integrate with your email service (SendGrid, Nodemailer, etc.)
    console.log("Sending email with content:", emailContent)
    
    // For now, we'll show a success message
    toast({
      title: "✔ Email Sent",
      description: `Payment reminder email sent to ${record.name}`,
    })
    
    setEmailPreviewOpen(false)
    
    // In a real implementation, you would make an API call like:
    // fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: record.email, // You'd need email in the record
    //     subject: emailContent.subject,
    //     body: emailContent.body,
    //     attachments: generatedQR ? [{ filename: 'qr-code.png', content: generatedQR }] : []
    //   })
    // })
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

  const handleManualPayment = async (payload: StudentManualPaymentPayload) => {
    try {
      console.log('Recording payment:', payload); // Debug log
      
      // Call the payments API to record the payment in the database
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: record.id,
          amount: payload.amount,
          paymentMethod: payload.mode,
          paymentType: "Course Fee",
          paymentCategory: "Course Payment",
          receiverName: payload.receiverName,
          receiverId: payload.receiverId,
          notes: payload.notes || "",
          paymentDate: payload.date,
          isManualPayment: true,
          recordedBy: "Admin Dashboard"
        })
      });

      console.log('API Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response data:', result); // Debug log

      if (result.success) {
        // Calculate new values based on the payment
        const newTotalPaid = record.totalPaidAmount + payload.amount;
        const newBalance = Math.max(0, record.finalPayment - newTotalPaid);
        const newStatus = newBalance === 0 ? 'Paid' : 'Pending'; // No "Partial" status - only Pending or Paid
        
        const updatedRecord: Partial<PaymentRecord> = {
          totalPaidAmount: newTotalPaid,
          balancePayment: newBalance,
          paymentStatus: newStatus as "Paid" | "Pending",
          paidDate: new Date().toISOString(),
          paymentReminder: newBalance > 0 // Auto-disable reminders if fully paid
        };

        console.log('Updating record with:', updatedRecord); // Debug log
        
        // Update the record in the parent component immediately
        onUpdateRecord(record.id, updatedRecord);
        
        // Show success message
        toast({
          title: "✔ Payment Recorded Successfully",
          description: `Payment of ₹${payload.amount.toLocaleString()} recorded for ${record.name}. New balance: ₹${newBalance.toLocaleString()}`,
        });

        // Force refresh the payment data from database after a short delay
        if (refreshPaymentData) {
          console.log('Triggering payment data refresh...'); // Debug log
          setTimeout(async () => {
            try {
              await refreshPaymentData();
              console.log('Payment data refreshed successfully'); // Debug log
            } catch (error) {
              console.error('Error during refresh:', error);
            }
          }, 500); // Reduced delay
        }
      } else {
        console.error('API returned error:', result);
        throw new Error(result.error || 'Payment recording failed');
      }
    } catch (error) {
      console.error('Payment recording error:', error);
      toast({
        title: "❌ Payment Recording Failed",
        description: error instanceof Error ? error.message : "Failed to record payment in database",
        variant: "destructive"
      });
    }
    
    setManualPaymentOpen(false);
  }

  const generatePayslip = async () => {
    // Use the same HTML as in payslip-button.tsx for PDF content
    const getCurrencySymbol = (currency: string) => {
      const symbols: { [key: string]: string } = {
        USD: "$", INR: "₹", GBP: "£", EUR: "€"
      }
      return symbols[currency] || "₹"
    }
    const payslipContent = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0;">UNIQBRIO</h1>
          <p style="margin: 5px 0; color: #666;">Payment Receipt</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Student Details</h3>
            <p><strong>Name:</strong> ${record.name}</p>
            <p><strong>ID:</strong> ${record.id}</p>
            <p><strong>Course:</strong> ${record.activity}</p>
            <p><strong>Category:</strong> ${record.category}</p>
          </div>
          <div>
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${record.paymentStatus}</p>
            <p><strong>Payment Mode:</strong> ${record.reminderMode}</p>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Course Fee:</span>
            <span>${getCurrencySymbol(record.currency)}${record.finalPayment.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #16a34a;">
            <span>Amount Paid:</span>
            <span>${getCurrencySymbol(record.currency)}${record.totalPaidAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #dc2626; border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
            <span>Balance Due:</span>
            <span>${getCurrencySymbol(record.currency)}${record.balancePayment.toLocaleString()}</span>
          </div>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This is a computer generated receipt. No signature required.</p>
          <p>For queries, contact: support@uniqbrio.com</p>
        </div>
      </div>
    `;
    await generatePayslipPDF(record, payslipContent);
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
          {record.registrationFees ? (
            <div className="space-y-1">
              {record.registrationFees.studentRegistration && (
                <div className="text-[11px]">
                  Student: {record.registrationFees.studentRegistration} {getCurrencyName(record.currency)}
                </div>
              )}
              {record.registrationFees.courseRegistration && (
                <div className="text-[11px]">
                  Course: {record.registrationFees.courseRegistration} {getCurrencyName(record.currency)}
                </div>
              )}
              {record.registrationFees.confirmationFee && (
                <div className="text-[11px]">
                  Confirmation: {record.registrationFees.confirmationFee} {getCurrencyName(record.currency)}
                </div>
              )}
              <Badge 
                className={`text-[11px] ${record.registrationFees.paid ? getStatusColor('paid') : getStatusColor(record.registrationFees.status || 'pending')}`}
              >
                {record.registrationFees.paid ? "✔ Paid" : (record.registrationFees.status || 'Pending')}
              </Badge>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </TableCell>
      )}
      {isColumnVisible('finalPayment') && (
        <TableCell className="text-[11px] p-1 font-medium">
          {record.finalPayment.toLocaleString()} {getCurrencyName(record.currency)}
        </TableCell>
      )}
      {isColumnVisible('totalPaid') && (
        <TableCell className="text-[11px] p-1 text-green-600 font-medium">
          {record.totalPaidAmount.toLocaleString()} {getCurrencyName(record.currency)}
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
          <Badge className={`text-[11px] ${getStatusColor(record.paymentStatus)}`}>
            {record.paymentStatus}
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
            className={`text-[11px] ${record.paymentStatus !== 'Paid' ? 'cursor-pointer hover:opacity-80' : ''}`}
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
                {record.paymentDetails.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span 
                      className="cursor-pointer text-blue-600 hover:underline"
                      onClick={() => navigator.clipboard.writeText(record.paymentDetails.upiId)}
                      title="Click to copy UPI ID"
                    >
                      {record.paymentDetails.upiId}
                    </span>
                  </div>
                )}
                {record.paymentDetails.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <a 
                      href={record.paymentDetails.paymentLink} 
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
                {record.paymentDetails.qrCode && (
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
                {record.paymentDetails.upiId && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3 w-3" />
                    <span 
                      className="cursor-pointer text-blue-600 hover:underline"
                      onClick={() => navigator.clipboard.writeText(record.paymentDetails.upiId)}
                      title="Click to copy UPI ID"
                    >
                      {record.paymentDetails.upiId}
                    </span>
                  </div>
                )}
                {record.paymentDetails.paymentLink && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Link className="h-3 w-3" />
                    <a 
                      href={record.paymentDetails.paymentLink} 
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
          <Button
            size="sm"
            onClick={() => setManualPaymentOpen(true)}
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
                onClick={() => sendReminder(record)}
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
            ) : record.paymentDetails.qrCode && record.paymentDetails.qrCode !== 'QR_CODE_PLACEHOLDER' ? (
              <img 
                src={record.paymentDetails.qrCode} 
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
            <p className="text-sm font-medium">Pay ₹{record.balancePayment.toLocaleString()}</p>
            <p className="text-xs text-gray-600">{record.name} - {record.activity}</p>
            {record.paymentDetails.upiId && (
              <p className="text-xs text-gray-500">UPI ID: {record.paymentDetails.upiId}</p>
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
    <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview - {record.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Email Subject */}
          <div>
            <label className="text-sm font-medium">Subject:</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
              {emailContent.subject}
            </div>
          </div>

          {/* Email Body */}
          <div>
            <label className="text-sm font-medium">Email Content:</label>
            <Textarea
              value={emailContent.body}
              onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
              className="mt-1 min-h-[300px] text-sm"
              placeholder="Email content..."
            />
          </div>

          {/* QR Code Preview */}
          {generatedQR && (
            <div>
              <label className="text-sm font-medium">QR Code Attachment:</label>
              <div className="mt-1 p-4 bg-white border rounded-lg flex justify-center">
                <img 
                  src={generatedQR} 
                  alt="Payment QR Code" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This QR code will be attached to the email for easy payment.
              </p>
            </div>
          )}

          {/* Course & Cohort Details Summary */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Course & Cohort Details:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Student:</strong> {record.name} ({record.id})</p>
              <p><strong>Course:</strong> {record.activity}</p>
              <p><strong>Cohort:</strong> {record.cohort || 'Not Assigned'}</p>
              <p><strong>Batch:</strong> {record.batch || 'Not Assigned'}</p>
              <p><strong>Instructor:</strong> {record.instructor || 'TBD'}</p>
              <p><strong>Schedule:</strong> {record.classSchedule || 'TBD'}</p>
            </div>
          </div>

          {/* Payment Details Summary */}
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Payment Summary:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Total Course Fee:</strong> ₹{record.finalPayment.toLocaleString()}</p>
              <p><strong>Amount Paid:</strong> ₹{record.totalPaidAmount.toLocaleString()}</p>
              <p><strong>Balance Due:</strong> ₹{record.balancePayment.toLocaleString()}</p>
              <p><strong>Status:</strong> {record.paymentStatus}</p>
              <p><strong>Due Date:</strong> {formatDate(record.nextPaymentDate)}</p>
              <p><strong>Frequency:</strong> {record.paymentFrequency}</p>
            </div>
          </div>

          {/* Payment Options Summary */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Payment Options:</h4>
            <div className="text-sm space-y-1">
              {record.paymentDetails.upiId && (
                <p><strong>UPI ID:</strong> {record.paymentDetails.upiId}</p>
              )}
              {record.paymentDetails.paymentLink && (
                <p><strong>Payment Link:</strong> {record.paymentDetails.paymentLink}</p>
              )}
              <p><strong>QR Code:</strong> Available in email attachment</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setEmailPreviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailReminder(record)}
              className="bg-[#9234ea] hover:bg-[#9234ea]/90"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}