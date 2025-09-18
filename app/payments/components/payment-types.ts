export interface PaymentRecord {
  id: string
  name: string
  activity: string
  category: string
  courseType: "Regular" | "Special" | "Ongoing"
  finalPayment: number
  totalPaidAmount: number
  balancePayment: number
  paymentStatus: "Paid" | "Partial" | "Pending" | "Overdue"
  paymentFrequency: "Monthly"| "Quarterly"|"Semi-annual" | "Weekly" | "Yearly" | "One-time"
  nextPaymentDate: string
  paidDate: string
  paymentReminder: boolean
  reminderMode: "SMS" | "Email" | "WhatsApp"
  communicationText: string
  paymentDetails: {
    qrCode?: string
    upiId?: string
    paymentLink?: string
  }
  currency: string
  emiSplit?: number
  reminderDays: number[]
  registrationFees?: {
    studentRegistration?: number
    courseRegistration?: number
    confirmationFee?: number
    paid: boolean
  }
  paymentModes: string[]
  studentType: "New" | "Existing"
}

export interface PaymentSummary {
  receivedPayment: number
  outstandingPayment: number
  totalPayment: number
  profit: number
}

export const currencySymbols: { [key: string]: string } = {
  USD: "$",
  INR: "₹",
  GBP: "£",
  EUR: "€",
}