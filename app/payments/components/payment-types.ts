export interface PaymentRecord {
  id: string
  name: string
  activity: string
  enrolledCourse?: string
  program: string
  category: string
  courseType: "Individual" | "Group" | "Online" | "Hybrid" | "-"
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
  communicationText: string
  communicationPreferences: {
    enabled: boolean
    channels: ("SMS" | "Email" | "WhatsApp" | "In App" | "Push Notification")[]
  }
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
  /** Timestamp (ISO) when finalPayment was last recomputed on client (for UI highlight). */
  finalPaymentUpdatedAt?: string
  /** ID of matched course when triple-rule (activity=id, course=name, category=level) succeeded (from sync API). */
  matchedCourseId?: string
  /** True if backend sync confirmed exact triple-rule match (authoritative server match). */
  tripleRuleMatched?: boolean
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