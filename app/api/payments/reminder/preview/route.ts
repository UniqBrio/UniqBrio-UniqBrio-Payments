import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import PaymentModel from '@/models/payment'

// Shared utility functions (duplicated intentionally for isolation; can be refactored later)
const formatCurrency = (amount: number, currency: string = 'INR') => {
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

function generatePreview(record: any, mode: string) {
  if (mode.toLowerCase() === 'sms') {
    return `Hi ${record.name}!\n\nPayment reminder for ${record.activity}\nBalance Due: ${formatCurrency(record.currentBalance ?? record.balancePayment, record.currency)}\nDue Date: ${formatDate(record.nextPaymentDate)}\n\nPayment Options:\n${record.paymentDetails?.upiId ? `UPI: ${record.paymentDetails.upiId}\n` : ''}${record.paymentDetails?.paymentLink ? `Link: ${record.paymentDetails.paymentLink}\n` : ''}\nComplete payment to secure your enrollment.\n\n- UniqBrio Team\n\n(SMS Sending Coming Soon)`
  }

  if (mode.toLowerCase() === 'whatsapp') {
    return `Hi ${record.name}! 📚\n\n*Payment Reminder - ${record.activity}*\n\n💰 *Amount Due:* ${formatCurrency(record.currentBalance ?? record.balancePayment, record.currency)}\n📅 *Due Date:* ${formatDate(record.nextPaymentDate)}\n\n*Payment Options:*\n${record.paymentDetails?.upiId ? `🏦 *UPI:* ${record.paymentDetails.upiId}\n` : ''}${record.paymentDetails?.paymentLink ? `💳 *Link:* ${record.paymentDetails.paymentLink}\n` : ''}\nComplete payment to secure your enrollment!\n\n*- UniqBrio Team* 🚀`
  }

  // Default to email style
  return `Subject: Payment Reminder - ${record.activity}\n\nDear ${record.name},\n\nThis is a friendly reminder regarding your pending payment.\n\nCourse: ${record.activity}\nBalance Due: ${formatCurrency(record.currentBalance ?? record.balancePayment, record.currency)}\nDue Date: ${formatDate(record.nextPaymentDate)}\n\nPayment Options:\n${record.paymentDetails?.upiId ? `• UPI ID: ${record.paymentDetails.upiId}\n` : ''}${record.paymentDetails?.paymentLink ? `• Payment Link: ${record.paymentDetails.paymentLink}\n` : ''}\n\nPlease complete your payment to secure your enrollment.\n\nBest regards,\nUniqBrio Team`
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const mode = (searchParams.get('mode') || 'email').trim()

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 })
    }

    const record = await PaymentModel.findOne({ studentId })
    if (!record) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    const content = generatePreview(record, mode)
    const comingSoon = mode.toLowerCase() === 'sms'

    return NextResponse.json({ success: true, mode, comingSoon, content })
  } catch (error) {
    console.error('Reminder preview error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate preview' }, { status: 500 })
  }
}
