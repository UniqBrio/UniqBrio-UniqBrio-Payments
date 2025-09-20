import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  // Student Reference
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  
  // Course Information
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  cohort: { type: String, default: "" },
  batch: { type: String, default: "" },
  
  // Payment Transaction Details
  transactionId: { type: String, unique: true, required: true },
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
  notes: { type: String, default: "" },
  reference: { type: String, default: "" }, // Transaction reference from payment gateway
  
  // File Attachments
  attachments: [{
    fileName: { type: String },
    filePath: { type: String },
    fileType: { type: String },
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Balance Tracking
  previousBalance: { type: Number, required: true, min: 0 },
  newBalance: { type: Number, required: true, min: 0 },
  totalCourseFee: { type: Number, required: true, min: 0 },
  
  // Additional Metadata
  isManualPayment: { type: Boolean, default: false },
  recordedBy: { type: String, default: "System" }, // Admin user who recorded manual payment
  ipAddress: { type: String },
  userAgent: { type: String },
  
  // EMI/Installment Information
  installmentNumber: { type: Number, min: 1 },
  totalInstallments: { type: Number, min: 1 },
  isEMI: { type: Boolean, default: false },
  
  // Academic Information
  semester: { type: String },
  academicYear: { type: String, default: new Date().getFullYear().toString() }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentSchema.index({ studentId: 1, paymentDate: -1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ courseId: 1 });

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toLocaleString()}`;
});

// Generate transaction ID
PaymentSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered. Current transactionId:', this.transactionId);
  
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
    console.log('Generated transactionId:', this.transactionId);
  }
  
  // Ensure required fields are present
  if (!this.studentId || !this.amount || !this.receiverName || !this.receiverId) {
    console.log('Pre-save validation failed:', {
      studentId: !!this.studentId,
      amount: !!this.amount,
      receiverName: !!this.receiverName,
      receiverId: !!this.receiverId
    });
    return next(new Error('Missing required fields: studentId, amount, receiverName, receiverId'));
  }
  
  console.log('Pre-save validation passed');
  next();
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema, "payments");