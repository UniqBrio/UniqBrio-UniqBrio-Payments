export interface Course {
  id: string
  name: string
  instructor: string
  instructorId: string
  description: string
  level: string
  type: string
  duration: string
  priceINR: number
  price: number
  currency: string
  schedule: string
  maxStudents: number
  enrolledStudents: number
  location: string
  tags: string[]
  modules: any[]
  completionRate: number
  schedulePeriod: {
    startDate: string
    endDate: string
    totalWeeks: string
  }
  sessionDetails: {
    sessionDuration: string
    maxClasses: string
  }
  frequencyDetails: {
    selectedDays: string[]
    dayTimes: Record<string, any>
  }
  frequencies: Array<{
    days: string[]
    start: string
    end: string
    sessions: string
  }>
  chapters: Array<{
    name: string
    description: string
  }>
  referralCode: string
  commissionRate: string
  referralStart: string
  referralEnd: string
  referralStatus: string
  affiliateTracking: {
    enabled: boolean
    referralCode: string
    commissionRate: number
    totalReferrals: number
    totalCommission: number
  }
  emiPlans: any[]
  scholarships: any[]
  taxInfo: {
    gstEnabled: boolean
    gstRate: number
    educationTaxRate: number
    pan: string
    autoGeneration: boolean
    invoicePrefix: string
    lastInvoiceNumber: number
    taxDocuments: any[]
  }
  faqs: Array<{
    question: string
    answer: string
    isEditing: boolean
  }>
  reminderSettings: {
    pushEnabled: boolean
    emailEnabled: boolean
    smsEnabled: boolean
    customSchedule: any[]
    frequency: string
    customDays: string
    customInterval: string
  }
  freeGifts: string[]
  status: string
  courseCategory: string
  rating: number
  cohortAnalysis: any[]
  learningBehavior: {
    bestLearningTimes: any[]
    engagementWindows: any[]
    preferredContentTypes: any[]
    averageSessionDuration: number
    peakActivityDays: any[]
  }
  roiCalculator: {
    courseCost: number
    expectedSalaryIncrease: number
    timeToROI: number
    industryAverageSalary: number
    skillDemandScore: number
  }
  dropoffPrediction: {
    riskScore: number
    riskFactors: any[]
    interventionSuggestions: any[]
  }
  sharedResources: any[]
  versionControl: any[]
  materialAnalytics: {
    resourceId: string
    views: number
    downloads: number
    averageRating: number
    successRate: number
    engagementTime: number
  }
  credentialVerification: boolean
  marketplaceEnabled: boolean
  ltiIntegration: boolean
  contentSecurity: {
    watermarkEnabled: boolean
    downloadProtection: boolean
    screenRecordingProtection: boolean
    accessLogging: boolean
    licenseTracking: boolean
  }
  offlineAccess: {
    enabled: boolean
    downloadLimit: number
    currentDownloads: number
    expiryDays: number
    accessLogs: any[]
  }
  industryPartners: any[]
  events: any[]
  alumniNetwork: any[]
  promotionTemplates: any[]
  seasonalPromos: any[]
  growthAnalytics: {
    enrollmentTrend: any[]
    revenueTrend: any[]
    completionTrend: any[]
    satisfactionTrend: any[]
  }
}

export type DraftType = {
  id: string
  name: string
  updatedAt: number
  instructor?: string
  description?: string
  level?: string
  type?: string
  priceINR?: number
  tags?: string[]
  schedule?: string
  maxStudents?: number
  location?: string
  schedulePeriod?: any
  sessionDetails?: any
  frequencyDetails?: any
  frequencies?: any[]
  chapters?: any[]
  referralCode?: string
  commissionRate?: string
  referralStart?: string
  referralEnd?: string
  referralStatus?: string
  faqs?: any[]
  reminderSettings?: any
  freeGifts?: string[]
  status?: string
  courseCategory?: string
  [key: string]: any
}
