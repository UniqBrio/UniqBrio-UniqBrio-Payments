import mongoose from "mongoose";

// Simple Payment Schema - One document per payment transaction
const SimplePaymentSchema = new mongoose.Schema({
  // Student Reference
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  
  // Payment Transaction Details
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { 
    type: String, 
    enum: ["Cash", "UPI", "QR", "Card", "Bank Transfer", "Online", "Cheque"], 
    required: true 
  },
  paymentType: { 
    type: String, 
    default: "Course Fee"
  },
  paymentCategory: {
    type: String,
    enum: ["Student Registration", "Course Registration", "Confirmation Fee", "Course Payment"],
    default: "Course Payment"
  },
  
  // Payment Details
  paymentDate: { type: Date, required: true },
  notes: { type: String, default: "" },
  
  // Manual Payment Fields
  isManualPayment: { type: Boolean, default: false },
  receivedByName: { type: String }, // Required for manual payments
  receivedByRole: { 
    type: String, 
    enum: ["instructor", "non-instructor", "admin", "superadmin", "Administrator"]
  }, // Required for manual payments
  recordedBy: { type: String, default: "System" },
  
  // Additional Fields for Course Matching
  registrationPaymentType: { type: String },
  finalPayment: { type: Number, default: 0, min: 0 }, // Course fee amount for balance calculation
  
  // Auto-generated
  transactionId: { type: String, unique: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
SimplePaymentSchema.index({ studentId: 1, paymentDate: -1 });
SimplePaymentSchema.index({ paymentCategory: 1 });
SimplePaymentSchema.index({ isManualPayment: 1 });

// Generate unique transaction ID before saving
SimplePaymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.transactionId = `PAY_${timestamp}_${random}`.toUpperCase();
  }
  next();
});

// IMPORTANT: Use a different physical collection to avoid clashing with the aggregated
// per-student Payment model (which also previously used the 'payments' collection).
// Earlier both schemas pointed to the same collection causing validation/index issues.
export default mongoose.models.SimplePayment || mongoose.model("SimplePayment", SimplePaymentSchema, "simple-payments");