export interface PaymentRecord {
  id: string
  name: string
  activity: string
  category: string
  courseType: "Regular" | "Special" | "Ongoing"
  cohort?: string
  batch?: string
  instructor?: string
  classSchedule?: string
  finalPayment: number
  totalPaidAmount: number
  balancePayment: number
  paymentStatus: "Paid" | "Pending"
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
    studentRegistration?: {
      amount: number
      paid: boolean
      paidDate?: string
    }
    courseRegistration?: {
      amount: number
      paid: boolean
      paidDate?: string
    }
    confirmationFee?: {
      amount: number
      paid: boolean
      paidDate?: string
    }
    overall: {
      paid: boolean
      status: "Paid" | "Pending"
    }
  }
  paymentModes: string[]
  studentType: "New" | "Existing"
  courseStartDate?: string
  paymentCategory?: "Student Registration" | "Course Registration" | "Confirmation Fee" | "Course Payment"
  /** Indicates finalPayment was computed client-side via fallback triple-rule (not from sync API). */
  derivedFinalPayment?: boolean
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