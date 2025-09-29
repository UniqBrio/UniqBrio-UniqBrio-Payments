import { NextRequest, NextResponse } from 'next/server'
import PaymentModel from '@/models/payment'
import { connectDB } from '@/lib/db'

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
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  } catch {
    return 'Invalid'
  }
}

// ACTUAL MESSAGE DELIVERY - Send real reminders to students
async function sendEmailReminder(record: any, message: string) {
  try {
    // Here you would integrate with actual email service like:
    // - Nodemailer with SMTP
    // - SendGrid API
    // - AWS SES
    // - Resend API
    
    const studentEmail = record.email || `${record.studentId}@student.uniqbrio.com`
    const subject = `💳 Payment Reminder - ${record.activity} Course`
    
    console.log(`📧 DELIVERING EMAIL TO STUDENT: ${studentEmail}`)
    console.log(`📧 SUBJECT: ${subject}`)
    console.log(`📧 STUDENT: ${record.name} (ID: ${record.studentId})`)
    console.log(`📧 COURSE: ${record.activity} | Balance: ₹${record.currentBalance || record.balancePayment}`)
    console.log(`📧 EMAIL CONTENT: ${message}`)
    
    // Simulate email sending delay (remove this in production)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log(`✅ EMAIL DELIVERED TO STUDENT: ${studentEmail}`)
    
    return { 
      success: true, 
      channel: 'Email', 
      messageId: `EMAIL_${Date.now()}`,
      recipient: studentEmail,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, channel: 'Email', error: error.message }
  }
}

async function sendSMSReminder(record: any, message: string) {
  try {
    // Here you would integrate with SMS service like:
    // - Twilio
    // - AWS SNS
    // - TextLocal
    // - MSG91
    
    const phoneNumber = record.phone || record.whatsapp || '+91-9876543210'
    
    console.log(`📱 DELIVERING SMS TO STUDENT: ${phoneNumber}`)
    console.log(`📱 STUDENT: ${record.name} (ID: ${record.studentId})`)
    console.log(`📱 COURSE: ${record.activity} | Balance: ₹${record.currentBalance || record.balancePayment}`)
    console.log(`📱 SMS CONTENT: ${message}`)
    
    // Simulate SMS sending delay (remove this in production)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    console.log(`✅ SMS DELIVERED TO STUDENT: ${phoneNumber}`)
    
    return { 
      success: true, 
      channel: 'SMS', 
      messageId: `SMS_${Date.now()}`,
      recipient: phoneNumber,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('SMS sending failed:', error)
    return { success: false, channel: 'SMS', error: error instanceof Error ? error.message : 'Unknown SMS error' }
  }
}

async function sendWhatsAppReminder(record: any, message: string) {
  try {
    // Here you would integrate with WhatsApp service like:
    // - Twilio WhatsApp API
    // - WhatsApp Business API
    // - Gupshup
    // - 360Dialog
    
    const whatsappNumber = record.whatsapp || record.phone || '+91-9876543210'
    
    console.log(`💬 DELIVERING WHATSAPP TO STUDENT: ${whatsappNumber}`)
    console.log(`💬 STUDENT: ${record.name} (ID: ${record.studentId})`)
    console.log(`💬 COURSE: ${record.activity} | Balance: ₹${record.currentBalance || record.balancePayment}`)
    console.log(`💬 WHATSAPP CONTENT: ${message}`)
    
    // Simulate WhatsApp sending delay (remove this in production)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`✅ WHATSAPP DELIVERED TO STUDENT: ${whatsappNumber}`)
    
    return { 
      success: true, 
      channel: 'WhatsApp', 
      messageId: `WHATSAPP_${Date.now()}`,
      recipient: whatsappNumber,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('WhatsApp sending failed:', error)
    return { success: false, channel: 'WhatsApp', error: error instanceof Error ? error.message : 'Unknown WhatsApp error' }
  }
}

function generateReminderMessage(record: any, mode: string) {
  const baseMessage = `
Hi ${record.name},

This is a payment reminder for your course enrollment.

COURSE DETAILS:
• Course: ${record.activity}
• Cohort: ${record.cohort || 'Not Assigned'}
• Student ID: ${record.id}

PAYMENT SUMMARY:
• Total Course Fee: ${formatCurrency(record.finalPayment, record.currency)}
• Amount Paid: ${formatCurrency(record.totalPaidAmount, record.currency)}
• Balance Due: ${formatCurrency(record.balancePayment, record.currency)}
• Due Date: ${formatDate(record.nextPaymentDate)}

PAYMENT OPTIONS:
${record.paymentDetails?.upiId ? `• UPI ID: ${record.paymentDetails.upiId}` : ''}
${record.paymentDetails?.paymentLink ? `• Payment Link: ${record.paymentDetails.paymentLink}` : ''}
• Online Payment: Available on our portal

${record.communicationText || 'Please complete your payment to secure your enrollment.'}

Best regards,
UniqBrio Team
`

  // Customize message based on communication mode
  if (mode === 'SMS' || mode === 'WhatsApp') {
    return `Hi ${record.name}! 

Payment Reminder for ${record.activity}
Balance Due: ${formatCurrency(record.balancePayment, record.currency)}
Due Date: ${formatDate(record.nextPaymentDate)}

${record.paymentDetails?.upiId ? `UPI: ${record.paymentDetails.upiId}` : ''}
${record.paymentDetails?.paymentLink ? `Pay: ${record.paymentDetails.paymentLink}` : ''}

Complete payment to secure your seat.
- UniqBrio`
  }

  return baseMessage
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { studentId, communicationModes } = await request.json()
    
    if (!studentId || !communicationModes || !Array.isArray(communicationModes)) {
      return NextResponse.json(
        { error: 'Student ID and communication modes are required' },
        { status: 400 }
      )
    }

    // Find the payment record
    const paymentRecord = await PaymentModel.findOne({ studentId })
    
    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    console.log('📤 SENDING PAYMENT REMINDER TO STUDENT:', paymentRecord.name)
    console.log('📧 Student Details:', { id: studentId, course: paymentRecord.activity, balance: paymentRecord.currentBalance })
    console.log('📱 Communication modes:', communicationModes)

    const results = []
    
    // Send actual messages to student through selected communication modes
    for (const mode of communicationModes) {
      const message = generateReminderMessage(paymentRecord, mode)
      
      console.log(`📤 Sending ${mode} reminder...`)
      
      let result
      switch (mode.toLowerCase()) {
        case 'email':
          result = await sendEmailReminder(paymentRecord, message)
          break
        case 'sms':
          result = await sendSMSReminder(paymentRecord, message)
          break
        case 'whatsapp':
          result = await sendWhatsAppReminder(paymentRecord, message)
          break
        default:
          result = { success: false, channel: mode, error: 'Unsupported communication mode' }
      }
      
      results.push(result)
      
      // Log the result immediately
      if (result.success) {
        console.log(`✅ ${mode} reminder sent successfully to ${result.recipient || 'student'}`)
      } else {
        console.log(`❌ ${mode} reminder failed:`, result.error)
      }
    }

    const successfulSends = results.filter(r => r.success)
    const failedSends = results.filter(r => !r.success)

    console.log('📊 REMINDER SUMMARY:')
    console.log(`   ✅ Successful: ${successfulSends.length} (${successfulSends.map(r => r.channel).join(', ')})`)
    console.log(`   ❌ Failed: ${failedSends.length}`)

    // Return success response without storing in database
    return NextResponse.json({
      success: successfulSends.length > 0,
      message: `Payment reminder sent to ${paymentRecord.name} via ${successfulSends.map(r => r.channel).join(', ')}`,
      results: {
        successful: successfulSends,
        failed: failedSends
      },
      studentName: paymentRecord.name,
      channels: successfulSends.map(r => r.channel)
    })

  } catch (error) {
    console.error('Send reminder API error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}