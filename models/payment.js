import mongoose from "mongoose";

// Individual Payment Record Schema
const PaymentRecordSchema = new mongoose.Schema({
  // Payment Transaction Details
  transactionId: { type: String }, // Generated automatically in pre-save hook
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  paymentType: { 
    type: String, 
    enum: ["Course Fee", "Registration Fee", "Installment", "Late Fee", "Refund"], 
    required: true 
  },
  paymentCategory: {
    type: String,
    enum: ["Student Registration", "Course Registration", "Confirmation Fee", "Course Payment"],
    required: true
  },
  
  // Payment Method & Status
  paymentMethod: { 
    type: String, 
    enum: ["Cash", "UPI", "QR", "Card", "Bank Transfer", "Online", "Cheque"], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ["Completed", "Pending", "Failed", "Refunded", "Cancelled"], 
    default: "Completed" 
  },
  
  // Payment Dates
  paymentDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date },
  processedDate: { type: Date, default: Date.now },
  
  // Payment Details
  receiverName: { type: String, required: true },
  receiverId: { type: String, required: true },
  receivedByName: { type: String }, // Person who received the payment
  receivedByRole: { 
    type: String, 
    enum: ["instructor", "non-instructor", "admin", "superadmin"]
  },
  notes: { type: String, default: "" },
  reference: { type: String, default: "" },
  
  // File Attachments
  attachments: [{
    fileName: { type: String },
    filePath: { type: String },
    fileType: { type: String },
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Balance Tracking at time of payment
  previousBalance: { type: Number, required: true, min: 0 },
  newBalance: { type: Number, required: true, min: 0 },
  
  // Additional Metadata
  isManualPayment: { type: Boolean, default: false },
  recordedBy: { type: String, default: "System" },
  ipAddress: { type: String },
  userAgent: { type: String },
  
  // EMI/Installment Information
  installmentNumber: { type: Number, min: 1 },
  totalInstallments: { type: Number, min: 1 },
  isEMI: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

// Main Payment Document Schema (One per Student)
const PaymentSchema = new mongoose.Schema({
  // Student Reference - UNIQUE per student
  studentId: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  
  // Course Information
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  cohort: { type: String, default: "" },
  batch: { type: String, default: "" },
  
  // Payment Summary
  totalCourseFee: { type: Number, required: true, min: 0 },
  totalPaidAmount: { type: Number, default: 0, min: 0 }, // Total of ALL payments (course + registration)
  coursePaidAmount: { type: Number, default: 0, min: 0 }, // Only course payments
  currentBalance: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  
  // Payment Status
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Partial", "Paid", "Overdue"], 
    default: "Pending" 
  },
  
  // Communication Settings (for message delivery only)
  paymentReminder: { type: Boolean, default: false },
  communicationText: { type: String, default: "" },
  
  // Communication Preferences (matches students collection structure)
  communicationPreferences: {
    enabled: { type: Boolean, default: true },
    channels: {
      type: [String],
      enum: ["Email", "SMS", "WhatsApp", "In App", "Push Notification"],
      default: ["Email"]
    }
  },
  
  // Registration Fees Tracking
  registrationFees: {
    studentRegistration: {
      amount: { type: Number, default: 500 },
      paid: { type: Boolean, default: false },
      paidDate: { type: String, default: null }
    },
    courseRegistration: {
      amount: { type: Number, default: 1000 },
      paid: { type: Boolean, default: false },
      paidDate: { type: String, default: null }
    },
    confirmationFee: {
      amount: { type: Number, default: 250 },
      paid: { type: Boolean, default: false },
      paidDate: { type: String, default: null }
    },
    overall: {
      paid: { type: Boolean, default: false },
      status: { type: String, enum: ["Paid", "Pending"], default: "Pending" }
    }
  },
  
  // All Payment Records for this Student
  paymentRecords: [PaymentRecordSchema],
  
  // Academic Information
  semester: { type: String },
  academicYear: { type: String, default: new Date().getFullYear().toString() },
  
  // Last Update Info
  lastPaymentDate: { type: Date },
  lastUpdatedBy: { type: String, default: "System" }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (studentId already indexed via unique: true)
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ "paymentRecords.paymentDate": -1 });
PaymentSchema.index({ "paymentRecords.transactionId": 1 });

// Virtual for formatted amounts
PaymentSchema.virtual('formattedTotalFee').get(function() {
  return `${this.currency} ${this.totalCourseFee.toLocaleString()}`;
});

PaymentSchema.virtual('formattedPaidAmount').get(function() {
  return `${this.currency} ${this.totalPaidAmount.toLocaleString()}`;
});

PaymentSchema.virtual('formattedBalance').get(function() {
  return `${this.currency} ${this.currentBalance.toLocaleString()}`;
});

// Virtual for total transactions
PaymentSchema.virtual('totalTransactions').get(function() {
  return this.paymentRecords.length;
});

// Virtual for completed payments count
PaymentSchema.virtual('completedPayments').get(function() {
  return this.paymentRecords.filter(record => record.paymentStatus === 'Completed').length;
});

// Pre-save middleware to update payment summary
PaymentSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered for student:', this.studentId);
  
  // Calculate total paid amount from completed payments
  const completedPayments = this.paymentRecords.filter(record => record.paymentStatus === 'Completed');
  
  // Calculate total of ALL payments
  this.totalPaidAmount = completedPayments.reduce((sum, record) => sum + record.amount, 0);
  
  // Calculate total of ONLY COURSE payments (excluding registration fees)
  const coursePayments = completedPayments.filter(record => record.paymentCategory === 'Course Payment');
  this.coursePaidAmount = coursePayments.reduce((sum, record) => sum + record.amount, 0);
  
  // Update current balance (based on course payments only)
  this.currentBalance = Math.max(0, this.totalCourseFee - this.coursePaidAmount);
  
  // Update payment status (based on course payments only)
  if (this.currentBalance === 0 && this.coursePaidAmount > 0) {
    this.paymentStatus = 'Paid';
  } else if (this.coursePaidAmount > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Pending';
  }
  
  // Update last payment date
  if (completedPayments.length > 0) {
    const latestPayment = completedPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
    this.lastPaymentDate = latestPayment.paymentDate;
  }
  
  console.log('Payment summary updated:', {
    totalPaidAmount: this.totalPaidAmount,
    currentBalance: this.currentBalance,
    paymentStatus: this.paymentStatus,
    totalRecords: this.paymentRecords.length
  });
  
  next();
});

// Generate unique transaction IDs for new payment records
PaymentSchema.pre('save', function(next) {
  this.paymentRecords.forEach(record => {
    if (!record.transactionId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      record.transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
      console.log('Generated transactionId for new record:', record.transactionId);
    }
  });
  next();
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema, "payments");