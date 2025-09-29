import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  // Basic course information
  id: { type: String, unique: true },
  name: { type: String, required: true },
  instructor: { type: String, required: true },
  instructorId: { type: String },
  description: { type: String, default: "" },
  
  // Course details
  level: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Beginner" 
  },
  type: { 
    type: String, 
    enum: ["Individual", "Group", "Online", "Hybrid"], 
    default: "Individual" 
  },
  duration: { type: String, default: "3 months" },
  
  // Pricing information
  priceINR: { type: Number, required: true, min: 0 },
  price: { type: Number, min: 0 }, // Alternative currency price
  currency: { type: String, default: "INR" },
  
  // Schedule and capacity
  schedule: { type: String, default: "Mon-Wed-Fri 10:00-12:00" },
  maxStudents: { type: Number, default: 20 },
  enrolledStudents: { type: Number, default: 0 },
  location: { type: String, default: "Online" },
  
  // Course metadata
  tags: [{ type: String }],
  modules: [{ type: mongoose.Schema.Types.Mixed }],
  completionRate: { type: Number, default: 0 },
  
  // Schedule period
  schedulePeriod: {
    startDate: { type: String },
    endDate: { type: String },
    totalWeeks: { type: String }
  },
  
  // Session details
  sessionDetails: {
    sessionDuration: { type: String, default: "2 hours" },
    maxClasses: { type: String, default: "24" }
  },
  
  // Frequency details
  frequencyDetails: {
    selectedDays: [{ type: String }],
    dayTimes: { type: mongoose.Schema.Types.Mixed }
  },
  
  frequencies: [{
    days: [{ type: String }],
    start: { type: String },
    end: { type: String },
    sessions: { type: String }
  }],
  
  // Course content
  chapters: [{
    name: { type: String },
    description: { type: String }
  }],
  
  // Referral and affiliate tracking
  referralCode: { type: String },
  commissionRate: { type: String, default: "10%" },
  referralStart: { type: String },
  referralEnd: { type: String },
  referralStatus: { 
    type: String, 
    enum: ["Active", "Inactive", "Expired"], 
    default: "Inactive" 
  },
  
  affiliateTracking: {
    enabled: { type: Boolean, default: false },
    referralCode: { type: String },
    commissionRate: { type: Number, default: 10 },
    totalReferrals: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 }
  },
  
  // Payment options
  emiPlans: [{ type: mongoose.Schema.Types.Mixed }],
  scholarships: [{ type: mongoose.Schema.Types.Mixed }],
  
  // Tax information
  taxInfo: {
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 18 },
    educationTaxRate: { type: Number, default: 0 },
    pan: { type: String },
    autoGeneration: { type: Boolean, default: false },
    invoicePrefix: { type: String, default: "UNIQ" },
    lastInvoiceNumber: { type: Number, default: 0 },
    taxDocuments: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // FAQs
  faqs: [{
    question: { type: String },
    answer: { type: String },
    isEditing: { type: Boolean, default: false }
  }],
  
  // Reminder settings
  reminderSettings: {
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    customSchedule: [{ type: mongoose.Schema.Types.Mixed }],
    frequency: { type: String, default: "Weekly" },
    customDays: { type: String },
    customInterval: { type: String }
  },
  
  // Additional offerings
  freeGifts: [{ type: String }],
  
  // Course status
  status: { 
    type: String, 
    enum: ["Active", "Inactive", "Draft", "Archived"], 
    default: "Active" 
  },
  courseCategory: { 
    type: String, 
    enum: ["Art", "Music", "Dance", "Craft", "Photography", "Drama", "Digital Media", "Other"], 
    default: "Art" 
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  
  // Analytics and insights
  cohortAnalysis: [{ type: mongoose.Schema.Types.Mixed }],
  learningBehavior: {
    bestLearningTimes: [{ type: mongoose.Schema.Types.Mixed }],
    engagementWindows: [{ type: mongoose.Schema.Types.Mixed }],
    preferredContentTypes: [{ type: mongoose.Schema.Types.Mixed }],
    averageSessionDuration: { type: Number, default: 0 },
    peakActivityDays: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // ROI and prediction analytics
  roiCalculator: {
    courseCost: { type: Number, default: 0 },
    expectedSalaryIncrease: { type: Number, default: 0 },
    timeToROI: { type: Number, default: 12 },
    industryAverageSalary: { type: Number, default: 0 },
    skillDemandScore: { type: Number, default: 0 }
  },
  
  dropoffPrediction: {
    riskScore: { type: Number, default: 0 },
    riskFactors: [{ type: mongoose.Schema.Types.Mixed }],
    interventionSuggestions: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // Resource management
  sharedResources: [{ type: mongoose.Schema.Types.Mixed }],
  versionControl: [{ type: mongoose.Schema.Types.Mixed }],
  
  materialAnalytics: {
    resourceId: { type: String },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    engagementTime: { type: Number, default: 0 }
  },
  
  // Security and access features
  credentialVerification: { type: Boolean, default: false },
  marketplaceEnabled: { type: Boolean, default: false },
  ltiIntegration: { type: Boolean, default: false },
  
  contentSecurity: {
    watermarkEnabled: { type: Boolean, default: false },
    downloadProtection: { type: Boolean, default: false },
    screenRecordingProtection: { type: Boolean, default: false },
    accessLogging: { type: Boolean, default: false },
    licenseTracking: { type: Boolean, default: false }
  },
  
  offlineAccess: {
    enabled: { type: Boolean, default: false },
    downloadLimit: { type: Number, default: 0 },
    currentDownloads: { type: Number, default: 0 },
    expiryDays: { type: Number, default: 30 },
    accessLogs: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  // Community and networking
  industryPartners: [{ type: mongoose.Schema.Types.Mixed }],
  events: [{ type: mongoose.Schema.Types.Mixed }],
  alumniNetwork: [{ type: mongoose.Schema.Types.Mixed }],
  
  // Marketing and promotions
  promotionTemplates: [{ type: mongoose.Schema.Types.Mixed }],
  seasonalPromos: [{ type: mongoose.Schema.Types.Mixed }],
  
  growthAnalytics: {
    enrollmentTrend: [{ type: mongoose.Schema.Types.Mixed }],
    revenueTrend: [{ type: mongoose.Schema.Types.Mixed }],
    completionTrend: [{ type: mongoose.Schema.Types.Mixed }],
    satisfactionTrend: [{ type: mongoose.Schema.Types.Mixed }]
  }
}, { 
  timestamps: true,
  strict: false // Allow additional fields for flexibility
});

// Indexes for performance
CourseSchema.index({ name: 1 });
CourseSchema.index({ instructor: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ courseCategory: 1 });
CourseSchema.index({ level: 1, type: 1 });

// Generate course ID if not provided
CourseSchema.pre('save', function(next) {
  if (!this.id) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    this.id = `COURSE_${timestamp}_${random}`.toUpperCase();
  }
  next();
});

export default mongoose.models.Course || mongoose.model("Course", CourseSchema, "courses");