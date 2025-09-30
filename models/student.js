import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  // Basic student information
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Course information
  course: { type: String, required: true },
  activity: { type: String }, // Alternative field name for course
  category: { type: String, default: "Regular" },
  level: { type: String, default: "Beginner" },
  type: { type: String, default: "Individual" },
  courseType: { type: String, enum: ["Individual", "Group", "Online", "Hybrid", "Regular", "Special", "Ongoing"], default: "Individual" },
  
  // Cohort and batch information
  cohort: { type: String, default: "" },
  batch: { type: String, default: "" },
  instructor: { type: String, default: "" },
  classSchedule: { type: String, default: "" },
  
  // Payment information
  paymentStatus: { type: String, enum: ["Paid", "Partial", "Pending", "Overdue", "Scheduled"], default: "Scheduled" },
  finalPayment: { type: Number, default: 0 },
  totalPaidAmount: { type: Number, default: 0 },
  balancePayment: { type: Number, default: 0 },
  currency: { type: String, default: "INR" },
  
  // Payment frequency and dates
  paymentFrequency: { 
    type: String, 
    enum: ["Monthly", "Quarterly", "Semi-annual", "Weekly", "Yearly", "One-time"], 
    default: "Monthly" 
  },
  courseStartDate: { type: Date, default: Date.now },
  paidDate: { type: Date },
  nextPaymentDate: { type: Date },
  
  // Communication and reminders
  paymentReminder: { type: Boolean, default: true },
  reminderMode: { type: String, enum: ["SMS", "Email", "WhatsApp"], default: "Email" },
  modeOfCommunication: { type: String, enum: ["SMS", "Email", "WhatsApp"], default: "Email" },
  communicationText: { type: String, default: "" },
  reminderDays: [{ type: Number }],
  
  // Registration fees
  registrationFees: {
    studentRegistration: { type: Number, default: 500 },
    courseRegistration: { type: Number, default: 1000 },
    confirmationFee: { type: Number, default: 250 },
    paid: { type: Boolean, default: false },
    status: { type: String, enum: ["Paid", "Partial", "Pending", "Overdue", "Scheduled"], default: "Scheduled" }
  },
  registrationDueDate: { type: Date },
  
  // Payment details
  paymentDetails: {
    qrCode: { type: String, default: "" },
    upiId: { type: String, default: "" },
    paymentLink: { type: String, default: "" }
  },
  
  // Individual payment detail fields (for backward compatibility)
  qrCode: { type: String, default: "" },
  upiId: { type: String, default: "" },
  paymentLink: { type: String, default: "" },
  
  // Additional fields
  paymentModes: [{ type: String }],
  studentType: { type: String, enum: ["New", "Existing"], default: "New" },
  emiSplit: { type: Number, default: 1 }
}, { 
  timestamps: true,
  strict: false // Allow additional fields if needed
});

export default mongoose.models.Student || mongoose.model("Student", StudentSchema, "students");